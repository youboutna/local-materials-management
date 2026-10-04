-- =============================================================================
-- MIGRATION : 20250720084947_create_email_logs.sql
-- Date       : 2025-07-20
-- Objet      : Créer/compléter btp.email_logs + RLS + trigger
--
-- RÈGLES DE QUALIFICATION APPLIQUÉES :
--   - CREATE INDEX        → nom de colonne SIMPLE (qualification interdite)
--   - ALTER TABLE ADD COLUMN → nom de colonne SIMPLE
--   - CREATE POLICY USING → qualification COMPLÈTE recommandée
--   - INSERT/UPDATE SET   → nom de colonne SIMPLE
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 1 : SCHÉMA
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS btp;

-- =============================================================================
-- ÉTAPE 2 : TABLE (idempotente)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.email_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    email_to TEXT NOT NULL,
    email_from TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT,
    template_name TEXT,
    status TEXT DEFAULT 'sent',
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- ÉTAPE 3 : COLONNES MANQUANTES (idempotent)
-- =============================================================================
-- ✅ ADD COLUMN : nom SIMPLE obligatoire

ALTER TABLE btp.email_logs
    ADD COLUMN IF NOT EXISTS user_id UUID,
    ADD COLUMN IF NOT EXISTS email_to TEXT,
    ADD COLUMN IF NOT EXISTS email_from TEXT,
    ADD COLUMN IF NOT EXISTS subject TEXT,
    ADD COLUMN IF NOT EXISTS body TEXT,
    ADD COLUMN IF NOT EXISTS template_name TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent',
    ADD COLUMN IF NOT EXISTS error_message TEXT,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- =============================================================================
-- ÉTAPE 4 : INDEX
-- =============================================================================
-- ✅ CREATE INDEX : nom de colonne SIMPLE — la qualification est INTERDITE
--    (résolution automatique par rapport à la table de l'index)

CREATE INDEX IF NOT EXISTS idx_email_logs_user_id
    ON btp.email_logs USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_email_logs_status
    ON btp.email_logs USING btree (status);

CREATE INDEX IF NOT EXISTS idx_email_logs_created_at
    ON btp.email_logs USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_logs_email_to
    ON btp.email_logs USING btree (email_to);

CREATE INDEX IF NOT EXISTS idx_email_logs_template_name
    ON btp.email_logs USING btree (template_name)
    WHERE template_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_email_logs_metadata_gin
    ON btp.email_logs USING GIN (metadata);

-- =============================================================================
-- ÉTAPE 5 : RLS
-- =============================================================================

ALTER TABLE btp.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.email_logs FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- ÉTAPE 6 : POLICIES — qualification COMPLÈTE recommandée
-- =============================================================================

DO $$
DECLARE
    v_rec RECORD;
BEGIN
    FOR v_rec IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'btp' AND tablename = 'email_logs'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON btp.email_logs', v_rec.policyname);
        RAISE NOTICE '  Policy supprimée : %', v_rec.policyname;
    END LOOP;
END $$;

CREATE POLICY "Admins can manage all email logs"
ON btp.email_logs
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

CREATE POLICY "Users can view their own email logs"
ON btp.email_logs
FOR SELECT
TO authenticated
USING (btp.email_logs.user_id = auth.uid());   -- ✅ qualification complète

CREATE POLICY "Users can insert email logs"
ON btp.email_logs
FOR INSERT
TO authenticated
WITH CHECK (
    btp.email_logs.user_id = auth.uid()        -- ✅ qualifié
    OR btp.email_logs.user_id IS NULL
);

CREATE POLICY "Users can update their own email logs"
ON btp.email_logs
FOR UPDATE
TO authenticated
USING (btp.email_logs.user_id = auth.uid())    -- ✅ qualifié
WITH CHECK (btp.email_logs.user_id = auth.uid());

-- =============================================================================
-- ÉTAPE 7 : PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE ON btp.email_logs TO authenticated;
GRANT SELECT ON btp.email_logs TO anon;
GRANT ALL ON btp.email_logs TO service_role;

-- =============================================================================
-- ÉTAPE 8 : TRIGGER updated_at
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'update_timestamp'
    ) THEN
        EXECUTE $fn$
            CREATE OR REPLACE FUNCTION public.update_timestamp()
            RETURNS TRIGGER
            LANGUAGE plpgsql
            SECURITY DEFINER
            SET search_path = ''
            AS $body$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $body$;
        $fn$;
    END IF;
END $$;

DROP TRIGGER IF EXISTS update_email_logs_updated_at ON btp.email_logs;

CREATE TRIGGER update_email_logs_updated_at
    BEFORE UPDATE ON btp.email_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_timestamp();

-- =============================================================================
-- ÉTAPE 9 : COMMENTAIRES
-- =============================================================================

COMMENT ON TABLE btp.email_logs IS
  'Logs des envois d''emails. RLS activé + FORCE. Statut validé côté référentiels.';

COMMENT ON COLUMN btp.email_logs.id IS 'Identifiant unique du log';
COMMENT ON COLUMN btp.email_logs.user_id IS 'ID utilisateur émetteur (nullable pour logs système)';
COMMENT ON COLUMN btp.email_logs.email_to IS 'Adresse destinataire';
COMMENT ON COLUMN btp.email_logs.email_from IS 'Adresse expéditeur';
COMMENT ON COLUMN btp.email_logs.subject IS 'Sujet';
COMMENT ON COLUMN btp.email_logs.body IS 'Corps (HTML ou texte)';
COMMENT ON COLUMN btp.email_logs.template_name IS 'Template utilisé';
COMMENT ON COLUMN btp.email_logs.status IS 'Statut — validation côté référentiels';
COMMENT ON COLUMN btp.email_logs.error_message IS 'Message d''erreur si échec';
COMMENT ON COLUMN btp.email_logs.metadata IS 'Métadonnées JSON';
COMMENT ON COLUMN btp.email_logs.created_at IS 'Date de création';
COMMENT ON COLUMN btp.email_logs.updated_at IS 'Date de mise à jour';

-- =============================================================================
-- ÉTAPE 10 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
    v_rls_enabled BOOLEAN;
    v_rls_forced BOOLEAN;
    v_policy_count INT;
    v_rec RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '  VÉRIFICATION — btp.email_logs';
    RAISE NOTICE '════════════════════════════════════════════════════════════';

    SELECT c.relrowsecurity, c.relforcerowsecurity
    INTO v_rls_enabled, v_rls_forced
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'btp' AND c.relname = 'email_logs';

    RAISE NOTICE '✅ RLS activé : %', v_rls_enabled;
    RAISE NOTICE '✅ RLS forcé  : %', v_rls_forced;

    SELECT COUNT(*) INTO v_policy_count
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'email_logs';

    RAISE NOTICE '';
    RAISE NOTICE 'Policies : %', v_policy_count;
    FOR v_rec IN
        SELECT policyname, cmd, roles
        FROM pg_policies
        WHERE schemaname = 'btp' AND tablename = 'email_logs'
        ORDER BY policyname
    LOOP
        RAISE NOTICE '   • % [%] → %', v_rec.policyname, v_rec.cmd, v_rec.roles;
    END LOOP;

    RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;