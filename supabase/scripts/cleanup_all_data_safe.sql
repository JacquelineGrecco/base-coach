-- =====================================================
-- SAFE CLEANUP - Deletes only YOUR data (not system data)
-- =====================================================
-- This version is safer and can be run without service_role
-- It only deletes data you own (based on your user_id)
-- =====================================================

-- Step 1: Find your user ID (replace with your actual email)
-- =====================================================
DO $$
DECLARE
  target_user_id UUID;
  deleted_evaluations INT;
  deleted_sessions INT;
  deleted_players INT;
  deleted_categories INT;
  deleted_teams INT;
BEGIN
  -- Get your user ID by email (CHANGE THIS TO YOUR EMAIL!)
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'YOUR_EMAIL@example.com'; -- ⚠️ CHANGE THIS!

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found! Update the email in the script.';
  END IF;

  RAISE NOTICE 'Deleting all data for user: %', target_user_id;

  -- Delete evaluations for your sessions
  WITH your_sessions AS (
    SELECT s.id
    FROM sessions s
    INNER JOIN teams t ON s.team_id = t.id
    WHERE t.user_id = target_user_id
  )
  DELETE FROM evaluations
  WHERE session_id IN (SELECT id FROM your_sessions);
  
  GET DIAGNOSTICS deleted_evaluations = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % evaluations', deleted_evaluations;

  -- Delete your sessions
  DELETE FROM sessions
  WHERE team_id IN (SELECT id FROM teams WHERE user_id = target_user_id);
  
  GET DIAGNOSTICS deleted_sessions = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % sessions', deleted_sessions;

  -- Delete your session templates
  DELETE FROM session_templates WHERE user_id = target_user_id;

  -- Delete your players
  DELETE FROM players
  WHERE team_id IN (SELECT id FROM teams WHERE user_id = target_user_id);
  
  GET DIAGNOSTICS deleted_players = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % players', deleted_players;

  -- Delete your categories
  DELETE FROM categories
  WHERE team_id IN (SELECT id FROM teams WHERE user_id = target_user_id);
  
  GET DIAGNOSTICS deleted_categories = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % categories', deleted_categories;

  -- Delete your teams
  DELETE FROM teams WHERE user_id = target_user_id;
  
  GET DIAGNOSTICS deleted_teams = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % teams', deleted_teams;

  -- Delete your profile (this will also delete from auth.users via trigger)
  DELETE FROM users WHERE id = target_user_id;
  
  RAISE NOTICE '✓ Deleted user profile';
  RAISE NOTICE '✅ Cleanup completed successfully!';
  
END $$;

