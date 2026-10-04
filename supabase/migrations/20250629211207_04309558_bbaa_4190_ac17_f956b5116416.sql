-- =============================================================================
-- MIGRATION : 20250629211207_fix_user_roles_rls_policies.sql
-- Date       : 2025-06-29
-- Objet      : Fix récursion RLS sur user_roles + policies admin pour profiles
--
-- SÉCURITÉ :
--   - SECURITY DEFINER + SET search_path = '' (anti schema-hijacking)
--   - REVOKE ALL FROM PUBLIC + GRANT EXECUTE TO authenticated (moindre privilège)
--   - STABLE (optimisation, pas de modification de données)
--   - STRICT (retourne NULL si argument NULL — non applicable ici mais sûr)
--   - Idempotente : peut être réexécutée sans erreur
--
-- CONTEXTE DE LA RÉCURSION :
--   Sans SECURITY DEFINER, une policy sur user_roles qui interroge user_roles
--   déclenche une récursion infinie → "infinite recursion detected in policy
--   for relation user_roles". SECURITY DEFINER exécute la fonction avec les
--   droits du propriétaire (postgres), contournant ainsi le RLS.
--
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 0 : VÉRIFICATIONS PRÉALABLES
-- =============================================================================
-- S'assurer que les tables cibles existent avant de créer les policies.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_roles'
  ) THEN
    RAISE EXCEPTION 'Table public.user_roles introuvable — migration annulée';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    RAISE EXCEPTION 'Table public.profiles introuvable — migration annulée';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.schemata
    WHERE schema_name = 'btp'
  ) THEN
    RAISE EXCEPTION 'Schema btp introuvable — migration annulée';
  END IF;

  RAISE NOTICE '✅ Tables et schémas requis présents';
END $$;

-- =============================================================================
-- ÉTAPE 1 : FONCTION btp.is_current_user_admin() — SÉCURISÉE
-- =============================================================================
-- Suppression préalable pour garantir la signature et les attributs
-- (DROP + CREATE plutôt que CREATE OR REPLACE, pour forcer SECURITY DEFINER)
-- =============================================================================

DROP FUNCTION IF EXISTS btp.is_current_user_admin() CASCADE;

CREATE FUNCTION btp.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
STRICT
SET search_path = ''
AS $$
  -- search_path = '' force à qualifier chaque objet → protection anti-hijacking
  -- L'utilisateur courant est lu via auth.uid() (natif Supabase)
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role_name IN ('admin', 'director')
  );
$$;

-- -----------------------------------------------------------------------------
-- Sécurité de la fonction : moindre privilège
-- -----------------------------------------------------------------------------
-- Par défaut, PostgreSQL accorde EXECUTE à PUBLIC sur les nouvelles fonctions.
-- On révoque ce droit et on le donne uniquement aux utilisateurs authentifiés.
-- -----------------------------------------------------------------------------

REVOKE ALL ON FUNCTION btp.is_current_user_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION btp.is_current_user_admin() FROM anon;
GRANT EXECUTE ON FUNCTION btp.is_current_user_admin() TO authenticated;
-- Optionnel : accorder au service_role pour les Edge Functions
GRANT EXECUTE ON FUNCTION btp.is_current_user_admin() TO service_role;

COMMENT ON FUNCTION btp.is_current_user_admin() IS
  'Vérifie si l''utilisateur courant (auth.uid()) a le rôle admin ou director. '
  'SECURITY DEFINER + search_path='''' pour éviter la récursion RLS et le schema hijacking. '
  'Accès limité aux utilisateurs authentifiés (REVOKE PUBLIC).';

-- =============================================================================
-- ÉTAPE 2 : RLS SUR public.user_roles
-- =============================================================================

-- 2.1 : Activer RLS (idempotent)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2.2 : Nettoyer TOUTES les policies existantes sur user_roles
--       (y compris les anciennes potentiellement conflictuelles)
DO $$
DECLARE
  v_rec RECORD;
BEGIN
  FOR v_rec IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_roles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', v_rec.policyname);
    RAISE NOTICE '  Policy supprimée : %', v_rec.policyname;
  END LOOP;
END $$;

-- 2.3 : Créer les nouvelles policies (moindre privilège, explicites)

-- Lecture : l'utilisateur voit ses propres rôles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Lecture admin : admin/director voient tous les rôles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (btp.is_current_user_admin());

-- Insertion : réservé aux admins
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (btp.is_current_user_admin());

-- Mise à jour : réservé aux admins (ne peut pas changer son propre rôle)
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

-- Suppression : réservé aux admins (ne peut pas se supprimer soi-même)
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  btp.is_current_user_admin()
  AND user_id <> auth.uid()  -- protection : un admin ne peut pas se supprimer
);

COMMENT ON POLICY "Users can view their own roles" ON public.user_roles IS
  'Un utilisateur ne peut voir que ses propres rôles.';
COMMENT ON POLICY "Admins can view all roles" ON public.user_roles IS
  'Admin/director peuvent voir tous les rôles.';
COMMENT ON POLICY "Admins can insert roles" ON public.user_roles IS
  'Seul admin/director peut attribuer un rôle.';
COMMENT ON POLICY "Admins can update roles" ON public.user_roles IS
  'Seul admin/director peut modifier un rôle.';
COMMENT ON POLICY "Admins can delete roles" ON public.user_roles IS
  'Seul admin/director peut supprimer un rôle (sauf le sien).';

-- =============================================================================
-- ÉTAPE 3 : RLS SUR public.profiles
-- =============================================================================

-- 3.1 : Activer RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3.2 : Nettoyer les policies existantes
DO $$
DECLARE
  v_rec RECORD;
BEGIN
  FOR v_rec IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', v_rec.policyname);
    RAISE NOTICE '  Policy supprimée : %', v_rec.policyname;
  END LOOP;
END $$;

-- 3.3 : Créer les nouvelles policies

-- Lecture : propre profil
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Mise à jour : propre profil (mais pas l'élévation de rôle)
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Lecture admin : tous les profils
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (btp.is_current_user_admin());

-- Mise à jour admin : tous les profils
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

-- Insertion admin : création de profils
CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (btp.is_current_user_admin());

COMMENT ON POLICY "Users can view own profile" ON public.profiles IS
  'Un utilisateur ne voit que son propre profil.';
COMMENT ON POLICY "Users can update own profile" ON public.profiles IS
  'Un utilisateur ne peut modifier que son propre profil.';
COMMENT ON POLICY "Admins can view all profiles" ON public.profiles IS
  'Admin/director peuvent voir tous les profils.';
COMMENT ON POLICY "Admins can update all profiles" ON public.profiles IS
  'Admin/director peuvent modifier tous les profils.';
COMMENT ON POLICY "Admins can insert profiles" ON public.profiles IS
  'Seul admin/director peut créer un profil.';

-- =============================================================================
-- ÉTAPE 4 : HARDENING COMPLÉMENTAIRE
-- =============================================================================
-- Protection contre les usages abusifs de la fonction.
-- =============================================================================

-- 4.1 : S'assurer que la fonction ne peut pas être exécutée par un utilisateur anon
DO $$
BEGIN
  -- Revérifier que anon n'a pas EXECUTE (idempotent)
  BEGIN
    REVOKE EXECUTE ON FUNCTION btp.is_current_user_admin() FROM anon;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- ignoré si le rôle anon n'existe pas
  END;
END $$;

-- 4.2 : S'assurer que RLS est bien forcé (FORCE ROW LEVEL SECURITY)
-- Empêche le propriétaire de la table de contourner le RLS
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- 4.3 : Commentaires de sécurité sur les tables
COMMENT ON TABLE public.user_roles IS
  'Rôles des utilisateurs. RLS activé + FORCE. Policies admin via btp.is_current_user_admin().';
COMMENT ON TABLE public.profiles IS
  'Profils utilisateurs. RLS activé + FORCE. Accès admin via btp.is_current_user_admin().';

-- =============================================================================
-- ÉTAPE 5 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_func_exists BOOLEAN;
  v_func_security TEXT;
  v_policy_count INT;
  v_rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  VÉRIFICATION POST-MIGRATION';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  -- 5.1 : Vérifier la fonction
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'btp' AND p.proname = 'is_current_user_admin'
  ) INTO v_func_exists;

  IF v_func_exists THEN
    RAISE NOTICE '✅ Fonction btp.is_current_user_admin() existe';

    -- Vérifier SECURITY DEFINER
    SELECT CASE WHEN prosecdef THEN 'DEFINER' ELSE 'INVOKER' END
    INTO v_func_security
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'btp' AND p.proname = 'is_current_user_admin';

    RAISE NOTICE '   → SECURITY : %', v_func_security;
    IF v_func_security <> 'DEFINER' THEN
      RAISE WARNING '⚠️  La fonction n''est PAS SECURITY DEFINER — risque de récursion !';
    END IF;
  ELSE
    RAISE EXCEPTION '❌ Fonction btp.is_current_user_admin() manquante';
  END IF;

  -- 5.2 : Vérifier les policies user_roles
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'user_roles';

  RAISE NOTICE '';
  RAISE NOTICE 'Policies sur public.user_roles : %', v_policy_count;
  FOR v_rec IN
    SELECT policyname, cmd FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_roles'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '   • % [%]', v_rec.policyname, v_rec.cmd;
  END LOOP;

  -- 5.3 : Vérifier les policies profiles
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'profiles';

  RAISE NOTICE '';
  RAISE NOTICE 'Policies sur public.profiles : %', v_policy_count;
  FOR v_rec IN
    SELECT policyname, cmd FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '   • % [%]', v_rec.policyname, v_rec.cmd;
  END LOOP;

  -- 5.4 : Vérifier que RLS est activé
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND rowsecurity = true
  ) THEN
    RAISE NOTICE '';
    RAISE NOTICE '✅ RLS activé sur user_roles';
  ELSE
    RAISE EXCEPTION '❌ RLS NON activé sur user_roles';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'profiles' AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✅ RLS activé sur profiles';
  ELSE
    RAISE EXCEPTION '❌ RLS NON activé sur profiles';
  END IF;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

-- =============================================================================
-- ÉTAPE 6 : RECHARGEMENT DU CACHE POSTGREST
-- =============================================================================

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;