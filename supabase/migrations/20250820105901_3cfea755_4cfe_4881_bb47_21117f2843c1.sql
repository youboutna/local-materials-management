-- =============================================================================
-- MIGRATION : 20250820105901_create_supplier_payment_requests.sql
-- Date       : 2025-08-20
-- Objet      : Créer/compléter btp.supplier_payment_requests
--              + RLS + triggers + index
--
-- SÉCURITÉ :
--   - Idempotente : CREATE TABLE IF NOT EXISTS + DROP POLICY/TRIGGER IF EXISTS
--   - RLS activé + FORCE
--   - Policies TO authenticated + is_current_user_admin() pour writes
--   - Pas de CHECK sur nomenclatures (validation côté référentiels)
--   - Trigger via public.update_timestamp() (SECURITY DEFINER)
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 1 : TABLE btp.supplier_payment_requests (IDEMPOTENTE)
-- =============================================================================
-- ⚠️ Pas de CHECK sur status : validation côté référentiels
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.supplier_payment_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL,
  project_id UUID NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  payment_reason TEXT NOT NULL DEFAULT '',
  supporting_documents TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',  -- pas de CHECK
  requested_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  approved_by UUID NULL,
  approved_at TIMESTAMPTZ NULL,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Compléter les colonnes manquantes
ALTER TABLE btp.supplier_payment_requests
  ADD COLUMN IF NOT EXISTS supplier_id UUID,
  ADD COLUMN IF NOT EXISTS project_id UUID,
  ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS payment_reason TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS supporting_documents TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS requested_date TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS approved_by UUID,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$ BEGIN RAISE NOTICE '✅ Table btp.supplier_payment_requests créée/vérifiée'; END $$;

-- =============================================================================
-- ÉTAPE 2 : RLS
-- =============================================================================

ALTER TABLE btp.supplier_payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.supplier_payment_requests FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- ÉTAPE 3 : NETTOYAGE DES POLICIES EXISTANTES (fix 42710)
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
BEGIN
  FOR v_rec IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'supplier_payment_requests'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.supplier_payment_requests',
      v_rec.policyname);
    RAISE NOTICE '  Policy supprimée : %', v_rec.policyname;
  END LOOP;
END $$;

-- =============================================================================
-- ÉTAPE 4 : POLICIES SÉCURISÉES
-- =============================================================================

-- 4.1 : Admins/managers : gestion complète
CREATE POLICY "Admins can manage supplier payment requests"
ON btp.supplier_payment_requests
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

-- 4.2 : Fournisseurs : voir leurs propres demandes
-- ⚠️ Suppose que btp.suppliers.user_id existe.
--    Si absent, remplacer par une vérification via email ou autre.
CREATE POLICY "Suppliers can view their own payment requests"
ON btp.supplier_payment_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM btp.suppliers s
    WHERE s.id = supplier_payment_requests.supplier_id
      AND s.user_id = auth.uid()
  )
);

-- 4.3 : Fournisseurs : créer leurs propres demandes
CREATE POLICY "Suppliers can create their own payment requests"
ON btp.supplier_payment_requests
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM btp.suppliers s
    WHERE s.id = supplier_payment_requests.supplier_id
      AND s.user_id = auth.uid()
  )
);

-- 4.4 : Fournisseurs : modifier leurs propres demandes en attente
CREATE POLICY "Suppliers can update their pending requests"
ON btp.supplier_payment_requests
FOR UPDATE
TO authenticated
USING (
  status = 'pending'
  AND EXISTS (
    SELECT 1 FROM btp.suppliers s
    WHERE s.id = supplier_payment_requests.supplier_id
      AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  status = 'pending'
  AND EXISTS (
    SELECT 1 FROM btp.suppliers s
    WHERE s.id = supplier_payment_requests.supplier_id
      AND s.user_id = auth.uid()
  )
);

COMMENT ON POLICY "Admins can manage supplier payment requests" ON btp.supplier_payment_requests IS
  'Admin/director : gestion complète.';
COMMENT ON POLICY "Suppliers can view their own payment requests" ON btp.supplier_payment_requests IS
  'Un fournisseur voit ses propres demandes de paiement.';
COMMENT ON POLICY "Suppliers can create their own payment requests" ON btp.supplier_payment_requests IS
  'Un fournisseur crée une demande pour lui-même.';
COMMENT ON POLICY "Suppliers can update their pending requests" ON btp.supplier_payment_requests IS
  'Un fournisseur modifie ses demandes encore en attente.';

-- =============================================================================
-- ÉTAPE 5 : PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.supplier_payment_requests TO authenticated;
GRANT SELECT ON btp.supplier_payment_requests TO anon;
GRANT ALL ON btp.supplier_payment_requests TO service_role;

-- =============================================================================
-- ÉTAPE 6 : INDEX (IDEMPOTENTS)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_supplier_payment_requests_supplier_id
  ON btp.supplier_payment_requests(supplier_id);

CREATE INDEX IF NOT EXISTS idx_supplier_payment_requests_project_id
  ON btp.supplier_payment_requests(project_id) WHERE project_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_supplier_payment_requests_status
  ON btp.supplier_payment_requests(status);

CREATE INDEX IF NOT EXISTS idx_supplier_payment_requests_requested_date
  ON btp.supplier_payment_requests(requested_date DESC);

CREATE INDEX IF NOT EXISTS idx_supplier_payment_requests_approved_by
  ON btp.supplier_payment_requests(approved_by) WHERE approved_by IS NOT NULL;

DO $$ BEGIN RAISE NOTICE '✅ Index créés'; END $$;

-- =============================================================================
-- ÉTAPE 7 : TRIGGERS updated_at (IDEMPOTENTS)
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

DROP TRIGGER IF EXISTS update_supplier_payment_requests_updated_at ON btp.supplier_payment_requests;
CREATE TRIGGER update_supplier_payment_requests_updated_at
  BEFORE UPDATE ON btp.supplier_payment_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DO $$ BEGIN RAISE NOTICE '✅ Trigger updated_at créé'; END $$;

-- =============================================================================
-- ÉTAPE 8 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rls_enabled BOOLEAN;
  v_rls_forced BOOLEAN;
  v_policy_count INT;
  v_has_supplier_user_id BOOLEAN;
  v_rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  VÉRIFICATION POST-MIGRATION';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  -- RLS
  SELECT c.relrowsecurity, c.relforcerowsecurity
  INTO v_rls_enabled, v_rls_forced
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'btp' AND c.relname = 'supplier_payment_requests';

  RAISE NOTICE 'RLS activé : %', v_rls_enabled;
  RAISE NOTICE 'RLS forcé  : %', v_rls_forced;

  -- Vérifier que btp.suppliers.user_id existe (pré-requis des policies)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'btp' AND table_name = 'suppliers'
      AND column_name = 'user_id'
  ) INTO v_has_supplier_user_id;

  RAISE NOTICE '';
  IF v_has_supplier_user_id THEN
    RAISE NOTICE '✅ btp.suppliers.user_id existe → policies fournisseurs OK';
  ELSE
    RAISE WARNING '⚠️  btp.suppliers.user_id N''EXISTE PAS → policies fournisseurs échoueront !';
    RAISE WARNING '   Ajouter la colonne ou adapter les policies.';
  END IF;

  -- Policies
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'btp' AND tablename = 'supplier_payment_requests';

  RAISE NOTICE '';
  RAISE NOTICE 'Policies : %', v_policy_count;
  FOR v_rec IN
    SELECT policyname, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'supplier_payment_requests'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '   • % [%] → %', v_rec.policyname, v_rec.cmd, v_rec.roles;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;