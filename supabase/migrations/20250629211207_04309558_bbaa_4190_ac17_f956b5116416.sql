
-- First, let's fix the infinite recursion issue in user_roles RLS policies
-- We need to drop existing problematic policies and create new ones

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Create a security definer function to check if current user is admin
CREATE OR REPLACE FUNCTION btp.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE SQL   
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role_name IN ('admin', 'director')
  );
$$;

-- Create new RLS policies that don't cause recursion
CREATE POLICY "Users can view their own roles" 
ON public.user_roles
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
ON public.user_roles
FOR SELECT 
USING (btp.is_current_user_admin());

CREATE POLICY "Admins can insert roles" 
ON public.user_roles
FOR INSERT 
WITH CHECK (btp.is_current_user_admin());

CREATE POLICY "Admins can update roles" 
ON public.user_roles
FOR UPDATE 
USING (btp.is_current_user_admin());

CREATE POLICY "Admins can delete roles" 
ON public.user_roles
FOR DELETE 
USING (btp.is_current_user_admin());

-- Also create policies for profiles table to allow admin editing
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Enable RLS on profiles if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create profiles policies
CREATE POLICY "Users can view own profile" 
ON public.profiles
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles
FOR SELECT 
USING (btp.is_current_user_admin());

CREATE POLICY "Admins can update all profiles" 
ON public.profiles
FOR UPDATE 
USING (btp.is_current_user_admin());

CREATE POLICY "Admins can insert profiles" 
ON public.profiles
FOR INSERT 
WITH CHECK (btp.is_current_user_admin());
