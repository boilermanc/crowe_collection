import type { PlanTier } from './stripe.js';

/**
 * Stripe price IDs mapped by plan tier and billing interval.
 * Values come from environment variables set in Stripe dashboard.
 */
export const STRIPE_PRICES = {
  curator: {
    monthly: process.env.STRIPE_PRICE_CURATOR_MONTHLY,
    annual: process.env.STRIPE_PRICE_CURATOR_ANNUAL,
  },
  enthusiast: {
    monthly: process.env.STRIPE_PRICE_ENTHUSIAST_MONTHLY,
    annual: process.env.STRIPE_PRICE_ENTHUSIAST_ANNUAL,
  },
} as const;

/** Number of free trial days for new paid subscriptions. */
export const TRIAL_DAYS = 14;

/**
 * Reverse-maps a Stripe price ID back to a plan tier name.
 * Returns 'collector' (free tier) if no match is found.
 */
/**
 * Returns true if the given priceId matches a known Stripe price.
 */
export function isKnownPriceId(priceId: string): boolean {
  for (const prices of Object.values(STRIPE_PRICES)) {
    if (prices.monthly === priceId || prices.annual === priceId) {
      return true;
    }
  }
  return false;
}

/**
 * Reverse-maps a Stripe price ID back to a plan tier name.
 * Returns 'collector' (free tier) if no match is found.
 */
export function getPlanFromPriceId(priceId: string): PlanTier {
  for (const [tier, prices] of Object.entries(STRIPE_PRICES)) {
    if (prices.monthly === priceId || prices.annual === priceId) {
      return tier as PlanTier;
    }
  }
  return 'collector';
}
