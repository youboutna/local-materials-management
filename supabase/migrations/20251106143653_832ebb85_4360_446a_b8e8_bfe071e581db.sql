-- =============================================================================
-- MIGRATION : 20251106143653_create_document_validation_logs.sql
-- Date       : 2025-11-06
-- Objet      : Créer btp.document_validation_logs + btp.submission_activity_logs
--              + RLS + triggers + realtime
--
-- SÉCURITÉ :
--   - Idempotente : CREATE IF NOT EXISTS + boucle DROP POLICY IF EXISTS
--   - RLS activé + FORCE
--   - Policies TO authenticated (sauf service_role)
--   - Fonction trigger SECURITY DEFINER + SET search_path + REVOKE PUBLIC
--   - Realtime : vérification avant ajout (fix 42710)
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 1 : TABLE btp.document_validation_logs (IDEMPOTENTE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.document_validation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES btp.documents(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES btp.tender_submissions(id) ON DELETE CASCADE,
  is_valid BOOLEAN NOT NULL DEFAULT false,
  errors JSONB DEFAULT '[]'::jsonb,
  warnings JSONB DEFAULT '[]'::jsonb,
  validated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE btp.document_validation_logs
  ADD COLUMN IF NOT EXISTS document_id UUID,
  ADD COLUMN IF NOT EXISTS submission_id UUID,
  ADD COLUMN IF NOT EXISTS is_valid BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS errors JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS warnings JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$ BEGIN RAISE NOTICE '✅ Table btp.document_validation_logs créée/vérifiée'; END $$;

-- =============================================================================
-- ÉTAPE 2 : TABLE btp.submission_activity_logs (IDEMPOTENTE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.submission_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES btp.tender_submissions(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE btp.submission_activity_logs
  ADD COLUMN IF NOT EXISTS submission_id UUID,
  ADD COLUMN IF NOT EXISTS action TEXT,
  ADD COLUMN IF NOT EXISTS details TEXT,
  ADD COLUMN IF NOT EXISTS performed_by UUID,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$ BEGIN RAISE NOTICE '✅ Table btp.submission_activity_logs créée/vérifiée'; END $$;

-- =============================================================================
-- ÉTAPE 3 : RLS + FORCE
-- =============================================================================

ALTER TABLE btp.document_validation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.document_validation_logs FORCE ROW LEVEL SECURITY;

ALTER TABLE btp.submission_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.submission_activity_logs FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- ÉTAPE 4 : NETTOYAGE DYNAMIQUE DES POLICIES (fix 42710)
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_count INT := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  NETTOYAGE DES POLICIES';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  FOR v_rec IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'btp'
      AND tablename IN ('document_validation_logs', 'submission_activity_logs')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.%I',
      v_rec.policyname, v_rec.tablename);
    RAISE NOTICE '  ✅ Supprimée : %.%', v_rec.tablename, v_rec.policyname;
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE '  → % policies supprimées', v_count;
  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

-- =============================================================================
-- ÉTAPE 5 : POLICIES — btp.document_validation_logs
-- =============================================================================

-- 5.1 : Utilisateurs voient les logs de leurs soumissions
CREATE POLICY "Users can view validation logs for their submissions"
ON btp.document_validation_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM btp.tender_submissions ts
    WHERE ts.id = btp.document_validation_logs.submission_id
      AND ts.user_id = auth.uid()
  )
);

COMMENT ON POLICY "Users can view validation logs for their submissions"
ON btp.document_validation_logs IS
  'Un utilisateur voit les logs de validation de ses propres soumissions.';

-- 5.2 : Admins peuvent tout voir et gérer
CREATE POLICY "Admins can manage validation logs"
ON btp.document_validation_logs
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

COMMENT ON POLICY "Admins can manage validation logs"
ON btp.document_validation_logs IS
  'Admin/director : gestion complète des logs de validation.';

-- 5.3 : Insertion authentifiée (pour les Edge Functions)
CREATE POLICY "Authenticated can insert validation logs"
ON btp.document_validation_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

COMMENT ON POLICY "Authenticated can insert validation logs"
ON btp.document_validation_logs IS
  'Les utilisateurs authentifiés peuvent insérer des logs.';

-- =============================================================================
-- ÉTAPE 6 : POLICIES — btp.submission_activity_logs
-- =============================================================================

-- 6.1 : Utilisateurs voient les logs de leurs soumissions
CREATE POLICY "Users can view activity logs for their submissions"
ON btp.submission_activity_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM btp.tender_submissions ts
    WHERE ts.id = btp.submission_activity_logs.submission_id
      AND ts.user_id = auth.uid()
  )
);

COMMENT ON POLICY "Users can view activity logs for their submissions"
ON btp.submission_activity_logs IS
  'Un utilisateur voit les logs d''activité de ses propres soumissions.';

-- 6.2 : Admins peuvent tout voir et gérer
CREATE POLICY "Admins can manage activity logs"
ON btp.submission_activity_logs
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

COMMENT ON POLICY "Admins can manage activity logs"
ON btp.submission_activity_logs IS
  'Admin/director : gestion complète des logs d''activité.';

-- 6.3 : Insertion authentifiée
CREATE POLICY "Authenticated can create activity logs"
ON btp.submission_activity_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

COMMENT ON POLICY "Authenticated can create activity logs"
ON btp.submission_activity_logs IS
  'Insertion réservée aux utilisateurs authentifiés.';

-- =============================================================================
-- ÉTAPE 7 : PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.document_validation_logs TO authenticated;
GRANT SELECT ON btp.document_validation_logs TO anon;
GRANT ALL ON btp.document_validation_logs TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.submission_activity_logs TO authenticated;
GRANT SELECT ON btp.submission_activity_logs TO anon;
GRANT ALL ON btp.submission_activity_logs TO service_role;

-- =============================================================================
-- ÉTAPE 8 : INDEX
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_document_validation_logs_document_id
  ON btp.document_validation_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_document_validation_logs_submission_id
  ON btp.document_validation_logs(submission_id);
CREATE INDEX IF NOT EXISTS idx_document_validation_logs_created_at
  ON btp.document_validation_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_submission_activity_logs_submission_id
  ON btp.submission_activity_logs(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_activity_logs_created_at
  ON btp.submission_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submission_activity_logs_performed_by
  ON btp.submission_activity_logs(performed_by) WHERE performed_by IS NOT NULL;

DO $$ BEGIN RAISE NOTICE '✅ Index créés'; END $$;

-- =============================================================================
-- ÉTAPE 9 : FONCTION log_submission_status_change() — SÉCURISÉE
-- =============================================================================

DROP FUNCTION IF EXISTS btp.log_submission_status_change() CASCADE;

CREATE FUNCTION btp.log_submission_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_performer UUID;
BEGIN
  -- Récupérer l'utilisateur (peut être NULL dans un contexte service_role)
  BEGIN
    v_performer := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_performer := NULL;
  END;

  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO btp.submission_activity_logs (
      submission_id,
      action,
      details,
      performed_by
    ) VALUES (
      NEW.id,
      'status_changed',
      'Statut changé : ' || COALESCE(OLD.status, '(null)') || ' → ' || COALESCE(NEW.status, '(null)'),
      v_performer
    );
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION btp.log_submission_status_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION btp.log_submission_status_change() FROM anon;
GRANT EXECUTE ON FUNCTION btp.log_submission_status_change() TO authenticated;
GRANT EXECUTE ON FUNCTION btp.log_submission_status_change() TO service_role;

COMMENT ON FUNCTION btp.log_submission_status_change() IS
  'Log automatiquement les changements de statut d''une soumission. SECURITY DEFINER + search_path=''''.';

DO $$ BEGIN RAISE NOTICE '✅ Fonction log_submission_status_change() créée et sécurisée'; END $$;

-- =============================================================================
-- ÉTAPE 10 : TRIGGER log_submission_status_change
-- =============================================================================

DROP TRIGGER IF EXISTS trigger_log_submission_status_change ON btp.tender_submissions;
CREATE TRIGGER trigger_log_submission_status_change
  AFTER UPDATE ON btp.tender_submissions
  FOR EACH ROW
  EXECUTE FUNCTION btp.log_submission_status_change();

DO $$ BEGIN RAISE NOTICE '✅ Trigger trigger_log_submission_status_change créé'; END $$;

-- =============================================================================
-- ÉTAPE 11 : REALTIME — AJOUT CONDITIONNEL (fix 42710)
-- =============================================================================
-- On vérifie que la table n'est pas déjà dans la publication avant de l'ajouter.

DO $$
DECLARE
  v_rec RECORD;
  v_tables TEXT[] := ARRAY['tender_submissions', 'submission_activity_logs'];
  v_tbl TEXT;
  v_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  REALTIME — Ajout conditionnel';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  FOREACH v_tbl IN ARRAY v_tables
  LOOP
    -- Vérifier si la table est déjà dans la publication
    SELECT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'btp'
        AND tablename = v_tbl
    ) INTO v_exists;

    IF v_exists THEN
      RAISE NOTICE '  ℹ️  btp.% déjà dans supabase_realtime', v_tbl;
    ELSE
      -- Vérifier que la publication existe
      IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE btp.%I', v_tbl);
        RAISE NOTICE '  ✅ btp.% ajoutée à supabase_realtime', v_tbl;
      ELSE
        RAISE NOTICE '  ⚠️  Publication supabase_realtime absente — skip btp.%', v_tbl;
      END IF;
    END IF;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

-- =============================================================================
-- ÉTAPE 12 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_rls_enabled BOOLEAN;
  v_rls_forced BOOLEAN;
  v_policy_count INT;
  v_func_security TEXT;
  v_tables TEXT[] := ARRAY['document_validation_logs', 'submission_activity_logs'];
  v_tbl TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  VÉRIFICATION POST-MIGRATION';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  FOREACH v_tbl IN ARRAY v_tables
  LOOP
    SELECT c.relrowsecurity, c.relforcerowsecurity
    INTO v_rls_enabled, v_rls_forced
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'btp' AND c.relname = v_tbl;

    RAISE NOTICE 'btp.% : RLS=% FORCE=%', v_tbl, v_rls_enabled, v_rls_forced;

    SELECT COUNT(*) INTO v_policy_count
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = v_tbl;
    RAISE NOTICE '   Policies : %', v_policy_count;
  END LOOP;

  -- Fonction
  SELECT CASE WHEN prosecdef THEN 'DEFINER' ELSE 'INVOKER' END INTO v_func_security
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'btp' AND p.proname = 'log_submission_status_change';
  RAISE NOTICE '';
  RAISE NOTICE 'Fonction log_submission_status_change : %',
    COALESCE(v_func_security, 'INTROUVABLE');

  RAISE NOTICE '';
  RAISE NOTICE 'Détail des policies :';
  FOR v_rec IN
    SELECT tablename, policyname, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'btp'
      AND tablename IN ('document_validation_logs', 'submission_activity_logs')
    ORDER BY tablename, policyname
  LOOP
    RAISE NOTICE '   • %.% [%] → %',
      v_rec.tablename, v_rec.policyname, v_rec.cmd, v_rec.roles;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;