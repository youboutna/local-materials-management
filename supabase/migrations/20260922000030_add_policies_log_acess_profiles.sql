-- =============================================================================
-- MIGRATION : 20260922000030_add_policies_log_access_profiles.sql
-- Date       : 2026-09-22
-- Objet      : Corriger les policies RLS de public.profiles et btp.employees
--              + fonction public.get_user_role() pour éviter la récursion
--
-- SÉCURITÉ :
--   - Idempotente : DROP FUNCTION IF EXISTS + boucle DROP POLICY IF EXISTS
--   - SECURITY DEFINER + SET search_path = ''
--   - REVOKE PUBLIC + GRANT aux rôles concernés
--   - RLS activé + FORCE
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 0 : S'ASSURER QUE public.profiles EXISTE
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    RAISE EXCEPTION 'Table public.profiles introuvable — migration annulée';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 1 : FONCTION public.get_user_role() — avec DROP préalable
-- =============================================================================
-- ✅ FIX 42P13 : DROP la fonction AVANT de la recréer
--    (évite l'erreur si le type de retour a changé)
-- =============================================================================

DROP FUNCTION IF EXISTS public.get_user_role(UUID) CASCADE;

CREATE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.role
  FROM public.profiles p
  WHERE p.id = p_user_id
  LIMIT 1;
$$;

-- Moindre privilège
REVOKE ALL ON FUNCTION public.get_user_role(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_role(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO service_role;

COMMENT ON FUNCTION public.get_user_role(UUID) IS
  'Retourne le rôle d''un utilisateur depuis public.profiles. '
  'SECURITY DEFINER + search_path='''' pour rompre la récursion RLS sur profiles.';

DO $$ BEGIN RAISE NOTICE '✅ Fonction public.get_user_role(UUID) créée'; END $$;

-- =============================================================================
-- ÉTAPE 2 : RLS + FORCE sur public.profiles
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- ÉTAPE 3 : NETTOYAGE DES POLICIES sur public.profiles
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_count INT := 0;
BEGIN
  FOR v_rec IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', v_rec.policyname);
    RAISE NOTICE '  Policy supprimée : %', v_rec.policyname;
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE '  → % policies supprimées sur public.profiles', v_count;
END $$;

-- =============================================================================
-- ÉTAPE 4 : CRÉATION DES NOUVELLES POLICIES sur public.profiles
-- =============================================================================

-- 4.1 : SELECT — propre profil + rôles admin/director/manager
CREATE POLICY profiles_select_policy
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.profiles.id = auth.uid()
  OR public.get_user_role(auth.uid()) = ANY (ARRAY['admin', 'director', 'manager']::text[])
);

-- 4.2 : INSERT — admin uniquement
CREATE POLICY profiles_insert_policy
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_user_role(auth.uid()) = 'admin'
);

-- 4.3 : UPDATE — propre profil + rôles admin/director/manager
CREATE POLICY profiles_update_policy
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  public.profiles.id = auth.uid()
  OR public.get_user_role(auth.uid()) = ANY (ARRAY['admin', 'director', 'manager']::text[])
)
WITH CHECK (
  public.profiles.id = auth.uid()
  OR public.get_user_role(auth.uid()) = ANY (ARRAY['admin', 'director', 'manager']::text[])
);

-- 4.4 : DELETE — admin uniquement
CREATE POLICY profiles_delete_policy
ON public.profiles
FOR DELETE
TO authenticated
USING (
  public.get_user_role(auth.uid()) = 'admin'
);

-- Commentaires
COMMENT ON POLICY profiles_select_policy ON public.profiles IS
  'Lecture : propre profil OU rôle admin/director/manager.';
COMMENT ON POLICY profiles_insert_policy ON public.profiles IS
  'Insertion : admin uniquement.';
COMMENT ON POLICY profiles_update_policy ON public.profiles IS
  'Mise à jour : propre profil OU rôle admin/director/manager.';
COMMENT ON POLICY profiles_delete_policy ON public.profiles IS
  'Suppression : admin uniquement.';

DO $$ BEGIN RAISE NOTICE '✅ 4 policies créées sur public.profiles'; END $$;

-- =============================================================================
-- ÉTAPE 5 : COLONNES btp.employees
-- =============================================================================

-- 5.1 : Vérifier que la table existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'btp' AND table_name = 'employees'
  ) THEN
    RAISE NOTICE '  ⚠️  btp.employees introuvable — étape 5 skippée';
    RETURN;
  END IF;
END $$;

-- 5.2 : Ajouter la colonne nif (idempotent)
ALTER TABLE btp.employees
  ADD COLUMN IF NOT EXISTS nif TEXT;

COMMENT ON COLUMN btp.employees.nif IS
  'Numéro d''Identification Fiscale (NIF)';

-- 5.3 : Ajouter user_id si absent (utilisé dans les policies)
ALTER TABLE btp.employees
  ADD COLUMN IF NOT EXISTS user_id UUID;

DO $$ BEGIN RAISE NOTICE '✅ btp.employees : colonnes nif + user_id'; END $$;

-- =============================================================================
-- ÉTAPE 6 : RLS + FORCE sur btp.employees
-- =============================================================================

ALTER TABLE btp.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.employees FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- ÉTAPE 7 : NETTOYAGE DES POLICIES sur btp.employees
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_count INT := 0;
BEGIN
  FOR v_rec IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'employees'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.employees', v_rec.policyname);
    RAISE NOTICE '  Policy supprimée : %', v_rec.policyname;
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE '  → % policies supprimées sur btp.employees', v_count;
END $$;

-- =============================================================================
-- ÉTAPE 8 : CRÉATION DES NOUVELLES POLICIES sur btp.employees
-- =============================================================================

-- 8.1 : SELECT — propre profil + rôles admin/director/manager
CREATE POLICY select_employees
ON btp.employees
FOR SELECT
TO authenticated
USING (
  btp.employees.user_id = auth.uid()
  OR public.get_user_role(auth.uid()) = ANY (ARRAY['admin', 'director', 'manager']::text[])
);

-- 8.2 : INSERT — rôles admin/director/manager
CREATE POLICY insert_employees
ON btp.employees
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_user_role(auth.uid()) = ANY (ARRAY['admin', 'director', 'manager']::text[])
);

-- 8.3 : UPDATE — rôles admin/director/manager
CREATE POLICY update_employees
ON btp.employees
FOR UPDATE
TO authenticated
USING (
  public.get_user_role(auth.uid()) = ANY (ARRAY['admin', 'director', 'manager']::text[])
)
WITH CHECK (
  public.get_user_role(auth.uid()) = ANY (ARRAY['admin', 'director', 'manager']::text[])
);

-- 8.4 : DELETE — rôles admin/director/manager
CREATE POLICY delete_employees
ON btp.employees
FOR DELETE
TO authenticated
USING (
  public.get_user_role(auth.uid()) = ANY (ARRAY['admin', 'director', 'manager']::text[])
);

-- Commentaires
COMMENT ON POLICY select_employees ON btp.employees IS
  'Lecture : propre profil OU rôle admin/director/manager.';
COMMENT ON POLICY insert_employees ON btp.employees IS
  'Insertion : rôle admin/director/manager.';
COMMENT ON POLICY update_employees ON btp.employees IS
  'Mise à jour : rôle admin/director/manager.';
COMMENT ON POLICY delete_employees ON btp.employees IS
  'Suppression : rôle admin/director/manager.';

DO $$ BEGIN RAISE NOTICE '✅ 4 policies créées sur btp.employees'; END $$;

-- =============================================================================
-- ÉTAPE 9 : PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.employees TO authenticated;
GRANT SELECT ON btp.employees TO anon;
GRANT ALL ON btp.employees TO service_role;

-- =============================================================================
-- ÉTAPE 10 : INDEX sur les colonnes utilisées par les policies
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON public.profiles(role) WHERE role IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'btp' AND table_name = 'employees'
      AND column_name = 'user_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_employees_user_id
             ON btp.employees(user_id) WHERE user_id IS NOT NULL';
  END IF;
END $$;

DO $$ BEGIN RAISE NOTICE '✅ Index créés'; END $$;

-- =============================================================================
-- ÉTAPE 11 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_rls_enabled BOOLEAN;
  v_rls_forced BOOLEAN;
  v_policy_count INT;
  v_func_security TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  VÉRIFICATION POST-MIGRATION';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  -- Fonction
  SELECT CASE WHEN prosecdef THEN 'DEFINER' ELSE 'INVOKER' END
  INTO v_func_security
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'get_user_role';

  RAISE NOTICE 'Fonction public.get_user_role() : %',
    COALESCE(v_func_security, 'INTROUVABLE');

  -- RLS profiles
  SELECT c.relrowsecurity, c.relforcerowsecurity
  INTO v_rls_enabled, v_rls_forced
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'profiles';

  RAISE NOTICE '';
  RAISE NOTICE 'public.profiles : RLS=% FORCE=%', v_rls_enabled, v_rls_forced;

  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'profiles';
  RAISE NOTICE '   Policies : %', v_policy_count;

  -- RLS employees
  SELECT c.relrowsecurity, c.relforcerowsecurity
  INTO v_rls_enabled, v_rls_forced
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'btp' AND c.relname = 'employees';

  RAISE NOTICE 'btp.employees : RLS=% FORCE=%', v_rls_enabled, v_rls_forced;

  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'btp' AND tablename = 'employees';
  RAISE NOTICE '   Policies : %', v_policy_count;

  RAISE NOTICE '';
  RAISE NOTICE 'Détail des policies sur profiles :';
  FOR v_rec IN
    SELECT policyname, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '   • % [%] → %', v_rec.policyname, v_rec.cmd, v_rec.roles;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE 'Détail des policies sur employees :';
  FOR v_rec IN
    SELECT policyname, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'employees'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '   • % [%] → %', v_rec.policyname, v_rec.cmd, v_rec.roles;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;