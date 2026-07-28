-- =============================================================================
-- MIGRATION: create_supplier_payment_request_function
-- Description: Crée la fonction pour créer une demande de paiement fournisseur
-- =============================================================================

-- 1. Créer la table supplier_payment_requests si elle n'existe pas
CREATE TABLE IF NOT EXISTS btp.supplier_payment_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id UUID NOT NULL,
    project_id UUID,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    payment_reason TEXT NOT NULL,
    supporting_documents TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid', 'cancelled')),
    requested_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (supplier_id) REFERENCES btp.suppliers(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES btp.projects(id) ON DELETE SET NULL
);

-- 2. Créer les index
CREATE INDEX IF NOT EXISTS idx_supplier_payment_requests_supplier_id ON btp.supplier_payment_requests(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payment_requests_project_id ON btp.supplier_payment_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payment_requests_status ON btp.supplier_payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_supplier_payment_requests_requested_date ON btp.supplier_payment_requests(requested_date);

-- 3. Activer RLS
ALTER TABLE btp.supplier_payment_requests ENABLE ROW LEVEL SECURITY;

-- 4. Politiques RLS
DROP POLICY IF EXISTS "Users can view supplier payment requests" ON btp.supplier_payment_requests;
CREATE POLICY "Users can view supplier payment requests"
ON btp.supplier_payment_requests
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert supplier payment requests" ON btp.supplier_payment_requests;
CREATE POLICY "Users can insert supplier payment requests"
ON btp.supplier_payment_requests
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update supplier payment requests" ON btp.supplier_payment_requests;
CREATE POLICY "Users can update supplier payment requests"
ON btp.supplier_payment_requests
FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete supplier payment requests" ON btp.supplier_payment_requests;
CREATE POLICY "Users can delete supplier payment requests"
ON btp.supplier_payment_requests
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- 5. Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.supplier_payment_requests TO authenticated;
GRANT SELECT ON btp.supplier_payment_requests TO anon;

-- 6. Fonction pour créer une demande de paiement (corrigée)
CREATE OR REPLACE FUNCTION btp.create_supplier_payment_request(
    supplier_id_param UUID,
    amount_param NUMERIC,
    description_param TEXT,
    payment_reason_param TEXT,
    project_id_param UUID DEFAULT NULL,
    supporting_documents_param TEXT[] DEFAULT '{}',
    notes_param TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    supplier_id UUID,
    project_id UUID,
    amount NUMERIC,
    description TEXT,
    payment_reason TEXT,
    supporting_documents TEXT[],
    status TEXT,
    requested_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
    INSERT INTO btp.supplier_payment_requests (
        supplier_id,
        project_id,
        amount,
        description,
        payment_reason,
        supporting_documents,
        status,
        requested_date,
        notes
    ) VALUES (
        supplier_id_param,
        project_id_param,
        amount_param,
        description_param,
        payment_reason_param,
        supporting_documents_param,
        'pending',
        NOW(),
        notes_param
    )
    RETURNING
        id,
        supplier_id,
        project_id,
        amount,
        description,
        payment_reason,
        supporting_documents,
        status,
        requested_date,
        notes,
        created_at,
        updated_at;
$$;

-- 7. Fonction pour approuver une demande de paiement
CREATE OR REPLACE FUNCTION btp.approve_supplier_payment_request(
    request_id UUID,
    approved_by_param UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    status TEXT,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
    UPDATE btp.supplier_payment_requests
    SET 
        status = 'approved',
        updated_at = NOW()
    WHERE id = request_id
    AND status = 'pending'
    RETURNING id, status, updated_at;
$$;

-- 8. Fonction pour rejeter une demande de paiement
CREATE OR REPLACE FUNCTION btp.reject_supplier_payment_request(
    request_id UUID,
    rejection_reason_param TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    status TEXT,
    notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
    UPDATE btp.supplier_payment_requests
    SET 
        status = 'rejected',
        notes = COALESCE(notes, '') || ' Rejeté: ' || COALESCE(rejection_reason_param, 'Pas de raison spécifiée'),
        updated_at = NOW()
    WHERE id = request_id
    AND status IN ('pending', 'approved')
    RETURNING id, status, notes, updated_at;
$$;

-- 9. Trigger pour updated_at
DROP TRIGGER IF EXISTS update_supplier_payment_requests_updated_at ON btp.supplier_payment_requests;
CREATE TRIGGER update_supplier_payment_requests_updated_at
    BEFORE UPDATE ON btp.supplier_payment_requests
    FOR EACH ROW
    EXECUTE FUNCTION btp.update_timestamp();

-- 10. Commentaires
COMMENT ON TABLE btp.supplier_payment_requests IS 'Table des demandes de paiement fournisseur';
COMMENT ON COLUMN btp.supplier_payment_requests.id IS 'Identifiant unique';
COMMENT ON COLUMN btp.supplier_payment_requests.supplier_id IS 'Référence au fournisseur';
COMMENT ON COLUMN btp.supplier_payment_requests.project_id IS 'Référence au projet (optionnel)';
COMMENT ON COLUMN btp.supplier_payment_requests.amount IS 'Montant demandé';
COMMENT ON COLUMN btp.supplier_payment_requests.description IS 'Description de la demande';
COMMENT ON COLUMN btp.supplier_payment_requests.payment_reason IS 'Raison du paiement';
COMMENT ON COLUMN btp.supplier_payment_requests.supporting_documents IS 'Documents justificatifs';
COMMENT ON COLUMN btp.supplier_payment_requests.status IS 'Statut de la demande';
COMMENT ON COLUMN btp.supplier_payment_requests.requested_date IS 'Date de la demande';
COMMENT ON COLUMN btp.supplier_payment_requests.notes IS 'Notes supplémentaires';

COMMENT ON FUNCTION btp.create_supplier_payment_request(UUID, NUMERIC, TEXT, TEXT, UUID, TEXT[], TEXT) IS 'Crée une nouvelle demande de paiement fournisseur';
COMMENT ON FUNCTION btp.approve_supplier_payment_request(UUID, UUID) IS 'Approuve une demande de paiement fournisseur';
COMMENT ON FUNCTION btp.reject_supplier_payment_request(UUID, TEXT) IS 'Rejette une demande de paiement fournisseur';

-- 11. Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 20250820110424 terminée avec succès';
    RAISE NOTICE '   - Table btp.supplier_payment_requests créée';
    RAISE NOTICE '   - Index créés';
    RAISE NOTICE '   - RLS activée avec politiques';
    RAISE NOTICE '   - Fonctions créées: create_supplier_payment_request, approve_supplier_payment_request, reject_supplier_payment_request';
    RAISE NOTICE '   - Trigger updated_at créé';
END $$;