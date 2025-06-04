-- First, create the user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role_name TEXT NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role_name)
);

-- user_roles table
ALTER TABLE public.user_roles
  ADD CONSTRAINT fk_user_roles_user
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create user_role ENUM type
CREATE TYPE user_role AS ENUM (
  'admin',
  'manager',
  'director',
  'agent',
  'supplier',
  'user'
);

-- Create document_status ENUM type
CREATE TYPE document_status AS ENUM (
  'draft',
  'pending_review',
  'approved',
  'rejected',
  'archived'
);

-- Create some sample users with roles
-- Note: In a real scenario, users would sign up through the auth system
-- This is just for demonstration with sample data

-- Insert sample profiles (these would normally be created via the handle_new_user trigger)
INSERT INTO public.profiles (id, full_name, phone, national_id) VALUES
  ('a139c5d3-64a9-49d6-9ed8-a97d6a27ad07', 'Admin User', '+222 12345678', 'ADMIN001'),
  ('61537d00-b460-404f-9d46-1752fa4bcd6a', 'Manager User', '+222 12345679', 'MANAGER001'),
  ('5652fe11-bb95-49b4-9f6a-d298ba411a5c', 'Director User', '+222 12345680', 'DIRECTOR001'),
  ('53e31484-6f07-4e92-9c1d-baea9ffad5d9', 'Agent User', '+222 12345681', 'AGENT001'),
  ('a139c5d3-64a9-49d6-9ed8-a97d6a27ad07', 'Supplier User', '+222 12345682', 'SUPPLIER001')
ON CONFLICT (id) DO NOTHING;

-- profiles table
ALTER TABLE public.profiles
  ADD CONSTRAINT fk_profiles_user
  FOREIGN KEY (id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Add a boolean is_admin column to profiles (or users)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Update is_admin for your admin users
UPDATE public.profiles SET is_admin = true WHERE id IN (SELECT user_id FROM public.user_roles WHERE role_name = 'admin');

-- Assign roles to users
INSERT INTO public.user_roles (user_id, role_name) VALUES
  ('a139c5d3-64a9-49d6-9ed8-a97d6a27ad07', 'admin'),
  ('5652fe11-bb95-49b4-9f6a-d298ba411a5c', 'manager'),
  ('a139c5d3-64a9-49d6-9ed8-a97d6a27ad07', 'director'),
  ('61537d00-b460-404f-9d46-1752fa4bcd6a', 'agent'),
  ('a139c5d3-64a9-49d6-9ed8-a97d6a27ad07', 'supplier')
ON CONFLICT (user_id, role_name) DO NOTHING;

-- Create a function to easily assign roles
CREATE OR REPLACE FUNCTION public.assign_user_role(target_user_id UUID, role_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role_name, assigned_by)
  VALUES (target_user_id, role_name, auth.uid())
  ON CONFLICT (user_id, role_name) DO NOTHING;
END;
$$;

-- Create a function to check if a user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(user_id UUID, role_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = has_role.user_id
      AND user_roles.role_name = has_role.role_name
  );
$$;

-- Create a function to get user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(target_user_id UUID)
RETURNS TABLE(role_name TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT user_roles.role_name
  FROM public.user_roles
  WHERE user_roles.user_id = target_user_id;
$$;
