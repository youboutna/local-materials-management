-- Add status column to profiles table
-- This fixes the schema mismatch between domain entity and database

ALTER TABLE profiles 
ADD COLUMN status VARCHAR(20) DEFAULT 'pending_verification';

-- Create index for performance
CREATE INDEX idx_profiles_status ON profiles(status);

-- Add constraint for status values
ALTER TABLE profiles 
ADD CONSTRAINT check_profiles_status 
CHECK (status IN ('active', 'inactive', 'suspended', 'pending_verification'));

-- Update existing records to have a default status
UPDATE profiles 
SET status = 'active' 
WHERE status IS NULL AND is_admin = true;

UPDATE profiles 
SET status = 'pending_verification' 
WHERE status IS NULL AND is_admin = false;
