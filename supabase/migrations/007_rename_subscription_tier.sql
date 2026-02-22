-- Rename profiles.subscription_tier → onboarding_selected_tier
-- This column only captures the user's tier selection during onboarding,
-- not their actual subscription plan (which lives in subscriptions.plan).
ALTER TABLE profiles
  RENAME COLUMN subscription_tier TO onboarding_selected_tier;
