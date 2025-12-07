-- Fix teams table RLS policies
-- Add INSERT policy so users can create teams

-- Drop existing policies if they exist and recreate them properly
DROP POLICY IF EXISTS "Users can insert own teams" ON teams;
DROP POLICY IF EXISTS "Users can create own teams" ON teams;

-- Users can create teams (INSERT policy)
CREATE POLICY "Users can create own teams" ON teams
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Verify other policies exist
-- Users can view own teams (SELECT policy)
DROP POLICY IF EXISTS "Users can view own teams" ON teams;
CREATE POLICY "Users can view own teams" ON teams
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can update own teams (UPDATE policy)  
DROP POLICY IF EXISTS "Users can update own teams" ON teams;
CREATE POLICY "Users can update own teams" ON teams
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can delete own teams (DELETE policy)
DROP POLICY IF EXISTS "Users can delete own teams" ON teams;
CREATE POLICY "Users can delete own teams" ON teams
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE teams IS 'Teams table with complete RLS policies: SELECT, INSERT, UPDATE, DELETE';

