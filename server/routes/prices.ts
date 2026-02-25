import { Router } from 'express';
import type Stripe from 'stripe';
import { getStripe, getPublishableKey, getStripeMode, getStripePrices } from '../lib/stripe.js';

// Simple in-memory cache
let cachedPrices: unknown = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const router = Router();

// No auth required — pricing is public info
router.get('/api/prices', async (_req, res) => {
  const now = Date.now();
  if (cachedPrices && now < cacheExpiry) {
    res.status(200).json(cachedPrices);
    return;
  }

  try {
    const stripe = await getStripe();
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

    // Fall back to configured price IDs (env vars / DB) for any missing tiers
    const configPrices = await getStripePrices();
    for (const [tier, ids] of Object.entries(configPrices)) {
      if (!tiers[tier]) {
        tiers[tier] = { name: tier.charAt(0).toUpperCase() + tier.slice(1) };
      }
      if (!tiers[tier].monthly && ids.monthly) {
        try {
          const p = await stripe.prices.retrieve(ids.monthly);
          tiers[tier].monthly = { priceId: p.id, amount: p.unit_amount, currency: p.currency, interval: 'month' };
        } catch { /* price ID may be invalid */ }
      }
      if (!tiers[tier].annual && ids.annual) {
        try {
          const p = await stripe.prices.retrieve(ids.annual);
          tiers[tier].annual = { priceId: p.id, amount: p.unit_amount, currency: p.currency, interval: 'year' };
        } catch { /* price ID may be invalid */ }
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

// ── GET /api/stripe-config ────────────────────────────────────────────
// Public endpoint — returns the publishable key + mode for frontend Stripe init.
router.get('/api/stripe-config', async (_req, res) => {
  try {
    const [publishableKey, mode] = await Promise.all([
      getPublishableKey(),
      getStripeMode(),
    ]);
    res.json({ publishableKey, mode });
  } catch (error) {
    console.error('Stripe config error:', error);
    res.status(500).json({ error: 'Failed to fetch Stripe config' });
  }
});

export default router;
