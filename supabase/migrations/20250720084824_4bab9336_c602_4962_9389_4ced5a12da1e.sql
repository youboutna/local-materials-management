-- =============================================================================
-- MIGRATION: add_payment_columns
-- Description: Ajoute les colonnes contractor et méthodes de paiement à la table payments
-- =============================================================================

-- Ajouter les colonnes avec IF NOT EXISTS (PostgreSQL 9.6+)
ALTER TABLE btp.payments 
    ADD COLUMN IF NOT EXISTS contractor_id UUID,
    ADD COLUMN IF NOT EXISTS contractor_name TEXT,
    ADD COLUMN IF NOT EXISTS contractor_contact TEXT,
    ADD COLUMN IF NOT EXISTS bank_name TEXT,
    ADD COLUMN IF NOT EXISTS account_number TEXT,
    ADD COLUMN IF NOT EXISTS check_number TEXT,
    ADD COLUMN IF NOT EXISTS mobile_number TEXT,
    ADD COLUMN IF NOT EXISTS mobile_operator TEXT,
    ADD COLUMN IF NOT EXISTS receiver_name TEXT;

-- Créer l'index s'il n'existe pas
CREATE INDEX IF NOT EXISTS idx_payments_contractor_id ON btp.payments(contractor_id);

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Colonnes vérifiées et ajoutées si nécessaire';
END $$;