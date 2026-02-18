import { Router } from 'express';
import Stripe from 'stripe';

// Simple in-memory cache
let cachedPrices: unknown = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const router = Router();

// No auth required — pricing is public info
router.get('/api/prices', async (_req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    res.status(200).json({ tiers: {} });
    return;
  }

  const now = Date.now();
  if (cachedPrices && now < cacheExpiry) {
    res.status(200).json(cachedPrices);
    return;
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
      limit: 20,
    });

    const tiers: Record<string, { monthly?: object; annual?: object; name: string }> = {};

    for (const price of prices.data) {
      const product = price.product as Stripe.Product;
      if (typeof product === 'string' || !product.active) continue;

      const tier = product.metadata?.tier;
      if (!tier) continue;

      if (!tiers[tier]) {
        tiers[tier] = { name: product.name };
      }

      const interval = price.recurring?.interval;
      const priceData = {
        priceId: price.id,
        amount: price.unit_amount, // in cents
        currency: price.currency,
        interval,
      };

      if (interval === 'month') {
        tiers[tier].monthly = priceData;
      } else if (interval === 'year') {
        tiers[tier].annual = priceData;
      }
    }

    const response = { tiers };
    cachedPrices = response;
    cacheExpiry = now + CACHE_TTL_MS;

    res.status(200).json(response);
  } catch (error) {
    console.error('Stripe prices error:', error);
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
});

export default router;
