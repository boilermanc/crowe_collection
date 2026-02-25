-- Change app-managed trial from 14 days to 7 days.
-- Trial is managed entirely in the app (no Stripe trial).

-- Update the trigger function to use 7 days for new signups
CREATE OR REPLACE FUNCTION create_trial_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (user_id, plan, status, trial_start, trial_end)
  VALUES (NEW.id, 'curator', 'trialing', now(), now() + interval '7 days')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
