-- Allow score of 0 in evaluations (for "not evaluated" / "N/A")
-- Current constraint only allows 1-5, but UI allows 0

-- Drop the old constraint
ALTER TABLE evaluations
DROP CONSTRAINT IF EXISTS evaluations_score_check;

-- Add new constraint allowing 0-5
ALTER TABLE evaluations
ADD CONSTRAINT evaluations_score_check CHECK (score BETWEEN 0 AND 5);

COMMENT ON COLUMN evaluations.score IS 'Player score for this valence (0 = not evaluated, 1-5 = rating)';

