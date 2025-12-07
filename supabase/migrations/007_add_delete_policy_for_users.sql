-- Add DELETE policy to allow users to delete their own account
-- This was missing from previous migrations and was preventing account deletion

-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "Users can delete own profile" ON users;

-- Create DELETE policy - allows users to delete their own account
CREATE POLICY "Users can delete own profile" ON users
  FOR DELETE USING (auth.uid() = id);

-- Verify all policies are in place
-- Expected policies: INSERT, SELECT, UPDATE, DELETE
COMMENT ON TABLE users IS 'User profiles with RLS policies: INSERT, SELECT, UPDATE, DELETE (own records only)';

