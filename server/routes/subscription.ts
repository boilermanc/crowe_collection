import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { requireAuthWithUser, type AuthResult } from '../middleware/auth.js';
import { getSubscription, PLAN_LIMITS } from '../lib/subscription.js';

const router = Router();

function getSupabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

router.get(
  '/api/subscription',
  requireAuthWithUser,
  async (req, res) => {
    const { userId } = (req as typeof req & { auth: AuthResult }).auth;

    try {
      const sub = await getSubscription(userId);
      const limits = PLAN_LIMITS[sub.plan];

      // Fetch plan_period_end from profiles (set by Stripe webhooks)
      let periodEnd: string | null = null;
      if (userId !== '__legacy__') {
        const supabase = getSupabaseAdmin();
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan_period_end')
          .eq('id', userId)
          .single();
        periodEnd = profile?.plan_period_end ?? null;
      }

      res.status(200).json({
        plan: sub.plan,
        status: sub.status,
        periodEnd,
        scansUsed: sub.aiScansUsed,
        scansLimit: limits.scans === Infinity ? -1 : limits.scans,
      });
    } catch (error) {
      console.error('Subscription fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch subscription' });
    }
  }
);

export default router;
