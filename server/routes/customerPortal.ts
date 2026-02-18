import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { requireAuthWithUser, type AuthResult } from '../middleware/auth.js';
import { stripe } from '../lib/stripe.js';

const router = Router();

function getSupabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

router.post(
  '/api/customer-portal',
  requireAuthWithUser,
  async (req, res) => {
    const { userId } = (req as typeof req & { auth: AuthResult }).auth;

    try {
      const supabase = getSupabaseAdmin();

      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      if (!profile?.stripe_customer_id) {
        res.status(400).json({ error: 'No active subscription found' });
        return;
      }

      const appUrl = process.env.APP_URL || 'https://rekkrd.com';

      const session = await stripe.billingPortal.sessions.create({
        customer: profile.stripe_customer_id,
        return_url: `${appUrl}/?portal=returned`,
      });

      res.status(200).json({ url: session.url });
    } catch (error) {
      console.error('Customer portal error:', error);
      res.status(500).json({ error: 'Failed to create customer portal session' });
    }
  }
);

export default router;
