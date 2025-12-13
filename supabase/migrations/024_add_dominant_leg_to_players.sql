-- ============================================================================
-- Migration: Add dominant_leg field to players table
-- Description: Adds a field to track the player's dominant leg (left, right, both)
-- Author: BaseCoach Team
-- Date: 2025-12-13
-- ============================================================================

-- Add dominant_leg column to players table
ALTER TABLE players
ADD COLUMN dominant_leg TEXT CHECK (dominant_leg IN ('left', 'right', 'both', 'Esquerda', 'Direita', 'Ambos'));

-- Add comment for documentation
COMMENT ON COLUMN players.dominant_leg IS 'Player''s dominant leg: left, right, or both (Esquerda, Direita, Ambos)';

-- Create index for filtering by dominant leg (optional, for analytics)
CREATE INDEX idx_players_dominant_leg ON players(dominant_leg);

