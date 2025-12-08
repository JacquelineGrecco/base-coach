-- Add session enhancements fields
-- Notes, duration tracking, and session state

-- Add columns to sessions table
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed' CHECK (status IN ('active', 'paused', 'completed'));

-- Add player-specific notes to evaluations
ALTER TABLE evaluations
ADD COLUMN IF NOT EXISTS player_notes TEXT;

-- Create session templates table
CREATE TABLE IF NOT EXISTS session_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  selected_valences TEXT[] NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_session_templates_user_id ON session_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);

-- Enable RLS
ALTER TABLE session_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for session_templates
CREATE POLICY "Users can view own templates" ON session_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own templates" ON session_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON session_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON session_templates
  FOR DELETE USING (auth.uid() = user_id);

COMMENT ON COLUMN sessions.notes IS 'General session notes added by coach';
COMMENT ON COLUMN sessions.duration_seconds IS 'Total session duration in seconds';
COMMENT ON COLUMN sessions.status IS 'Current session status: active, paused, or completed';
COMMENT ON COLUMN evaluations.player_notes IS 'Player-specific observation notes';
COMMENT ON TABLE session_templates IS 'Reusable session templates with pre-selected valences';

