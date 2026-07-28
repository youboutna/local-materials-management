-- =============================================================================
-- MIGRATION: create_suppliers_table
-- Description: Crée la table btp.suppliers
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.suppliers (
    id UUID DEFAULT gen_random_uuid(),
    name TEXT,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    registration_number TEXT,
    tax_id TEXT,
    status TEXT DEFAULT 'active',
    rating NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT suppliers_pkey PRIMARY KEY (id), 
    category TEXT,
);

ALTER TABLE btp.suppliers ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_suppliers_name ON btp.suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_email ON btp.suppliers(email);
CREATE INDEX IF NOT EXISTS idx_suppliers_category  ON btp.suppliers(category);

GRANT SELECT ON btp.suppliers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.suppliers TO authenticated;