-- Backfill existing auth.users into public.users table
-- This creates user profiles for anyone who signed up before the trigger was added

-- Insert users from auth.users that don't exist in public.users yet
INSERT INTO public.users (id, email, name, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', 'Coach User') as name,
  au.created_at,
  NOW() as updated_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL; -- Only insert if user doesn't exist in public.users

-- Show how many users were backfilled
DO $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.users;
  RAISE NOTICE 'Total users in public.users table: %', user_count;
END $$;

