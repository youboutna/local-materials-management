BEGIN;

GRANT USAGE ON SCHEMA btp TO anon, authenticated, service_role;
GRANT SELECT ON btp.articles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.articles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.newsletter_subscribers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.newsletter_campaigns TO authenticated;
GRANT ALL ON btp.articles, btp.newsletter_subscribers, btp.newsletter_campaigns TO service_role;
GRANT ALL ON btp.newsletter_subscription_tokens, btp.newsletter_campaign_deliveries TO service_role;

ALTER TABLE btp.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE btp.notifications
  ADD CONSTRAINT notifications_type_check CHECK (type IN (
    'task_assigned', 'task_updated', 'task_completed', 'delay_warning',
    'bank_guarantee_trigger', 'inspection_overdue', 'contractor_penalty',
    'compliance_alert', 'escalation_required', 'inspection_required',
    'project_update', 'insurance_expiry', 'insurance_update',
    'task_assignment', 'task_overdue', 'project_created', 'project_completed',
    'project_milestone', 'payment_due', 'payment_completed', 'payment_failed',
    'payment_pending', 'document_review', 'document_shared', 'document_approved',
    'document_rejected', 'document_uploaded', 'system', 'payment_blocked',
    'payment_warning', 'info', 'project_delay', 'inspection_issue', 'financial_risk'
  ));

CREATE OR REPLACE FUNCTION btp.complete_newsletter_subscription_action(
  p_token_hash TEXT,
  p_action TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, btp
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

REVOKE ALL ON FUNCTION btp.complete_newsletter_subscription_action(TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION btp.complete_newsletter_subscription_action(TEXT, TEXT)
  TO service_role;

CREATE OR REPLACE FUNCTION public.cleanup_expired_user_roles()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE public.user_roles
     SET status = 'inactive'
   WHERE status = 'active'
     AND expires_at IS NOT NULL
     AND expires_at < now();

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_expired_user_roles() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_user_roles() TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
