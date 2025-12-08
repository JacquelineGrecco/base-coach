-- Add unique constraint for team names per user
-- Prevents coaches from creating duplicate team names

-- Drop existing constraint if it exists
ALTER TABLE teams DROP CONSTRAINT IF EXISTS unique_team_name_per_user;

-- Add unique constraint on (user_id, name) combination
ALTER TABLE teams 
ADD CONSTRAINT unique_team_name_per_user UNIQUE (user_id, name);

COMMENT ON CONSTRAINT unique_team_name_per_user ON teams IS 'Ensures team names are unique per user';

