-- =============================================================================
-- MIGRATION : 20250905154417_create_escalation_thresholds.sql
-- Date       : 2025-09-05
-- Objet      : Créer/compléter btp.escalation_thresholds + seed + RPC
--
-- SÉCURITÉ :
--   - Idempotente : CREATE IF NOT EXISTS + ON CONFLICT DO NOTHING
--   - RLS activé + FORCE
--   - Policies TO authenticated + is_current_user_admin()
--   - Fonction RPC : SECURITY DEFINER + SET search_path + REVOKE PUBLIC
--   - Paramètre préfixé p_ pour éviter collision
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 0 : S'ASSURER QUE btp.is_current_user_admin EXISTE
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'btp' AND p.proname = 'is_current_user_admin'
  ) THEN
    EXECUTE $fn$
      CREATE FUNCTION btp.is_current_user_admin()
      RETURNS BOOLEAN
      LANGUAGE SQL
      SECURITY DEFINER
      STABLE
      SET search_path = ''
      AS $body$
        SELECT EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid()
            AND role_name IN ('admin', 'director')
        );
      $body$;
    $fn$;

    REVOKE ALL ON FUNCTION btp.is_current_user_admin() FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION btp.is_current_user_admin() TO authenticated;
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 1 : TABLE btp.escalation_thresholds (IDEMPOTENTE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.escalation_thresholds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  threshold_type TEXT NOT NULL,
  threshold_name TEXT NOT NULL,
  threshold_value NUMERIC NOT NULL DEFAULT 0,
  threshold_unit TEXT NOT NULL DEFAULT 'percentage',
  severity_level TEXT NOT NULL DEFAULT 'low',
  escalation_level INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  UNIQUE(threshold_type, threshold_name)
);

ALTER TABLE btp.escalation_thresholds
  ADD COLUMN IF NOT EXISTS threshold_type TEXT,
  ADD COLUMN IF NOT EXISTS threshold_name TEXT,
  ADD COLUMN IF NOT EXISTS threshold_value NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS threshold_unit TEXT DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS severity_level TEXT DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS escalation_level INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS updated_by UUID;

DO $$ BEGIN RAISE NOTICE '✅ Table btp.escalation_thresholds créée/vérifiée'; END $$;

-- =============================================================================
-- ÉTAPE 2 : RLS + FORCE
-- =============================================================================

ALTER TABLE btp.escalation_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.escalation_thresholds FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- ÉTAPE 3 : NETTOYAGE DES POLICIES EXISTANTES (fix 42710)
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
BEGIN
  FOR v_rec IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'escalation_thresholds'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.escalation_thresholds',
      v_rec.policyname);
    RAISE NOTICE '  Policy supprimée : %', v_rec.policyname;
  END LOOP;
END $$;

-- =============================================================================
-- ÉTAPE 4 : POLICIES SÉCURISÉES
-- =============================================================================

CREATE POLICY "Admins can manage escalation thresholds"
ON btp.escalation_thresholds
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

CREATE POLICY "Authenticated can view escalation thresholds"
ON btp.escalation_thresholds
FOR SELECT
TO authenticated
USING (true);

COMMENT ON POLICY "Admins can manage escalation thresholds" ON btp.escalation_thresholds IS
  'Admin/director : gestion complète.';
COMMENT ON POLICY "Authenticated can view escalation thresholds" ON btp.escalation_thresholds IS
  'Tous les utilisateurs authentifiés peuvent lire les seuils.';

-- =============================================================================
-- ÉTAPE 5 : PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.escalation_thresholds TO authenticated;
GRANT SELECT ON btp.escalation_thresholds TO anon;
GRANT ALL ON btp.escalation_thresholds TO service_role;

-- =============================================================================
-- ÉTAPE 6 : INDEX
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_escalation_thresholds_type
  ON btp.escalation_thresholds(threshold_type);
CREATE INDEX IF NOT EXISTS idx_escalation_thresholds_active
  ON btp.escalation_thresholds(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_escalation_thresholds_severity
  ON btp.escalation_thresholds(severity_level);

DO $$ BEGIN RAISE NOTICE '✅ Index créés'; END $$;

-- =============================================================================
-- ÉTAPE 7 : SEED INITIAL (IDEMPOTENT)
-- =============================================================================
-- ON CONFLICT (threshold_type, threshold_name) DO NOTHING → réexécutable

INSERT INTO btp.escalation_thresholds (
  threshold_type, threshold_name, threshold_value, threshold_unit,
  severity_level, escalation_level, description
) VALUES
  -- Retard projet
  ('project_delay', 'warning',            10, 'percentage', 'medium',   1, 'Alerte Retard - Notification initiale'),
  ('project_delay', 'bank_notification',  20, 'percentage', 'high',     2, 'Notification Bancaire - Avis aux institutions financières'),
  ('project_delay', 'guarantee_trigger',  30, 'percentage', 'high',     3, 'Déclenchement Garantie - Activation des garanties bancaires'),
  ('project_delay', 'legal_escalation',   40, 'percentage', 'critical', 4, 'Escalade Juridique - Intervention de l''équipe juridique'),

  -- Expiration assurance
  ('insurance_expiry', 'early_warning', 30, 'days', 'low',      1, 'Pré-alerte expiration assurance'),
  ('insurance_expiry', 'warning',       15, 'days', 'medium',   1, 'Alerte expiration assurance'),
  ('insurance_expiry', 'urgent',         7, 'days', 'high',     2, 'Expiration imminente assurance'),
  ('insurance_expiry', 'critical',       0, 'days', 'critical', 3, 'Assurance expirée'),

  -- Validation paiement
  ('payment_validation', 'tolerance',           10, 'percentage', 'medium', 1, 'Tolérance de paiement au-dessus du progrès'),
  ('payment_validation', 'initial_payment_max', 30, 'percentage', 'medium', 1, 'Paiement initial maximum autorisé'),

  -- Inspection en retard
  ('inspection_overdue', 'warning',   3, 'days', 'medium',   1, 'Inspection en retard - avertissement'),
  ('inspection_overdue', 'escalation', 7, 'days', 'high',     2, 'Inspection en retard - escalade'),
  ('inspection_overdue', 'critical',  14, 'days', 'critical', 3, 'Inspection très en retard'),

  -- Gaspillage matériaux
  ('material_wastage', 'standard', 10, 'percentage', 'low', 1, 'Facteur de gaspillage matériau standard'),

  -- Allocation budgétaire
  ('budget_allocation', 'phase_default',       10, 'percentage', 'low', 1, 'Allocation budgétaire par défaut pour phase'),
  ('budget_allocation', 'procurement_default', 20, 'percentage', 'low', 1, 'Allocation budgétaire par défaut pour approvisionnement')
ON CONFLICT (threshold_type, threshold_name) DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ Seed escalation_thresholds appliqué (idempotent)'; END $$;

-- =============================================================================
-- ÉTAPE 8 : FONCTION TRIGGER public.update_timestamp() (sécurisée)
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

-- =============================================================================
-- ÉTAPE 9 : TRIGGER updated_at (IDEMPOTENT)
-- =============================================================================

DROP TRIGGER IF EXISTS update_escalation_thresholds_updated_at ON btp.escalation_thresholds;
CREATE TRIGGER update_escalation_thresholds_updated_at
  BEFORE UPDATE ON btp.escalation_thresholds
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DO $$ BEGIN RAISE NOTICE '✅ Trigger updated_at créé'; END $$;

-- =============================================================================
-- ÉTAPE 10 : FONCTION RPC get_escalation_thresholds (SÉCURISÉE)
-- =============================================================================
-- ✅ Paramètre préfixé p_threshold_type (évite collision avec colonne)
-- ✅ SECURITY DEFINER + SET search_path = ''
-- ✅ REVOKE PUBLIC + GRANT authenticated

DROP FUNCTION IF EXISTS btp.get_escalation_thresholds(text) CASCADE;

CREATE FUNCTION btp.get_escalation_thresholds(p_threshold_type text)
RETURNS TABLE(
  threshold_name text,
  threshold_value numeric,
  threshold_unit text,
  severity_level text,
  escalation_level integer,
  description text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    et.threshold_name,
    et.threshold_value,
    et.threshold_unit,
    et.severity_level,
    et.escalation_level,
    et.description
  FROM btp.escalation_thresholds et
  WHERE et.threshold_type = p_threshold_type
    AND et.is_active = true
  ORDER BY et.threshold_value ASC;
$$;

REVOKE ALL ON FUNCTION btp.get_escalation_thresholds(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION btp.get_escalation_thresholds(text) FROM anon;
GRANT EXECUTE ON FUNCTION btp.get_escalation_thresholds(text) TO authenticated;
GRANT EXECUTE ON FUNCTION btp.get_escalation_thresholds(text) TO service_role;

COMMENT ON FUNCTION btp.get_escalation_thresholds(text) IS
  'Retourne les seuils actifs pour un type donné. SECURITY DEFINER + search_path=''''.';

DO $$ BEGIN RAISE NOTICE '✅ Fonction btp.get_escalation_thresholds() créée et sécurisée'; END $$;

-- =============================================================================
-- ÉTAPE 11 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rls_enabled BOOLEAN;
  v_rls_forced BOOLEAN;
  v_policy_count INT;
  v_threshold_count INT;
  v_func_security TEXT;
  v_rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  VÉRIFICATION POST-MIGRATION';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  SELECT c.relrowsecurity, c.relforcerowsecurity
  INTO v_rls_enabled, v_rls_forced
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'btp' AND c.relname = 'escalation_thresholds';

  RAISE NOTICE 'RLS activé : %', v_rls_enabled;
  RAISE NOTICE 'RLS forcé  : %', v_rls_forced;

  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'btp' AND tablename = 'escalation_thresholds';
  RAISE NOTICE 'Policies : %', v_policy_count;

  SELECT COUNT(*) INTO v_threshold_count
  FROM btp.escalation_thresholds;
  RAISE NOTICE 'Thresholds : %', v_threshold_count;

  SELECT CASE WHEN prosecdef THEN 'DEFINER' ELSE 'INVOKER' END INTO v_func_security
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'btp' AND p.proname = 'get_escalation_thresholds';
  RAISE NOTICE 'Fonction get_escalation_thresholds : %', COALESCE(v_func_security, 'INTROUVABLE');

  RAISE NOTICE '';
  RAISE NOTICE 'Policies :';
  FOR v_rec IN
    SELECT policyname, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'escalation_thresholds'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '   • % [%] → %', v_rec.policyname, v_rec.cmd, v_rec.roles;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;