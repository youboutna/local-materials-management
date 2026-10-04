-- =============================================================================
-- MIGRATION : 20250727064238_create_supplier_notifications.sql
-- Date       : 2025-07-27
-- Objet      : Créer/compléter btp.supplier_notifications + colonnes associées
--              + fonctions RPC sécurisées
--
-- SÉCURITÉ :
--   - Idempotente : IF NOT EXISTS + boucle DROP POLICY IF EXISTS
--   - ADD COLUMN IF NOT EXISTS pour toutes les colonnes
--   - SECURITY DEFINER + SET search_path = '' sur les fonctions
--   - REVOKE PUBLIC + GRANT authenticated
--   - Bug corrigé : use_supplier_reset_token utilise p_reset_token
--   - Pas de CHECK sur notification_type (validation côté app)
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 1 : TABLE btp.supplier_notifications (idempotente + complétion)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.supplier_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES btp.suppliers(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL DEFAULT 'general',  -- pas de CHECK
  email TEXT NOT NULL DEFAULT '',
  reset_token TEXT,
  task_id UUID,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ✅ Compléter les colonnes manquantes (fix 42703)
ALTER TABLE btp.supplier_notifications
  ADD COLUMN IF NOT EXISTS supplier_id UUID,
  ADD COLUMN IF NOT EXISTS notification_type TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS reset_token TEXT,
  ADD COLUMN IF NOT EXISTS task_id UUID,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$ BEGIN RAISE NOTICE '✅ Table btp.supplier_notifications créée/complétée'; END $$;

-- =============================================================================
-- ÉTAPE 2 : INDEX (idempotents)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_supplier_notifications_supplier_id
  ON btp.supplier_notifications(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_notifications_email
  ON btp.supplier_notifications(email);
CREATE INDEX IF NOT EXISTS idx_supplier_notifications_reset_token
  ON btp.supplier_notifications(reset_token) WHERE reset_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_supplier_notifications_notification_type
  ON btp.supplier_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_supplier_notifications_sent_at
  ON btp.supplier_notifications(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_supplier_notifications_expires_at
  ON btp.supplier_notifications(expires_at) WHERE expires_at IS NOT NULL;

DO $$ BEGIN RAISE NOTICE '✅ Index supplier_notifications créés'; END $$;

-- =============================================================================
-- ÉTAPE 3 : RLS
-- =============================================================================

ALTER TABLE btp.supplier_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.supplier_notifications FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- ÉTAPE 4 : NETTOYAGE DES POLICIES (fix 42710)
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
BEGIN
  FOR v_rec IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'supplier_notifications'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.supplier_notifications', v_rec.policyname);
    RAISE NOTICE '  Policy supprimée : %', v_rec.policyname;
  END LOOP;
END $$;

-- =============================================================================
-- ÉTAPE 5 : POLICIES SÉCURISÉES
-- =============================================================================

-- Admins : gestion complète
CREATE POLICY "Admins can manage supplier notifications"
ON btp.supplier_notifications
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

-- Fournisseurs : leurs propres notifications (via suppliers.user_id)
CREATE POLICY "Suppliers can view their own notifications"
ON btp.supplier_notifications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM btp.suppliers s
    WHERE s.id = btp.supplier_notifications.supplier_id
      AND s.user_id = auth.uid()
  )
);

-- Fournisseurs : par email (fallback si user_id absent)
CREATE POLICY "Suppliers can view by email"
ON btp.supplier_notifications
FOR SELECT
TO authenticated
USING (email = auth.email());

COMMENT ON POLICY "Admins can manage supplier notifications" ON btp.supplier_notifications IS
  'Admin/director : gestion complète.';

-- =============================================================================
-- ÉTAPE 6 : COLONNES SUR btp.suppliers (idempotent)
-- =============================================================================

ALTER TABLE btp.suppliers
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS default_password_reset_required BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_suppliers_user_id
  ON btp.suppliers(user_id) WHERE user_id IS NOT NULL;

DO $$ BEGIN RAISE NOTICE '✅ Colonnes + index sur btp.suppliers'; END $$;

-- =============================================================================
-- ÉTAPE 7 : COLONNES SUR btp.task_assignments (conditionnel)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'btp' AND table_name = 'task_assignments'
  ) THEN
    ALTER TABLE btp.task_assignments
      ADD COLUMN IF NOT EXISTS completion_token TEXT,
      ADD COLUMN IF NOT EXISTS completion_url TEXT;

    CREATE INDEX IF NOT EXISTS idx_task_assignments_completion_token
      ON btp.task_assignments(completion_token) WHERE completion_token IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_task_assignments_completion_url
      ON btp.task_assignments(completion_url) WHERE completion_url IS NOT NULL;

    RAISE NOTICE '✅ Colonnes + index sur btp.task_assignments';
  ELSE
    RAISE NOTICE 'ℹ️  btp.task_assignments absente — skip';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 8 : FONCTIONS RPC SÉCURISÉES
-- =============================================================================

-- 8.1 : generate_supplier_reset_token
DROP FUNCTION IF EXISTS btp.generate_supplier_reset_token(TEXT) CASCADE;

CREATE FUNCTION btp.generate_supplier_reset_token(p_supplier_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $func$
DECLARE
  v_reset_token TEXT;
  v_supplier_id UUID;
BEGIN
  -- Récupérer l'ID du fournisseur
  SELECT id INTO v_supplier_id
  FROM btp.suppliers
  WHERE email = p_supplier_email;

  IF v_supplier_id IS NULL THEN
    RAISE EXCEPTION 'Fournisseur non trouvé avec l''email: %', p_supplier_email;
  END IF;

  -- Générer un token aléatoire
  v_reset_token := encode(gen_random_bytes(32), 'base64');

  -- Insérer la notification
  INSERT INTO btp.supplier_notifications (
    supplier_id, notification_type, email, reset_token, expires_at, created_by
  ) VALUES (
    v_supplier_id, 'password_reset', p_supplier_email, v_reset_token,
    NOW() + INTERVAL '24 hours', auth.uid()
  );

  RETURN v_reset_token;
END;
$func$;

REVOKE ALL ON FUNCTION btp.generate_supplier_reset_token(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION btp.generate_supplier_reset_token(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION btp.generate_supplier_reset_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION btp.generate_supplier_reset_token(TEXT) TO service_role;

COMMENT ON FUNCTION btp.generate_supplier_reset_token(TEXT) IS
  'Génère un token de réinitialisation pour un fournisseur. SECURITY DEFINER + search_path=''''.';

-- 8.2 : verify_supplier_reset_token
DROP FUNCTION IF EXISTS btp.verify_supplier_reset_token(TEXT) CASCADE;

CREATE FUNCTION btp.verify_supplier_reset_token(p_reset_token TEXT)
RETURNS TABLE(valid BOOLEAN, supplier_id UUID, email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $func$
BEGIN
  RETURN QUERY
  SELECT
    TRUE AS valid,
    s.id AS supplier_id,
    s.email
  FROM btp.supplier_notifications sn
  JOIN btp.suppliers s ON s.id = sn.supplier_id
  WHERE sn.reset_token = p_reset_token
    AND sn.used_at IS NULL
    AND sn.expires_at > NOW()
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT;
  END IF;
END;
$func$;

REVOKE ALL ON FUNCTION btp.verify_supplier_reset_token(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION btp.verify_supplier_reset_token(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION btp.verify_supplier_reset_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION btp.verify_supplier_reset_token(TEXT) TO service_role;

COMMENT ON FUNCTION btp.verify_supplier_reset_token(TEXT) IS
  'Vérifie un token de réinitialisation. SECURITY DEFINER + search_path=''''.';

-- 8.3 : use_supplier_reset_token — ✅ BUG CORRIGÉ
DROP FUNCTION IF EXISTS btp.use_supplier_reset_token(TEXT) CASCADE;

CREATE FUNCTION btp.use_supplier_reset_token(p_reset_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $func$
DECLARE
  v_updated INT;
BEGIN
  -- ✅ FIX : p_reset_token (paramètre) ≠ reset_token (colonne)
  --          + table qualifiée explicitement
  UPDATE btp.supplier_notifications
  SET used_at = NOW()
  WHERE reset_token = p_reset_token
    AND used_at IS NULL
    AND expires_at > NOW();

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$func$;

REVOKE ALL ON FUNCTION btp.use_supplier_reset_token(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION btp.use_supplier_reset_token(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION btp.use_supplier_reset_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION btp.use_supplier_reset_token(TEXT) TO service_role;

COMMENT ON FUNCTION btp.use_supplier_reset_token(TEXT) IS
  'Marque un token comme utilisé. SECURITY DEFINER + search_path='''' + fix collision reset_token.';

DO $$ BEGIN RAISE NOTICE '✅ Fonctions RPC créées et sécurisées'; END $$;

-- =============================================================================
-- ÉTAPE 9 : PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.supplier_notifications TO authenticated;
GRANT SELECT ON btp.supplier_notifications TO anon;
GRANT ALL ON btp.supplier_notifications TO service_role;

-- =============================================================================
-- ÉTAPE 10 : TRIGGER updated_at
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

DROP TRIGGER IF EXISTS update_supplier_notifications_updated_at ON btp.supplier_notifications;
CREATE TRIGGER update_supplier_notifications_updated_at
  BEFORE UPDATE ON btp.supplier_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

-- =============================================================================
-- ÉTAPE 11 : COMMENTAIRES (après avoir garanti les colonnes)
-- =============================================================================

COMMENT ON TABLE btp.supplier_notifications IS 'Notifications pour les fournisseurs';

COMMENT ON COLUMN btp.supplier_notifications.id IS 'Identifiant unique';
COMMENT ON COLUMN btp.supplier_notifications.supplier_id IS 'Référence au fournisseur';
COMMENT ON COLUMN btp.supplier_notifications.notification_type IS 'Type — validation côté référentiels';
COMMENT ON COLUMN btp.supplier_notifications.email IS 'Email du destinataire';
COMMENT ON COLUMN btp.supplier_notifications.reset_token IS 'Token de réinitialisation';
COMMENT ON COLUMN btp.supplier_notifications.task_id IS 'Tâche associée';
COMMENT ON COLUMN btp.supplier_notifications.sent_at IS 'Date d''envoi';
COMMENT ON COLUMN btp.supplier_notifications.expires_at IS 'Expiration du token';
COMMENT ON COLUMN btp.supplier_notifications.used_at IS 'Date d''utilisation';
COMMENT ON COLUMN btp.supplier_notifications.created_by IS 'Créateur';
COMMENT ON COLUMN btp.supplier_notifications.metadata IS 'Métadonnées JSON';
COMMENT ON COLUMN btp.supplier_notifications.created_at IS 'Date de création';
COMMENT ON COLUMN btp.supplier_notifications.updated_at IS 'Date de mise à jour';

-- =============================================================================
-- ÉTAPE 12 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rls_enabled BOOLEAN;
  v_rls_forced BOOLEAN;
  v_policy_count INT;
  v_col_count INT;
  v_func_count INT;
  v_rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  VÉRIFICATION — btp.supplier_notifications';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  SELECT c.relrowsecurity, c.relforcerowsecurity
  INTO v_rls_enabled, v_rls_forced
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'btp' AND c.relname = 'supplier_notifications';

  RAISE NOTICE 'RLS activé : %', v_rls_enabled;
  RAISE NOTICE 'RLS forcé  : %', v_rls_forced;

  SELECT COUNT(*) INTO v_col_count
  FROM information_schema.columns
  WHERE table_schema = 'btp' AND table_name = 'supplier_notifications';
  RAISE NOTICE 'Colonnes : %', v_col_count;

  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'btp' AND tablename = 'supplier_notifications';
  RAISE NOTICE 'Policies : %', v_policy_count;

  RAISE NOTICE '';
  RAISE NOTICE 'Fonctions RPC :';
  FOR v_rec IN
    SELECT p.proname, CASE WHEN p.prosecdef THEN 'DEFINER' ELSE 'INVOKER' END AS security
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'btp'
      AND p.proname IN ('generate_supplier_reset_token', 'verify_supplier_reset_token', 'use_supplier_reset_token')
    ORDER BY p.proname
  LOOP
    RAISE NOTICE '   • % [%]', v_rec.proname, v_rec.security;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;