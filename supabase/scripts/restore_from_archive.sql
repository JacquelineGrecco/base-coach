-- =====================================================
-- Restore Data from Archive
-- =====================================================
-- Use this to restore accidentally deleted data
-- ⚠️ Use with caution - ensure data consistency
-- =====================================================

-- =====================================================
-- Example: Restore a User and All Their Data
-- =====================================================

DO $$
DECLARE
  target_user_email TEXT := 'user@example.com'; -- ⚠️ CHANGE THIS!
  target_user_id UUID;
  restored_teams INT := 0;
  restored_categories INT := 0;
  restored_players INT := 0;
BEGIN
  -- Get the user ID from archive
  SELECT id INTO target_user_id
  FROM users_archive
  WHERE email = target_user_email
  ORDER BY deleted_at DESC
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User % not found in archive', target_user_email;
  END IF;

  RAISE NOTICE 'Restoring user: % (ID: %)', target_user_email, target_user_id;

  -- 1. Restore User (only if not already exists)
  INSERT INTO users (
    id, email, name, phone, bio, user_type, plan_type, created_at
  )
  SELECT 
    id, email, name, phone, bio, user_type, plan_type, created_at
  FROM users_archive
  WHERE id = target_user_id
  ORDER BY deleted_at DESC
  LIMIT 1
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '✓ User restored';

  -- 2. Restore Teams
  INSERT INTO teams (
    id, user_id, name, sport, age_group, season, notes, is_archived, archived_at, created_at
  )
  SELECT 
    id, user_id, name, sport, age_group, season, notes, is_archived, archived_at, created_at
  FROM teams_archive
  WHERE user_id = target_user_id
  ON CONFLICT (id) DO NOTHING;

  GET DIAGNOSTICS restored_teams = ROW_COUNT;
  RAISE NOTICE '✓ Restored % teams', restored_teams;

  -- 3. Restore Categories
  INSERT INTO categories (
    id, team_id, name, age_group, gender, season, notes, is_active, archived_at, created_at
  )
  SELECT 
    id, team_id, name, age_group, gender, season, notes, is_active, archived_at, created_at
  FROM categories_archive
  WHERE team_id IN (SELECT id FROM teams WHERE user_id = target_user_id)
  ON CONFLICT (id) DO NOTHING;

  GET DIAGNOSTICS restored_categories = ROW_COUNT;
  RAISE NOTICE '✓ Restored % categories', restored_categories;

  -- 4. Restore Players
  INSERT INTO players (
    id, team_id, category_id, name, position, jersey_number, birth_date, notes, 
    is_active, archived_at, created_at
  )
  SELECT 
    id, team_id, category_id, name, position, jersey_number, birth_date, notes, 
    is_active, archived_at, created_at
  FROM players_archive
  WHERE team_id IN (SELECT id FROM teams WHERE user_id = target_user_id)
  ON CONFLICT (id) DO NOTHING;

  GET DIAGNOSTICS restored_players = ROW_COUNT;
  RAISE NOTICE '✓ Restored % players', restored_players;

  RAISE NOTICE '✅ Restore completed!';
  RAISE NOTICE 'Summary: User + % teams + % categories + % players', 
    restored_teams, restored_categories, restored_players;

END $$;

-- =====================================================
-- Example: Restore a Single Team
-- =====================================================

-- Uncomment and modify to restore a specific team
/*
DO $$
DECLARE
  target_team_id UUID := 'team-uuid-here'; -- ⚠️ CHANGE THIS!
BEGIN
  -- Restore team
  INSERT INTO teams (
    id, user_id, name, sport, age_group, season, notes, is_archived, archived_at, created_at
  )
  SELECT 
    id, user_id, name, sport, age_group, season, notes, is_archived, archived_at, created_at
  FROM teams_archive
  WHERE id = target_team_id
  ORDER BY deleted_at DESC
  LIMIT 1
  ON CONFLICT (id) DO NOTHING;

  -- Restore categories
  INSERT INTO categories (
    id, team_id, name, age_group, gender, season, notes, is_active, archived_at, created_at
  )
  SELECT 
    id, team_id, name, age_group, gender, season, notes, is_active, archived_at, created_at
  FROM categories_archive
  WHERE team_id = target_team_id
  ON CONFLICT (id) DO NOTHING;

  -- Restore players
  INSERT INTO players (
    id, team_id, category_id, name, position, jersey_number, birth_date, notes, 
    is_active, archived_at, created_at
  )
  SELECT 
    id, team_id, category_id, name, position, jersey_number, birth_date, notes, 
    is_active, archived_at, created_at
  FROM players_archive
  WHERE team_id = target_team_id
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '✅ Team and related data restored!';
END $$;
*/

-- =====================================================
-- Verify Restored Data
-- =====================================================

-- Check if user was restored
SELECT 
  'User' as type,
  email,
  name,
  is_active,
  created_at
FROM users
WHERE email = 'user@example.com'; -- Change this

-- Check restored teams
SELECT 
  'Team' as type,
  name,
  sport,
  is_archived
FROM teams
WHERE user_id IN (SELECT id FROM users WHERE email = 'user@example.com');

-- =====================================================
-- Cleanup: Remove from Archive After Successful Restore
-- =====================================================

-- Only run this AFTER verifying the restore was successful!
-- Uncomment to remove restored items from archive

/*
DELETE FROM users_archive 
WHERE email = 'user@example.com' 
  AND deleted_at = (
    SELECT MAX(deleted_at) FROM users_archive WHERE email = 'user@example.com'
  );

DELETE FROM teams_archive 
WHERE user_id IN (SELECT id FROM users WHERE email = 'user@example.com');

DELETE FROM categories_archive 
WHERE team_id IN (SELECT id FROM teams WHERE user_id IN (SELECT id FROM users WHERE email = 'user@example.com'));

DELETE FROM players_archive 
WHERE team_id IN (SELECT id FROM teams WHERE user_id IN (SELECT id FROM users WHERE email = 'user@example.com'));

RAISE NOTICE '✅ Cleaned up archive tables after successful restore';
*/






