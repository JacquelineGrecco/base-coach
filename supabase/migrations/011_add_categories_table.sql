-- Add categories table for team age groups/divisions
-- Categories are optional groupings within a team (Sub-12, Sub-15, etc.)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age_group TEXT,
  season TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure category names are unique within a team
  UNIQUE(team_id, name)
);

-- Add category_id to players table (optional - players can be team-level or category-level)
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_categories_team_id ON categories(team_id);
CREATE INDEX IF NOT EXISTS idx_players_category_id ON players(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories table
-- Users can view categories for their own teams
CREATE POLICY "Users can view categories for own teams" ON categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = categories.team_id 
      AND teams.user_id = auth.uid()
    )
  );

-- Users can create categories for their own teams
CREATE POLICY "Users can create categories for own teams" ON categories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = categories.team_id 
      AND teams.user_id = auth.uid()
    )
  );

-- Users can update categories for their own teams
CREATE POLICY "Users can update categories for own teams" ON categories
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = categories.team_id 
      AND teams.user_id = auth.uid()
    )
  );

-- Users can delete categories for their own teams
CREATE POLICY "Users can delete categories for own teams" ON categories
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = categories.team_id 
      AND teams.user_id = auth.uid()
    )
  );

-- Add comments for documentation
COMMENT ON TABLE categories IS 'Age group/division categories within teams (e.g., Sub-12, Sub-15)';
COMMENT ON COLUMN categories.team_id IS 'The team this category belongs to';
COMMENT ON COLUMN categories.name IS 'Category name (e.g., "Sub-12", "Juvenil")';
COMMENT ON COLUMN categories.age_group IS 'Age group code (e.g., "U-12", "U-15")';
COMMENT ON COLUMN categories.season IS 'Season or year (e.g., "2025", "2024/2025")';
COMMENT ON COLUMN categories.is_active IS 'Whether this category is currently active';

COMMENT ON COLUMN players.category_id IS 'Optional category assignment. Players belong to teams (required) and can optionally be assigned to categories';

-- Create a helpful view for player assignments
CREATE OR REPLACE VIEW player_assignments AS
SELECT 
  p.id AS player_id,
  p.name AS player_name,
  p.position,
  p.jersey_number,
  t.id AS team_id,
  t.name AS team_name,
  c.id AS category_id,
  c.name AS category_name,
  c.age_group,
  CASE 
    WHEN c.id IS NULL THEN 'Team Level'
    ELSE 'Category Level'
  END AS assignment_level
FROM players p
JOIN teams t ON t.id = p.team_id
LEFT JOIN categories c ON c.id = p.category_id
WHERE p.is_active = true;

COMMENT ON VIEW player_assignments IS 'Helpful view showing player team and category assignments';

