-- Add unique constraint to key column
ALTER TABLE public.system_settings ADD CONSTRAINT system_settings_key_unique UNIQUE (key);

-- Insert admin notification emails configuration if not exists
INSERT INTO public.system_settings (key, category, configuration)
VALUES (
  'admin_notification_emails',
  'notifications',
  '{"emails": []}'::jsonb
)
ON CONFLICT (key) DO NOTHING;