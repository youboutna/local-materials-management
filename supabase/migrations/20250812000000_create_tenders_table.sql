-- =============================================================================
-- MIGRATION: create_tenders_table
-- Description: Crée la table btp.tenders pour la gestion des appels d'offres
-- =============================================================================

-- 1. Créer la table tenders dans le schéma btp
CREATE TABLE IF NOT EXISTS btp.tenders (
    id UUID DEFAULT gen_random_uuid(),
    project_id UUID,
    title TEXT,
    description TEXT,
    status TEXT DEFAULT 'draft',
    tender_category TEXT,
    market_type TEXT,
    procurement_type TEXT,
    selection_mode TEXT,
    financing_source TEXT,
    tender_number INTEGER,
    project_reference TEXT,
    
    -- Dates
    launch_date TIMESTAMPTZ,
    publication_date DATE,
    deadline_date DATE,
    submission_deadline DATE,
    evaluation_deadline DATE,
    attribution_date DATE,
    
    -- Budget
    estimated_value NUMERIC,
    budget_min NUMERIC,
    budget_max NUMERIC,
    contract_duration INTEGER,
    
    -- Critères
    evaluation_criteria JSONB DEFAULT '{}',
    eligibility_requirements JSONB DEFAULT '[]',
    award_criteria TEXT,
    
    -- Suivi
    current_phase INTEGER DEFAULT 0,
    current_stage TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT tenders_pkey PRIMARY KEY (id),
    CONSTRAINT tenders_project_id_fkey FOREIGN KEY (project_id) REFERENCES btp.projects(id) ON DELETE CASCADE
);

-- 2. Ajouter les colonnes manquantes si nécessaire
DO $$
BEGIN
    -- Vérifier et ajouter tender_number
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'btp' 
        AND table_name = 'tenders' 
        AND column_name = 'tender_number'
    ) THEN
        ALTER TABLE btp.tenders ADD COLUMN tender_number INTEGER;
        RAISE NOTICE '✅ Colonne tender_number ajoutée';
    END IF;

    -- Vérifier et ajouter tender_category
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'btp' 
        AND table_name = 'tenders' 
        AND column_name = 'tender_category'
    ) THEN
        ALTER TABLE btp.tenders ADD COLUMN tender_category TEXT;
        RAISE NOTICE '✅ Colonne tender_category ajoutée';
    END IF;

    -- Vérifier et ajouter procurement_type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'btp' 
        AND table_name = 'tenders' 
        AND column_name = 'procurement_type'
    ) THEN
        ALTER TABLE btp.tenders ADD COLUMN procurement_type TEXT;
        RAISE NOTICE '✅ Colonne procurement_type ajoutée';
    END IF;

    -- Vérifier et ajouter budget_min
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'btp' 
        AND table_name = 'tenders' 
        AND column_name = 'budget_min'
    ) THEN
        ALTER TABLE btp.tenders ADD COLUMN budget_min NUMERIC;
        RAISE NOTICE '✅ Colonne budget_min ajoutée';
    END IF;

    -- Vérifier et ajouter budget_max
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'btp' 
        AND table_name = 'tenders' 
        AND column_name = 'budget_max'
    ) THEN
        ALTER TABLE btp.tenders ADD COLUMN budget_max NUMERIC;
        RAISE NOTICE '✅ Colonne budget_max ajoutée';
    END IF;

    -- Vérifier et ajouter contract_duration
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'btp' 
        AND table_name = 'tenders' 
        AND column_name = 'contract_duration'
    ) THEN
        ALTER TABLE btp.tenders ADD COLUMN contract_duration INTEGER;
        RAISE NOTICE '✅ Colonne contract_duration ajoutée';
    END IF;

    -- Vérifier et ajouter evaluation_criteria
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'btp' 
        AND table_name = 'tenders' 
        AND column_name = 'evaluation_criteria'
    ) THEN
        ALTER TABLE btp.tenders ADD COLUMN evaluation_criteria JSONB DEFAULT '{}';
        RAISE NOTICE '✅ Colonne evaluation_criteria ajoutée';
    END IF;

    -- Vérifier et ajouter eligibility_requirements
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'btp' 
        AND table_name = 'tenders' 
        AND column_name = 'eligibility_requirements'
    ) THEN
        ALTER TABLE btp.tenders ADD COLUMN eligibility_requirements JSONB DEFAULT '[]';
        RAISE NOTICE '✅ Colonne eligibility_requirements ajoutée';
    END IF;

    -- Vérifier et ajouter award_criteria
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'btp' 
        AND table_name = 'tenders' 
        AND column_name = 'award_criteria'
    ) THEN
        ALTER TABLE btp.tenders ADD COLUMN award_criteria TEXT;
        RAISE NOTICE '✅ Colonne award_criteria ajoutée';
    END IF;

    -- Vérifier et ajouter current_phase
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'btp' 
        AND table_name = 'tenders' 
        AND column_name = 'current_phase'
    ) THEN
        ALTER TABLE btp.tenders ADD COLUMN current_phase INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Colonne current_phase ajoutée';
    END IF;

    -- Vérifier et ajouter current_stage
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'btp' 
        AND table_name = 'tenders' 
        AND column_name = 'current_stage'
    ) THEN
        ALTER TABLE btp.tenders ADD COLUMN current_stage TEXT;
        RAISE NOTICE '✅ Colonne current_stage ajoutée';
    END IF;

    -- Vérifier et ajouter deadline_date
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'btp' 
        AND table_name = 'tenders' 
        AND column_name = 'deadline_date'
    ) THEN
        ALTER TABLE btp.tenders ADD COLUMN deadline_date DATE;
        RAISE NOTICE '✅ Colonne deadline_date ajoutée';
    END IF;

    -- Vérifier et ajouter publication_date
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'btp' 
        AND table_name = 'tenders' 
        AND column_name = 'publication_date'
    ) THEN
        ALTER TABLE btp.tenders ADD COLUMN publication_date DATE;
        RAISE NOTICE '✅ Colonne publication_date ajoutée';
    END IF;

    -- Vérifier et ajouter submission_deadline
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'btp' 
        AND table_name = 'tenders' 
        AND column_name = 'submission_deadline'
    ) THEN
        ALTER TABLE btp.tenders ADD COLUMN submission_deadline DATE;
        RAISE NOTICE '✅ Colonne submission_deadline ajoutée';
    END IF;

    -- Vérifier et ajouter evaluation_deadline
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'btp' 
        AND table_name = 'tenders' 
        AND column_name = 'evaluation_deadline'
    ) THEN
        ALTER TABLE btp.tenders ADD COLUMN evaluation_deadline DATE;
        RAISE NOTICE '✅ Colonne evaluation_deadline ajoutée';
    END IF;

    -- Vérifier et ajouter attribution_date
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'btp' 
        AND table_name = 'tenders' 
        AND column_name = 'attribution_date'
    ) THEN
        ALTER TABLE btp.tenders ADD COLUMN attribution_date DATE;
        RAISE NOTICE '✅ Colonne attribution_date ajoutée';
    END IF;

    -- Vérifier et ajouter launch_date
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'btp' 
        AND table_name = 'tenders' 
        AND column_name = 'launch_date'
    ) THEN
        ALTER TABLE btp.tenders ADD COLUMN launch_date TIMESTAMPTZ;
        RAISE NOTICE '✅ Colonne launch_date ajoutée';
    END IF;

    -- Vérifier et ajouter estimated_value
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'btp' 
        AND table_name = 'tenders' 
        AND column_name = 'estimated_value'
    ) THEN
        ALTER TABLE btp.tenders ADD COLUMN estimated_value NUMERIC;
        RAISE NOTICE '✅ Colonne estimated_value ajoutée';
    END IF;

    -- Vérifier et ajouter status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'btp' 
        AND table_name = 'tenders' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE btp.tenders ADD COLUMN status TEXT DEFAULT 'draft';
        RAISE NOTICE '✅ Colonne status ajoutée';
    END IF;

    -- Vérifier et ajouter selection_mode
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'btp' 
        AND table_name = 'tenders' 
        AND column_name = 'selection_mode'
    ) THEN
        ALTER TABLE btp.tenders ADD COLUMN selection_mode TEXT;
        RAISE NOTICE '✅ Colonne selection_mode ajoutée';
    END IF;

    -- Vérifier et ajouter financing_source
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'btp' 
        AND table_name = 'tenders' 
        AND column_name = 'financing_source'
    ) THEN
        ALTER TABLE btp.tenders ADD COLUMN financing_source TEXT;
        RAISE NOTICE '✅ Colonne financing_source ajoutée';
    END IF;
END $$;

-- 3. Activer RLS
ALTER TABLE btp.tenders ENABLE ROW LEVEL SECURITY;

-- 4. Index (vérifier l'existence des colonnes)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'tenders' AND column_name = 'project_id') THEN
        CREATE INDEX IF NOT EXISTS idx_tenders_project_id ON btp.tenders(project_id);
        RAISE NOTICE '✅ Index idx_tenders_project_id créé';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'tenders' AND column_name = 'tender_number') THEN
        CREATE INDEX IF NOT EXISTS idx_tenders_tender_number ON btp.tenders(tender_number);
        RAISE NOTICE '✅ Index idx_tenders_tender_number créé';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'tenders' AND column_name = 'status') THEN
        CREATE INDEX IF NOT EXISTS idx_tenders_status ON btp.tenders(status);
        RAISE NOTICE '✅ Index idx_tenders_status créé';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'tenders' AND column_name = 'deadline_date') THEN
        CREATE INDEX IF NOT EXISTS idx_tenders_deadline_date ON btp.tenders(deadline_date);
        RAISE NOTICE '✅ Index idx_tenders_deadline_date créé';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'tenders' AND column_name = 'publication_date') THEN
        CREATE INDEX IF NOT EXISTS idx_tenders_publication_date ON btp.tenders(publication_date);
        RAISE NOTICE '✅ Index idx_tenders_publication_date créé';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'tenders' AND column_name = 'launch_date') THEN
        CREATE INDEX IF NOT EXISTS idx_tenders_launch_date ON btp.tenders(launch_date);
        RAISE NOTICE '✅ Index idx_tenders_launch_date créé';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'tenders' AND column_name = 'attribution_date') THEN
        CREATE INDEX IF NOT EXISTS idx_tenders_attribution_date ON btp.tenders(attribution_date);
        RAISE NOTICE '✅ Index idx_tenders_attribution_date créé';
    END IF;
END $$;

-- 5. Trigger updated_at
DROP TRIGGER IF EXISTS set_timestamp_tenders ON btp.tenders;
CREATE TRIGGER set_timestamp_tenders
    BEFORE UPDATE ON btp.tenders
    FOR EACH ROW
    EXECUTE FUNCTION btp.update_timestamp();

-- 6. Permissions
GRANT SELECT ON btp.tenders TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.tenders TO authenticated;

-- 7. Politiques RLS
DROP POLICY IF EXISTS select_tenders ON btp.tenders;
CREATE POLICY select_tenders ON btp.tenders
    FOR SELECT TO public
    USING (auth.role() IN ('admin', 'director', 'manager'));

DROP POLICY IF EXISTS insert_tenders ON btp.tenders;
CREATE POLICY insert_tenders ON btp.tenders
    FOR INSERT TO public
    WITH CHECK (auth.role() IN ('admin', 'director', 'manager'));

DROP POLICY IF EXISTS update_tenders ON btp.tenders;
CREATE POLICY update_tenders ON btp.tenders
    FOR UPDATE TO public
    USING (auth.role() IN ('admin', 'director', 'manager'))
    WITH CHECK (auth.role() IN ('admin', 'director', 'manager'));

DROP POLICY IF EXISTS delete_tenders ON btp.tenders;
CREATE POLICY delete_tenders ON btp.tenders
    FOR DELETE TO public
    USING (auth.role() IN ('admin', 'director', 'manager'));

-- 8. Commentaires
COMMENT ON TABLE btp.tenders IS 'Table des appels d''offres (tenders)';
COMMENT ON COLUMN btp.tenders.id IS 'Identifiant unique';
COMMENT ON COLUMN btp.tenders.project_id IS 'Référence au projet';
COMMENT ON COLUMN btp.tenders.title IS 'Titre de l''appel d''offres';
COMMENT ON COLUMN btp.tenders.description IS 'Description détaillée';
COMMENT ON COLUMN btp.tenders.status IS 'Statut (draft, published, closed, awarded)';
COMMENT ON COLUMN btp.tenders.tender_category IS 'Catégorie (travaux, fournitures, services)';
COMMENT ON COLUMN btp.tenders.market_type IS 'Type de marché (national, international, restreint)';
COMMENT ON COLUMN btp.tenders.procurement_type IS 'Type de procédure (AON, consultation, gré à gré)';
COMMENT ON COLUMN btp.tenders.selection_mode IS 'Mode de sélection (qualité, prix, mixte)';
COMMENT ON COLUMN btp.tenders.financing_source IS 'Source de financement';
COMMENT ON COLUMN btp.tenders.tender_number IS 'Numéro unique de l''appel d''offres';
COMMENT ON COLUMN btp.tenders.project_reference IS 'Référence du projet associé';
COMMENT ON COLUMN btp.tenders.launch_date IS 'Date de lancement';
COMMENT ON COLUMN btp.tenders.publication_date IS 'Date de publication';
COMMENT ON COLUMN btp.tenders.deadline_date IS 'Date limite de soumission';
COMMENT ON COLUMN btp.tenders.submission_deadline IS 'Date limite de dépôt des offres';
COMMENT ON COLUMN btp.tenders.evaluation_deadline IS 'Date limite d''évaluation';
COMMENT ON COLUMN btp.tenders.attribution_date IS 'Date d''attribution';
COMMENT ON COLUMN btp.tenders.estimated_value IS 'Valeur estimée du marché';
COMMENT ON COLUMN btp.tenders.budget_min IS 'Budget minimum';
COMMENT ON COLUMN btp.tenders.budget_max IS 'Budget maximum';
COMMENT ON COLUMN btp.tenders.contract_duration IS 'Durée du contrat en mois';
COMMENT ON COLUMN btp.tenders.evaluation_criteria IS 'Critères d''évaluation (JSON)';
COMMENT ON COLUMN btp.tenders.eligibility_requirements IS 'Exigences d''éligibilité (JSON)';
COMMENT ON COLUMN btp.tenders.award_criteria IS 'Critères d''attribution';
COMMENT ON COLUMN btp.tenders.current_phase IS 'Phase actuelle (0-100)';
COMMENT ON COLUMN btp.tenders.current_stage IS 'Étape actuelle';
COMMENT ON COLUMN btp.tenders.created_at IS 'Date de création';
COMMENT ON COLUMN btp.tenders.updated_at IS 'Date de dernière mise à jour';

-- 9. Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 20250812000000_create_tenders_table terminée avec succès';
    RAISE NOTICE '   - Table btp.tenders créée/vérifiée';
    RAISE NOTICE '   - Index créés';
    RAISE NOTICE '   - RLS activée avec politiques';
    RAISE NOTICE '   - Trigger updated_at créé';
END $$;