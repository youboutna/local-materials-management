BEGIN;

-- 1. Fonction SECURITY DEFINER pointant vers public.profiles (Rompt la récursion)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = user_id LIMIT 1;
$$;

-- 2. Nettoyage et recréation des politiques sur public.profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "manage_profiles_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

CREATE POLICY profiles_select_policy ON public.profiles
FOR SELECT TO authenticated
USING (
  id = auth.uid() 
  OR public.get_user_role(auth.uid()) = ANY (ARRAY['admin', 'director', 'manager'])
);

CREATE POLICY profiles_insert_policy ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (
  public.get_user_role(auth.uid()) = 'admin'
);

CREATE POLICY profiles_update_policy ON public.profiles
FOR UPDATE TO authenticated
USING (
  id = auth.uid() 
  OR public.get_user_role(auth.uid()) = ANY (ARRAY['admin', 'director', 'manager'])
)
WITH CHECK (
  id = auth.uid() 
  OR public.get_user_role(auth.uid()) = ANY (ARRAY['admin', 'director', 'manager'])
);

CREATE POLICY profiles_delete_policy ON public.profiles
FOR DELETE TO authenticated
USING (
  public.get_user_role(auth.uid()) = 'admin'
);

-- 3. Mise à jour des politiques de btp.employees vers public.profiles

ALTER TABLE btp.employees
  ADD COLUMN IF NOT EXISTS nif TEXT;
  ----------------------------------------------
DROP POLICY IF EXISTS select_employees ON btp.employees;
DROP POLICY IF EXISTS insert_employees ON btp.employees;
DROP POLICY IF EXISTS update_employees ON btp.employees;
DROP POLICY IF EXISTS delete_employees ON btp.employees;

CREATE POLICY select_employees ON btp.employees
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() 
  OR public.get_user_role(auth.uid()) = ANY (ARRAY['admin', 'director', 'manager'])
);

CREATE POLICY insert_employees ON btp.employees
FOR INSERT TO authenticated
WITH CHECK (
  public.get_user_role(auth.uid()) = ANY (ARRAY['admin', 'director', 'manager'])
);

CREATE POLICY update_employees ON btp.employees
FOR UPDATE TO authenticated
USING (
  public.get_user_role(auth.uid()) = ANY (ARRAY['admin', 'director', 'manager'])
)
WITH CHECK (
  public.get_user_role(auth.uid()) = ANY (ARRAY['admin', 'director', 'manager'])
);

CREATE POLICY delete_employees ON btp.employees
FOR DELETE TO authenticated
USING (
  public.get_user_role(auth.uid()) = ANY (ARRAY['admin', 'director', 'manager'])
);

COMMIT;