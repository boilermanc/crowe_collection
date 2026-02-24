import { getStripePrices, type PlanTier } from './stripe.js';

export type { PlanTier };

/** Number of free trial days for new paid subscriptions. */
export const TRIAL_DAYS = 14;

/**
 * Returns true if the given priceId matches a known Stripe price.
 */
export async function isKnownPriceId(priceId: string): Promise<boolean> {
  const prices = await getStripePrices();
  for (const tier of Object.values(prices)) {
    if (tier.monthly === priceId || tier.annual === priceId) {
      return true;
    }
  }
  return false;
}

/**
 * Reverse-maps a Stripe price ID back to a plan tier name.
 * Returns 'collector' (free tier) if no match is found.
 */
export async function getPlanFromPriceId(priceId: string): Promise<PlanTier> {
  const prices = await getStripePrices();
  for (const [tier, p] of Object.entries(prices)) {
    if (p.monthly === priceId || p.annual === priceId) {
      return tier as PlanTier;
    }
  }
  return 'collector';
}
