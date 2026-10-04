-- ============================================================
-- MIGRATION : Fix récursion RLS sur public.user_roles
-- Date : 2026-10-04
-- Description :
--   1. Crée/répare la fonction btp.is_current_user_admin() en SECURITY DEFINER
--      (bypass RLS → pas de récursion)
--   2. Supprime les 4 policies récursives sur public.user_roles
--   3. Recrée des policies propres utilisant la fonction
--   4. Recharge le cache PostgREST
-- Idempotent : OUI
-- ============================================================

BEGIN;

-- ============================================================
-- 0. Vérifier où se trouve la table user_roles (btp ou public)
-- ============================================================
DO $$
DECLARE
  v_schema text;
BEGIN
  SELECT table_schema INTO v_schema
  FROM information_schema.tables
  WHERE table_name = 'user_roles'
  ORDER BY (table_schema = 'public') DESC, table_schema
  LIMIT 1;

  IF v_schema IS NULL THEN
    RAISE EXCEPTION 'Table user_roles introuvable';
  END IF;

  RAISE NOTICE 'Table user_roles trouvée dans le schéma : %', v_schema;
END $$;

-- ============================================================
-- 1. Créer/Réparer la fonction btp.is_current_user_admin()
--    SECURITY DEFINER = bypass RLS
-- ============================================================
CREATE OR REPLACE FUNCTION btp.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = btp, public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role_name IN ('admin', 'super_admin')
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
  );
$$;

GRANT EXECUTE ON FUNCTION btp.is_current_user_admin()
  TO authenticated, anon, service_role;

-- ============================================================
-- 2. Supprimer TOUTES les policies existantes sur user_roles
--    (à la fois les anciennes correctes et les récursives)
-- ============================================================
DROP POLICY IF EXISTS "Admins can delete roles"            ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles"            ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles"            ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles"          ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles"     ON public.user_roles;

DROP POLICY IF EXISTS "user_roles_delete_admin"            ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_admin"            ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_own_or_admin"     ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_admin"            ON public.user_roles;

-- Au cas où d'autres noms existent
DROP POLICY IF EXISTS "users_can_view_roles"               ON public.user_roles;
DROP POLICY IF EXISTS "users_can_view_own_roles"           ON public.user_roles;
DROP POLICY IF EXISTS "admins_can_manage_roles"            ON public.user_roles;
DROP POLICY IF EXISTS "admins_can_view_all_roles"          ON public.user_roles;
DROP POLICY IF EXISTS "Public can read user_roles"         ON public.user_roles;
DROP POLICY IF EXISTS "Enable read access for all users"   ON public.user_roles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.user_roles;

-- ============================================================
-- 3. S'assurer que RLS est activé
-- ============================================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. Recréer des policies PROPRES (non récursives)
--    Toutes utilisent btp.is_current_user_admin() qui bypass RLS
-- ============================================================

-- Lecture : chaque user voit ses propres rôles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Lecture : les admins voient tous les rôles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (btp.is_current_user_admin());

-- Insertion : les admins uniquement
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (btp.is_current_user_admin());

-- Modification : les admins uniquement
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

-- Suppression : les admins uniquement
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (btp.is_current_user_admin());

-- ============================================================
-- 5. Recharger le cache PostgREST
-- ============================================================
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- ============================================================
-- 6. Vérification finale
-- ============================================================
DO $$
DECLARE
  v_count int;
  v_policy_names text;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_policy
  WHERE polrelid = 'public.user_roles'::regclass;

  SELECT string_agg(polname, ', ' ORDER BY polname) INTO v_policy_names
  FROM pg_policy
  WHERE polrelid = 'public.user_roles'::regclass;

  RAISE NOTICE '✅ Policies actives sur public.user_roles (%): %', v_count, v_policy_names;

  IF v_count <> 5 THEN
    RAISE WARNING '⚠️  Attendu 5 policies, trouvé %', v_count;
  END IF;
END $$;

COMMIT;

-- ============================================================
-- FIN DE MIGRATION
-- ============================================================