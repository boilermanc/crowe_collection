import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

export interface AuthResult {
  userId: string;
}

let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (_supabaseAdmin) return _supabaseAdmin;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _supabaseAdmin = createClient(url, key);
  return _supabaseAdmin;
}

/**
 * Express middleware that verifies Supabase JWT and attaches userId to req.
 * Falls back to API_SECRET check during migration period.
 */
export async function requireAuthWithUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.slice(7);

  // Try Supabase JWT first
  const admin = getSupabaseAdmin();
  if (admin) {
    const { data: { user }, error } = await admin.auth.getUser(token);
    if (user && !error) {
      (req as Request & { auth: AuthResult }).auth = { userId: user.id };
      next();
      return;
    }
  }

  // Fallback: legacy shared secret (migration period only)
  const secret = process.env.API_SECRET;
  if (secret && token === secret) {
    (req as Request & { auth: AuthResult }).auth = { userId: '__legacy__' };
    next();
    return;
  }

  res.status(401).json({ error: 'Unauthorized' });
}

/**
 * Express middleware: validates Authorization header against API_SECRET.
 * Legacy — use requireAuthWithUser for new code.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const secret = process.env.API_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'API_SECRET not configured' });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}
