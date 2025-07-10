
-- Allow admins to update user emails through auth.users table
-- This requires using the auth.admin functions which are already available in the codebase

-- Add a function to update user email (admins only)
CREATE OR REPLACE FUNCTION public.admin_update_user_email(target_user_id UUID, new_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Only admins can update user emails';
  END IF;
  
  -- The actual email update will be done via supabase.auth.admin.updateUserById
  -- This function is just for permission checking
  RETURN;
END;
$$;
