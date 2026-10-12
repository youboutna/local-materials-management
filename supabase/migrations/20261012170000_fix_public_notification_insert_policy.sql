BEGIN;

CREATE OR REPLACE FUNCTION public.can_create_notification_for_user(
  target_recipient_id UUID
) RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT target_recipient_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
        FROM public.user_roles AS role
       WHERE role.user_id = (SELECT auth.uid())
         AND role.role_name IN ('admin', 'super_admin', 'director')
         AND role.status = 'active'
         AND (role.expires_at IS NULL OR role.expires_at > NOW())
    );
$$;

REVOKE ALL ON FUNCTION public.can_create_notification_for_user(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_create_notification_for_user(UUID) TO authenticated;

DROP POLICY IF EXISTS insert_notifications ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;

CREATE POLICY "Authenticated users can create permitted notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (public.can_create_notification_for_user(recipient_id));

NOTIFY pgrst, 'reload schema';

COMMIT;
