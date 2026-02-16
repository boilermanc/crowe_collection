import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Validates the Authorization header against the API_SECRET environment variable.
 * Returns true if authorized, false if it already sent a 401 response.
 */
export function requireAuth(req: VercelRequest, res: VercelResponse): boolean {
  const secret = process.env.API_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'API_SECRET not configured' });
    return false;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }

  return true;
}
