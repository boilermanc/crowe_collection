import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Returns the list of allowed origins from the ALLOWED_ORIGINS env var,
 * falling back to the Vercel deployment URL and localhost dev server.
 */
function getAllowedOrigins(): string[] {
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean);
  }

  const origins: string[] = ['http://localhost:5173'];
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`);
  }
  return origins;
}

/**
 * Sets CORS headers and handles OPTIONS preflight requests.
 *
 * @returns `true` if the request was a preflight (caller should return immediately),
 *          `false` if the caller should continue processing.
 */
export function cors(
  req: VercelRequest,
  res: VercelResponse,
  methods: string = 'POST'
): boolean {
  const origin = req.headers.origin;

  if (origin && getAllowedOrigins().includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', methods);
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  return false;
}
