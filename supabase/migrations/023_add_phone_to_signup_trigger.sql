-- Update the handle_new_user function to include phone from metadata
-- This allows phone to be captured during signup

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, phone, user_type, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL), -- Extract phone from metadata
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'coach'), -- Default to coach
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user profile when auth user is created. Extracts name, phone, and user_type from signup metadata.';

-- Also update the ensure_profile_exists function to include phone
CREATE OR REPLACE FUNCTION public.ensure_profile_exists()
RETURNS TRIGGER AS $$
BEGIN
  -- On login, ensure profile exists
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    INSERT INTO public.users (id, email, name, phone, user_type, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
      'coach',
      NOW(),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.ensure_profile_exists() IS 'Ensures user profile exists on login. Creates profile if missing. Includes phone from metadata.';


