-- =============================================================================
-- MIGRATION: enhance_materials
-- Description: Ajoute des colonnes à btp.materials
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'btp' AND tablename = 'materials') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'materials' AND column_name = 'supplier_id') THEN
            EXECUTE 'ALTER TABLE btp.materials ADD COLUMN supplier_id UUID';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'materials' AND column_name = 'material_code') THEN
            EXECUTE 'ALTER TABLE btp.materials ADD COLUMN material_code TEXT UNIQUE';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'materials' AND column_name = 'minimum_stock') THEN
            EXECUTE 'ALTER TABLE btp.materials ADD COLUMN minimum_stock NUMERIC DEFAULT 0';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'materials' AND column_name = 'maximum_stock') THEN
            EXECUTE 'ALTER TABLE btp.materials ADD COLUMN maximum_stock NUMERIC';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'materials' AND column_name = 'lead_time_days') THEN
            EXECUTE 'ALTER TABLE btp.materials ADD COLUMN lead_time_days INTEGER DEFAULT 0';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'materials' AND column_name = 'quality_grade') THEN
            EXECUTE 'ALTER TABLE btp.materials ADD COLUMN quality_grade TEXT';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'materials' AND column_name = 'technical_specifications') THEN
            EXECUTE 'ALTER TABLE btp.materials ADD COLUMN technical_specifications JSONB DEFAULT ''{}''::jsonb';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'materials' AND column_name = 'material_status') THEN
            EXECUTE 'ALTER TABLE btp.materials ADD COLUMN material_status TEXT DEFAULT ''active'' CHECK (material_status IN (''active'', ''discontinued'', ''pending''))';
        END IF;
        RAISE NOTICE '✅ btp.materials enrichie';
    ELSE
        RAISE NOTICE '⏭️ btp.materials n''existe pas';
    END IF;
END $$;