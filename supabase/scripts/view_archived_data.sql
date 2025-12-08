-- =====================================================
-- View Archived Data
-- =====================================================
-- Query archived data that was moved before deletion
-- Use this for audit, recovery, or analytics
-- =====================================================

-- =====================================================
-- View Archived Users
-- =====================================================

-- All archived users
SELECT 
  id,
  email,
  name,
  deactivated_at,
  deleted_at,
  DATE_PART('day', deleted_at - deactivated_at) as days_before_deletion,
  deactivation_reason
FROM users_archive
ORDER BY deleted_at DESC;

-- Count archived users by month
SELECT 
  TO_CHAR(deleted_at, 'YYYY-MM') as month,
  COUNT(*) as archived_count
FROM users_archive
GROUP BY TO_CHAR(deleted_at, 'YYYY-MM')
ORDER BY month DESC;

-- =====================================================
-- View Archived Teams
-- =====================================================

-- All archived teams
SELECT 
  id,
  user_id,
  name,
  sport,
  archived_at,
  deleted_at,
  DATE_PART('day', deleted_at - archived_at) as days_before_deletion
FROM teams_archive
ORDER BY deleted_at DESC
LIMIT 100;

-- Archived teams by user
SELECT 
  user_id,
  COUNT(*) as team_count
FROM teams_archive
GROUP BY user_id
ORDER BY team_count DESC;

-- =====================================================
-- View Archived Categories
-- =====================================================

-- All archived categories
SELECT 
  id,
  team_id,
  name,
  gender,
  archived_at,
  deleted_at
FROM categories_archive
ORDER BY deleted_at DESC
LIMIT 100;

-- =====================================================
-- View Archived Players
-- =====================================================

-- All archived players
SELECT 
  id,
  team_id,
  category_id,
  name,
  position,
  jersey_number,
  archived_at,
  deleted_at
FROM players_archive
ORDER BY deleted_at DESC
LIMIT 100;

-- Count archived players by position
SELECT 
  position,
  COUNT(*) as player_count
FROM players_archive
GROUP BY position
ORDER BY player_count DESC;

-- =====================================================
-- Search Archived Data by Email
-- =====================================================

-- Find all data related to a specific user email
WITH user_info AS (
  SELECT id, email, name, deleted_at
  FROM users_archive
  WHERE email = 'user@example.com' -- Change this
)
SELECT 
  'User' as type,
  u.id::TEXT as id,
  u.name as name,
  u.deleted_at as deleted_at
FROM user_info u

UNION ALL

SELECT 
  'Team' as type,
  t.id::TEXT,
  t.name,
  t.deleted_at
FROM teams_archive t
INNER JOIN user_info u ON t.user_id = u.id

UNION ALL

SELECT 
  'Category' as type,
  c.id::TEXT,
  c.name,
  c.deleted_at
FROM categories_archive c
INNER JOIN teams_archive t ON c.team_id = t.id
INNER JOIN user_info u ON t.user_id = u.id

UNION ALL

SELECT 
  'Player' as type,
  p.id::TEXT,
  p.name,
  p.deleted_at
FROM players_archive p
INNER JOIN teams_archive t ON p.team_id = t.id
INNER JOIN user_info u ON t.user_id = u.id

ORDER BY deleted_at DESC;

-- =====================================================
-- Statistics on Archived Data
-- =====================================================

-- Overall archive statistics
SELECT 
  'Users' as table_name,
  COUNT(*) as total_archived,
  MIN(deleted_at) as first_archived,
  MAX(deleted_at) as last_archived
FROM users_archive

UNION ALL

SELECT 
  'Teams',
  COUNT(*),
  MIN(deleted_at),
  MAX(deleted_at)
FROM teams_archive

UNION ALL

SELECT 
  'Categories',
  COUNT(*),
  MIN(deleted_at),
  MAX(deleted_at)
FROM categories_archive

UNION ALL

SELECT 
  'Players',
  COUNT(*),
  MIN(deleted_at),
  MAX(deleted_at)
FROM players_archive;

-- =====================================================
-- Optional: Purge Old Archives (Use with Caution!)
-- =====================================================

-- Uncomment to delete archives older than 2 years
-- WARNING: This is permanent!

-- DELETE FROM users_archive WHERE deleted_at < NOW() - INTERVAL '2 years';
-- DELETE FROM teams_archive WHERE deleted_at < NOW() - INTERVAL '2 years';
-- DELETE FROM categories_archive WHERE deleted_at < NOW() - INTERVAL '2 years';
-- DELETE FROM players_archive WHERE deleted_at < NOW() - INTERVAL '2 years';

-- =====================================================
-- Export Archived Data for Backup
-- =====================================================

-- Copy to CSV (run in psql or use Supabase Dashboard export)
-- \copy (SELECT * FROM users_archive ORDER BY deleted_at DESC) TO 'users_archive_backup.csv' WITH CSV HEADER;
-- \copy (SELECT * FROM teams_archive ORDER BY deleted_at DESC) TO 'teams_archive_backup.csv' WITH CSV HEADER;
-- \copy (SELECT * FROM categories_archive ORDER BY deleted_at DESC) TO 'categories_archive_backup.csv' WITH CSV HEADER;
-- \copy (SELECT * FROM players_archive ORDER BY deleted_at DESC) TO 'players_archive_backup.csv' WITH CSV HEADER;

