-- Migration 025: Add Subscription System
-- Description: Implements subscription tiers, limits, and tracking
-- Created: 2024-12-13

-- =====================================================
-- 1. Add subscription fields to users table
-- =====================================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' 
  CHECK (subscription_tier IN ('free', 'pro', 'premium', 'enterprise')),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' 
  CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'expired')),
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ai_insights_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_insights_reset_at TIMESTAMP WITH TIME ZONE DEFAULT date_trunc('month', now() + interval '1 month');

COMMENT ON COLUMN users.subscription_tier IS 'User subscription tier: free, pro, premium, or enterprise';
COMMENT ON COLUMN users.subscription_status IS 'Current subscription status';
COMMENT ON COLUMN users.ai_insights_used IS 'Number of AI insights used in current billing period';
COMMENT ON COLUMN users.ai_insights_reset_at IS 'When AI insights counter resets (monthly)';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_trial_ends_at ON users(trial_ends_at) WHERE trial_ends_at IS NOT NULL;

-- =====================================================
-- 2. Create subscription history table
-- =====================================================

CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'pro', 'premium', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'expired')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE subscription_history IS 'Tracks subscription tier changes over time';
COMMENT ON COLUMN subscription_history.metadata IS 'Additional data: payment_id, invoice_id, etc.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_started_at ON subscription_history(started_at);
CREATE INDEX IF NOT EXISTS idx_subscription_history_tier ON subscription_history(tier);

-- RLS policies
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription history"
  ON subscription_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription history"
  ON subscription_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 3. Function to check tier access
-- =====================================================

CREATE OR REPLACE FUNCTION has_tier_access(required_tier TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_tier TEXT;
  user_status TEXT;
BEGIN
  -- Get user's subscription tier and status
  SELECT subscription_tier, subscription_status INTO user_tier, user_status
  FROM users
  WHERE id = auth.uid();
  
  -- Check if subscription is active or trialing
  IF user_status NOT IN ('active', 'trialing') THEN
    RETURN FALSE;
  END IF;
  
  -- Check tier hierarchy
  RETURN CASE required_tier
    WHEN 'free' THEN TRUE
    WHEN 'pro' THEN user_tier IN ('pro', 'premium', 'enterprise')
    WHEN 'premium' THEN user_tier IN ('premium', 'enterprise')
    WHEN 'enterprise' THEN user_tier = 'enterprise'
    ELSE FALSE
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION has_tier_access(TEXT) IS 'Check if user has access to features requiring a specific tier';

-- =====================================================
-- 4. Function to get tier limits
-- =====================================================

CREATE OR REPLACE FUNCTION get_tier_limits(tier TEXT)
RETURNS TABLE(
  max_teams INTEGER,
  max_players_per_team INTEGER,
  max_ai_insights_per_month INTEGER
) AS $$
BEGIN
  RETURN QUERY SELECT
    CASE tier
      WHEN 'free' THEN 1
      WHEN 'pro' THEN 5
      WHEN 'premium' THEN 999999
      WHEN 'enterprise' THEN 999999
      ELSE 1
    END AS max_teams,
    CASE tier
      WHEN 'free' THEN 15
      WHEN 'pro' THEN 999999
      WHEN 'premium' THEN 999999
      WHEN 'enterprise' THEN 999999
      ELSE 15
    END AS max_players_per_team,
    CASE tier
      WHEN 'free' THEN 0
      WHEN 'pro' THEN 5
      WHEN 'premium' THEN 999999
      WHEN 'enterprise' THEN 999999
      ELSE 0
    END AS max_ai_insights_per_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_tier_limits(TEXT) IS 'Returns resource limits for a given subscription tier';

-- =====================================================
-- 5. Add is_active column to teams (for limit tracking)
-- =====================================================

ALTER TABLE teams
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_teams_is_active ON teams(is_active) WHERE is_active = true;

COMMENT ON COLUMN teams.is_active IS 'Whether team counts toward subscription limit';

-- =====================================================
-- 6. Function to check team limit
-- =====================================================

CREATE OR REPLACE FUNCTION check_team_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_tier TEXT;
  user_status TEXT;
  team_count INTEGER;
  max_teams INTEGER;
BEGIN
  -- Get user's subscription tier and status
  SELECT subscription_tier, subscription_status INTO user_tier, user_status
  FROM users
  WHERE id = NEW.coach_id;
  
  -- Check if subscription is active
  IF user_status NOT IN ('active', 'trialing') THEN
    RAISE EXCEPTION 'Your subscription is not active. Please renew to create teams.';
  END IF;
  
  -- Get max teams for this tier
  SELECT (get_tier_limits(user_tier)).max_teams INTO max_teams;
  
  -- Count active teams
  SELECT COUNT(*) INTO team_count
  FROM teams
  WHERE coach_id = NEW.coach_id
    AND is_active = true
    AND archived_at IS NULL;
  
  -- Check limit
  IF team_count >= max_teams THEN
    RAISE EXCEPTION 'Team limit reached for % tier (% teams). Please upgrade your subscription to add more teams.', 
      user_tier, max_teams
      USING HINT = 'Visit the Pricing page to upgrade your plan';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_team_limit() IS 'Trigger function to enforce team limits based on subscription tier';

-- Create trigger
DROP TRIGGER IF EXISTS enforce_team_limit ON teams;
CREATE TRIGGER enforce_team_limit
  BEFORE INSERT ON teams
  FOR EACH ROW
  EXECUTE FUNCTION check_team_limit();

-- =====================================================
-- 7. Function to check player limit
-- =====================================================

CREATE OR REPLACE FUNCTION check_player_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_tier TEXT;
  user_status TEXT;
  player_count INTEGER;
  max_players INTEGER;
BEGIN
  -- Get user's subscription tier via team
  SELECT u.subscription_tier, u.subscription_status INTO user_tier, user_status
  FROM users u
  JOIN teams t ON t.coach_id = u.id
  WHERE t.id = NEW.team_id;
  
  -- Check if subscription is active
  IF user_status NOT IN ('active', 'trialing') THEN
    RAISE EXCEPTION 'Your subscription is not active. Please renew to add players.';
  END IF;
  
  -- Get max players for this tier
  SELECT (get_tier_limits(user_tier)).max_players_per_team INTO max_players;
  
  -- Count active players in team
  SELECT COUNT(*) INTO player_count
  FROM players
  WHERE team_id = NEW.team_id
    AND archived_at IS NULL;
  
  -- Check limit
  IF player_count >= max_players THEN
    RAISE EXCEPTION 'Player limit reached for % tier (% players per team). Please upgrade your subscription to add more players.', 
      user_tier, max_players
      USING HINT = 'Visit the Pricing page to upgrade your plan';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_player_limit() IS 'Trigger function to enforce player limits based on subscription tier';

-- Create trigger
DROP TRIGGER IF EXISTS enforce_player_limit ON players;
CREATE TRIGGER enforce_player_limit
  BEFORE INSERT ON players
  FOR EACH ROW
  EXECUTE FUNCTION check_player_limit();

-- =====================================================
-- 8. Function to increment AI insights usage
-- =====================================================

CREATE OR REPLACE FUNCTION increment_ai_insights_usage(user_id_param UUID)
RETURNS VOID AS $$
DECLARE
  current_reset_at TIMESTAMP WITH TIME ZONE;
  current_count INTEGER;
BEGIN
  -- Get current reset date
  SELECT ai_insights_reset_at INTO current_reset_at
  FROM users
  WHERE id = user_id_param;
  
  -- If reset date has passed, reset counter
  IF current_reset_at < now() THEN
    UPDATE users
    SET 
      ai_insights_used = 1,
      ai_insights_reset_at = date_trunc('month', now() + interval '1 month')
    WHERE id = user_id_param;
  ELSE
    -- Increment counter
    UPDATE users
    SET ai_insights_used = ai_insights_used + 1
    WHERE id = user_id_param;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_ai_insights_usage(UUID) IS 'Increments AI insights usage counter, auto-resets monthly';

-- =====================================================
-- 9. Function to record subscription change
-- =====================================================

CREATE OR REPLACE FUNCTION record_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only record if tier or status changed
  IF (OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier) OR 
     (OLD.subscription_status IS DISTINCT FROM NEW.subscription_status) THEN
    
    -- End previous subscription in history
    IF OLD.subscription_tier IS NOT NULL THEN
      UPDATE subscription_history
      SET ended_at = now()
      WHERE user_id = NEW.id
        AND ended_at IS NULL;
    END IF;
    
    -- Insert new subscription history record
    INSERT INTO subscription_history (
      user_id,
      tier,
      status,
      started_at
    ) VALUES (
      NEW.id,
      NEW.subscription_tier,
      NEW.subscription_status,
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION record_subscription_change() IS 'Automatically records subscription changes to history table';

-- Create trigger
DROP TRIGGER IF EXISTS track_subscription_changes ON users;
CREATE TRIGGER track_subscription_changes
  AFTER UPDATE ON users
  FOR EACH ROW
  WHEN (OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier OR 
        OLD.subscription_status IS DISTINCT FROM NEW.subscription_status)
  EXECUTE FUNCTION record_subscription_change();

-- =====================================================
-- 10. Function to check and expire trials
-- =====================================================

CREATE OR REPLACE FUNCTION expire_trials()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Update expired trials to free tier
  WITH expired AS (
    UPDATE users
    SET 
      subscription_tier = 'free',
      subscription_status = 'expired',
      subscription_end_date = now()
    WHERE subscription_status = 'trialing'
      AND trial_ends_at < now()
    RETURNING id
  )
  SELECT COUNT(*) INTO expired_count FROM expired;
  
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION expire_trials() IS 'Expires trials that have reached their end date';

-- =====================================================
-- 11. Initialize existing users to free tier
-- =====================================================

-- Update existing users to free tier if not set
UPDATE users
SET 
  subscription_tier = 'free',
  subscription_status = 'active'
WHERE subscription_tier IS NULL;

-- Create initial history records for existing users
INSERT INTO subscription_history (user_id, tier, status, started_at)
SELECT 
  id,
  COALESCE(subscription_tier, 'free'),
  COALESCE(subscription_status, 'active'),
  created_at
FROM users
WHERE id NOT IN (SELECT user_id FROM subscription_history)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 12. Schedule trial expiration check (pg_cron)
-- =====================================================

-- Check if pg_cron extension exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Unschedule existing job if it exists
    PERFORM cron.unschedule('expire-trials');
    
    -- Schedule daily trial expiration check at 3 AM UTC
    PERFORM cron.schedule(
      'expire-trials',
      '0 3 * * *',
      $$SELECT expire_trials();$$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron extension not available, skipping scheduled job';
END $$;

-- =====================================================
-- Migration Complete
-- =====================================================

-- Summary of changes:
-- ✅ Added subscription fields to users table
-- ✅ Created subscription_history table with RLS
-- ✅ Added helper functions for tier checking and limits
-- ✅ Added triggers to enforce team and player limits
-- ✅ Added AI insights usage tracking
-- ✅ Added subscription change tracking
-- ✅ Added trial expiration automation
-- ✅ Initialized existing users to free tier

-- Next steps:
-- 1. Create subscriptionService.ts in the app
-- 2. Update components to check subscription tier
-- 3. Add UpgradePrompt component
-- 4. Gate premium features (radar charts, evolution charts, AI insights)

