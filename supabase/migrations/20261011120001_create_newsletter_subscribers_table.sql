-- Create newsletter_subscribers table for managing newsletter subscriptions
-- This table stores email subscribers with consent tracking

CREATE TABLE IF NOT EXISTS btp.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending_confirmation' CHECK (status IN ('pending_confirmation', 'active', 'unsubscribed')),
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  source TEXT DEFAULT 'footer',
  consent_given BOOLEAN NOT NULL DEFAULT FALSE,
  consent_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT newsletter_subscribers_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON btp.newsletter_subscribers(status);

-- Create index on subscribed_at for chronological queries
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_subscribed_at ON btp.newsletter_subscribers(subscribed_at DESC);

-- Add RLS policies
ALTER TABLE btp.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Policy: No public read access (email addresses are private)
CREATE POLICY "No public read access to subscribers"
  ON btp.newsletter_subscribers
  FOR SELECT
  TO anon
  USING (false);

-- Policy: Authenticated users can read subscriber list (for admin)
CREATE POLICY "Authenticated users can read subscribers"
  ON btp.newsletter_subscribers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role_name IN ('admin', 'director')
    )
  );

-- Policy: Admin/Director can manage all subscribers
CREATE POLICY "Admin/Director can manage all subscribers"
  ON btp.newsletter_subscribers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role_name IN ('admin', 'director')
    )
  );

-- Policy: Public can insert new subscriptions (consent required)
CREATE POLICY "Public can subscribe"
  ON btp.newsletter_subscribers
  FOR INSERT
  TO anon
  WITH CHECK (
    consent_given = TRUE
    AND consent_date IS NOT NULL
    AND status = 'pending_confirmation'
  );

-- Policy: Authenticated users can subscribe
CREATE POLICY "Authenticated users can subscribe"
  ON btp.newsletter_subscribers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    consent_given = TRUE
    AND consent_date IS NOT NULL
    AND status = 'pending_confirmation'
  );

-- Add comment
COMMENT ON TABLE btp.newsletter_subscribers IS 'Newsletter subscribers with consent tracking';
COMMENT ON COLUMN btp.newsletter_subscribers.email IS 'Normalized email address (unique)';
COMMENT ON COLUMN btp.newsletter_subscribers.status IS 'Subscription status: pending_confirmation, active, or unsubscribed';
COMMENT ON COLUMN btp.newsletter_subscribers.source IS 'Subscription source: footer, form, etc.';
COMMENT ON COLUMN btp.newsletter_subscribers.consent_given IS 'Explicit consent for GDPR compliance';
COMMENT ON COLUMN btp.newsletter_subscribers.consent_date IS 'Date when consent was given';
