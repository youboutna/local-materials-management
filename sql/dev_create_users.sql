CREATE TABLE IF NOT EXISTS public.users (
  instance_id uuid,
  id uuid PRIMARY KEY,
  aud varchar,
  role varchar,
  email varchar,
  encrypted_password varchar,
  email_confirmed_at timestamptz,
  invited_at timestamptz,
  confirmation_token varchar,
  confirmation_sent_at timestamptz,
  recovery_token varchar,
  recovery_sent_at timestamptz,
  email_change_token_new varchar,
  email_change varchar,
  email_change_sent_at timestamptz,
  last_sign_in_at timestamptz,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  is_super_admin boolean,
  created_at timestamptz,
  updated_at timestamptz,
  phone text,
  phone_confirmed_at timestamptz,
  phone_change text,
  phone_change_token varchar,
  phone_change_sent_at timestamptz,
  confirmed_at timestamptz,
  email_change_token_current varchar,
  email_change_confirm_status int2,
  banned_until timestamptz,
  reauthentication_token varchar,
  reauthentication_sent_at timestamptz,
  is_sso_user boolean,
  deleted_at timestamptz,
  is_anonymous boolean
);


-- Create a view to combine auth.users and public.users in supabase context
CREATE VIEW public.user_full AS
SELECT
  auth.users.id AS auth_id,
  public.users.*,
  auth.users.email AS auth_email
FROM
  auth.users
JOIN
  public.users ON auth.users.id = public.users.id;
