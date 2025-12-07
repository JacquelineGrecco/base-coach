-- Handle orphaned auth users (auth exists but profile deleted)
-- This allows users to re-register after deleting their account

-- Function to check if an auth user has no profile and recreate it
CREATE OR REPLACE FUNCTION public.recreate_missing_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this auth user already has a profile
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    -- Profile doesn't exist, create it
    INSERT INTO public.users (id, email, name, user_type, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
      COALESCE(NEW.raw_user_meta_data->>'user_type', 'coach'),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING; -- Prevent duplicate key errors
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the trigger to use the new function that handles recreation
-- Drop the old trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create new trigger that handles both new users and profile recreation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.recreate_missing_profile();

-- Also create a trigger for when auth user logs in (to catch edge cases)
CREATE OR REPLACE FUNCTION public.ensure_profile_exists()
RETURNS TRIGGER AS $$
BEGIN
  -- On login, ensure profile exists
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    INSERT INTO public.users (id, email, name, user_type, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      'coach',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment explaining the solution
COMMENT ON FUNCTION public.recreate_missing_profile() IS 
  'Automatically recreates user profile if auth user exists but profile was deleted. Allows users to re-register after account deletion.';

COMMENT ON FUNCTION public.ensure_profile_exists() IS 
  'Ensures a profile exists when user logs in. Handles edge cases where auth user has no profile.';

