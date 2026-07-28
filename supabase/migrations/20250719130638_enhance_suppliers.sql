-- =============================================================================
-- MIGRATION: enhance_suppliers
-- Description: Ajoute des colonnes à btp.suppliers
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'btp' AND tablename = 'suppliers') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'suppliers' AND column_name = 'business_registration') THEN
            EXECUTE 'ALTER TABLE btp.suppliers ADD COLUMN business_registration TEXT';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'suppliers' AND column_name = 'tax_number') THEN
            EXECUTE 'ALTER TABLE btp.suppliers ADD COLUMN tax_number TEXT';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'suppliers' AND column_name = 'bank_details') THEN
            EXECUTE 'ALTER TABLE btp.suppliers ADD COLUMN bank_details JSONB DEFAULT ''{}''::jsonb';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'suppliers' AND column_name = 'certifications') THEN
            EXECUTE 'ALTER TABLE btp.suppliers ADD COLUMN certifications JSONB DEFAULT ''[]''::jsonb';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'suppliers' AND column_name = 'delivery_zones') THEN
            EXECUTE 'ALTER TABLE btp.suppliers ADD COLUMN delivery_zones JSONB DEFAULT ''[]''::jsonb';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'suppliers' AND column_name = 'payment_terms') THEN
            EXECUTE 'ALTER TABLE btp.suppliers ADD COLUMN payment_terms TEXT';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'suppliers' AND column_name = 'performance_score') THEN
            EXECUTE 'ALTER TABLE btp.suppliers ADD COLUMN performance_score NUMERIC CHECK (performance_score >= 0 AND performance_score <= 10)';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'suppliers' AND column_name = 'last_contract_date') THEN
            EXECUTE 'ALTER TABLE btp.suppliers ADD COLUMN last_contract_date DATE';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'suppliers' AND column_name = 'preferred_supplier') THEN
            EXECUTE 'ALTER TABLE btp.suppliers ADD COLUMN preferred_supplier BOOLEAN DEFAULT FALSE';
        END IF;
        RAISE NOTICE '✅ btp.suppliers enrichie';
    ELSE
        RAISE NOTICE '⏭️ btp.suppliers n''existe pas';
    END IF;
END $$;