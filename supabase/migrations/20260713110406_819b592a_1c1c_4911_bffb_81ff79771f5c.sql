-- =============================================================================
-- MIGRATION: boq_alignment_phase_2
-- Description: Ajout des colonnes source_type/btp_code et migration vers boq_lines
-- =============================================================================

-- ============================================================
-- ÉTAPE 1 : AJOUT DES COLONNES MANQUANTES
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='btp' AND table_name='quantity_takeoffs') THEN
    ALTER TABLE btp.quantity_takeoffs
      ADD COLUMN IF NOT EXISTS source_type text,
      ADD COLUMN IF NOT EXISTS btp_code text;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='btp' AND table_name='tender_estimate_items') THEN
    ALTER TABLE btp.tender_estimate_items
      ADD COLUMN IF NOT EXISTS source_type text,
      ADD COLUMN IF NOT EXISTS btp_code text;
  END IF;
END$$;

-- ============================================================
-- ÉTAPE 2 : AJOUT DES COLONNES CRUCIALES POUR LA MIGRATION (CORRECTION)
-- ============================================================
-- Le bloc de migration ci-dessous a besoin de ces colonnes.

ALTER TABLE btp.tender_estimate_items
  ADD COLUMN IF NOT EXISTS item_code text,
  ADD COLUMN IF NOT EXISTS item_type text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS unit text,
  ADD COLUMN IF NOT EXISTS quantity numeric,
  ADD COLUMN IF NOT EXISTS unit_price numeric,
  ADD COLUMN IF NOT EXISTS material_id uuid,
  ADD COLUMN IF NOT EXISTS resource_kind text,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS submitted_by uuid,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Index sur btp_code
CREATE INDEX IF NOT EXISTS idx_public_tender_estimate_items_btp_code
  ON btp.tender_estimate_items(btp_code) WHERE btp_code IS NOT NULL;

-- ============================================================
-- ÉTAPE 3 : MIGRATION DES DONNÉES VERS boq_lines
-- ============================================================
-- Ce bloc est désormais sécurisé car toutes les colonnes existent.

DO $mig$
DECLARE
  ph_type text; ms_type text; tk_type text;
BEGIN
  -- Vérifier le type des colonnes ID pour adapter la migration
  SELECT data_type INTO ph_type FROM information_schema.columns
    WHERE table_schema='btp' AND table_name='tender_estimate_items' AND column_name='phase_id';
  SELECT data_type INTO ms_type FROM information_schema.columns
    WHERE table_schema='btp' AND table_name='tender_estimate_items' AND column_name='milestone_id';
  SELECT data_type INTO tk_type FROM information_schema.columns
    WHERE table_schema='btp' AND table_name='tender_estimate_items' AND column_name='task_id';

  IF ph_type = 'uuid' THEN
    INSERT INTO btp.boq_lines (
      id, estimate_id, tender_id, phase_id, milestone_id, task_id,
      resource_id, resource_kind,
      line_type, source_type, designation, element_type, btp_code, unit,
      quantity, unit_price_ht, sender_id, created_at, updated_at
    )
    SELECT 
      tei.id, tei.estimate_id, te.tender_id,
      tei.phase_id, tei.milestone_id, tei.task_id,
      tei.material_id, tei.resource_kind,
      CASE WHEN tei.source='supplier_bid' THEN 'supplier_bid' ELSE 'estimate' END,
      COALESCE(tei.source_type,'import'),
      COALESCE(NULLIF(tei.description,''), NULLIF(tei.item_code,''), 'Ligne'),
      tei.item_type, tei.btp_code, tei.unit,
      COALESCE(tei.quantity,0), tei.unit_price, tei.submitted_by,
      tei.created_at, tei.updated_at
    FROM btp.tender_estimate_items tei
    LEFT JOIN btp.tender_estimates te ON te.id = tei.estimate_id
    WHERE NOT EXISTS (SELECT 1 FROM btp.boq_lines b WHERE b.id = tei.id);
  ELSE
    INSERT INTO btp.boq_lines (
      id, estimate_id, tender_id, phase_code, milestone_code, task_code,
      resource_id, resource_kind,
      line_type, source_type, designation, element_type, btp_code, unit,
      quantity, unit_price_ht, sender_id, created_at, updated_at
    )
    SELECT 
      tei.id, tei.estimate_id, te.tender_id,
      tei.phase_id::text, tei.milestone_id::text, tei.task_id::text,
      tei.material_id, tei.resource_kind,
      CASE WHEN tei.source='supplier_bid' THEN 'supplier_bid' ELSE 'estimate' END,
      COALESCE(tei.source_type,'import'),
      COALESCE(NULLIF(tei.description,''), NULLIF(tei.item_code,''), 'Ligne'),
      tei.item_type, tei.btp_code, tei.unit,
      COALESCE(tei.quantity,0), tei.unit_price, tei.submitted_by,
      tei.created_at, tei.updated_at
    FROM btp.tender_estimate_items tei
    LEFT JOIN btp.tender_estimates te ON te.id = tei.estimate_id
    WHERE NOT EXISTS (SELECT 1 FROM btp.boq_lines b WHERE b.id = tei.id);
  END IF;
END $mig$;

-- ============================================================
-- ÉTAPE 4 : FINALISATION (Notifications et RLS existent déjà)
-- ============================================================
NOTIFY pgrst, 'reload schema';