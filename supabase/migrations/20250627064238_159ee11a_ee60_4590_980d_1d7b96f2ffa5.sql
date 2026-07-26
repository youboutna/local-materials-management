
-- Create supplier notifications table
CREATE TABLE IF NOT EXISTS btp.supplier_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES btp.suppliers(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  email TEXT NOT NULL,
  reset_token TEXT,
  task_id UUID,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE btp.supplier_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage supplier notifications" ON btp.supplier_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role_name IN ('admin', 'director', 'manager')
    )
  );

-- Add email column to suppliers if not exists
ALTER TABLE btp.suppliers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE btp.suppliers ADD COLUMN IF NOT EXISTS default_password_reset_required BOOLEAN DEFAULT true;

-- Update task_assignments to include completion_token
ALTER TABLE btp.task_assignments ADD COLUMN IF NOT EXISTS completion_token TEXT;
ALTER TABLE btp.task_assignments ADD COLUMN IF NOT EXISTS completion_url TEXT;

-- Create function to generate reset tokens
CREATE OR REPLACE FUNCTION generate_supplier_reset_token(supplier_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reset_token TEXT;
BEGIN
  reset_token := encode(gen_random_bytes(32), 'base64');
  
  INSERT INTO btp.supplier_notifications (
    supplier_id,
    notification_type,
    email,
    reset_token,
    expires_at,
    created_by
  )
  SELECT 
    s.id,
    'password_reset',
    supplier_email,
    reset_token,
    NOW() + INTERVAL '24 hours',
    auth.uid()
  FROM btp.suppliers s
  WHERE s.email = supplier_email;
  
  RETURN reset_token;
END;
$$;
