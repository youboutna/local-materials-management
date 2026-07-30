-- =============================================================================
-- MIGRATION: create_progress_invoices_table
-- Description: Création de la table btp.progress_invoices pour la gestion des factures d'avancement
-- =============================================================================

-- 1. Création de la table progress_invoices
CREATE TABLE IF NOT EXISTS btp.progress_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Informations de base
    invoice_number TEXT,
    invoice_type TEXT,
    invoice_amount DECIMAL(15,2),
    work_description TEXT,
    status TEXT DEFAULT 'draft' 
        CHECK (status IN ('draft', 'submitted', 'consultant_review', 'ministry_review', 'donor_review', 'approved', 'paid', 'rejected')),
    
    -- Avancement
    previous_progress DECIMAL(5,2),
    progress_increment DECIMAL(5,2),
    progress_percentage DECIMAL(5,2),
    cumulative_paid DECIMAL(15,2),
    retention_amount DECIMAL(15,2),
    total_contract_amount DECIMAL(15,2),
    
    -- JSON complexes
    lot_details JSONB DEFAULT '[]'::jsonb,
    quantities_executed JSONB DEFAULT '[]'::jsonb,
    supporting_documents JSONB DEFAULT '[]'::jsonb,
    workflow_history JSONB DEFAULT '[]'::jsonb,
    
    -- Relations et validations
    project_id UUID REFERENCES btp.projects(id) ON DELETE CASCADE,
    inspection_id UUID REFERENCES btp.inspections(id) ON DELETE SET NULL,
    consultant_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ministry_reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Documents liés (visible sur votre capture d'écran) - DÉJÀ PRÉSENT
    service_fait_document_id UUID, 
    inspection_report_url TEXT,
    
    -- Workflow et approbations
    consultant_approval_status TEXT DEFAULT 'pending' 
        CHECK (consultant_approval_status IN ('pending', 'approved', 'rejected')),
    consultant_comments TEXT,
    consultant_validated_at TIMESTAMPTZ,
    
    ministry_comments TEXT,
    ministry_validated_at TIMESTAMPTZ,
    
    donor_approval_required BOOLEAN DEFAULT false,
    donor_approved_at TIMESTAMPTZ,
    donor_comments TEXT,
    
    -- Soumission et paiement
    submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    submitted_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    
    -- Timestamps système
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Activation de la sécurité RLS
ALTER TABLE btp.progress_invoices ENABLE ROW LEVEL SECURITY;

-- 3. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_progress_invoices_project_id ON btp.progress_invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_progress_invoices_inspection_id ON btp.progress_invoices(inspection_id);
CREATE INDEX IF NOT EXISTS idx_progress_invoices_consultant_id ON btp.progress_invoices(consultant_id);
CREATE INDEX IF NOT EXISTS idx_progress_invoices_status ON btp.progress_invoices(status);
CREATE INDEX IF NOT EXISTS idx_progress_invoices_created_at ON btp.progress_invoices(created_at DESC);

-- 4. Création d'une fonction de mise à jour du timestamp (si elle n'existe pas déjà)
CREATE OR REPLACE FUNCTION btp.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger de mise à jour automatique du updated_at
DROP TRIGGER IF EXISTS update_progress_invoices_updated_at ON btp.progress_invoices;
CREATE TRIGGER update_progress_invoices_updated_at
    BEFORE UPDATE ON btp.progress_invoices
    FOR EACH ROW
    EXECUTE FUNCTION btp.update_updated_at_column();

-- 6. Politiques RLS (Accès basés sur les rôles et l'utilisateur connecté)
-- Politique : Lecture (Consultants, Ministère, Donateurs, Admin)
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON btp.progress_invoices;
CREATE POLICY "Allow read access to authenticated users" ON btp.progress_invoices
    FOR SELECT TO authenticated
    USING (true);

-- Politique : Insertion (Authentifié)
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON btp.progress_invoices;
CREATE POLICY "Allow insert for authenticated users" ON btp.progress_invoices
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Politique : Mise à jour (Propriétaire, Consultant, Admin)
DROP POLICY IF EXISTS "Allow update for owners and reviewers" ON btp.progress_invoices;
CREATE POLICY "Allow update for owners and reviewers" ON btp.progress_invoices
    FOR UPDATE TO authenticated
    USING (auth.uid() = submitted_by OR auth.uid() = consultant_id OR auth.uid() = ministry_reviewer_id OR auth.role() = 'admin')
    WITH CHECK (auth.uid() = submitted_by OR auth.uid() = consultant_id OR auth.uid() = ministry_reviewer_id OR auth.role() = 'admin');

-- Politique : Suppression (Propriétaire ou Admin)
DROP POLICY IF EXISTS "Allow delete for owners and admins" ON btp.progress_invoices;
CREATE POLICY "Allow delete for owners and admins" ON btp.progress_invoices
    FOR DELETE TO authenticated
    USING (auth.uid() = submitted_by OR auth.role() = 'admin');

-- 7. Commentaires sur la table et les colonnes (Documentation)
COMMENT ON TABLE btp.progress_invoices IS 'Factures d''avancement des projets BTP avec workflow d''approbation';
COMMENT ON COLUMN btp.progress_invoices.id IS 'Identifiant unique de la facture d''avancement';
COMMENT ON COLUMN btp.progress_invoices.invoice_number IS 'Numéro de la facture';
COMMENT ON COLUMN btp.progress_invoices.invoice_type IS 'Type de facture (ex: acompte, solde)';
COMMENT ON COLUMN btp.progress_invoices.invoice_amount IS 'Montant de la facture';
COMMENT ON COLUMN btp.progress_invoices.work_description IS 'Description des travaux concernés';
COMMENT ON COLUMN btp.progress_invoices.status IS 'Statut actuel dans le workflow (draft, submitted, approved, etc.)';
COMMENT ON COLUMN btp.progress_invoices.previous_progress IS 'Pourcentage d''avancement précédent';
COMMENT ON COLUMN btp.progress_invoices.progress_increment IS 'Incrément d''avancement de la facture actuelle';
COMMENT ON COLUMN btp.progress_invoices.progress_percentage IS 'Pourcentage d''avancement global après cette facture';
COMMENT ON COLUMN btp.progress_invoices.cumulative_paid IS 'Montant total payé cumulé';
COMMENT ON COLUMN btp.progress_invoices.retention_amount IS 'Montant de la retenue de garantie';
COMMENT ON COLUMN btp.progress_invoices.total_contract_amount IS 'Montant total du contrat';
COMMENT ON COLUMN btp.progress_invoices.lot_details IS 'Détails des lots concernés (JSON)';
COMMENT ON COLUMN btp.progress_invoices.quantities_executed IS 'Quantités exécutées (JSON)';
COMMENT ON COLUMN btp.progress_invoices.supporting_documents IS 'Liste des documents justificatifs (JSON)';
COMMENT ON COLUMN btp.progress_invoices.workflow_history IS 'Historique du workflow d''approbation (JSON)';
COMMENT ON COLUMN btp.progress_invoices.project_id IS 'ID du projet lié';
COMMENT ON COLUMN btp.progress_invoices.inspection_id IS 'ID de l''inspection liée';
COMMENT ON COLUMN btp.progress_invoices.consultant_id IS 'ID du consultant en charge de la validation';
COMMENT ON COLUMN btp.progress_invoices.ministry_reviewer_id IS 'ID du validateur ministériel';
COMMENT ON COLUMN btp.progress_invoices.service_fait_document_id IS 'ID du document "service fait" lié à cette facture';
COMMENT ON COLUMN btp.progress_invoices.inspection_report_url IS 'URL du rapport d''inspection';
COMMENT ON COLUMN btp.progress_invoices.consultant_approval_status IS 'Statut d''approbation du consultant';
COMMENT ON COLUMN btp.progress_invoices.donor_approval_required IS 'Si l''approbation du donateur est requise';
COMMENT ON COLUMN btp.progress_invoices.submitted_by IS 'Utilisateur ayant soumis la facture';
COMMENT ON COLUMN btp.progress_invoices.submitted_at IS 'Date de soumission de la facture';
COMMENT ON COLUMN btp.progress_invoices.paid_at IS 'Date de paiement de la facture';
COMMENT ON COLUMN btp.progress_invoices.created_at IS 'Date de création de l''enregistrement';
COMMENT ON COLUMN btp.progress_invoices.updated_at IS 'Date de dernière mise à jour de l''enregistrement';

-- 8. Octroi des permissions de base (Accès API)
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.progress_invoices TO authenticated;
GRANT ALL ON btp.progress_invoices TO service_role;

-- 9. Notification de rechargement du schéma pour PostgREST
NOTIFY pgrst, 'reload schema';