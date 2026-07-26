-- Create email_logs table for tracking sent reports
CREATE TABLE IF NOT EXISTS btp.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  content_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE btp.email_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view email logs
CREATE POLICY "Admins can view email logs" 
ON btp.email_logs 
FOR SELECT 
USING (is_current_user_admin());

-- Create policy for system to insert email logs
CREATE POLICY "System can insert email logs" 
ON btp.email_logs 
FOR INSERT 
WITH CHECK (true);