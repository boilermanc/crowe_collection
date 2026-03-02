import type { Request, Response, NextFunction } from 'express';
import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';

export interface AuthResult {
  userId: string;
}

/**
 * Express middleware that verifies Supabase JWT and attaches userId to req.
 */
export async function requireAuthWithUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.slice(7);

  const admin = getSupabaseAdmin();
  if (admin) {
    const { data: { user }, error } = await admin.auth.getUser(token);
    if (user && !error) {
      (req as Request & { auth: AuthResult }).auth = { userId: user.id };
      next();
      return;
    }
  }

  res.status(401).json({ error: 'Unauthorized' });
}
