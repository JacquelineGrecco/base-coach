-- Add plan_type column to users table
-- This enables subscription/plan management for coaches

-- Add plan_type column with default 'free'
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS plan_type TEXT 
CHECK (plan_type IN ('free', 'basic', 'premium'))
DEFAULT 'free';

-- Create index for faster plan type queries
CREATE INDEX IF NOT EXISTS idx_users_plan_type ON users(plan_type);

-- Update existing users to have 'free' plan
UPDATE users 
SET plan_type = 'free' 
WHERE plan_type IS NULL;

-- Add comment to the column
COMMENT ON COLUMN users.plan_type IS 'User subscription plan: free, basic, or premium';

