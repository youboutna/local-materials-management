-- Add status and last_login_at columns to profiles table
-- These columns are needed for the UserProfile entity and cleanup functionality

ALTER TABLE profiles 
ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending_verification'));

ALTER TABLE profiles 
ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;

-- Create index for better performance on cleanup queries
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_last_login_at ON profiles(last_login_at);

-- Update existing profiles to have active status by default
UPDATE profiles SET status = 'active' WHERE status IS NULL;
