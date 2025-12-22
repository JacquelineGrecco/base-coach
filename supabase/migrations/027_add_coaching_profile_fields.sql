-- Migration: Add Coaching Profile Fields
-- Created: 2024-12-21
-- Description: Adds years_experience, coaching_license, and linkedin_url fields to users table

-- Add coaching profile columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS years_experience INTEGER CHECK (years_experience >= 0 AND years_experience <= 50),
ADD COLUMN IF NOT EXISTS coaching_license TEXT CHECK (coaching_license IN ('Pro', 'A', 'B', 'C', 'None')),
ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Add comment to document the fields
COMMENT ON COLUMN public.users.years_experience IS 'Number of years of coaching experience (0-50)';
COMMENT ON COLUMN public.users.coaching_license IS 'Coaching license type: Pro, A, B, C, or None';
COMMENT ON COLUMN public.users.linkedin_url IS 'LinkedIn profile or portfolio URL';

-- Create index for coaching_license for potential filtering
CREATE INDEX IF NOT EXISTS idx_users_coaching_license ON public.users(coaching_license) WHERE coaching_license IS NOT NULL;

