-- Add category_id to sessions table for category-specific training sessions
-- Allows coaches to run sessions for specific categories (Sub-12, Sub-15, etc.)

-- Add category_id column (optional - null means all team players)
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_category_id ON sessions(category_id);

-- Add index for team + category combination queries
CREATE INDEX IF NOT EXISTS idx_sessions_team_category ON sessions(team_id, category_id);

COMMENT ON COLUMN sessions.category_id IS 'Optional category filter for the session. NULL means session includes all team players.';






