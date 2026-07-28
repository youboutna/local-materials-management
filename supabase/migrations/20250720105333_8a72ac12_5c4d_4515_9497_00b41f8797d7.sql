-- =============================================================================
-- MIGRATION: add_payment_columns_verification
-- Description: Vérification et ajout des colonnes manquantes dans payments
-- =============================================================================

DO $$
BEGIN
    -- Vérifier et ajouter contractor_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'btp' 
        AND table_name = 'payments' 
        AND column_name = 'contractor_id'
    ) THEN
        ALTER TABLE btp.payments ADD COLUMN contractor_id UUID;
        RAISE NOTICE '✅ contractor_id ajoutée';
    ELSE
        RAISE NOTICE '⏭️ contractor_id existe déjà';
    END IF;

    -- Vérifier et ajouter contractor_name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'btp' 
        AND table_name = 'payments' 
        AND column_name = 'contractor_name'
    ) THEN
        ALTER TABLE btp.payments ADD COLUMN contractor_name TEXT;
        RAISE NOTICE '✅ contractor_name ajoutée';
    ELSE
        RAISE NOTICE '⏭️ contractor_name existe déjà';
    END IF;

    -- Vérifier et ajouter contractor_contact
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'btp' 
        AND table_name = 'payments' 
        AND column_name = 'contractor_contact'
    ) THEN
        ALTER TABLE btp.payments ADD COLUMN contractor_contact TEXT;
        RAISE NOTICE '✅ contractor_contact ajoutée';
    ELSE
        RAISE NOTICE '⏭️ contractor_contact existe déjà';
    END IF;

    -- Vérifier et ajouter bank_name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'btp' 
        AND table_name = 'payments' 
        AND column_name = 'bank_name'
    ) THEN
        ALTER TABLE btp.payments ADD COLUMN bank_name TEXT;
        RAISE NOTICE '✅ bank_name ajoutée';
    ELSE
        RAISE NOTICE '⏭️ bank_name existe déjà';
    END IF;

    -- Vérifier et ajouter account_number
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'btp' 
        AND table_name = 'payments' 
        AND column_name = 'account_number'
    ) THEN
        ALTER TABLE btp.payments ADD COLUMN account_number TEXT;
        RAISE NOTICE '✅ account_number ajoutée';
    ELSE
        RAISE NOTICE '⏭️ account_number existe déjà';
    END IF;

    -- Vérifier et ajouter check_number
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'btp' 
        AND table_name = 'payments' 
        AND column_name = 'check_number'
    ) THEN
        ALTER TABLE btp.payments ADD COLUMN check_number TEXT;
        RAISE NOTICE '✅ check_number ajoutée';
    ELSE
        RAISE NOTICE '⏭️ check_number existe déjà';
    END IF;

    -- Vérifier et ajouter mobile_number
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'btp' 
        AND table_name = 'payments' 
        AND column_name = 'mobile_number'
    ) THEN
        ALTER TABLE btp.payments ADD COLUMN mobile_number TEXT;
        RAISE NOTICE '✅ mobile_number ajoutée';
    ELSE
        RAISE NOTICE '⏭️ mobile_number existe déjà';
    END IF;

    -- Vérifier et ajouter mobile_operator
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'btp' 
        AND table_name = 'payments' 
        AND column_name = 'mobile_operator'
    ) THEN
        ALTER TABLE btp.payments ADD COLUMN mobile_operator TEXT;
        RAISE NOTICE '✅ mobile_operator ajoutée';
    ELSE
        RAISE NOTICE '⏭️ mobile_operator existe déjà';
    END IF;

    -- Vérifier et ajouter receiver_name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'btp' 
        AND table_name = 'payments' 
        AND column_name = 'receiver_name'
    ) THEN
        ALTER TABLE btp.payments ADD COLUMN receiver_name TEXT;
        RAISE NOTICE '✅ receiver_name ajoutée';
    ELSE
        RAISE NOTICE '⏭️ receiver_name existe déjà';
    END IF;

    RAISE NOTICE '✅ Vérification des colonnes terminée';
END $$;