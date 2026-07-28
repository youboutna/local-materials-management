-- =============================================================================
-- MIGRATION: create_employees
-- Description: Crée la table btp.employees pour la gestion des employés
-- Alignée avec le type employees du DTO
-- =============================================================================

-- 1. Créer la table employees dans le schéma btp
CREATE TABLE IF NOT EXISTS btp.employees (
    id UUID DEFAULT gen_random_uuid(),
    employee_id TEXT,
    user_id UUID,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    position TEXT,
    department TEXT,
    hire_date DATE,
    salary NUMERIC,
    skills TEXT[],
    certifications JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    manager_id UUID,
    superior_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT employees_pkey PRIMARY KEY (id),
    CONSTRAINT employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT employees_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES btp.employees(id) ON DELETE SET NULL,
    CONSTRAINT employees_superior_id_fkey FOREIGN KEY (superior_id) REFERENCES btp.employees(id) ON DELETE SET NULL
);

-- 2. Activer RLS
ALTER TABLE btp.employees ENABLE ROW LEVEL SECURITY;

-- 3. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON btp.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON btp.employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_department ON btp.employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_position ON btp.employees(position);
CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON btp.employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_superior_id ON btp.employees(superior_id);
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON btp.employees(is_active);

-- 4. Trigger updated_at
CREATE TRIGGER set_timestamp_employees
    BEFORE UPDATE ON btp.employees
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- 5. Permissions
GRANT SELECT ON btp.employees TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.employees TO authenticated;

-- 6. Politiques RLS
DROP POLICY IF EXISTS select_employees ON btp.employees;
CREATE POLICY select_employees ON btp.employees
    FOR SELECT TO public
    USING (auth.role() IN ('admin', 'director', 'manager') OR user_id = auth.uid());

DROP POLICY IF EXISTS insert_employees ON btp.employees;
CREATE POLICY insert_employees ON btp.employees
    FOR INSERT TO public
    WITH CHECK (auth.role() IN ('admin', 'director', 'manager'));

DROP POLICY IF EXISTS update_employees ON btp.employees;
CREATE POLICY update_employees ON btp.employees
    FOR UPDATE TO public
    USING (auth.role() IN ('admin', 'director', 'manager'))
    WITH CHECK (auth.role() IN ('admin', 'director', 'manager'));

DROP POLICY IF EXISTS delete_employees ON btp.employees;
CREATE POLICY delete_employees ON btp.employees
    FOR DELETE TO public
    USING (auth.role() IN ('admin', 'director', 'manager'));

-- 7. Commentaires
COMMENT ON TABLE btp.employees IS 'Table des employés';
COMMENT ON COLUMN btp.employees.employee_id IS 'Identifiant interne de l''employé';
COMMENT ON COLUMN btp.employees.user_id IS 'Référence vers auth.users (optionnelle)';
COMMENT ON COLUMN btp.employees.manager_id IS 'Référence vers le manager (auto-référence)';
COMMENT ON COLUMN btp.employees.superior_id IS 'Référence vers le supérieur hiérarchique (auto-référence)';
COMMENT ON COLUMN btp.employees.skills IS 'Liste des compétences';
COMMENT ON COLUMN btp.employees.certifications IS 'Certifications (JSON)';