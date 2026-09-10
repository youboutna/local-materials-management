-- ============================================================
-- Migration: Add step_id and observations to inspections
-- Version: 20240815_add_inspection_fields
-- Description: Ajout des champs step_id et observations à la table inspections
-- ============================================================

-- ============================================================
-- 1. Ajout des colonnes
-- ============================================================

-- Ajout de la colonne step_id (lien vers les étapes de construction)
ALTER TABLE btp.inspections
  ADD COLUMN IF NOT EXISTS step_id UUID;

-- Ajout de la colonne observations (stockage JSON des observations)
ALTER TABLE btp.inspections
  ADD COLUMN IF NOT EXISTS observations JSONB NOT NULL DEFAULT '[]'::JSONB;

-- Ajout de la colonne observation_notes (texte libre pour les notes)
ALTER TABLE btp.inspections
  ADD COLUMN IF NOT EXISTS observation_notes TEXT;

-- Ajout de la colonne verified_by (qui a vérifié l'inspection)
ALTER TABLE btp.inspections
  ADD COLUMN IF NOT EXISTS verified_by UUID;

-- Ajout de la colonne verified_at (date de vérification)
ALTER TABLE btp.inspections
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- ============================================================
-- 2. Création des index
-- ============================================================

-- Index sur step_id pour les recherches par étape
CREATE INDEX IF NOT EXISTS idx_btp_inspections_step_id 
  ON btp.inspections(step_id);

-- Index composite pour les recherches par projet + étape
CREATE INDEX IF NOT EXISTS idx_btp_inspections_project_step 
  ON btp.inspections(project_id, step_id);

-- Index sur verified_by
CREATE INDEX IF NOT EXISTS idx_btp_inspections_verified_by 
  ON btp.inspections(verified_by);

-- Index sur verified_at pour les tris par date de vérification
CREATE INDEX IF NOT EXISTS idx_btp_inspections_verified_at 
  ON btp.inspections(verified_at DESC);

-- Index GIN pour les recherches dans observations (JSONB)
CREATE INDEX IF NOT EXISTS idx_btp_inspections_observations 
  ON btp.inspections USING GIN (observations);

-- ============================================================
-- 3. Ajout des commentaires
-- ============================================================

COMMENT ON COLUMN btp.inspections.step_id IS 'Référence à l''étape de construction (phase_step)';
COMMENT ON COLUMN btp.inspections.observations IS 'Observations de l''inspection (format JSON)';
COMMENT ON COLUMN btp.inspections.observation_notes IS 'Notes textuelles sur les observations';
COMMENT ON COLUMN btp.inspections.verified_by IS 'Utilisateur qui a vérifié l''inspection';
COMMENT ON COLUMN btp.inspections.verified_at IS 'Date de vérification de l''inspection';

-- ============================================================
-- 4. Ajout des contraintes (optionnelles)
-- ============================================================

-- Contrainte de clé étrangère vers step_id (si la table phase_steps existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'btp' AND table_name = 'phase_steps'
  ) THEN
    ALTER TABLE btp.inspections
      ADD CONSTRAINT fk_inspections_step_id
      FOREIGN KEY (step_id) REFERENCES btp.phase_steps(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Contrainte de clé étrangère vers auth.users pour verified_by
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) THEN
    ALTER TABLE btp.inspections
      ADD CONSTRAINT fk_inspections_verified_by
      FOREIGN KEY (verified_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- 5. Vérification de la migration
-- ============================================================

DO $$
DECLARE
  col_exists BOOLEAN;
BEGIN
  -- Vérifier que la colonne step_id existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'btp' 
    AND table_name = 'inspections' 
    AND column_name = 'step_id'
  ) INTO col_exists;
  
  IF col_exists THEN
    RAISE NOTICE '✅ Colonne step_id ajoutée avec succès';
  ELSE
    RAISE NOTICE '❌ Erreur: Colonne step_id non trouvée';
  END IF;

  -- Vérifier que la colonne observations existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'btp' 
    AND table_name = 'inspections' 
    AND column_name = 'observations'
  ) INTO col_exists;
  
  IF col_exists THEN
    RAISE NOTICE '✅ Colonne observations ajoutée avec succès';
  ELSE
    RAISE NOTICE '❌ Erreur: Colonne observations non trouvée';
  END IF;
END $$;

-- ============================================================
-- 6. Rollback (optionnel)
-- ============================================================

-- Pour annuler cette migration:
-- ALTER TABLE btp.inspections DROP COLUMN IF EXISTS step_id;
-- ALTER TABLE btp.inspections DROP COLUMN IF EXISTS observations;
-- ALTER TABLE btp.inspections DROP COLUMN IF EXISTS observation_notes;
-- ALTER TABLE btp.inspections DROP COLUMN IF EXISTS verified_by;
-- ALTER TABLE btp.inspections DROP COLUMN IF EXISTS verified_at;
-- DROP INDEX IF EXISTS btp.idx_btp_inspections_step_id;
-- DROP INDEX IF EXISTS btp.idx_btp_inspections_project_step;
-- DROP INDEX IF EXISTS btp.idx_btp_inspections_verified_by;
-- DROP INDEX IF EXISTS btp.idx_btp_inspections_verified_at;
-- DROP INDEX IF EXISTS btp.idx_btp_inspections_observations;