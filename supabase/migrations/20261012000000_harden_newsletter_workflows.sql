ALTER TABLE btp.newsletter_subscribers
  ALTER COLUMN consent_given SET DEFAULT FALSE;

DROP POLICY IF EXISTS "Public can subscribe" ON btp.newsletter_subscribers;
DROP POLICY IF EXISTS "Authenticated users can subscribe" ON btp.newsletter_subscribers;

CREATE TABLE IF NOT EXISTS btp.newsletter_subscription_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES btp.newsletter_subscribers(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  action TEXT NOT NULL CHECK (action IN ('confirm', 'unsubscribe')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscription_tokens_subscriber
  ON btp.newsletter_subscription_tokens(subscriber_id);

ALTER TABLE btp.newsletter_subscription_tokens ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION btp.complete_newsletter_subscription_action(
  p_token_hash TEXT,
  p_action TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = btp
AS $$
DECLARE
  v_token_id UUID;
  v_subscriber_id UUID;
  v_updated_id UUID;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  IF p_action NOT IN ('confirm', 'unsubscribe') THEN
    RETURN FALSE;
  END IF;

  SELECT id, subscriber_id
    INTO v_token_id, v_subscriber_id
    FROM btp.newsletter_subscription_tokens
   WHERE token_hash = p_token_hash
     AND action = p_action
     AND used_at IS NULL
     AND expires_at > v_now
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  UPDATE btp.newsletter_subscribers
     SET status = CASE WHEN p_action = 'confirm' THEN 'active' ELSE 'unsubscribed' END,
         confirmed_at = CASE WHEN p_action = 'confirm' THEN v_now ELSE confirmed_at END,
         unsubscribed_at = CASE WHEN p_action = 'unsubscribe' THEN v_now ELSE unsubscribed_at END
   WHERE id = v_subscriber_id
     AND status = CASE WHEN p_action = 'confirm' THEN 'pending_confirmation' ELSE 'active' END
  RETURNING id INTO v_updated_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  UPDATE btp.newsletter_subscription_tokens
     SET used_at = v_now
   WHERE id = v_token_id;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION btp.complete_newsletter_subscription_action(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION btp.complete_newsletter_subscription_action(TEXT, TEXT) TO service_role;

CREATE TABLE IF NOT EXISTS btp.newsletter_campaign_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES btp.newsletter_campaigns(id) ON DELETE CASCADE,
  subscriber_id UUID NOT NULL REFERENCES btp.newsletter_subscribers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  provider_reference TEXT,
  error_message TEXT,
  attempted_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (campaign_id, subscriber_id)
);

CREATE INDEX IF NOT EXISTS idx_newsletter_campaign_deliveries_campaign
  ON btp.newsletter_campaign_deliveries(campaign_id, status);

ALTER TABLE btp.newsletter_campaign_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read all articles" ON btp.articles;
DROP POLICY IF EXISTS "Authors can read their own articles" ON btp.articles;
DROP POLICY IF EXISTS "Authenticated users can read permitted articles" ON btp.articles;
CREATE POLICY "Authenticated users can read permitted articles"
  ON btp.articles FOR SELECT TO authenticated
  USING (
    status = 'published'
    OR auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role_name IN ('admin', 'director')
    )
  );

DROP POLICY IF EXISTS "Authors can insert their own articles" ON btp.articles;
CREATE POLICY "Authors can insert their own articles"
  ON btp.articles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND status = 'draft');

DROP POLICY IF EXISTS "Authors can update their own articles" ON btp.articles;
CREATE POLICY "Authors can update their own articles"
  ON btp.articles FOR UPDATE TO authenticated
  USING (auth.uid() = author_id AND status = 'draft')
  WITH CHECK (auth.uid() = author_id AND status = 'draft');

DROP POLICY IF EXISTS "Authors can delete their own articles" ON btp.articles;
CREATE POLICY "Authors can delete their own articles"
  ON btp.articles FOR DELETE TO authenticated
  USING (auth.uid() = author_id AND status = 'draft');

CREATE INDEX IF NOT EXISTS idx_articles_published_at
  ON btp.articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_project_id
  ON btp.articles(project_id);

COMMENT ON TABLE btp.newsletter_subscription_tokens IS
  'Hashed, single-use tokens for newsletter confirmation and unsubscribe links';
COMMENT ON TABLE btp.newsletter_campaign_deliveries IS
  'Idempotent per-campaign delivery state and provider references';
