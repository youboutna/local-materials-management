-- =============================================================================
-- MIGRATION : 20260822000020_add_policies_secret_generate.sql
-- Date       : 2026-08-22
-- Objet      : Politiques RLS pour tender_sharing_secrets et tender_access_logs
--
-- SÉCURITÉ :
--   - Idempotente : boucle DROP POLICY IF EXISTS
--   - RLS activé + FORCE
--   - Helper `btp.get_current_user_role()` (SECURITY DEFINER) au lieu de auth.jwt()
--   - Une seule politique par opération (pas d'addition OR involontaire)
--   - INSERT : contrôle strict du créateur
--   - UPDATE/DELETE : internes uniquement
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 0 : VÉRIFIER QUE LES TABLES EXISTENT
-- =============================================================================

DO $$
DECLARE
  v_tables TEXT[] := ARRAY['tender_sharing_secrets', 'tender_access_logs'];
  v_tbl TEXT;
  v_missing TEXT[] := ARRAY[]::TEXT[];
BEGIN
  FOREACH v_tbl IN ARRAY v_tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'btp' AND table_name = v_tbl
    ) THEN
      v_missing := array_append(v_missing, v_tbl);
    END IF;
  END LOOP;

  IF array_length(v_missing, 1) > 0 THEN
    RAISE EXCEPTION 'Tables manquantes : % — migration annulée',
      array_to_string(v_missing, ', ');
  END IF;

  RAISE NOTICE '✅ Tables présentes';
END $$;

-- =============================================================================
-- ÉTAPE 1 : HELPER — btp.get_current_user_role()
-- =============================================================================
-- SECURITY DEFINER + search_path = '' → évite la récursion RLS
-- Retourne le rôle métier de l'utilisateur courant (admin/director/...)
-- =============================================================================

DROP FUNCTION IF EXISTS btp.get_current_user_role() CASCADE;

CREATE FUNCTION btp.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (
      SELECT ur.role_name
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND (ur.expires_at IS NULL OR ur.expires_at > now())
      ORDER BY
        CASE ur.role_name
          WHEN 'admin' THEN 1
          WHEN 'director' THEN 2
          WHEN 'manager' THEN 3
          WHEN 'engineering_consultant' THEN 4
          WHEN 'consultant' THEN 5
          WHEN 'supplier' THEN 6
          ELSE 99
        END ASC
      LIMIT 1
    ),
    'member'
  );
$$;

REVOKE ALL ON FUNCTION btp.get_current_user_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION btp.get_current_user_role() FROM anon;
GRANT EXECUTE ON FUNCTION btp.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION btp.get_current_user_role() TO service_role;

COMMENT ON FUNCTION btp.get_current_user_role() IS
  'Retourne le rôle métier de l''utilisateur courant (admin/director/...). '
  'SECURITY DEFINER + search_path = ''''.';

DO $$ BEGIN RAISE NOTICE '✅ Fonction btp.get_current_user_role() créée'; END $$;

-- =============================================================================
-- ÉTAPE 2 : RLS + FORCE
-- =============================================================================

ALTER TABLE btp.tender_sharing_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.tender_sharing_secrets FORCE ROW LEVEL SECURITY;

ALTER TABLE btp.tender_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.tender_access_logs FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- ÉTAPE 3 : NETTOYAGE DES POLICIES EXISTANTES
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_count INT := 0;
BEGIN
  FOR v_rec IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'btp'
      AND tablename IN ('tender_sharing_secrets', 'tender_access_logs')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.%I',
      v_rec.policyname, v_rec.tablename);
    RAISE NOTICE '  Policy supprimée : %.%', v_rec.tablename, v_rec.policyname;
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE '  → % policies supprimées', v_count;
END $$;

-- =============================================================================
-- ÉTAPE 4 : POLICIES POUR tender_sharing_secrets
-- =============================================================================
-- Règle métier :
--   - SELECT : tous les authentifiés (transparence des secrets partagés)
--   - INSERT : tous les authentifiés (création par interne ou fournisseur)
--   - UPDATE : internes uniquement (fournisseur ne peut PAS modifier)
--   - DELETE : internes uniquement (fournisseur ne peut PAS supprimer)
-- =============================================================================

-- 4.1 : SELECT — tous les authentifiés
CREATE POLICY "secrets_select_authenticated"
ON btp.tender_sharing_secrets
FOR SELECT
TO authenticated
USING (true);

-- 4.2 : INSERT — tous les authentifiés
-- ✅ Contrôle : le créateur doit correspondre à shared_by
CREATE POLICY "secrets_insert_authenticated"
ON btp.tender_sharing_secrets
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    btp.tender_sharing_secrets.shared_by IS NULL
    OR btp.tender_sharing_secrets.shared_by = auth.uid()
  )
);

-- 4.3 : UPDATE — internes uniquement
-- ✅ Une seule politique → pas d'addition OR
CREATE POLICY "secrets_update_internal_roles"
ON btp.tender_sharing_secrets
FOR UPDATE
TO authenticated
USING (
  btp.get_current_user_role() IN (
    'admin', 'manager', 'director', 'engineering_consultant', 'consultant'
  )
)
WITH CHECK (
  btp.get_current_user_role() IN (
    'admin', 'manager', 'director', 'engineering_consultant', 'consultant'
  )
);

-- 4.4 : DELETE — internes uniquement
CREATE POLICY "secrets_delete_internal_roles"
ON btp.tender_sharing_secrets
FOR DELETE
TO authenticated
USING (
  btp.get_current_user_role() IN (
    'admin', 'manager', 'director', 'engineering_consultant', 'consultant'
  )
);

COMMENT ON POLICY "secrets_select_authenticated" ON btp.tender_sharing_secrets IS
  'SELECT : tous les utilisateurs authentifiés.';
COMMENT ON POLICY "secrets_insert_authenticated" ON btp.tender_sharing_secrets IS
  'INSERT : tous les authentifiés, shared_by doit être auth.uid() ou NULL.';
COMMENT ON POLICY "secrets_update_internal_roles" ON btp.tender_sharing_secrets IS
  'UPDATE : admin/manager/director/consultant uniquement (fournisseur BLOQUÉ).';
COMMENT ON POLICY "secrets_delete_internal_roles" ON btp.tender_sharing_secrets IS
  'DELETE : admin/manager/director/consultant uniquement (fournisseur BLOQUÉ).';

-- =============================================================================
-- ÉTAPE 5 : POLICIES POUR tender_access_logs
-- =============================================================================
-- Règle métier :
--   - INSERT : tous les authentifiés (log de leurs actions)
--   - SELECT : internes voient tout ; fournisseurs voient les leurs
-- =============================================================================

-- 5.1 : INSERT — tous les authentifiés
CREATE POLICY "access_logs_insert_authenticated"
ON btp.tender_access_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 5.2 : SELECT — internes voient tout
-- ✅ Combiné dans une seule politique avec la vue fournisseur (OR logique interne)
CREATE POLICY "access_logs_select_authorized"
ON btp.tender_access_logs
FOR SELECT
TO authenticated
USING (
  -- Cas 1 : rôle interne → voit tout
  btp.get_current_user_role() IN (
    'admin', 'manager', 'director', 'engineering_consultant', 'consultant'
  )
  -- Cas 2 : fournisseur → voit ses propres logs (par email ou par secret)
  OR (
    btp.get_current_user_role() = 'supplier'
    AND (
      -- Ses propres logs (par email)
      btp.tender_access_logs.accessed_by = auth.email()
      -- OU les logs des secrets qu'il a créés
      OR EXISTS (
        SELECT 1 FROM btp.tender_sharing_secrets tss
        WHERE tss.id = btp.tender_access_logs.sharing_secret_id
          AND tss.supplier_email = auth.email()
      )
    )
  )
);

COMMENT ON POLICY "access_logs_insert_authenticated" ON btp.tender_access_logs IS
  'INSERT : tous les authentifiés (log de leurs actions).';
COMMENT ON POLICY "access_logs_select_authorized" ON btp.tender_access_logs IS
  'SELECT : internes voient tout ; fournisseurs voient leurs propres logs.';

-- =============================================================================
-- ÉTAPE 6 : PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.tender_sharing_secrets TO authenticated;
GRANT SELECT ON btp.tender_sharing_secrets TO anon;
GRANT ALL ON btp.tender_sharing_secrets TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.tender_access_logs TO authenticated;
GRANT SELECT ON btp.tender_access_logs TO anon;
GRANT ALL ON btp.tender_access_logs TO service_role;

-- =============================================================================
-- ÉTAPE 7 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_rls_enabled BOOLEAN;
  v_rls_forced BOOLEAN;
  v_policy_count INT;
  v_func_security TEXT;
  v_tables TEXT[] := ARRAY['tender_sharing_secrets', 'tender_access_logs'];
  v_tbl TEXT;
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
  WHERE n.nspname = 'btp' AND p.proname = 'get_current_user_role';

  RAISE NOTICE 'Fonction btp.get_current_user_role() : %',
    COALESCE(v_func_security, 'INTROUVABLE');

  -- RLS
  FOREACH v_tbl IN ARRAY v_tables
  LOOP
    SELECT c.relrowsecurity, c.relforcerowsecurity
    INTO v_rls_enabled, v_rls_forced
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'btp' AND c.relname = v_tbl;

    RAISE NOTICE '';
    RAISE NOTICE 'btp.% : RLS=% FORCE=%', v_tbl, v_rls_enabled, v_rls_forced;

    SELECT COUNT(*) INTO v_policy_count
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = v_tbl;
    RAISE NOTICE '   Policies : %', v_policy_count;
  END LOOP;

  -- Détail
  RAISE NOTICE '';
  RAISE NOTICE 'Détail des policies :';
  FOR v_rec IN
    SELECT tablename, policyname, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'btp'
      AND tablename IN ('tender_sharing_secrets', 'tender_access_logs')
    ORDER BY tablename, policyname
  LOOP
    RAISE NOTICE '   • %.% [%] → %',
      v_rec.tablename, v_rec.policyname, v_rec.cmd, v_rec.roles;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

-- =============================================================================
-- ÉTAPE 8 : NOTIFY POSTGREST
-- =============================================================================

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;