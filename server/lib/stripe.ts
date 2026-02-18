import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY is not set — Stripe calls will fail');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export type PlanTier = 'collector' | 'curator' | 'enthusiast';
