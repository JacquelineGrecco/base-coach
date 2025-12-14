-- =====================================================
-- CLEANUP ALL DATA - Use with EXTREME CAUTION!
-- =====================================================
-- This script deletes ALL data from the database
-- Use ONLY for testing/development environments
-- DO NOT run in production!
-- =====================================================

-- Step 1: Delete all data from application tables (in correct order due to foreign keys)
-- =====================================================

-- Delete evaluations (depends on sessions and players)
DELETE FROM evaluations;

-- Delete sessions (depends on teams and categories)
DELETE FROM sessions;

-- Delete session templates
DELETE FROM session_templates;

-- Delete players (depends on teams and categories)
DELETE FROM players;

-- Delete categories (depends on teams)
DELETE FROM categories;

-- Delete teams (depends on users)
DELETE FROM teams;

-- Delete users from public.users (this is the profile table)
DELETE FROM users;

-- =====================================================
-- Step 2: Delete ALL auth users from auth.users
-- =====================================================
-- WARNING: This requires superuser/service_role permissions
-- Run this in Supabase Dashboard with service_role key
-- =====================================================

-- Option A: If you have RLS bypassed (Supabase Dashboard SQL Editor)
DELETE FROM auth.users;

-- =====================================================
-- Step 3: Reset auto-increment sequences (optional)
-- =====================================================
-- This ensures IDs start from 1 again
-- Not necessary for UUID-based tables, but good for consistency

-- No sequences to reset (all tables use UUIDs)

-- =====================================================
-- Step 4: Clear cron job history (optional)
-- =====================================================
-- This clears the job run history but keeps the scheduled jobs

-- Uncomment if you want to clear cron history
-- DELETE FROM cron.job_run_details;

-- =====================================================
-- Step 5: Verify cleanup
-- =====================================================

-- Check all tables are empty
SELECT 'evaluations' as table_name, COUNT(*) as count FROM evaluations
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'session_templates', COUNT(*) FROM session_templates
UNION ALL
SELECT 'players', COUNT(*) FROM players
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'teams', COUNT(*) FROM teams
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'auth.users', COUNT(*) FROM auth.users;

-- =====================================================
-- Expected output: All counts should be 0
-- =====================================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Database cleanup completed successfully!';
  RAISE NOTICE 'All users, data, and auth records have been deleted.';
  RAISE NOTICE 'You can now create fresh test accounts.';
END $$;


