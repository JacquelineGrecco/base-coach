-- Add season and notes columns to teams table
-- This allows teams to have season/year tracking and additional information

ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS season TEXT;

ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN teams.season IS 'Season or year (e.g., "2025", "2024/2025")';
COMMENT ON COLUMN teams.notes IS 'Optional notes/description for the team';

