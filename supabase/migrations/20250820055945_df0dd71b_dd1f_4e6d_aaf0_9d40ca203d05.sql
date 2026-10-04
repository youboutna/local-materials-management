-- =============================================================================
-- MIGRATION : 20250820055945_create_compliance_tables.sql
-- Date       : 2025-08-20
-- Objet      : Créer/compléter les tables de conformité :
--              - btp.insurance_certificates (attestations d'assurance)
--              - btp.bank_guarantees (garanties bancaires)
--              - btp.payment_blocks (blocages de paiement)
--
-- SÉCURITÉ :
--   - Idempotente : CREATE TABLE IF NOT EXISTS + DROP POLICY IF EXISTS
--   - RLS activé + FORCE
--   - Policies TO authenticated + is_current_user_admin() pour writes
--   - Pas de CHECK sur nomenclatures (validation côté référentiels)
--   - Triggers updated_at via public.update_timestamp()
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 1 : TABLE btp.insurance_certificates (IDEMPOTENTE)
-- =============================================================================
-- ⚠️ Pas de CHECK sur coverage_type ni status : validation côté référentiels
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.insurance_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  contractor_id UUID NOT NULL,
  contractor_name TEXT NOT NULL,
  insurance_company TEXT NOT NULL,
  policy_number TEXT NOT NULL,
  coverage_amount NUMERIC NOT NULL DEFAULT 0,
  coverage_type TEXT NOT NULL,  -- pas de CHECK
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
  certificate_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',  -- pas de CHECK
  last_verified TIMESTAMPTZ,
  verified_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE btp.insurance_certificates
  ADD COLUMN IF NOT EXISTS project_id UUID,
  ADD COLUMN IF NOT EXISTS contractor_id UUID,
  ADD COLUMN IF NOT EXISTS contractor_name TEXT,
  ADD COLUMN IF NOT EXISTS insurance_company TEXT,
  ADD COLUMN IF NOT EXISTS policy_number TEXT,
  ADD COLUMN IF NOT EXISTS coverage_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coverage_type TEXT,
  ADD COLUMN IF NOT EXISTS valid_from DATE,
  ADD COLUMN IF NOT EXISTS valid_until DATE,
  ADD COLUMN IF NOT EXISTS certificate_url TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS last_verified TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$ BEGIN RAISE NOTICE '✅ Table btp.insurance_certificates créée/vérifiée'; END $$;

-- =============================================================================
-- ÉTAPE 2 : TABLE btp.bank_guarantees (IDEMPOTENTE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.bank_guarantees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  contractor_id UUID NOT NULL,
  bank_name TEXT NOT NULL,
  guarantee_amount NUMERIC NOT NULL DEFAULT 0,
  guarantee_type TEXT NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE btp.bank_guarantees
  ADD COLUMN IF NOT EXISTS project_id UUID,
  ADD COLUMN IF NOT EXISTS contractor_id UUID,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS guarantee_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS guarantee_type TEXT,
  ADD COLUMN IF NOT EXISTS issue_date DATE,
  ADD COLUMN IF NOT EXISTS expiry_date DATE,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$ BEGIN RAISE NOTICE '✅ Table btp.bank_guarantees créée/vérifiée'; END $$;

-- =============================================================================
-- ÉTAPE 3 : TABLE btp.payment_blocks (IDEMPOTENTE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.payment_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  contractor_id UUID NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  blocking_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  blocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  blocked_by UUID,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE btp.payment_blocks
  ADD COLUMN IF NOT EXISTS project_id UUID,
  ADD COLUMN IF NOT EXISTS contractor_id UUID,
  ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS blocking_reasons JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS blocked_by UUID,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolved_by UUID,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$ BEGIN RAISE NOTICE '✅ Table btp.payment_blocks créée/vérifiée'; END $$;

-- =============================================================================
-- ÉTAPE 4 : RLS
-- =============================================================================

ALTER TABLE btp.insurance_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.insurance_certificates FORCE ROW LEVEL SECURITY;

ALTER TABLE btp.bank_guarantees ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.bank_guarantees FORCE ROW LEVEL SECURITY;

ALTER TABLE btp.payment_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.payment_blocks FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- ÉTAPE 5 : NETTOYAGE DES POLICIES EXISTANTES (fix 42710)
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
BEGIN
  FOR v_rec IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'btp'
      AND tablename IN ('insurance_certificates', 'bank_guarantees', 'payment_blocks')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.%I',
      v_rec.policyname, v_rec.tablename);
    RAISE NOTICE '  Policy supprimée : %.%', v_rec.tablename, v_rec.policyname;
  END LOOP;
END $$;

-- =============================================================================
-- ÉTAPE 6 : POLICIES SÉCURISÉES
-- =============================================================================

-- 6.1 : btp.insurance_certificates
CREATE POLICY "Admins can manage insurance certificates"
ON btp.insurance_certificates
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

CREATE POLICY "Authenticated can view insurance certificates"
ON btp.insurance_certificates
FOR SELECT
TO authenticated
USING (true);

COMMENT ON POLICY "Admins can manage insurance certificates" ON btp.insurance_certificates IS
  'Admin/director : gestion complète.';
COMMENT ON POLICY "Authenticated can view insurance certificates" ON btp.insurance_certificates IS
  'Utilisateurs authentifiés : lecture.';

-- 6.2 : btp.bank_guarantees
CREATE POLICY "Admins can manage bank guarantees"
ON btp.bank_guarantees
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

CREATE POLICY "Authenticated can view bank guarantees"
ON btp.bank_guarantees
FOR SELECT
TO authenticated
USING (true);

COMMENT ON POLICY "Admins can manage bank guarantees" ON btp.bank_guarantees IS
  'Admin/director : gestion complète.';
COMMENT ON POLICY "Authenticated can view bank guarantees" ON btp.bank_guarantees IS
  'Utilisateurs authentifiés : lecture.';

-- 6.3 : btp.payment_blocks
CREATE POLICY "Admins can manage payment blocks"
ON btp.payment_blocks
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

CREATE POLICY "Authenticated can view payment blocks"
ON btp.payment_blocks
FOR SELECT
TO authenticated
USING (true);

COMMENT ON POLICY "Admins can manage payment blocks" ON btp.payment_blocks IS
  'Admin/director : gestion complète.';
COMMENT ON POLICY "Authenticated can view payment blocks" ON btp.payment_blocks IS
  'Utilisateurs authentifiés : lecture.';

-- =============================================================================
-- ÉTAPE 7 : PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.insurance_certificates TO authenticated;
GRANT SELECT ON btp.insurance_certificates TO anon;
GRANT ALL ON btp.insurance_certificates TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.bank_guarantees TO authenticated;
GRANT SELECT ON btp.bank_guarantees TO anon;
GRANT ALL ON btp.bank_guarantees TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.payment_blocks TO authenticated;
GRANT SELECT ON btp.payment_blocks TO anon;
GRANT ALL ON btp.payment_blocks TO service_role;

-- =============================================================================
-- ÉTAPE 8 : INDEX (IDEMPOTENTS)
-- =============================================================================

-- insurance_certificates
CREATE INDEX IF NOT EXISTS idx_insurance_certificates_project_id
  ON btp.insurance_certificates(project_id);
CREATE INDEX IF NOT EXISTS idx_insurance_certificates_contractor_id
  ON btp.insurance_certificates(contractor_id);
CREATE INDEX IF NOT EXISTS idx_insurance_certificates_status
  ON btp.insurance_certificates(status);
CREATE INDEX IF NOT EXISTS idx_insurance_certificates_valid_until
  ON btp.insurance_certificates(valid_until);

-- bank_guarantees
CREATE INDEX IF NOT EXISTS idx_bank_guarantees_project_id
  ON btp.bank_guarantees(project_id);
CREATE INDEX IF NOT EXISTS idx_bank_guarantees_contractor_id
  ON btp.bank_guarantees(contractor_id);
CREATE INDEX IF NOT EXISTS idx_bank_guarantees_status
  ON btp.bank_guarantees(status);
CREATE INDEX IF NOT EXISTS idx_bank_guarantees_expiry_date
  ON btp.bank_guarantees(expiry_date);

-- payment_blocks
CREATE INDEX IF NOT EXISTS idx_payment_blocks_project_id
  ON btp.payment_blocks(project_id);
CREATE INDEX IF NOT EXISTS idx_payment_blocks_contractor_id
  ON btp.payment_blocks(contractor_id);
CREATE INDEX IF NOT EXISTS idx_payment_blocks_blocked_at
  ON btp.payment_blocks(blocked_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_blocks_resolved_at
  ON btp.payment_blocks(resolved_at) WHERE resolved_at IS NOT NULL;

DO $$ BEGIN RAISE NOTICE '✅ Index créés'; END $$;

-- =============================================================================
-- ÉTAPE 9 : TRIGGERS updated_at (IDEMPOTENTS)
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
    RAISE NOTICE '  Fonction public.update_timestamp() créée';
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_insurance_certificates_updated_at ON btp.insurance_certificates;
CREATE TRIGGER update_insurance_certificates_updated_at
  BEFORE UPDATE ON btp.insurance_certificates
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS update_bank_guarantees_updated_at ON btp.bank_guarantees;
CREATE TRIGGER update_bank_guarantees_updated_at
  BEFORE UPDATE ON btp.bank_guarantees
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS update_payment_blocks_updated_at ON btp.payment_blocks;
CREATE TRIGGER update_payment_blocks_updated_at
  BEFORE UPDATE ON btp.payment_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DO $$ BEGIN RAISE NOTICE '✅ Triggers updated_at créés'; END $$;

-- =============================================================================
-- ÉTAPE 10 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rls_enabled BOOLEAN;
  v_rls_forced BOOLEAN;
  v_policy_count INT;
  v_rec RECORD;
  v_tables TEXT[] := ARRAY['insurance_certificates', 'bank_guarantees', 'payment_blocks'];
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

  RAISE NOTICE '';
  RAISE NOTICE 'Détail des policies :';
  FOR v_rec IN
    SELECT tablename, policyname, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'btp'
      AND tablename IN ('insurance_certificates', 'bank_guarantees', 'payment_blocks')
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