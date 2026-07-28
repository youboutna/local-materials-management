-- =============================================================================
-- MIGRATION: enhance_tenders
-- Description: Ajoute des colonnes à btp.tenders
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'btp' AND tablename = 'tenders') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'tenders' AND column_name = 'tender_number') THEN
            EXECUTE 'ALTER TABLE btp.tenders ADD COLUMN tender_number TEXT UNIQUE';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'tenders' AND column_name = 'publication_date') THEN
            EXECUTE 'ALTER TABLE btp.tenders ADD COLUMN publication_date DATE';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'tenders' AND column_name = 'deadline_date') THEN
            EXECUTE 'ALTER TABLE btp.tenders ADD COLUMN deadline_date DATE';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'tenders' AND column_name = 'budget_min') THEN
            EXECUTE 'ALTER TABLE btp.tenders ADD COLUMN budget_min NUMERIC';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'tenders' AND column_name = 'budget_max') THEN
            EXECUTE 'ALTER TABLE btp.tenders ADD COLUMN budget_max NUMERIC';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'tenders' AND column_name = 'evaluation_criteria') THEN
            EXECUTE 'ALTER TABLE btp.tenders ADD COLUMN evaluation_criteria JSONB DEFAULT ''{}''::jsonb';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'tenders' AND column_name = 'eligibility_requirements') THEN
            EXECUTE 'ALTER TABLE btp.tenders ADD COLUMN eligibility_requirements JSONB DEFAULT ''[]''::jsonb';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'tenders' AND column_name = 'contract_duration') THEN
            EXECUTE 'ALTER TABLE btp.tenders ADD COLUMN contract_duration INTEGER';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'tenders' AND column_name = 'award_criteria') THEN
            EXECUTE 'ALTER TABLE btp.tenders ADD COLUMN award_criteria TEXT';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'tenders' AND column_name = 'tender_category') THEN
            EXECUTE 'ALTER TABLE btp.tenders ADD COLUMN tender_category TEXT';
        END IF;
        RAISE NOTICE '✅ btp.tenders enrichie';
    ELSE
        RAISE NOTICE '⏭️ btp.tenders n''existe pas';
    END IF;
END $$;