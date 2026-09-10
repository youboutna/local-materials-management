-- =============================================================================
-- MIGRATION: 20260909120000_create_profit_distributions.sql
-- Description: Création de la table profit_distributions dans le schéma btp
-- Version: 7.0 (Corrigée - pg_policies et pg_get_expr)
-- =============================================================================
/**
BEGIN;

-- =============================================================================
-- PARTIE 1 : CRÉATION DE LA TABLE
-- =============================================================================

-- 1. Vérifier/créer le schéma btp
CREATE SCHEMA IF NOT EXISTS btp;

-- 2. Créer la table profit_distributions
CREATE TABLE IF NOT EXISTS btp.profit_distributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL,
    recipient_type VARCHAR(50) DEFAULT 'user' CHECK (recipient_type IN ('user', 'employee', 'supplier', 'team')),
    mission_id UUID,
    project_id UUID,
    amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
    percentage DECIMAL(5,2) CHECK (percentage >= 0 AND percentage <= 100),
    distribution_date TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled', 'rejected')),
    description TEXT,
    payment_method VARCHAR(50),
    payment_reference TEXT,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ajouter les contraintes de clé étrangère (si les tables existent)
DO $$
BEGIN
    -- Vérifier si la table btp.missions existe
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'btp' AND table_name = 'missions'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'fk_profit_distributions_mission'
            AND conrelid = 'btp.profit_distributions'::regclass
        ) THEN
            ALTER TABLE btp.profit_distributions 
            ADD CONSTRAINT fk_profit_distributions_mission 
            FOREIGN KEY (mission_id) 
            REFERENCES btp.missions(id) 
            ON DELETE SET NULL;
        END IF;
    END IF;

    -- Vérifier si la table btp.projects existe
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'btp' AND table_name = 'projects'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'fk_profit_distributions_project'
            AND conrelid = 'btp.profit_distributions'::regclass
        ) THEN
            ALTER TABLE btp.profit_distributions 
            ADD CONSTRAINT fk_profit_distributions_project 
            FOREIGN KEY (project_id) 
            REFERENCES btp.projects(id) 
            ON DELETE SET NULL;
        END IF;
    END IF;

    -- Vérifier si la table public.profiles existe
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profiles'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'fk_profit_distributions_recipient'
            AND conrelid = 'btp.profit_distributions'::regclass
        ) THEN
            ALTER TABLE btp.profit_distributions 
            ADD CONSTRAINT fk_profit_distributions_recipient 
            FOREIGN KEY (recipient_id) 
            REFERENCES public.profiles(id) 
            ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- 4. Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_profit_distributions_recipient 
ON btp.profit_distributions(recipient_id);

CREATE INDEX IF NOT EXISTS idx_profit_distributions_mission 
ON btp.profit_distributions(mission_id);

CREATE INDEX IF NOT EXISTS idx_profit_distributions_project 
ON btp.profit_distributions(project_id);

CREATE INDEX IF NOT EXISTS idx_profit_distributions_status 
ON btp.profit_distributions(status);

CREATE INDEX IF NOT EXISTS idx_profit_distributions_date 
ON btp.profit_distributions(distribution_date);

CREATE INDEX IF NOT EXISTS idx_profit_distributions_recipient_type 
ON btp.profit_distributions(recipient_type);

CREATE INDEX IF NOT EXISTS idx_profit_distributions_created_by 
ON btp.profit_distributions(created_by);

-- Index pour les recherches JSON
CREATE INDEX IF NOT EXISTS idx_profit_distributions_metadata 
ON btp.profit_distributions USING gin(metadata);

-- =============================================================================
-- PARTIE 2 : ACTIVATION RLS
-- =============================================================================

-- 5. Activer RLS
ALTER TABLE btp.profit_distributions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PARTIE 3 : POLITIQUES RLS
-- =============================================================================

-- 6. Supprimer les politiques existantes
DROP POLICY IF EXISTS "profit_distributions_read_own_or_admin" ON btp.profit_distributions;
DROP POLICY IF EXISTS "profit_distributions_write_admin" ON btp.profit_distributions;
DROP POLICY IF EXISTS "Users can view own profit distributions" ON btp.profit_distributions;
DROP POLICY IF EXISTS "Admins can manage profit distributions" ON btp.profit_distributions;
DROP POLICY IF EXISTS "Users can view profit distributions" ON btp.profit_distributions;
DROP POLICY IF EXISTS "Users can create profit distributions" ON btp.profit_distributions;
DROP POLICY IF EXISTS "Users can update profit distributions" ON btp.profit_distributions;
DROP POLICY IF EXISTS "Users can delete profit distributions" ON btp.profit_distributions;
DROP POLICY IF EXISTS "Owners can view their profit distributions" ON btp.profit_distributions;
DROP POLICY IF EXISTS "Managers can view all profit distributions" ON btp.profit_distributions;

-- 7. Politique de lecture
CREATE POLICY "Users can view own profit distributions"
ON btp.profit_distributions
FOR SELECT
TO authenticated
USING (
    recipient_id = auth.uid()
    OR created_by = auth.uid()
    OR (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin', 'director', 'manager')
        )
    )
);

-- 8. Politique d'insertion
CREATE POLICY "Users can create profit distributions"
ON btp.profit_distributions
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin', 'director', 'manager')
        )
    )
);

-- 9. Politique de mise à jour
CREATE POLICY "Users can update profit distributions"
ON btp.profit_distributions
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'director', 'manager')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'director', 'manager')
    )
);

-- 10. Politique de suppression
CREATE POLICY "Users can delete profit distributions"
ON btp.profit_distributions
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
);

-- 11. Politique pour les propriétaires
CREATE POLICY "Owners can view their profit distributions"
ON btp.profit_distributions
FOR SELECT
TO authenticated
USING (recipient_id = auth.uid());

-- 12. Politique pour les managers
CREATE POLICY "Managers can view all profit distributions"
ON btp.profit_distributions
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('manager', 'director')
    )
);

-- =============================================================================
-- PARTIE 4 : FONCTIONS ET TRIGGERS
-- =============================================================================

-- 13. Créer la fonction update_updated_at_column
CREATE OR REPLACE FUNCTION btp.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 14. Créer le trigger
DROP TRIGGER IF EXISTS set_updated_at ON btp.profit_distributions;
CREATE TRIGGER set_updated_at 
BEFORE UPDATE ON btp.profit_distributions 
FOR EACH ROW 
EXECUTE FUNCTION btp.update_updated_at_column();

-- 15. Fonction pour la vérification du statut
CREATE OR REPLACE FUNCTION btp.check_profit_distribution_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Si le montant est approuvé, passer le statut à 'approved'
    IF NEW.approved_at IS NOT NULL AND OLD.approved_at IS NULL THEN
        NEW.status = 'approved';
    END IF;
    
    -- Si le paiement est effectué, passer le statut à 'paid'
    IF NEW.paid_at IS NOT NULL AND OLD.paid_at IS NULL THEN
        NEW.status = 'paid';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 16. Créer le trigger pour le statut
DROP TRIGGER IF EXISTS check_profit_distribution_status ON btp.profit_distributions;
CREATE TRIGGER check_profit_distribution_status
BEFORE UPDATE ON btp.profit_distributions
FOR EACH ROW
EXECUTE FUNCTION btp.check_profit_distribution_status();

-- =============================================================================
-- PARTIE 5 : VUES
-- =============================================================================

-- 17. Vue pour les résumés par bénéficiaire
CREATE OR REPLACE VIEW btp.v_profit_distributions_summary AS
SELECT 
    recipient_id,
    recipient_type,
    COUNT(*) AS total_distributions,
    SUM(amount) AS total_amount,
    AVG(amount) AS average_amount,
    MIN(distribution_date) AS first_distribution,
    MAX(distribution_date) AS last_distribution,
    COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
    COUNT(*) FILTER (WHERE status = 'approved') AS approved_count,
    COUNT(*) FILTER (WHERE status = 'paid') AS paid_count,
    COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_count
FROM btp.profit_distributions
GROUP BY recipient_id, recipient_type;

-- 18. Vue pour les distributions par projet
DO $$
DECLARE
    v_projects_exists BOOLEAN;
    v_has_name_column BOOLEAN;
    v_has_title_column BOOLEAN;
    v_has_project_name_column BOOLEAN;
    v_column_name TEXT;
BEGIN
    -- Vérifier si la table projects existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'btp' AND table_name = 'projects'
    ) INTO v_projects_exists;
    
    IF v_projects_exists THEN
        -- Vérifier les colonnes disponibles
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'btp' AND table_name = 'projects' AND column_name = 'name'
        ) INTO v_has_name_column;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'btp' AND table_name = 'projects' AND column_name = 'title'
        ) INTO v_has_title_column;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'btp' AND table_name = 'projects' AND column_name = 'project_name'
        ) INTO v_has_project_name_column;
        
        -- Déterminer la colonne à utiliser
        IF v_has_name_column THEN
            v_column_name := 'name';
        ELSIF v_has_title_column THEN
            v_column_name := 'title';
        ELSIF v_has_project_name_column THEN
            v_column_name := 'project_name';
        ELSE
            v_column_name := 'id::text';
        END IF;
        
        -- Créer la vue avec la colonne dynamique
        EXECUTE format('
            CREATE OR REPLACE VIEW btp.v_profit_distributions_by_project AS
            SELECT 
                p.id AS project_id,
                p.%I AS project_name,
                COUNT(pd.id) AS distribution_count,
                SUM(pd.amount) AS total_distributed,
                AVG(pd.amount) AS average_distribution,
                MIN(pd.distribution_date) AS first_distribution,
                MAX(pd.distribution_date) AS last_distribution
            FROM btp.profit_distributions pd
            LEFT JOIN btp.projects p ON p.id = pd.project_id
            GROUP BY p.id, p.%I
        ', v_column_name, v_column_name);
        
        RAISE NOTICE '✅ Vue v_profit_distributions_by_project créée avec colonne: %', v_column_name;
    ELSE
        -- Vue simplifiée si la table projects n'existe pas
        CREATE OR REPLACE VIEW btp.v_profit_distributions_by_project AS
        SELECT 
            project_id,
            COUNT(*) AS distribution_count,
            SUM(amount) AS total_distributed,
            AVG(amount) AS average_distribution,
            MIN(distribution_date) AS first_distribution,
            MAX(distribution_date) AS last_distribution
        FROM btp.profit_distributions
        WHERE project_id IS NOT NULL
        GROUP BY project_id;
        
        RAISE NOTICE 'ℹ️ Vue v_profit_distributions_by_project créée sans JOIN';
    END IF;
END $$;

-- 19. Vue pour les distributions par statut
CREATE OR REPLACE VIEW btp.v_profit_distributions_by_status AS
SELECT 
    status,
    COUNT(*) AS count,
    SUM(amount) AS total_amount,
    AVG(amount) AS average_amount,
    MIN(distribution_date) AS first_distribution,
    MAX(distribution_date) AS last_distribution
FROM btp.profit_distributions
GROUP BY status
ORDER BY status;

-- 20. Vue pour les distributions par mois
CREATE OR REPLACE VIEW btp.v_profit_distributions_by_month AS
SELECT 
    DATE_TRUNC('month', distribution_date) AS month,
    COUNT(*) AS distribution_count,
    SUM(amount) AS total_amount,
    AVG(amount) AS average_amount,
    COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
    COUNT(*) FILTER (WHERE status = 'approved') AS approved_count,
    COUNT(*) FILTER (WHERE status = 'paid') AS paid_count
FROM btp.profit_distributions
WHERE distribution_date IS NOT NULL
GROUP BY DATE_TRUNC('month', distribution_date)
ORDER BY month DESC;

-- =============================================================================
-- PARTIE 6 : DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE btp.profit_distributions IS 'Table des distributions de bénéfices pour les projets BTP';
COMMENT ON COLUMN btp.profit_distributions.id IS 'Identifiant unique de la distribution';
COMMENT ON COLUMN btp.profit_distributions.recipient_id IS 'ID du bénéficiaire (utilisateur, employé, fournisseur)';
COMMENT ON COLUMN btp.profit_distributions.recipient_type IS 'Type du bénéficiaire: user, employee, supplier, team';
COMMENT ON COLUMN btp.profit_distributions.mission_id IS 'ID de la mission associée';
COMMENT ON COLUMN btp.profit_distributions.project_id IS 'ID du projet associé';
COMMENT ON COLUMN btp.profit_distributions.amount IS 'Montant distribué';
COMMENT ON COLUMN btp.profit_distributions.percentage IS 'Pourcentage du bénéfice (si applicable)';
COMMENT ON COLUMN btp.profit_distributions.distribution_date IS 'Date de distribution';
COMMENT ON COLUMN btp.profit_distributions.status IS 'Statut: pending, approved, paid, cancelled, rejected';
COMMENT ON COLUMN btp.profit_distributions.description IS 'Description de la distribution';
COMMENT ON COLUMN btp.profit_distributions.payment_method IS 'Méthode de paiement';
COMMENT ON COLUMN btp.profit_distributions.payment_reference IS 'Référence de paiement';
COMMENT ON COLUMN btp.profit_distributions.approved_by IS 'ID de l''approbateur';
COMMENT ON COLUMN btp.profit_distributions.approved_at IS 'Date d''approbation';
COMMENT ON COLUMN btp.profit_distributions.paid_at IS 'Date de paiement';
COMMENT ON COLUMN btp.profit_distributions.notes IS 'Notes supplémentaires';
COMMENT ON COLUMN btp.profit_distributions.metadata IS 'Métadonnées JSON';
COMMENT ON COLUMN btp.profit_distributions.created_by IS 'ID du créateur';
COMMENT ON COLUMN btp.profit_distributions.created_at IS 'Date de création';
COMMENT ON COLUMN btp.profit_distributions.updated_at IS 'Date de dernière mise à jour';

-- =============================================================================
-- PARTIE 7 : VÉRIFICATION FINALE (CORRIGÉE)
-- =============================================================================

DO $$
DECLARE
    v_table_exists BOOLEAN;
    v_policy_count INTEGER;
    v_column_count INTEGER;
    v_view_count INTEGER;
BEGIN
    -- Vérifier si la table existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'btp' AND table_name = 'profit_distributions'
    ) INTO v_table_exists;
    
    -- Compter les politiques
    SELECT COUNT(*) INTO v_policy_count 
    FROM pg_policies 
    WHERE schemaname = 'btp' AND tablename = 'profit_distributions';
    
    -- Compter les colonnes
    SELECT COUNT(*) INTO v_column_count 
    FROM information_schema.columns 
    WHERE table_schema = 'btp' AND table_name = 'profit_distributions';
    
    -- Compter les vues
    SELECT COUNT(*) INTO v_view_count 
    FROM information_schema.views 
    WHERE table_schema = 'btp' AND table_name LIKE 'v_profit_distributions%';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 RAPPORT DE MIGRATION';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Table profit_distributions: %', v_table_exists;
    RAISE NOTICE '📋 Nombre de colonnes: %', v_column_count;
    RAISE NOTICE '🔒 Nombre de politiques RLS: %', v_policy_count;
    RAISE NOTICE '👁️ Nombre de vues: %', v_view_count;
    RAISE NOTICE '========================================';
END $$;

-- Vérification de la structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'btp' 
AND table_name = 'profit_distributions'
ORDER BY ordinal_position;

-- Vérification des politiques (CORRIGÉE - sans pg_get_expr sur pg_policies)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual AS qual_condition,
    with_check AS with_check_condition
FROM pg_policies
WHERE schemaname = 'btp'
AND tablename = 'profit_distributions'
ORDER BY policyname;

-- Vérification des index
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'btp'
AND tablename = 'profit_distributions'
ORDER BY indexname;

-- Vérification des vues
SELECT 
    schemaname,
    tablename AS viewname,
    viewdefinition
FROM pg_views
WHERE schemaname = 'btp'
AND tablename LIKE 'v_profit_distributions%'
ORDER BY tablename;

COMMIT;

-- =============================================================================
-- FIN DE LA MIGRATION
-- =============================================================================

**/