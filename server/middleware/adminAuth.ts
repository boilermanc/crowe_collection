import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

export interface AdminAuthResult {
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
 * Express middleware that verifies the request is from an authenticated admin user.
 * Validates Supabase JWT, then checks profiles.role = 'admin'.
 * Attaches adminAuth to the request on success.
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.slice(7);
  const admin = getSupabaseAdmin();
  if (!admin) {
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }

  // Verify JWT
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (!user || error) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  // Check admin role
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: admin access required' });
    return;
  }

  (req as Request & { adminAuth: AdminAuthResult }).adminAuth = { userId: user.id };
  next();
}
