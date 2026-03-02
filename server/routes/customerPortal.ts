import { Router } from 'express';
import { requireAuthWithUser, type AuthResult } from '../middleware/auth.js';
import { getStripe } from '../lib/stripe.js';
import { requireSupabaseAdmin } from '../lib/supabaseAdmin.js';

const router = Router();

router.post(
  '/api/customer-portal',
  requireAuthWithUser,
  async (req, res) => {
    const { userId } = (req as typeof req & { auth: AuthResult }).auth;

    try {
      const supabase = requireSupabaseAdmin();

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

      const stripe = await getStripe();
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
