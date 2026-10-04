-- =============================================================================
-- MIGRATION : 20260310020000_fix_user_roles_expires_at.sql
-- Date       : 2026-03-10
-- Objet      : Harmoniser user_roles.expired_at → expires_at
--              + fonction public.is_user_admin()
--
-- SÉCURITÉ :
--   - Idempotente : rename conditionnel + CREATE IF NOT EXISTS
--   - `SET search_path = ''` sur toutes les fonctions SECURITY DEFINER
--   - REVOKE PUBLIC + GRANT ciblé
--   - Pas de GRANT anon (aucune raison)
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 0 : VÉRIFIER QUE public.user_roles EXISTE
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_roles'
  ) THEN
    RAISE EXCEPTION 'Table public.user_roles introuvable — migration annulée';
  END IF;
  RAISE NOTICE '✅ Table public.user_roles présente';
END $$;

-- =============================================================================
-- ÉTAPE 1 : DIAGNOSTIC
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  DIAGNOSTIC — public.user_roles';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  FOR v_rec IN
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_roles'
      AND column_name IN ('expired_at', 'expires_at', 'status', 'role_name', 'user_id')
    ORDER BY column_name
  LOOP
    RAISE NOTICE '  • % : % (nullable=%)',
      v_rec.column_name, v_rec.data_type, v_rec.is_nullable;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

-- =============================================================================
-- ÉTAPE 2 : RENOMMER expired_at → expires_at (IDEMPOTENT)
-- =============================================================================

DO $$
DECLARE
  v_has_expired BOOLEAN;
  v_has_expires BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_roles'
      AND column_name = 'expired_at'
  ) INTO v_has_expired;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_roles'
      AND column_name = 'expires_at'
  ) INTO v_has_expires;

  IF v_has_expired AND NOT v_has_expires THEN
    -- Cas normal : renommer
    ALTER TABLE public.user_roles
      RENAME COLUMN expired_at TO expires_at;
    RAISE NOTICE '  ✅ Colonne renommée : expired_at → expires_at';

  ELSIF v_has_expires AND NOT v_has_expired THEN
    -- Déjà renommée : ne rien faire
    RAISE NOTICE '  ℹ️  Colonne expires_at existe déjà (rename déjà effectué)';

  ELSIF v_has_expired AND v_has_expires THEN
    -- Les 2 existent : migrer les données puis supprimer l'ancienne
    RAISE NOTICE '  ⚠️  Les 2 colonnes existent — migration des données + drop expired_at';

    EXECUTE $sql$
      UPDATE public.user_roles
      SET expires_at = COALESCE(expires_at, expired_at)
      WHERE expired_at IS NOT NULL
    $sql$;

    ALTER TABLE public.user_roles DROP COLUMN expired_at;
    RAISE NOTICE '  ✅ Colonne expired_at supprimée (données migrées)';

  ELSE
    -- Aucune des 2 : créer expires_at
    RAISE NOTICE '  ⚠️  Aucune colonne expired_at/expires_at — création expires_at';

    ALTER TABLE public.user_roles
      ADD COLUMN expires_at TIMESTAMPTZ;
    RAISE NOTICE '  ✅ Colonne expires_at créée';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 3 : INDEX (IDEMPOTENT)
-- =============================================================================

-- Supprimer l'ancien index (avec l'ancien nom)
DROP INDEX IF EXISTS public.idx_user_roles_expired_at;

-- Créer le nouvel index (idempotent)
CREATE INDEX IF NOT EXISTS idx_user_roles_expires_at
  ON public.user_roles(expires_at)
  WHERE expires_at IS NOT NULL;

DO $$ BEGIN RAISE NOTICE '✅ Index idx_user_roles_expires_at'; END $$;

-- =============================================================================
-- ÉTAPE 4 : FONCTION public.is_user_admin() — SÉCURISÉE
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_user_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = p_user_id
      AND ur.role_name IN ('admin', 'super_admin', 'director')
      AND ur.status = 'active'
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
  );
$$;

-- Moindre privilège : REVOKE PUBLIC + GRANT ciblé
REVOKE ALL ON FUNCTION public.is_user_admin(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_user_admin(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_user_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_admin(UUID) TO service_role;

COMMENT ON FUNCTION public.is_user_admin(UUID) IS
  'Vérifie si un utilisateur donné a un rôle admin/super_admin/director actif et non expiré. '
  'SECURITY DEFINER + search_path='''' pour éviter le schema hijacking.';

DO $$ BEGIN RAISE NOTICE '✅ Fonction public.is_user_admin() créée et sécurisée'; END $$;

-- =============================================================================
-- ÉTAPE 5 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_has_expires BOOLEAN;
  v_func_security TEXT;
  v_has_search_path BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  VÉRIFICATION POST-MIGRATION';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  -- Colonne
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_roles'
      AND column_name = 'expires_at'
  ) INTO v_has_expires;

  RAISE NOTICE 'public.user_roles.expires_at : %', v_has_expires;

  -- Colonnes restantes
  FOR v_rec IN
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_roles'
      AND column_name IN ('expires_at', 'expired_at')
    ORDER BY column_name
  LOOP
    RAISE NOTICE '  • % : %', v_rec.column_name, v_rec.data_type;
  END LOOP;

  -- Fonction
  SELECT
    CASE WHEN prosecdef THEN 'DEFINER' ELSE 'INVOKER' END,
    pg_get_functiondef(p.oid) ILIKE '%search_path%'
  INTO v_func_security, v_has_search_path
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'is_user_admin';

  RAISE NOTICE '';
  RAISE NOTICE 'Fonction public.is_user_admin() :';
  RAISE NOTICE '  • SECURITY    : %', COALESCE(v_func_security, 'INTROUVABLE');
  RAISE NOTICE '  • search_path : %', COALESCE(v_has_search_path::text, 'INTROUVABLE');

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

-- =============================================================================
-- ÉTAPE 6 : NOTIFY POSTGREST
-- =============================================================================

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;