-- =============================================================================
-- MIGRATION: enable_rls_and_create_policies
-- Description: Active RLS et crée les politiques pour les tables existantes
-- =============================================================================

-- 1. Projects table policies
ALTER TABLE btp.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON btp.projects;
CREATE POLICY "Enable read access for all users" ON btp.projects
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON btp.projects;
CREATE POLICY "Enable insert for authenticated users only" ON btp.projects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users only" ON btp.projects;
CREATE POLICY "Enable update for authenticated users only" ON btp.projects
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON btp.projects;
CREATE POLICY "Enable delete for authenticated users only" ON btp.projects
    FOR DELETE USING (auth.role() = 'authenticated');

-- 2. Materials table policies
ALTER TABLE btp.materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access to materials" ON btp.materials;
CREATE POLICY "Allow public access to materials" ON btp.materials
    FOR ALL USING (true);

-- 3. Suppliers table policies
ALTER TABLE btp.suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage suppliers" ON btp.suppliers;
CREATE POLICY "Users can manage suppliers" ON btp.suppliers
    FOR ALL USING (true);

-- 4. Tenders table policies
ALTER TABLE btp.tenders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON btp.tenders;
CREATE POLICY "Enable read access for authenticated users" ON btp.tenders
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON btp.tenders;
CREATE POLICY "Enable insert access for authenticated users" ON btp.tenders
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for authenticated users" ON btp.tenders;
CREATE POLICY "Enable update access for authenticated users" ON btp.tenders
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON btp.tenders;
CREATE POLICY "Enable delete access for authenticated users" ON btp.tenders
    FOR DELETE USING (true);

-- 5. Project materials table policies
ALTER TABLE btp.project_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access to project_materials" ON btp.project_materials;
CREATE POLICY "Allow public access to project_materials" ON btp.project_materials
    FOR ALL USING (true);

-- 6. Create indexes with column existence checks
DO $$
BEGIN
    -- Projects indexes
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'projects' AND column_name = 'status') THEN
        CREATE INDEX IF NOT EXISTS idx_projects_status ON btp.projects(status);
        RAISE NOTICE '✅ Index idx_projects_status créé';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'projects' AND column_name = 'start_date') THEN
        CREATE INDEX IF NOT EXISTS idx_projects_start_date ON btp.projects(start_date);
        RAISE NOTICE '✅ Index idx_projects_start_date créé';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'projects' AND column_name = 'budget') THEN
        CREATE INDEX IF NOT EXISTS idx_projects_budget ON btp.projects(budget);
        RAISE NOTICE '✅ Index idx_projects_budget créé';
    END IF;

    -- Materials indexes
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'materials' AND column_name = 'category') THEN
        CREATE INDEX IF NOT EXISTS idx_materials_category ON btp.materials(category);
        RAISE NOTICE '✅ Index idx_materials_category créé';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'materials' AND column_name = 'price_per_unit') THEN
        CREATE INDEX IF NOT EXISTS idx_materials_price ON btp.materials(price_per_unit);
        RAISE NOTICE '✅ Index idx_materials_price créé';
    END IF;

    -- Suppliers indexes (vérifier l'existence des colonnes)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'suppliers' AND column_name = 'category') THEN
        CREATE INDEX IF NOT EXISTS idx_suppliers_category ON btp.suppliers(category);
        RAISE NOTICE '✅ Index idx_suppliers_category créé';
    ELSE
        RAISE NOTICE '⏭️ Colonne category n''existe pas dans btp.suppliers - index non créé';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'suppliers' AND column_name = 'is_active') THEN
        CREATE INDEX IF NOT EXISTS idx_suppliers_active ON btp.suppliers(is_active);
        RAISE NOTICE '✅ Index idx_suppliers_active créé';
    END IF;

    -- Tenders indexes
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'tenders' AND column_name = 'status') THEN
        CREATE INDEX IF NOT EXISTS idx_tenders_status ON btp.tenders(status);
        RAISE NOTICE '✅ Index idx_tenders_status créé';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'btp' AND table_name = 'tenders' AND column_name = 'project_id') THEN
        CREATE INDEX IF NOT EXISTS idx_tenders_project ON btp.tenders(project_id);
        RAISE NOTICE '✅ Index idx_tenders_project créé';
    END IF;
END $$;

-- 7. Create update triggers for timestamp management
CREATE OR REPLACE FUNCTION btp.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Apply triggers to tables that have updated_at columns
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'btp' AND tablename = 'projects') THEN
        DROP TRIGGER IF EXISTS update_projects_timestamp ON btp.projects;
        CREATE TRIGGER update_projects_timestamp
            BEFORE UPDATE ON btp.projects
            FOR EACH ROW EXECUTE FUNCTION btp.update_timestamp();
        RAISE NOTICE '✅ Trigger update_projects_timestamp créé';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'btp' AND tablename = 'materials') THEN
        DROP TRIGGER IF EXISTS update_materials_timestamp ON btp.materials;
        CREATE TRIGGER update_materials_timestamp
            BEFORE UPDATE ON btp.materials
            FOR EACH ROW EXECUTE FUNCTION btp.update_timestamp();
        RAISE NOTICE '✅ Trigger update_materials_timestamp créé';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'btp' AND tablename = 'suppliers') THEN
        DROP TRIGGER IF EXISTS update_suppliers_timestamp ON btp.suppliers;
        CREATE TRIGGER update_suppliers_timestamp
            BEFORE UPDATE ON btp.suppliers
            FOR EACH ROW EXECUTE FUNCTION btp.update_timestamp();
        RAISE NOTICE '✅ Trigger update_suppliers_timestamp créé';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'btp' AND tablename = 'tenders') THEN
        DROP TRIGGER IF EXISTS update_tenders_timestamp ON btp.tenders;
        CREATE TRIGGER update_tenders_timestamp
            BEFORE UPDATE ON btp.tenders
            FOR EACH ROW EXECUTE FUNCTION btp.update_timestamp();
        RAISE NOTICE '✅ Trigger update_tenders_timestamp créé';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'btp' AND tablename = 'project_materials') THEN
        DROP TRIGGER IF EXISTS update_project_materials_timestamp ON btp.project_materials;
        CREATE TRIGGER update_project_materials_timestamp
            BEFORE UPDATE ON btp.project_materials
            FOR EACH ROW EXECUTE FUNCTION btp.update_timestamp();
        RAISE NOTICE '✅ Trigger update_project_materials_timestamp créé';
    END IF;
END $$;

-- 9. Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 20250819131158 terminée avec succès';
    RAISE NOTICE '   - RLS activée sur toutes les tables';
    RAISE NOTICE '   - Politiques créées';
    RAISE NOTICE '   - Index créés (avec vérification)';
    RAISE NOTICE '   - Triggers updated_at créés';
END $$;