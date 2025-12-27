-- Add bio and profile picture support to users table
-- Enables coaches to personalize their profiles

-- Add bio column (short description about the coach)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add profile picture URL
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add constraints
ALTER TABLE users 
ADD CONSTRAINT bio_length_check 
CHECK (LENGTH(bio) <= 500);

-- Add comments
COMMENT ON COLUMN users.bio IS 'Coach biography/about section (max 500 characters)';
COMMENT ON COLUMN users.profile_picture_url IS 'URL to profile picture stored in Supabase Storage';

-- Create storage bucket for profile pictures (run this separately in dashboard)
-- This is just documentation, actual bucket created via dashboard:
/*
  Bucket name: avatars
  Public: true
  File size limit: 2MB
  Allowed MIME types: image/jpeg, image/png, image/webp
  
  RLS Policies for avatars bucket:
  - Users can upload to their own folder (user_id)
  - Everyone can view public avatars
  - Users can delete their own avatars
*/







