-- =============================================================================
-- MIGRATION: create_supplier_inspections_payments
-- Description: Crée les tables supplier_inspections et supplier_payments
-- =============================================================================

-- 1. Vérifier et ajouter la colonne user_id à btp.suppliers si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'btp' 
        AND table_name = 'suppliers' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE btp.suppliers ADD COLUMN user_id UUID REFERENCES auth.users(id);
        RAISE NOTICE '✅ Colonne user_id ajoutée à btp.suppliers';
    END IF;
END $$;

-- 2. Créer ou remplacer la fonction update_timestamp (en dehors du DO block)
CREATE OR REPLACE FUNCTION btp.update_timestamp()
RETURNS TRIGGER AS $func$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

-- 3. Créer la table supplier_inspections
CREATE TABLE IF NOT EXISTS btp.supplier_inspections (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id UUID NOT NULL,
    inspector_name TEXT NOT NULL,
    inspection_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
    score INTEGER CHECK (score >= 0 AND score <= 100),
    comments TEXT,
    recommendations TEXT,
    next_inspection_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    FOREIGN KEY (supplier_id) REFERENCES btp.suppliers(id) ON DELETE CASCADE
);

-- 4. Créer la table supplier_payments
CREATE TABLE IF NOT EXISTS btp.supplier_payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id UUID NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    due_date DATE NOT NULL,
    payment_date DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'partial')),
    description TEXT,
    reference_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    FOREIGN KEY (supplier_id) REFERENCES btp.suppliers(id) ON DELETE CASCADE
);

-- 5. Créer les index
CREATE INDEX IF NOT EXISTS idx_supplier_inspections_supplier_id ON btp.supplier_inspections(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_inspections_status ON btp.supplier_inspections(status);
CREATE INDEX IF NOT EXISTS idx_supplier_inspections_date ON btp.supplier_inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier_id ON btp.supplier_payments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_status ON btp.supplier_payments(status);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_due_date ON btp.supplier_payments(due_date);

-- 6. Activer RLS
ALTER TABLE btp.supplier_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.supplier_payments ENABLE ROW LEVEL SECURITY;

-- 7. Politiques pour supplier_inspections
DROP POLICY IF EXISTS "Admins can manage all supplier inspections" ON btp.supplier_inspections;
CREATE POLICY "Admins can manage all supplier inspections" 
ON btp.supplier_inspections 
FOR ALL 
USING (
    auth.role() IN ('admin', 'director', 'manager')
    OR EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role_name IN ('admin', 'director', 'manager')
    )
);

DROP POLICY IF EXISTS "Suppliers can view their own inspections" ON btp.supplier_inspections;
CREATE POLICY "Suppliers can view their own inspections" 
ON btp.supplier_inspections 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM btp.suppliers s
        WHERE s.id = supplier_inspections.supplier_id 
        AND s.user_id = auth.uid()
    )
);

-- 8. Politiques pour supplier_payments
DROP POLICY IF EXISTS "Admins can manage all supplier payments" ON btp.supplier_payments;
CREATE POLICY "Admins can manage all supplier payments" 
ON btp.supplier_payments 
FOR ALL 
USING (
    auth.role() IN ('admin', 'director', 'manager')
    OR EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role_name IN ('admin', 'director', 'manager')
    )
);

DROP POLICY IF EXISTS "Suppliers can view their own payments" ON btp.supplier_payments;
CREATE POLICY "Suppliers can view their own payments" 
ON btp.supplier_payments 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM btp.suppliers s
        WHERE s.id = supplier_payments.supplier_id 
        AND s.user_id = auth.uid()
    )
);

-- 9. Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.supplier_inspections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.supplier_payments TO authenticated;
GRANT SELECT ON btp.supplier_inspections TO anon;
GRANT SELECT ON btp.supplier_payments TO anon;

-- 10. Triggers pour updated_at
DROP TRIGGER IF EXISTS update_supplier_inspections_updated_at ON btp.supplier_inspections;
CREATE TRIGGER update_supplier_inspections_updated_at
    BEFORE UPDATE ON btp.supplier_inspections
    FOR EACH ROW
    EXECUTE FUNCTION btp.update_timestamp();

DROP TRIGGER IF EXISTS update_supplier_payments_updated_at ON btp.supplier_payments;
CREATE TRIGGER update_supplier_payments_updated_at
    BEFORE UPDATE ON btp.supplier_payments
    FOR EACH ROW
    EXECUTE FUNCTION btp.update_timestamp();

-- 11. Commentaires
COMMENT ON TABLE btp.supplier_inspections IS 'Table des inspections des fournisseurs';
COMMENT ON TABLE btp.supplier_payments IS 'Table des paiements des fournisseurs';
COMMENT ON COLUMN btp.supplier_inspections.supplier_id IS 'Référence au fournisseur';
COMMENT ON COLUMN btp.supplier_inspections.inspector_name IS 'Nom de l''inspecteur';
COMMENT ON COLUMN btp.supplier_inspections.inspection_date IS 'Date de l''inspection';
COMMENT ON COLUMN btp.supplier_inspections.status IS 'Statut de l''inspection';
COMMENT ON COLUMN btp.supplier_inspections.score IS 'Score de l''inspection (0-100)';
COMMENT ON COLUMN btp.supplier_inspections.comments IS 'Commentaires sur l''inspection';
COMMENT ON COLUMN btp.supplier_inspections.recommendations IS 'Recommandations suite à l''inspection';
COMMENT ON COLUMN btp.supplier_inspections.next_inspection_date IS 'Date de la prochaine inspection';
COMMENT ON COLUMN btp.supplier_payments.amount IS 'Montant du paiement';
COMMENT ON COLUMN btp.supplier_payments.due_date IS 'Date d''échéance';
COMMENT ON COLUMN btp.supplier_payments.payment_date IS 'Date de paiement effective';
COMMENT ON COLUMN btp.supplier_payments.status IS 'Statut du paiement';
COMMENT ON COLUMN btp.supplier_payments.reference_number IS 'Numéro de référence du paiement';

-- 12. Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 20250720153749 terminée avec succès';
    RAISE NOTICE '   - Table btp.supplier_inspections créée';
    RAISE NOTICE '   - Table btp.supplier_payments créée';
    RAISE NOTICE '   - Politiques RLS configurées';
    RAISE NOTICE '   - Triggers créés';
END $$;