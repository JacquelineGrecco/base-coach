-- Rename 'valence' column to 'valence_id' in evaluations table
-- This aligns with the naming convention used in the app code

-- Rename the column
ALTER TABLE evaluations
RENAME COLUMN valence TO valence_id;

-- Update the unique constraint to use the new column name
ALTER TABLE evaluations
DROP CONSTRAINT IF EXISTS evaluations_session_id_player_id_valence_key;

ALTER TABLE evaluations
ADD CONSTRAINT evaluations_session_id_player_id_valence_id_key 
UNIQUE(session_id, player_id, valence_id);

-- Update the index to use the new column name
DROP INDEX IF EXISTS idx_evaluations_player_valence;
CREATE INDEX IF NOT EXISTS idx_evaluations_player_valence_id ON evaluations(player_id, valence_id);

COMMENT ON COLUMN evaluations.valence_id IS 'The valence/criteria being evaluated (e.g., passing, dribbling, etc.)';


