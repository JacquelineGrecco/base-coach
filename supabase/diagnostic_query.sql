-- Supabase Database Diagnostics Script
-- Run this in your Supabase SQL Editor to diagnose RLS and auth issues
-- Copy and paste this entire script into: Supabase Dashboard > SQL Editor > New Query

-- ============================================================================
-- 1. CHECK IF USER IS AUTHENTICATED
-- ============================================================================
SELECT 
  'Current User ID' as check_name,
  auth.uid() as result,
  CASE 
    WHEN auth.uid() IS NULL THEN '❌ NO USER AUTHENTICATED'
    ELSE '✅ User is authenticated'
  END as status;

-- ============================================================================
-- 2. CHECK USER PROFILE EXISTS
-- ============================================================================
SELECT 
  'User Profile Check' as check_name,
  id,
  name,
  email,
  is_active,
  CASE 
    WHEN is_active = true THEN '✅ Profile is active'
    ELSE '⚠️  Profile is NOT active'
  END as status
FROM users 
WHERE id = auth.uid();

-- ============================================================================
-- 3. CHECK TEAMS OWNED BY USER
-- ============================================================================
SELECT 
  '==== TEAMS ====' as section,
  id as team_id,
  name as team_name,
  user_id,
  CASE 
    WHEN user_id = auth.uid() THEN '✅ Owned by you'
    ELSE '❌ NOT owned by you'
  END as ownership_status,
  is_active,
  created_at
FROM teams 
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- ============================================================================
-- 4. CHECK PLAYERS IN YOUR TEAMS
-- ============================================================================
SELECT 
  '==== PLAYERS ====' as section,
  p.id as player_id,
  p.name as player_name,
  p.jersey_number,
  p.team_id,
  t.name as team_name,
  p.is_active as player_active,
  p.archived_at,
  CASE 
    WHEN t.user_id = auth.uid() THEN '✅ You can access'
    ELSE '❌ You CANNOT access'
  END as access_status
FROM players p
JOIN teams t ON t.id = p.team_id
WHERE t.user_id = auth.uid()
ORDER BY t.name, p.jersey_number, p.name
LIMIT 20;

-- ============================================================================
-- 5. CHECK RLS POLICIES ON PLAYERS TABLE
-- ============================================================================
SELECT 
  '==== RLS POLICIES (players table) ====' as section,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression
FROM pg_policies
WHERE tablename = 'players';

-- ============================================================================
-- 6. TEST DIRECT PLAYER QUERY (as the RLS policy would see it)
-- ============================================================================
-- This tests if the RLS policy is working correctly
SELECT 
  '==== TEST QUERY ====' as section,
  p.id,
  p.name,
  p.team_id,
  COUNT(*) OVER() as total_accessible_players
FROM players p
WHERE EXISTS (
  SELECT 1 FROM teams 
  WHERE teams.id = p.team_id 
  AND teams.user_id = auth.uid()
)
AND p.is_active = true
LIMIT 5;

-- ============================================================================
-- 7. CHECK FOR COMMON ISSUES
-- ============================================================================
-- Check if there are active players but they're not showing up
SELECT 
  '==== DIAGNOSTICS ====' as section,
  (SELECT COUNT(*) FROM teams WHERE user_id = auth.uid()) as total_teams,
  (SELECT COUNT(*) FROM players p 
   JOIN teams t ON t.id = p.team_id 
   WHERE t.user_id = auth.uid()) as total_players_all,
  (SELECT COUNT(*) FROM players p 
   JOIN teams t ON t.id = p.team_id 
   WHERE t.user_id = auth.uid() AND p.is_active = true) as total_players_active,
  (SELECT COUNT(*) FROM players p 
   JOIN teams t ON t.id = p.team_id 
   WHERE t.user_id = auth.uid() AND p.archived_at IS NOT NULL) as total_players_archived;

-- ============================================================================
-- 8. CHECK AUTH USER vs DATABASE USER
-- ============================================================================
SELECT 
  '==== AUTH vs DATABASE CHECK ====' as section,
  auth.uid() as auth_user_id,
  (SELECT id FROM users WHERE id = auth.uid()) as db_user_id,
  CASE 
    WHEN (SELECT id FROM users WHERE id = auth.uid()) IS NULL 
    THEN '❌ CRITICAL: Auth user exists but NO database profile!'
    ELSE '✅ User profile matches auth'
  END as sync_status;

-- ============================================================================
-- INTERPRETATION GUIDE:
-- ============================================================================
-- ✅ All checks show positive results = Database is OK
-- ❌ "NO USER AUTHENTICATED" = Session/auth issue (frontend problem)
-- ⚠️  "Profile is NOT active" = User account is deactivated
-- ❌ "NOT owned by you" for teams = Permission issue
-- ❌ "You CANNOT access" for players = RLS policy blocking access
-- 🔍 total_players_all > 0 but total_players_active = 0 = All players are inactive/archived

