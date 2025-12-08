-- =====================================================
-- User Deactivation System (No Auto-Recovery)
-- =====================================================
-- Users are deactivated (not deleted)
-- After 365 days of inactivity → Contact support via WhatsApp
-- Before 365 days → Support can manually reactivate
-- =====================================================

-- Ensure pg_cron extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =====================================================
-- Step 1: Add deactivation fields to users table
-- =====================================================

-- Add is_active column (default true)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add deactivated_at timestamp
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

-- Add deactivation_reason (optional feedback)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS deactivation_reason TEXT;

COMMENT ON COLUMN users.is_active IS 'Whether the user account is active. Deactivated accounts cannot login.';
COMMENT ON COLUMN users.deactivated_at IS 'Timestamp when the user was deactivated. After 365 days, user must contact support.';
COMMENT ON COLUMN users.deactivation_reason IS 'Optional reason provided by user when deactivating account.';

-- =====================================================
-- Step 2: Update archived retention to 365 days
-- =====================================================

COMMENT ON COLUMN teams.archived_at IS 'Timestamp when the team was archived. Items older than 365 days are auto-deleted.';
COMMENT ON COLUMN categories.archived_at IS 'Timestamp when the category was archived. Items older than 365 days are auto-deleted.';
COMMENT ON COLUMN players.archived_at IS 'Timestamp when the player was archived. Items older than 365 days are auto-deleted.';

-- =====================================================
-- Create Archive Tables for Historical Data
-- =====================================================

-- Archive table for deleted teams
CREATE TABLE IF NOT EXISTS teams_archive (
  id UUID,
  user_id UUID,
  name TEXT,
  sport TEXT,
  age_group TEXT,
  season TEXT,
  notes TEXT,
  is_archived BOOLEAN,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, deleted_at)
);

-- Archive table for deleted categories
CREATE TABLE IF NOT EXISTS categories_archive (
  id UUID,
  team_id UUID,
  name TEXT,
  age_group TEXT,
  gender TEXT,
  season TEXT,
  notes TEXT,
  is_active BOOLEAN,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, deleted_at)
);

-- Archive table for deleted players
CREATE TABLE IF NOT EXISTS players_archive (
  id UUID,
  team_id UUID,
  category_id UUID,
  name TEXT,
  position TEXT,
  jersey_number INTEGER,
  birth_date DATE,
  notes TEXT,
  is_active BOOLEAN,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, deleted_at)
);

-- Archive table for deleted users
CREATE TABLE IF NOT EXISTS users_archive (
  id UUID,
  email TEXT,
  name TEXT,
  phone TEXT,
  bio TEXT,
  user_type TEXT,
  plan_type TEXT,
  is_active BOOLEAN,
  deactivated_at TIMESTAMPTZ,
  deactivation_reason TEXT,
  created_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, deleted_at)
);

COMMENT ON TABLE teams_archive IS 'Archive of permanently deleted teams for audit/recovery purposes';
COMMENT ON TABLE categories_archive IS 'Archive of permanently deleted categories for audit/recovery purposes';
COMMENT ON TABLE players_archive IS 'Archive of permanently deleted players for audit/recovery purposes';
COMMENT ON TABLE users_archive IS 'Archive of permanently deleted users for audit/recovery purposes';

-- Create indexes on archive tables
CREATE INDEX IF NOT EXISTS idx_teams_archive_user_id ON teams_archive(user_id);
CREATE INDEX IF NOT EXISTS idx_teams_archive_deleted_at ON teams_archive(deleted_at);
CREATE INDEX IF NOT EXISTS idx_categories_archive_team_id ON categories_archive(team_id);
CREATE INDEX IF NOT EXISTS idx_categories_archive_deleted_at ON categories_archive(deleted_at);
CREATE INDEX IF NOT EXISTS idx_players_archive_team_id ON players_archive(team_id);
CREATE INDEX IF NOT EXISTS idx_players_archive_deleted_at ON players_archive(deleted_at);
CREATE INDEX IF NOT EXISTS idx_users_archive_email ON users_archive(email);
CREATE INDEX IF NOT EXISTS idx_users_archive_deleted_at ON users_archive(deleted_at);

-- =====================================================
-- Update cleanup function to archive before deleting
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_archived_items()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  archived_players_count INT;
  archived_categories_count INT;
  archived_teams_count INT;
BEGIN
  -- Archive players before deleting (move to archive table)
  INSERT INTO players_archive (
    id, team_id, category_id, name, position, jersey_number, 
    birth_date, notes, is_active, archived_at, created_at
  )
  SELECT 
    id, team_id, category_id, name, position, jersey_number, 
    birth_date, notes, is_active, archived_at, created_at
  FROM players
  WHERE is_active = false 
    AND archived_at IS NOT NULL 
    AND archived_at < NOW() - INTERVAL '365 days';
  
  GET DIAGNOSTICS archived_players_count = ROW_COUNT;

  -- Now delete archived players
  DELETE FROM players
  WHERE is_active = false 
    AND archived_at IS NOT NULL 
    AND archived_at < NOW() - INTERVAL '365 days';

  -- Archive categories before deleting
  INSERT INTO categories_archive (
    id, team_id, name, age_group, gender, season, notes, 
    is_active, archived_at, created_at
  )
  SELECT 
    id, team_id, name, age_group, gender, season, notes, 
    is_active, archived_at, created_at
  FROM categories
  WHERE is_active = false 
    AND archived_at IS NOT NULL 
    AND archived_at < NOW() - INTERVAL '365 days';
  
  GET DIAGNOSTICS archived_categories_count = ROW_COUNT;

  -- Now delete archived categories
  DELETE FROM categories
  WHERE is_active = false 
    AND archived_at IS NOT NULL 
    AND archived_at < NOW() - INTERVAL '365 days';

  -- Archive teams before deleting
  INSERT INTO teams_archive (
    id, user_id, name, sport, age_group, season, notes, 
    is_archived, archived_at, created_at
  )
  SELECT 
    id, user_id, name, sport, age_group, season, notes, 
    is_archived, archived_at, created_at
  FROM teams
  WHERE is_archived = true 
    AND archived_at IS NOT NULL 
    AND archived_at < NOW() - INTERVAL '365 days';
  
  GET DIAGNOSTICS archived_teams_count = ROW_COUNT;

  -- Now delete archived teams
  DELETE FROM teams
  WHERE is_archived = true 
    AND archived_at IS NOT NULL 
    AND archived_at < NOW() - INTERVAL '365 days';

  RAISE NOTICE 'Cleanup completed: Archived % teams, % categories, % players before deletion', 
    archived_teams_count, archived_categories_count, archived_players_count;
END;
$$;

COMMENT ON FUNCTION cleanup_old_archived_items() IS 'Archives and then deletes teams, categories, and players that have been archived for more than 365 days. Data is preserved in archive tables.';

-- =====================================================
-- Step 3: Create function to deactivate user account
-- =====================================================

CREATE OR REPLACE FUNCTION deactivate_user_account(
  user_id_param UUID,
  reason_param TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark user as deactivated
  UPDATE users
  SET 
    is_active = false,
    deactivated_at = NOW(),
    deactivation_reason = reason_param,
    updated_at = NOW()
  WHERE id = user_id_param;

  -- Archive all user's teams (cascades to categories and players)
  UPDATE teams
  SET is_archived = true, archived_at = NOW()
  WHERE user_id = user_id_param AND is_archived = false;

  RAISE NOTICE 'User account deactivated. User must contact support to reactivate after 365 days.';
END;
$$;

COMMENT ON FUNCTION deactivate_user_account(UUID, TEXT) IS 'Deactivates a user account and archives all related data. User cannot login. Support can reactivate within 365 days.';

-- =====================================================
-- Step 4: Create function to reactivate user account (Admin/Support only)
-- =====================================================

CREATE OR REPLACE FUNCTION reactivate_user_account(user_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user exists and is deactivated
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id_param 
      AND is_active = false
  ) THEN
    RAISE EXCEPTION 'User account is already active or does not exist.';
  END IF;

  -- Reactivate user
  UPDATE users
  SET 
    is_active = true,
    deactivated_at = NULL,
    deactivation_reason = NULL,
    updated_at = NOW()
  WHERE id = user_id_param;

  -- Restore user's teams
  UPDATE teams
  SET is_archived = false, archived_at = NULL
  WHERE user_id = user_id_param 
    AND archived_at IS NOT NULL;

  -- Restore categories
  UPDATE categories
  SET is_active = true, archived_at = NULL
  WHERE team_id IN (SELECT id FROM teams WHERE user_id = user_id_param)
    AND archived_at IS NOT NULL;

  -- Restore players
  UPDATE players
  SET is_active = true, archived_at = NULL
  WHERE team_id IN (SELECT id FROM teams WHERE user_id = user_id_param)
    AND archived_at IS NOT NULL;

  RAISE NOTICE 'User account reactivated successfully by support.';
END;
$$;

COMMENT ON FUNCTION reactivate_user_account(UUID) IS 'Reactivates a deactivated user account. Should only be called by admin/support staff.';

-- =====================================================
-- Step 5: Create function to permanently delete old deactivated users
-- =====================================================
-- This runs automatically after 365 days of deactivation
-- Data is permanently deleted at this point

CREATE OR REPLACE FUNCTION cleanup_old_deactivated_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  archived_users_count INT;
BEGIN
  -- Archive users before deleting (move to archive table)
  INSERT INTO users_archive (
    id, email, name, phone, bio, user_type, plan_type,
    is_active, deactivated_at, deactivation_reason, created_at
  )
  SELECT 
    id, email, name, phone, bio, user_type, plan_type,
    is_active, deactivated_at, deactivation_reason, created_at
  FROM users
  WHERE is_active = false
    AND deactivated_at IS NOT NULL 
    AND deactivated_at < NOW() - INTERVAL '365 days';
  
  GET DIAGNOSTICS archived_users_count = ROW_COUNT;

  -- Now permanently delete users who have been deactivated for more than 365 days
  -- The CASCADE will delete all related data (teams, players, sessions, etc.)
  -- Note: Teams/categories/players should already be archived by cleanup_old_archived_items()
  DELETE FROM users
  WHERE is_active = false
    AND deactivated_at IS NOT NULL 
    AND deactivated_at < NOW() - INTERVAL '365 days';

  RAISE NOTICE 'Cleanup completed: Archived and deleted % deactivated users older than 365 days', archived_users_count;
END;
$$;

COMMENT ON FUNCTION cleanup_old_deactivated_users() IS 'Archives and then permanently deletes user accounts that have been deactivated for more than 365 days. User data is preserved in users_archive table.';

-- =====================================================
-- Step 6: Update scheduled cron job
-- =====================================================

-- Try to unschedule the old job (ignore error if it doesn't exist)
DO $$
BEGIN
  PERFORM cron.unschedule('cleanup-archived-items');
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Job cleanup-archived-items does not exist, skipping unschedule';
END $$;

-- Schedule the new job to run both cleanup functions
SELECT cron.schedule(
  'cleanup-archived-items',
  '0 2 * * *',  -- Every day at 2:00 AM UTC
  $$
    SELECT cleanup_old_archived_items();
    SELECT cleanup_old_deactivated_users();
  $$
);

-- =====================================================
-- Step 7: Add index for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_deactivated_at ON users(deactivated_at) WHERE is_active = false;

-- =====================================================
-- Migration Complete
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ User deactivation system installed successfully!';
  RAISE NOTICE 'Users can be deactivated and will be permanently deleted after 365 days.';
  RAISE NOTICE 'Users deactivated for 365+ days must contact support via WhatsApp.';
END $$;

