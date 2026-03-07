import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import fetch from 'node-fetch';
import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';
import { getEbayToken } from '../lib/ebay-auth.js';

const router = Router();

const ENDPOINT_URL = 'https://rekkrd.com/api/ebay/account-deletion';

async function getEbayConfig(): Promise<Record<string, string>> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase admin not configured');

  const { data, error } = await supabase
    .from('config_settings')
    .select('key, value')
    .eq('category', 'ebay');

  if (error) throw new Error(`Failed to load eBay config: ${error.message}`);

  const cfg: Record<string, string> = {};
  for (const row of data ?? []) {
    cfg[row.key] = row.value;
  }
  return cfg;
}

// GET — eBay challenge verification handshake
router.get('/account-deletion', (req: Request, res: Response) => {
  const challengeCode = req.query.challenge_code as string;
  const verificationToken = process.env.EBAY_VERIFICATION_TOKEN;

  if (!challengeCode || !verificationToken) {
    res.status(400).json({ error: 'Missing challenge_code or verification token' });
    return;
  }

  const hash = crypto
    .createHash('sha256')
    .update(challengeCode + verificationToken + ENDPOINT_URL)
    .digest('hex');

  res.status(200).json({ challengeResponse: hash });
});

// POST — eBay account deletion notification
router.post('/account-deletion', (req: Request, res: Response) => {
  console.log('eBay account deletion notification:', JSON.stringify(req.body));
  res.status(200).end();
});

// All other methods
router.all('/account-deletion', (_req: Request, res: Response) => {
  res.status(405).json({ error: 'Method not allowed' });
});

// GET /search — search eBay Browse API
router.get('/search', async (req: Request, res: Response) => {
  try {
    const cfg = await getEbayConfig();

    if (cfg['enabled'] !== 'true') {
      res.status(503).json({ error: 'eBay integration is not enabled' });
      return;
    }

    const sandbox = cfg['mode'] === 'sandbox';
    const appId = sandbox ? cfg['sandbox_app_id'] : cfg['prod_app_id'];
    const certId = sandbox ? cfg['sandbox_cert_id'] : cfg['prod_cert_id'];

    if (!appId || !certId) {
      res.status(503).json({ error: 'eBay credentials not configured' });
      return;
    }

    const q = req.query.q as string;
    if (!q) {
      res.status(400).json({ error: 'Missing required query parameter: q' });
      return;
    }

    const limit = Math.min(Number(req.query.limit) || 10, 50);

    const token = await getEbayToken(appId, certId, sandbox);
    const baseUrl = sandbox
      ? 'https://api.sandbox.ebay.com'
      : 'https://api.ebay.com';

    const searchUrl = `${baseUrl}/buy/browse/v1/item_summary/search?q=${encodeURIComponent(q)}&limit=${limit}&filter=buyingOptions:{FIXED_PRICE}`;

    const ebayRes = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
      },
    });

    const data = await ebayRes.json();
    res.status(ebayRes.status).json(data);
  } catch (err: unknown) {
    const message = (err as Error).message;
    console.error('[ebay] search error:', message);
    res.status(500).json({ error: 'eBay search failed' });
  }
});

export default router;
