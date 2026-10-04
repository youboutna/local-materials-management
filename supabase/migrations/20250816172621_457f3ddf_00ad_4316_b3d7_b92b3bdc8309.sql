-- =============================================================================
-- MIGRATION : 20250816172621_add_material_identifiers_and_documents.sql
-- Date       : 2025-08-16
-- Objet      : Ajouter identifiants matériaux + table btp.material_documents
--              + RLS + trigger + index
--
-- SÉCURITÉ :
--   - Idempotente : ADD COLUMN IF NOT EXISTS + DROP POLICY/TRIGGER IF EXISTS
--   - RLS activé + FORCE
--   - Policies TO authenticated + is_current_user_admin() pour writes
--   - Pas de CHECK sur document_type (validation côté référentiels)
--   - Trigger via public.update_timestamp()
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 1 : COLONNES SUR btp.materials (IDEMPOTENT)
-- =============================================================================

ALTER TABLE btp.materials ADD COLUMN IF NOT EXISTS gtin VARCHAR(14) NULL;
ALTER TABLE btp.materials ADD COLUMN IF NOT EXISTS sku VARCHAR(100) NULL;
ALTER TABLE btp.materials ADD COLUMN IF NOT EXISTS ean VARCHAR(13) NULL;
ALTER TABLE btp.materials ADD COLUMN IF NOT EXISTS asin VARCHAR(10) NULL;
ALTER TABLE btp.materials ADD COLUMN IF NOT EXISTS multilang_labels JSONB NULL DEFAULT '{}'::JSONB;

DO $$
BEGIN
  RAISE NOTICE '✅ Colonnes identifiants ajoutées à btp.materials';
END $$;

-- =============================================================================
-- ÉTAPE 2 : TABLE btp.material_documents (IDEMPOTENTE)
-- =============================================================================
-- ⚠️ Pas de CHECK sur document_type : la validation est côté référentiels.
--    Sinon chaque nouveau type nécessite une migration DB.

CREATE TABLE IF NOT EXISTS btp.material_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES btp.materials(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,  -- pas de CHECK : validation côté app
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_name VARCHAR(255),
  file_url TEXT,
  file_size INTEGER,
  mime_type VARCHAR(100),
  document_number VARCHAR(100),
  document_date DATE,
  expiry_date DATE,
  supplier_name VARCHAR(255),
  metadata JSONB DEFAULT '{}'::JSONB,
  tags TEXT[],
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compléter les colonnes manquantes (si la table existait déjà)
ALTER TABLE btp.material_documents
  ADD COLUMN IF NOT EXISTS material_id UUID,
  ADD COLUMN IF NOT EXISTS document_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS file_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS file_size INTEGER,
  ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS document_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS document_date DATE,
  ADD COLUMN IF NOT EXISTS expiry_date DATE,
  ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS uploaded_by UUID,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
  RAISE NOTICE '✅ Table btp.material_documents créée/vérifiée';
END $$;

-- =============================================================================
-- ÉTAPE 3 : INDEX (IDEMPOTENTS) — nom de colonne SIMPLE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_materials_gtin
  ON btp.materials(gtin) WHERE gtin IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_materials_sku
  ON btp.materials(sku) WHERE sku IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_materials_ean
  ON btp.materials(ean) WHERE ean IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_materials_asin
  ON btp.materials(asin) WHERE asin IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_material_documents_material_id
  ON btp.material_documents(material_id);

CREATE INDEX IF NOT EXISTS idx_material_documents_type
  ON btp.material_documents(document_type);

CREATE INDEX IF NOT EXISTS idx_material_documents_date
  ON btp.material_documents(document_date);

CREATE INDEX IF NOT EXISTS idx_material_documents_uploaded_by
  ON btp.material_documents(uploaded_by);

DO $$
BEGIN
  RAISE NOTICE '✅ Index créés';
END $$;

-- =============================================================================
-- ÉTAPE 4 : RLS
-- =============================================================================

ALTER TABLE btp.material_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.material_documents FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- ÉTAPE 5 : NETTOYAGE DES POLICIES EXISTANTES (fix 42710)
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
BEGIN
  FOR v_rec IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'material_documents'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.material_documents', v_rec.policyname);
    RAISE NOTICE '  Policy supprimée : %', v_rec.policyname;
  END LOOP;
END $$;

-- =============================================================================
-- ÉTAPE 6 : POLICIES SÉCURISÉES
-- =============================================================================

-- 6.1 : Admins : gestion complète
CREATE POLICY "Admins can manage material documents"
ON btp.material_documents
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

-- 6.2 : Utilisateurs authentifiés : lecture seule
CREATE POLICY "Authenticated can view material documents"
ON btp.material_documents
FOR SELECT
TO authenticated
USING (true);

-- 6.3 : Uploader peut modifier ses propres documents
CREATE POLICY "Uploaders can update their own documents"
ON btp.material_documents
FOR UPDATE
TO authenticated
USING (uploaded_by = auth.uid())
WITH CHECK (uploaded_by = auth.uid());

COMMENT ON POLICY "Admins can manage material documents" ON btp.material_documents IS
  'Admin/director : gestion complète.';
COMMENT ON POLICY "Authenticated can view material documents" ON btp.material_documents IS
  'Tous les utilisateurs authentifiés : lecture.';
COMMENT ON POLICY "Uploaders can update their own documents" ON btp.material_documents IS
  'Un utilisateur peut modifier ses propres documents.';

-- =============================================================================
-- ÉTAPE 7 : PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.material_documents TO authenticated;
GRANT SELECT ON btp.material_documents TO anon;
GRANT ALL ON btp.material_documents TO service_role;

-- =============================================================================
-- ÉTAPE 8 : TRIGGER updated_at (IDEMPOTENT)
-- =============================================================================

-- Vérifier/créer public.update_timestamp()
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

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS update_material_documents_updated_at ON btp.material_documents;

-- Créer le trigger
CREATE TRIGGER update_material_documents_updated_at
  BEFORE UPDATE ON btp.material_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

DO $$
BEGIN
  RAISE NOTICE '✅ Trigger update_material_documents_updated_at créé';
END $$;

-- =============================================================================
-- ÉTAPE 9 : COMMENTAIRES
-- =============================================================================

COMMENT ON TABLE btp.material_documents IS
  'Documents attachés aux matériaux (factures, bons de livraison, garanties, certificats). '
  'RLS activé + FORCE. Type de document validé côté référentiels.';

COMMENT ON COLUMN btp.material_documents.document_type IS
  'Type de document — validation côté référentiels (pas de CHECK DB)';

-- =============================================================================
-- ÉTAPE 10 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rls_enabled BOOLEAN;
  v_rls_forced BOOLEAN;
  v_policy_count INT;
  v_trigger_exists BOOLEAN;
  v_rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  VÉRIFICATION POST-MIGRATION — btp.material_documents';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  -- RLS via pg_class
  SELECT c.relrowsecurity, c.relforcerowsecurity
  INTO v_rls_enabled, v_rls_forced
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'btp' AND c.relname = 'material_documents';

  RAISE NOTICE 'RLS activé : %', v_rls_enabled;
  RAISE NOTICE 'RLS forcé  : %', v_rls_forced;

  -- Trigger
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE event_object_schema = 'btp'
      AND event_object_table = 'material_documents'
      AND trigger_name = 'update_material_documents_updated_at'
  ) INTO v_trigger_exists;

  RAISE NOTICE 'Trigger existe : %', v_trigger_exists;

  -- Policies
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'btp' AND tablename = 'material_documents';

  RAISE NOTICE '';
  RAISE NOTICE 'Policies : %', v_policy_count;
  FOR v_rec IN
    SELECT policyname, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'material_documents'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '   • % [%] → %', v_rec.policyname, v_rec.cmd, v_rec.roles;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;