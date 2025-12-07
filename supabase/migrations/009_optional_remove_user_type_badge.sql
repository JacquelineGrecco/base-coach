-- OPTIONAL: Simplify user type display
-- This migration is optional - only run if you want to hide user type from UI
-- The column remains in database for future use, but won't be displayed

-- Note: This is a comment-only migration
-- To actually remove user type badge from UI, update Profile.tsx component
-- The database column stays for future flexibility

COMMENT ON COLUMN users.user_type IS 
  'User type (coach/player). Currently all users are coaches. Column kept for future player portal feature.';

