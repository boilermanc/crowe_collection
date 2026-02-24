import { Router, type Request, type Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { requireAdmin } from '../middleware/adminAuth.js';
import { invalidateStripeCache } from '../lib/stripe.js';

const router = Router();

let _admin: ReturnType<typeof createClient> | null = null;
function getSupabaseAdmin() {
  if (_admin) return _admin;
  _admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  return _admin;
}

// ── GET /api/admin/integrations ─────────────────────────────────────
// Fetch settings by category. Defaults to 'integrations', supports ?category=stripe.
router.get('/api/admin/integrations', requireAdmin, async (req: Request, res: Response) => {
  try {
    const category = (req.query.category as string) || 'integrations';
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('config_settings')
      .select('key, value, data_type')
      .eq('category', category)
      .order('key');

    if (error) {
      console.error('[integrations] Fetch error:', error.message);
      res.status(500).json({ error: 'Failed to fetch settings' });
      return;
    }

    const settings: Record<string, unknown> = {};
    for (const row of (data || []) as Array<{ key: string; value: unknown; data_type: string }>) {
      settings[row.key] = parseValue(row.value, row.data_type);
    }

    res.json(settings);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[integrations] GET error:', message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── PUT /api/admin/integrations ─────────────────────────────────────
// Bulk upsert settings. Body: { category?, settings: { key: { value, dataType } } }
router.put('/api/admin/integrations', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { category: bodyCategory, settings } = req.body as {
      category?: string;
      settings: Record<string, { value: unknown; dataType: string }>;
    };

    const category = bodyCategory || 'integrations';

    if (!settings || typeof settings !== 'object') {
      res.status(400).json({ error: 'Missing settings object' });
      return;
    }

    const records = Object.entries(settings).map(([key, config]) => ({
      category,
      key,
      value: stringifyValue(config.value, config.dataType),
      data_type: config.dataType,
      updated_at: new Date().toISOString(),
    }));

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('config_settings')
      .upsert(records, { onConflict: 'category,key' });

    if (error) {
      console.error('[integrations] Upsert error:', error.message);
      res.status(500).json({ error: 'Failed to save settings' });
      return;
    }

    // Invalidate Stripe cache when saving stripe settings
    if (category === 'stripe') {
      invalidateStripeCache();
    }

    res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[integrations] PUT error:', message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/admin/integrations/test ───────────────────────────────
// Test an integration connection. Body: { integration, config }
router.post('/api/admin/integrations/test', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { integration, config } = req.body as {
      integration: string;
      config: Record<string, string>;
    };

    if (!integration) {
      res.status(400).json({ error: 'Missing integration name' });
      return;
    }

    let result: { success: boolean; message: string };

    switch (integration) {
      case 'stripe': {
        const secretKey = config?.secret_key;
        if (!secretKey) {
          result = { success: false, message: 'No secret key provided' };
          break;
        }
        try {
          const testStripe = new Stripe(secretKey);
          await testStripe.balance.retrieve();
          result = { success: true, message: 'Stripe connection successful' };
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          result = { success: false, message: `Stripe test failed: ${msg}` };
        }
        break;
      }
      default:
        result = { success: false, message: `Unknown integration: ${integration}` };
    }

    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[integrations] Test error:', message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── Helpers ─────────────────────────────────────────────────────────

function parseValue(value: unknown, dataType: string): unknown {
  if (value === null || value === undefined) return value;

  if (dataType === 'boolean') {
    if (typeof value === 'boolean') return value;
    return value === 'true' || value === true;
  }
  if (dataType === 'number') {
    return typeof value === 'number' ? value : parseFloat(String(value));
  }

  // String: strip double-encoding
  if (typeof value === 'string' && value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    try { return JSON.parse(value); } catch { return value; }
  }
  return value;
}

function stringifyValue(value: unknown, dataType: string): unknown {
  switch (dataType) {
    case 'boolean': return value ? true : false;
    case 'number':  return typeof value === 'number' ? value : parseFloat(String(value));
    case 'json':    return typeof value === 'object' ? value : JSON.parse(String(value));
    default:        return String(value ?? '');
  }
}

export default router;
