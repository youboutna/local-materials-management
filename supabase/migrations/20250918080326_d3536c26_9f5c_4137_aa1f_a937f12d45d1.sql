-- =============================================================================
-- MIGRATION: fix_tender_steps_workflow
-- Description: Ajoute les colonnes manquantes et corrige le type status
-- =============================================================================

-- 1. Ajouter les colonnes (si elles n'existent pas)
ALTER TABLE btp.tender_steps 
ADD COLUMN IF NOT EXISTS submission_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS review_deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approval_deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS actual_completion_date TIMESTAMPTZ;

-- 2. Créer le type ENUM avec toutes les valeurs
DO $$ 
BEGIN
    -- Créer le type s'il n'existe pas
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workflow_step_status') THEN
        CREATE TYPE workflow_step_status AS ENUM ('pending', 'in_progress', 'completed', 'approved', 'rejected', 'on_hold');
    ELSE
        -- Ajouter les valeurs manquantes
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'workflow_step_status'::regtype AND enumlabel = 'on_hold') THEN
            ALTER TYPE workflow_step_status ADD VALUE IF NOT EXISTS 'on_hold';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'workflow_step_status'::regtype AND enumlabel = 'approved') THEN
            ALTER TYPE workflow_step_status ADD VALUE IF NOT EXISTS 'approved';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'workflow_step_status'::regtype AND enumlabel = 'rejected') THEN
            ALTER TYPE workflow_step_status ADD VALUE IF NOT EXISTS 'rejected';
        END IF;
    END IF;
END $$;

-- 3. Ajouter une colonne temporaire pour la conversion
ALTER TABLE btp.tender_steps 
ADD COLUMN IF NOT EXISTS status_new workflow_step_status DEFAULT 'pending';

-- 4. Mettre à jour la colonne temporaire avec les valeurs existantes
UPDATE btp.tender_steps 
SET status_new = 
    CASE 
        WHEN status = 'pending' THEN 'pending'::workflow_step_status
        WHEN status = 'in_progress' THEN 'in_progress'::workflow_step_status
        WHEN status = 'completed' THEN 'completed'::workflow_step_status
        WHEN status = 'approved' THEN 'approved'::workflow_step_status
        WHEN status = 'rejected' THEN 'rejected'::workflow_step_status
        WHEN status = 'on_hold' THEN 'on_hold'::workflow_step_status
        ELSE 'pending'::workflow_step_status
    END;

-- 5. Supprimer l'ancienne colonne et renommer la nouvelle
ALTER TABLE btp.tender_steps DROP COLUMN status CASCADE;
ALTER TABLE btp.tender_steps RENAME COLUMN status_new TO status;

-- 6. Définir la valeur par défaut
ALTER TABLE btp.tender_steps ALTER COLUMN status SET DEFAULT 'pending';

-- 7. Index
CREATE INDEX IF NOT EXISTS idx_tender_steps_tender_id_status ON btp.tender_steps(tender_id, status);
CREATE INDEX IF NOT EXISTS idx_tender_steps_dates ON btp.tender_steps(due_date, submission_date);

-- 8. Fonction pour mettre à jour les dates
CREATE OR REPLACE FUNCTION update_tender_step_dates()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('completed', 'approved') AND OLD.status NOT IN ('completed', 'approved') THEN
        NEW.actual_completion_date = NOW();
    END IF;
    
    IF NEW.status NOT IN ('completed', 'approved') AND OLD.status IN ('completed', 'approved') THEN
        NEW.actual_completion_date = NULL;
    END IF;
    
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger
DROP TRIGGER IF EXISTS trigger_update_tender_step_dates ON btp.tender_steps;
CREATE TRIGGER trigger_update_tender_step_dates
    BEFORE UPDATE ON btp.tender_steps
    FOR EACH ROW
    EXECUTE FUNCTION update_tender_step_dates();

-- 10. Mettre à jour les valeurs NULL
UPDATE btp.tender_steps SET status = 'pending' WHERE status IS NULL;