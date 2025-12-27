-- Add user_type column to differentiate between coaches and players
-- Currently the app is designed for coaches, but this prepares for future player features

-- Add user_type column with default 'coach'
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS user_type TEXT 
CHECK (user_type IN ('coach', 'player'))
DEFAULT 'coach';

-- Create index for faster user type queries
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);

-- Update existing users to be 'coach' type (since the app is for coaches)
UPDATE users 
SET user_type = 'coach' 
WHERE user_type IS NULL;

-- Add comment to the column
COMMENT ON COLUMN users.user_type IS 'Type of user: coach (manages teams) or player (athlete being evaluated)';

-- Update the handle_new_user function to set user_type from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, user_type, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'coach'), -- Default to coach
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;







