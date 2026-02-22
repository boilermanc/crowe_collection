import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { requireAuthWithUser } from './_auth';
import { cors } from './_cors';

const LOG_PREFIX = '[discogs-pricing]';
const USER_AGENT = 'Rekkrd/1.0 +https://rekkrd.com';
const MAX_RELEASE_IDS = 50;
const RATE_LIMIT_MS = 200;

// ── Supabase admin client ─────────────────────────────────────────

let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (_supabaseAdmin) return _supabaseAdmin;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error(`${LOG_PREFIX} SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured`);
  _supabaseAdmin = createClient(url, key);
  return _supabaseAdmin;
}

// ── Helpers ───────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface PriceResult {
  release_id: number;
  price_low: number | null;
  price_median: number | null;
}

async function fetchMarketplaceStats(releaseId: number): Promise<PriceResult> {
  const url = `https://api.discogs.com/marketplace/stats/${releaseId}?curr_abbr=USD`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    let errorMessage: string;
    try {
      const body = await response.json();
      errorMessage = (body as { message?: string }).message || JSON.stringify(body);
    } catch {
      errorMessage = response.statusText;
    }
    throw new Error(`Discogs API ${response.status}: ${errorMessage}`);
  }

  const data = await response.json();

  return {
    release_id: releaseId,
    price_low: data.lowest_price?.value ?? null,
    price_median: data.median_price?.value ?? null,
  };
}

// ── Handler ───────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res, 'POST')) return;
  const auth = await requireAuthWithUser(req, res);
  if (!auth) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { release_ids } = req.body || {};

    // Validate release_ids
    if (!Array.isArray(release_ids)) {
      return res.status(400).json({ error: 'release_ids must be an array' });
    }
    if (release_ids.length === 0) {
      return res.status(400).json({ error: 'release_ids must not be empty' });
    }
    if (release_ids.length > MAX_RELEASE_IDS) {
      return res.status(400).json({ error: `release_ids must not exceed ${MAX_RELEASE_IDS} items` });
    }

    const admin = getSupabaseAdmin();
    let updated = 0;
    const errors: string[] = [];

    for (let i = 0; i < release_ids.length; i++) {
      const releaseId = release_ids[i];

      // Rate limit between requests (skip delay before first request)
      if (i > 0) {
        await delay(RATE_LIMIT_MS);
      }

      try {
        const prices = await fetchMarketplaceStats(releaseId);

        const { error: updateError } = await admin
          .from('wantlist')
          .update({
            price_low: prices.price_low,
            price_median: prices.price_median,
            price_high: null,
            prices_updated_at: new Date().toISOString(),
          })
          .eq('discogs_release_id', releaseId)
          .eq('user_id', auth.userId);

        if (updateError) {
          const msg = `Release ${releaseId}: DB update failed — ${updateError.message}`;
          console.error(`${LOG_PREFIX} ${msg}`);
          errors.push(msg);
        } else {
          updated++;
        }
      } catch (fetchError) {
        const msg = `Release ${releaseId}: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`;
        console.error(`${LOG_PREFIX} ${msg}`);
        errors.push(msg);
      }
    }

    return res.status(200).json({ updated, errors });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`${LOG_PREFIX} Error:`, error);
    return res.status(500).json({ error: 'Failed to fetch Discogs pricing', details: message });
  }
}
