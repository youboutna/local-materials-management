-- Add expires_at and status columns to user_roles table
ALTER TABLE user_roles 
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN status VARCHAR(20) DEFAULT 'active';

-- Create index for performance
CREATE INDEX idx_user_roles_expires_at ON user_roles(expires_at);
CREATE INDEX idx_user_roles_status ON user_roles(status);

-- Add constraint for status values
ALTER TABLE user_roles 
ADD CONSTRAINT check_user_roles_status 
CHECK (status IN ('active', 'expired', 'revoked', 'suspended'));

-- Update existing records
UPDATE user_roles 
SET status = 'active' 
WHERE status IS NULL;
