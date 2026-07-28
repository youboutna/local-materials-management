-- =============================================================================
-- MIGRATION: create_payments_table
-- Description: Crée la table btp.payments avec toutes ses colonnes
-- =============================================================================

-- 1. Créer la table payments dans le schéma btp
CREATE TABLE IF NOT EXISTS btp.payments (
    id UUID DEFAULT gen_random_uuid(),
    project_id UUID,
    phase_id UUID,
    inspection_id UUID,
    amount NUMERIC,
    payment_method TEXT,
    payment_date TIMESTAMPTZ,
    transaction_id TEXT,
    progress_at_payment NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Colonnes contractor
    contractor_id UUID,
    contractor_name TEXT,
    contractor_contact TEXT,
    
    -- Colonnes bancaires
    bank_name TEXT,
    account_number TEXT,
    check_number TEXT,
    
    -- Colonnes mobile
    mobile_number TEXT,
    mobile_operator TEXT,
    receiver_name TEXT,
    
    -- Pour les politiques RLS
    created_by UUID,
    
    CONSTRAINT payments_pkey PRIMARY KEY (id),
    CONSTRAINT payments_project_id_fkey FOREIGN KEY (project_id) REFERENCES btp.projects(id) ON DELETE CASCADE,
    CONSTRAINT payments_phase_id_fkey FOREIGN KEY (phase_id) REFERENCES btp.phases(id) ON DELETE SET NULL,
    CONSTRAINT payments_inspection_id_fkey FOREIGN KEY (inspection_id) REFERENCES btp.inspections(id) ON DELETE SET NULL
);

-- 2. Activer RLS
ALTER TABLE btp.payments ENABLE ROW LEVEL SECURITY;

-- 3. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_payments_project_id ON btp.payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_phase_id ON btp.payments(phase_id);
CREATE INDEX IF NOT EXISTS idx_payments_contractor_id ON btp.payments(contractor_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON btp.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_created_by ON btp.payments(created_by);

-- 4. Trigger pour updated_at
DROP TRIGGER IF EXISTS set_timestamp_payments ON btp.payments;
CREATE TRIGGER set_timestamp_payments
    BEFORE UPDATE ON btp.payments
    FOR EACH ROW
    EXECUTE FUNCTION btp.update_timestamp();

-- 5. Permissions
GRANT SELECT ON btp.payments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.payments TO authenticated;

-- 6. Politiques RLS
DROP POLICY IF EXISTS select_payments ON btp.payments;
CREATE POLICY select_payments ON btp.payments
    FOR SELECT TO public
    USING (
        auth.role() IN ('admin', 'director', 'manager') 
        OR auth.uid() = created_by
    );

DROP POLICY IF EXISTS insert_payments ON btp.payments;
CREATE POLICY insert_payments ON btp.payments
    FOR INSERT TO public
    WITH CHECK (
        auth.role() IN ('admin', 'director', 'manager')
    );

DROP POLICY IF EXISTS update_payments ON btp.payments;
CREATE POLICY update_payments ON btp.payments
    FOR UPDATE TO public
    USING (
        auth.role() IN ('admin', 'director', 'manager')
    )
    WITH CHECK (
        auth.role() IN ('admin', 'director', 'manager')
    );

DROP POLICY IF EXISTS delete_payments ON btp.payments;
CREATE POLICY delete_payments ON btp.payments
    FOR DELETE TO public
    USING (
        auth.role() IN ('admin', 'director', 'manager')
    );

-- 7. Commentaires
COMMENT ON TABLE btp.payments IS 'Table des paiements liés aux projets, phases et inspections';
COMMENT ON COLUMN btp.payments.id IS 'Identifiant unique du paiement';
COMMENT ON COLUMN btp.payments.project_id IS 'Référence au projet';
COMMENT ON COLUMN btp.payments.phase_id IS 'Référence à la phase du projet';
COMMENT ON COLUMN btp.payments.inspection_id IS 'Référence à l''inspection';
COMMENT ON COLUMN btp.payments.amount IS 'Montant du paiement';
COMMENT ON COLUMN btp.payments.payment_method IS 'Méthode de paiement (virement, chèque, mobile, etc.)';
COMMENT ON COLUMN btp.payments.payment_date IS 'Date du paiement';
COMMENT ON COLUMN btp.payments.transaction_id IS 'Identifiant de la transaction';
COMMENT ON COLUMN btp.payments.progress_at_payment IS 'Progression du projet au moment du paiement (0-100)';
COMMENT ON COLUMN btp.payments.contractor_id IS 'Identifiant de l''entrepreneur';
COMMENT ON COLUMN btp.payments.contractor_name IS 'Nom de l''entrepreneur';
COMMENT ON COLUMN btp.payments.contractor_contact IS 'Contact de l''entrepreneur';
COMMENT ON COLUMN btp.payments.bank_name IS 'Nom de la banque';
COMMENT ON COLUMN btp.payments.account_number IS 'Numéro de compte';
COMMENT ON COLUMN btp.payments.check_number IS 'Numéro du chèque';
COMMENT ON COLUMN btp.payments.mobile_number IS 'Numéro de téléphone mobile';
COMMENT ON COLUMN btp.payments.mobile_operator IS 'Opérateur mobile';
COMMENT ON COLUMN btp.payments.receiver_name IS 'Nom du bénéficiaire';
COMMENT ON COLUMN btp.payments.created_by IS 'Utilisateur qui a créé le paiement';
COMMENT ON COLUMN btp.payments.created_at IS 'Date de création';
COMMENT ON COLUMN btp.payments.updated_at IS 'Date de dernière mise à jour';