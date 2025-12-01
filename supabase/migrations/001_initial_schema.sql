-- BaseCoach Database Schema
-- Version: 1.0
-- Description: Initial schema for user authentication, teams, players, sessions, and evaluations

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE (Coaches)
-- ============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster email lookups
CREATE INDEX idx_users_email ON users(email);

-- ============================================================================
-- TEAMS TABLE
-- ============================================================================
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sport TEXT DEFAULT 'futsal' CHECK (sport IN ('futsal', 'football', 'volleyball', 'basketball', 'handball')),
  age_group TEXT,
  location TEXT,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX idx_teams_user_id ON teams(user_id);
CREATE INDEX idx_teams_sport ON teams(sport);
CREATE INDEX idx_teams_archived ON teams(is_archived);

-- ============================================================================
-- PLAYERS TABLE
-- ============================================================================
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  jersey_number INTEGER,
  position TEXT,
  birth_date DATE,
  photo_url TEXT,
  parent_name TEXT,
  parent_email TEXT,
  parent_phone TEXT,
  medical_notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX idx_players_team_id ON players(team_id);
CREATE INDEX idx_players_active ON players(is_active);
CREATE INDEX idx_players_jersey ON players(team_id, jersey_number);

-- ============================================================================
-- SESSIONS TABLE
-- ============================================================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  selected_valences TEXT[] NOT NULL,
  notes TEXT,
  location TEXT,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX idx_sessions_team_id ON sessions(team_id);
CREATE INDEX idx_sessions_date ON sessions(date DESC);
CREATE INDEX idx_sessions_team_date ON sessions(team_id, date DESC);

-- ============================================================================
-- EVALUATIONS TABLE
-- ============================================================================
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  valence TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one evaluation per player per valence per session
  UNIQUE(session_id, player_id, valence)
);

-- Indexes for faster queries
CREATE INDEX idx_evaluations_session_id ON evaluations(session_id);
CREATE INDEX idx_evaluations_player_id ON evaluations(player_id);
CREATE INDEX idx_evaluations_player_valence ON evaluations(player_id, valence);

-- ============================================================================
-- REPORTS TABLE
-- ============================================================================
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_premium BOOLEAN DEFAULT false,
  purchased_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One report per player per session
  UNIQUE(session_id, player_id)
);

-- Indexes for faster queries
CREATE INDEX idx_reports_player_id ON reports(player_id);
CREATE INDEX idx_reports_session_id ON reports(session_id);
CREATE INDEX idx_reports_premium ON reports(is_premium);

-- ============================================================================
-- ATTENDANCE TABLE
-- ============================================================================
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'injured', 'suspended')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One attendance record per player per session
  UNIQUE(session_id, player_id)
);

-- Indexes for faster queries
CREATE INDEX idx_attendance_session_id ON attendance(session_id);
CREATE INDEX idx_attendance_player_id ON attendance(player_id);

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================
-- Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON evaluations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Users: Can only see/edit their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Teams: Users can only see/manage their own teams
CREATE POLICY "Users can view own teams" ON teams
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create teams" ON teams
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own teams" ON teams
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own teams" ON teams
  FOR DELETE USING (auth.uid() = user_id);

-- Players: Users can only see/manage players in their teams
CREATE POLICY "Users can view players in own teams" ON players
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = players.team_id 
      AND teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create players in own teams" ON players
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = players.team_id 
      AND teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update players in own teams" ON players
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = players.team_id 
      AND teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete players in own teams" ON players
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = players.team_id 
      AND teams.user_id = auth.uid()
    )
  );

-- Sessions: Users can only see/manage sessions for their teams
CREATE POLICY "Users can view sessions for own teams" ON sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = sessions.team_id 
      AND teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create sessions for own teams" ON sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = sessions.team_id 
      AND teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update sessions for own teams" ON sessions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = sessions.team_id 
      AND teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete sessions for own teams" ON sessions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = sessions.team_id 
      AND teams.user_id = auth.uid()
    )
  );

-- Evaluations: Users can only see/manage evaluations for their sessions
CREATE POLICY "Users can view evaluations for own sessions" ON evaluations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions 
      JOIN teams ON teams.id = sessions.team_id
      WHERE sessions.id = evaluations.session_id 
      AND teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create evaluations for own sessions" ON evaluations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions 
      JOIN teams ON teams.id = sessions.team_id
      WHERE sessions.id = evaluations.session_id 
      AND teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update evaluations for own sessions" ON evaluations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM sessions 
      JOIN teams ON teams.id = sessions.team_id
      WHERE sessions.id = evaluations.session_id 
      AND teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete evaluations for own sessions" ON evaluations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM sessions 
      JOIN teams ON teams.id = sessions.team_id
      WHERE sessions.id = evaluations.session_id 
      AND teams.user_id = auth.uid()
    )
  );

-- Reports: Users can only see/manage reports for their players
CREATE POLICY "Users can view reports for own players" ON reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM players 
      JOIN teams ON teams.id = players.team_id
      WHERE players.id = reports.player_id 
      AND teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create reports for own players" ON reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM players 
      JOIN teams ON teams.id = players.team_id
      WHERE players.id = reports.player_id 
      AND teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update reports for own players" ON reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM players 
      JOIN teams ON teams.id = players.team_id
      WHERE players.id = reports.player_id 
      AND teams.user_id = auth.uid()
    )
  );

-- Attendance: Same policies as evaluations
CREATE POLICY "Users can view attendance for own sessions" ON attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions 
      JOIN teams ON teams.id = sessions.team_id
      WHERE sessions.id = attendance.session_id 
      AND teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create attendance for own sessions" ON attendance
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions 
      JOIN teams ON teams.id = sessions.team_id
      WHERE sessions.id = attendance.session_id 
      AND teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update attendance for own sessions" ON attendance
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM sessions 
      JOIN teams ON teams.id = sessions.team_id
      WHERE sessions.id = attendance.session_id 
      AND teams.user_id = auth.uid()
    )
  );

-- ============================================================================
-- HELPFUL VIEWS
-- ============================================================================

-- View: Player statistics across all sessions
CREATE VIEW player_stats AS
SELECT 
  p.id AS player_id,
  p.name AS player_name,
  p.team_id,
  e.valence,
  COUNT(e.id) AS evaluation_count,
  ROUND(AVG(e.score)::numeric, 2) AS average_score,
  MIN(e.score) AS min_score,
  MAX(e.score) AS max_score,
  ARRAY_AGG(e.score ORDER BY s.date) AS score_history,
  ARRAY_AGG(s.date ORDER BY s.date) AS evaluation_dates
FROM players p
LEFT JOIN evaluations e ON e.player_id = p.id
LEFT JOIN sessions s ON s.id = e.session_id
WHERE p.is_active = true
GROUP BY p.id, p.name, p.team_id, e.valence;

-- View: Team statistics
CREATE VIEW team_stats AS
SELECT 
  t.id AS team_id,
  t.name AS team_name,
  COUNT(DISTINCT p.id) AS total_players,
  COUNT(DISTINCT s.id) AS total_sessions,
  COUNT(DISTINCT e.id) AS total_evaluations,
  ROUND(AVG(e.score)::numeric, 2) AS team_average_score
FROM teams t
LEFT JOIN players p ON p.team_id = t.id AND p.is_active = true
LEFT JOIN sessions s ON s.team_id = t.id
LEFT JOIN evaluations e ON e.session_id = s.id
WHERE t.is_archived = false
GROUP BY t.id, t.name;

-- ============================================================================
-- SEED DATA (Optional - for testing)
-- ============================================================================
-- Uncomment to add sample data

-- INSERT INTO users (id, email, name) VALUES
--   ('00000000-0000-0000-0000-000000000001', 'fernanda@basecoach.com', 'Fernanda Silva');

-- INSERT INTO teams (user_id, name, sport, age_group) VALUES
--   ('00000000-0000-0000-0000-000000000001', 'Time Sub-13', 'futsal', 'U-13');

