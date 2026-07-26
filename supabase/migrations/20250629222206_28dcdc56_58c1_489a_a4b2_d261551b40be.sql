
-- First, add the is_admin column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Add admin role to the user youboutna (youboutna.elhadramy@gmail.com)
INSERT INTO public.user_roles (user_id, role_name, assigned_by)
SELECT 
  u.id,
  'admin',
  u.id  -- Self-assignment for initial admin setup
FROM auth.users u
WHERE u.email = 'youboutna.elhadramy@gmail.com'
ON CONFLICT (user_id, role_name) DO NOTHING;

-- Also ensure the user has director role (admins typically have director privileges too)
INSERT INTO public.user_roles (user_id, role_name, assigned_by)
SELECT 
  u.id,
  'director',
  u.id
FROM auth.users u
WHERE u.email = 'youboutna.elhadramy@gmail.com'
ON CONFLICT (user_id, role_name) DO NOTHING;

-- Update the profile to mark as admin
UPDATE public.profiles 
SET is_admin = true 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'youboutna.elhadramy@gmail.com'
);
