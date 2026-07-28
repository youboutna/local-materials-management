-- =============================================================================
-- MIGRATION: create_materials_table
-- Description: Crée la table btp.materials pour la gestion des matériaux
-- =============================================================================

-- 1. Créer la table materials dans le schéma btp
CREATE TABLE IF NOT EXISTS btp.materials (
    id UUID DEFAULT gen_random_uuid(),
    name TEXT,
    description TEXT,
    category TEXT,
    subcategory TEXT,
    unit TEXT,
    quantity NUMERIC DEFAULT 0,
    available_quantity NUMERIC DEFAULT 0,
    min_quantity NUMERIC DEFAULT 0,
    price_per_unit NUMERIC DEFAULT 0,
    
    -- Identifiants
    sku TEXT UNIQUE,
    ean TEXT,
    gtin TEXT,
    asin TEXT,
    
    -- Localisation
    localisation JSONB DEFAULT '{}',
    coordinates_latitude NUMERIC,
    coordinates_longitude NUMERIC,
    adresse JSONB DEFAULT '{}',
    forme TEXT,
    origin_location TEXT,
    
    -- Image et labels
    image TEXT,
    tags JSONB DEFAULT '[]',
    multilang_labels JSONB DEFAULT '{}',
    
    -- Statut et suivi
    material_status TEXT DEFAULT 'active' CHECK (material_status IN ('active', 'discontinued', 'pending')),
    timeline JSONB DEFAULT '[]',
    last_restock TIMESTAMPTZ,
    
    -- Supplier (stocké en JSON pour flexibilité)
    supplier JSONB DEFAULT '{}',
    
    -- Workspace
    workspace_id UUID,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT materials_pkey PRIMARY KEY (id)
);

-- 2. Activer RLS
ALTER TABLE btp.materials ENABLE ROW LEVEL SECURITY;

-- 3. Index
CREATE INDEX IF NOT EXISTS idx_materials_name ON btp.materials(name);
CREATE INDEX IF NOT EXISTS idx_materials_category ON btp.materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_sku ON btp.materials(sku);
CREATE INDEX IF NOT EXISTS idx_materials_status ON btp.materials(material_status);
CREATE INDEX IF NOT EXISTS idx_materials_workspace_id ON btp.materials(workspace_id);
CREATE INDEX IF NOT EXISTS idx_materials_localisation ON btp.materials USING GIN (localisation jsonb_path_ops);

-- 4. Trigger updated_at
CREATE TRIGGER set_timestamp_materials
    BEFORE UPDATE ON btp.materials
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- 5. Permissions
GRANT SELECT ON btp.materials TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.materials TO authenticated;

-- 6. Politiques RLS
DROP POLICY IF EXISTS select_materials ON btp.materials;
CREATE POLICY select_materials ON btp.materials
    FOR SELECT TO public
    USING (auth.role() IN ('admin', 'director', 'manager') OR workspace_id IS NOT NULL);

DROP POLICY IF EXISTS insert_materials ON btp.materials;
CREATE POLICY insert_materials ON btp.materials
    FOR INSERT TO public
    WITH CHECK (auth.role() IN ('admin', 'director', 'manager'));

DROP POLICY IF EXISTS update_materials ON btp.materials;
CREATE POLICY update_materials ON btp.materials
    FOR UPDATE TO public
    USING (auth.role() IN ('admin', 'director', 'manager'))
    WITH CHECK (auth.role() IN ('admin', 'director', 'manager'));

DROP POLICY IF EXISTS delete_materials ON btp.materials;
CREATE POLICY delete_materials ON btp.materials
    FOR DELETE TO public
    USING (auth.role() IN ('admin', 'director', 'manager'));

-- 7. Commentaires
COMMENT ON TABLE btp.materials IS 'Table des matériaux';
COMMENT ON COLUMN btp.materials.sku IS 'Stock Keeping Unit - identifiant unique';
COMMENT ON COLUMN btp.materials.ean IS 'European Article Number';
COMMENT ON COLUMN btp.materials.gtin IS 'Global Trade Item Number';
COMMENT ON COLUMN btp.materials.asin IS 'Amazon Standard Identification Number';
COMMENT ON COLUMN btp.materials.localisation IS 'Localisation géographique (JSON)';
COMMENT ON COLUMN btp.materials.material_status IS 'Statut du matériau (active, discontinued, pending)';
COMMENT ON COLUMN btp.materials.supplier IS 'Informations du fournisseur (JSON)';
COMMENT ON COLUMN btp.materials.timeline IS 'Historique des mouvements (JSON)';