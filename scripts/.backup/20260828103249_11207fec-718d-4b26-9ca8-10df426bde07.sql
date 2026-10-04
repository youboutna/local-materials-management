GRANT SELECT, INSERT, UPDATE, DELETE ON btp.system_settings TO authenticated;
GRANT ALL ON btp.system_settings TO service_role;

ALTER TABLE btp.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage system settings" ON btp.system_settings;

CREATE POLICY "Authenticated can read system settings"
ON btp.system_settings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert system settings"
ON btp.system_settings
FOR INSERT
TO authenticated
WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can update system settings"
ON btp.system_settings
FOR UPDATE
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can delete system settings"
ON btp.system_settings
FOR DELETE
TO authenticated
USING (public.is_current_user_admin());