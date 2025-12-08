-- Add archived_at timestamp to track when items were archived
-- Items archived for more than 7 days will be automatically deleted

-- Add archived_at column to teams
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

COMMENT ON COLUMN teams.archived_at IS 'Timestamp when the team was archived. Items older than 7 days are auto-deleted.';

-- Add archived_at column to categories
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

COMMENT ON COLUMN categories.archived_at IS 'Timestamp when the category was archived. Items older than 7 days are auto-deleted.';

-- Add archived_at column to players
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

COMMENT ON COLUMN players.archived_at IS 'Timestamp when the player was archived. Items older than 7 days are auto-deleted.';

-- Create function to clean up archived items older than 7 days
CREATE OR REPLACE FUNCTION cleanup_old_archived_items()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete players archived more than 7 days ago
  DELETE FROM players
  WHERE is_active = false 
    AND archived_at IS NOT NULL 
    AND archived_at < NOW() - INTERVAL '7 days';

  -- Delete categories archived more than 7 days ago
  DELETE FROM categories
  WHERE is_active = false 
    AND archived_at IS NOT NULL 
    AND archived_at < NOW() - INTERVAL '7 days';

  -- Delete teams archived more than 7 days ago
  DELETE FROM teams
  WHERE is_archived = true 
    AND archived_at IS NOT NULL 
    AND archived_at < NOW() - INTERVAL '7 days';

  -- Log the cleanup (optional)
  RAISE NOTICE 'Cleanup completed: archived items older than 7 days have been deleted';
END;
$$;

COMMENT ON FUNCTION cleanup_old_archived_items() IS 'Deletes archived teams, categories, and players that have been archived for more than 7 days';

-- Set up automatic cleanup using pg_cron extension
-- This runs daily at 2 AM UTC
-- Enable pg_cron extension first (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing schedule if it exists
SELECT cron.unschedule('cleanup-archived-items') WHERE jobid IN (
  SELECT jobid FROM cron.job WHERE jobname = 'cleanup-archived-items'
);

-- Schedule the cleanup job to run daily at 2 AM UTC
SELECT cron.schedule(
  'cleanup-archived-items',     -- Job name
  '0 2 * * *',                   -- Cron expression: Every day at 2:00 AM
  'SELECT cleanup_old_archived_items()'  -- SQL to execute
);

COMMENT ON EXTENSION pg_cron IS 'Job scheduler for PostgreSQL';

-- Note: If pg_cron is not available in your Supabase instance, you can:
-- Option 1: Run manually when needed: SELECT cleanup_old_archived_items();
-- Option 2: Call this function from your application
-- Option 3: Set up a Supabase Edge Function with a cron trigger

