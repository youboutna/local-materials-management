-- Create newsletter_campaigns table for managing email campaigns
-- This table stores email newsletter campaigns with sending status

CREATE TABLE IF NOT EXISTS btp.newsletter_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  preheader TEXT,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT newsletter_campaigns_recipients_check CHECK (total_recipients >= 0),
  CONSTRAINT newsletter_campaigns_sent_check CHECK (sent_count >= 0),
  CONSTRAINT newsletter_campaigns_failed_check CHECK (failed_count >= 0)
);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_status ON btp.newsletter_campaigns(status);

-- Create index on scheduled_for for scheduled campaigns
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_scheduled_for ON btp.newsletter_campaigns(scheduled_for) WHERE status = 'scheduled';

-- Create index on author_id for user content
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_author_id ON btp.newsletter_campaigns(author_id);

-- Create index on created_at for chronological queries
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_created_at ON btp.newsletter_campaigns(created_at DESC);

-- Add RLS policies
ALTER TABLE btp.newsletter_campaigns ENABLE ROW LEVEL SECURITY;

-- Policy: No public read access
CREATE POLICY "No public read access to campaigns"
  ON btp.newsletter_campaigns
  FOR SELECT
  TO anon
  USING (false);

-- Policy: Authenticated users can read campaign list (for admin)
CREATE POLICY "Authenticated users can read campaigns"
  ON btp.newsletter_campaigns
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role_name IN ('admin', 'director')
    )
  );

-- Policy: Admin/Director can manage all campaigns
CREATE POLICY "Admin/Director can manage all campaigns"
  ON btp.newsletter_campaigns
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role_name IN ('admin', 'director')
    )
  );

-- Policy: Authors can insert their own campaigns
CREATE POLICY "Authors can insert their own campaigns"
  ON btp.newsletter_campaigns
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id AND status = 'draft');

-- Policy: Authors can update their own campaigns
CREATE POLICY "Authors can update their own campaigns"
  ON btp.newsletter_campaigns
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id AND status = 'draft')
  WITH CHECK (auth.uid() = author_id AND status = 'draft');

-- Policy: Authors can delete their own campaigns
CREATE POLICY "Authors can delete their own campaigns"
  ON btp.newsletter_campaigns
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id AND status = 'draft');

-- Add comment
COMMENT ON TABLE btp.newsletter_campaigns IS 'Email newsletter campaigns with sending status tracking';
COMMENT ON COLUMN btp.newsletter_campaigns.status IS 'Campaign status: draft, scheduled, sending, sent, or failed';
COMMENT ON COLUMN btp.newsletter_campaigns.scheduled_for IS 'When to send the campaign (if scheduled)';
COMMENT ON COLUMN btp.newsletter_campaigns.total_recipients IS 'Total number of recipients';
COMMENT ON COLUMN btp.newsletter_campaigns.sent_count IS 'Number of successfully sent emails';
COMMENT ON COLUMN btp.newsletter_campaigns.failed_count IS 'Number of failed email sends';
