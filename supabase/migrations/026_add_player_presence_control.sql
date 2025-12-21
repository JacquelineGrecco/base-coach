-- Migration 026: Add Player Presence Control
-- Description: Track player attendance in training sessions
-- Created: 2024-12-21

-- =====================================================
-- 1. Create session_attendance table
-- =====================================================

CREATE TABLE IF NOT EXISTS session_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  is_present BOOLEAN NOT NULL DEFAULT true,
  arrival_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure one attendance record per player per session
  UNIQUE(session_id, player_id)
);

COMMENT ON TABLE session_attendance IS 'Tracks which players were present in each training session';
COMMENT ON COLUMN session_attendance.is_present IS 'Whether the player attended the session';
COMMENT ON COLUMN session_attendance.arrival_time IS 'When the player arrived (optional)';
COMMENT ON COLUMN session_attendance.notes IS 'Notes about attendance (late, injured, etc)';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_attendance_session_id ON session_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_session_attendance_player_id ON session_attendance(player_id);
CREATE INDEX IF NOT EXISTS idx_session_attendance_is_present ON session_attendance(is_present);
CREATE INDEX IF NOT EXISTS idx_session_attendance_created_at ON session_attendance(created_at);

-- =====================================================
-- 2. Row Level Security (RLS) Policies
-- =====================================================

ALTER TABLE session_attendance ENABLE ROW LEVEL SECURITY;

-- Users can view attendance for their own sessions
CREATE POLICY "Users can view own session attendance"
  ON session_attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      JOIN teams t ON s.team_id = t.id
      WHERE s.id = session_attendance.session_id
        AND t.coach_id = auth.uid()
    )
  );

-- Users can insert attendance for their own sessions
CREATE POLICY "Users can insert own session attendance"
  ON session_attendance FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions s
      JOIN teams t ON s.team_id = t.id
      WHERE s.id = session_attendance.session_id
        AND t.coach_id = auth.uid()
    )
  );

-- Users can update attendance for their own sessions
CREATE POLICY "Users can update own session attendance"
  ON session_attendance FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      JOIN teams t ON s.team_id = t.id
      WHERE s.id = session_attendance.session_id
        AND t.coach_id = auth.uid()
    )
  );

-- Users can delete attendance for their own sessions
CREATE POLICY "Users can delete own session attendance"
  ON session_attendance FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      JOIN teams t ON s.team_id = t.id
      WHERE s.id = session_attendance.session_id
        AND t.coach_id = auth.uid()
    )
  );

-- =====================================================
-- 3. Function to calculate player attendance rate
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_attendance_rate(player_id_param UUID, team_id_param UUID DEFAULT NULL)
RETURNS TABLE(
  total_sessions INTEGER,
  attended_sessions INTEGER,
  attendance_rate NUMERIC
) AS $$
DECLARE
  total INT;
  attended INT;
  rate NUMERIC;
BEGIN
  -- Count total sessions for this player (in team if specified)
  SELECT COUNT(DISTINCT sa.session_id) INTO total
  FROM session_attendance sa
  JOIN sessions s ON sa.session_id = s.id
  WHERE sa.player_id = player_id_param
    AND (team_id_param IS NULL OR s.team_id = team_id_param);
  
  -- Count attended sessions
  SELECT COUNT(*) INTO attended
  FROM session_attendance sa
  JOIN sessions s ON sa.session_id = s.id
  WHERE sa.player_id = player_id_param
    AND sa.is_present = true
    AND (team_id_param IS NULL OR s.team_id = team_id_param);
  
  -- Calculate rate
  IF total > 0 THEN
    rate := ROUND((attended::NUMERIC / total::NUMERIC) * 100, 1);
  ELSE
    rate := 0;
  END IF;
  
  RETURN QUERY SELECT total, attended, rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_attendance_rate(UUID, UUID) IS 'Calculates attendance rate for a player, optionally filtered by team';

-- =====================================================
-- 4. Function to get session attendance summary
-- =====================================================

CREATE OR REPLACE FUNCTION get_session_attendance_summary(session_id_param UUID)
RETURNS TABLE(
  total_players INTEGER,
  present_count INTEGER,
  absent_count INTEGER,
  attendance_rate NUMERIC
) AS $$
DECLARE
  total INT;
  present INT;
  absent INT;
  rate NUMERIC;
BEGIN
  -- Count total players marked for this session
  SELECT COUNT(*) INTO total
  FROM session_attendance
  WHERE session_id = session_id_param;
  
  -- Count present
  SELECT COUNT(*) INTO present
  FROM session_attendance
  WHERE session_id = session_id_param
    AND is_present = true;
  
  -- Count absent
  absent := total - present;
  
  -- Calculate rate
  IF total > 0 THEN
    rate := ROUND((present::NUMERIC / total::NUMERIC) * 100, 1);
  ELSE
    rate := 0;
  END IF;
  
  RETURN QUERY SELECT total, present, absent, rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_session_attendance_summary(UUID) IS 'Gets attendance summary for a specific session';

-- =====================================================
-- 5. Trigger to update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_session_attendance_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_session_attendance_timestamp ON session_attendance;
CREATE TRIGGER update_session_attendance_timestamp
  BEFORE UPDATE ON session_attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_session_attendance_timestamp();

-- =====================================================
-- 6. Add attendance summary to sessions view (optional)
-- =====================================================

-- Create a view for sessions with attendance data
CREATE OR REPLACE VIEW sessions_with_attendance AS
SELECT 
  s.*,
  COUNT(sa.id) AS total_players,
  COUNT(sa.id) FILTER (WHERE sa.is_present = true) AS present_count,
  COUNT(sa.id) FILTER (WHERE sa.is_present = false) AS absent_count,
  CASE 
    WHEN COUNT(sa.id) > 0 THEN 
      ROUND((COUNT(sa.id) FILTER (WHERE sa.is_present = true)::NUMERIC / COUNT(sa.id)::NUMERIC) * 100, 1)
    ELSE 0 
  END AS attendance_rate
FROM sessions s
LEFT JOIN session_attendance sa ON s.id = sa.session_id
GROUP BY s.id;

COMMENT ON VIEW sessions_with_attendance IS 'Sessions with attendance statistics';

-- Grant access to authenticated users
GRANT SELECT ON sessions_with_attendance TO authenticated;

-- =====================================================
-- Migration Complete
-- =====================================================

-- Summary:
-- ✅ Created session_attendance table with RLS policies
-- ✅ Added indexes for performance
-- ✅ Created function to calculate player attendance rate
-- ✅ Created function to get session attendance summary
-- ✅ Added trigger for updated_at timestamp
-- ✅ Created view for sessions with attendance data

-- Next steps in the app:
-- 1. Update SessionSetup to show player selection with checkboxes
-- 2. Save attendance records when session starts
-- 3. Filter evaluations to only show present players
-- 4. Display attendance in Dashboard and Reports
-- 5. Add attendance export functionality

