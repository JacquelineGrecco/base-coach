-- Add CHECK constraint for player positions
-- Ensures data integrity by only allowing predefined futsal positions

-- Add constraint to validate position values
ALTER TABLE players
DROP CONSTRAINT IF EXISTS valid_position;

ALTER TABLE players
ADD CONSTRAINT valid_position 
CHECK (
  position IS NULL OR 
  position IN ('Goleiro', 'Fixo', 'Ala', 'Pivô')
);

COMMENT ON CONSTRAINT valid_position ON players IS 'Validates that position is one of the allowed futsal positions: Goleiro, Fixo, Ala, Pivô';

-- Add index for better query performance when filtering by position
CREATE INDEX IF NOT EXISTS idx_players_position ON players(position) WHERE position IS NOT NULL;

COMMENT ON INDEX idx_players_position IS 'Improves query performance when filtering players by position';

