-- =============================================================================
-- MIGRATION: create_project_materials
-- Description: Crée la table btp.project_materials pour la gestion des matériaux de projet
-- =============================================================================

-- 1. Créer la table project_materials
CREATE TABLE IF NOT EXISTS btp.project_materials (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL,
    material_id UUID NOT NULL,
    phase_id UUID,
    quantity NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Foreign keys
    FOREIGN KEY (project_id) REFERENCES btp.projects(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES btp.materials(id) ON DELETE CASCADE,
    FOREIGN KEY (phase_id) REFERENCES btp.phases(id) ON DELETE SET NULL
);

-- 2. Créer les index
CREATE INDEX IF NOT EXISTS idx_project_materials_project_id ON btp.project_materials(project_id);
CREATE INDEX IF NOT EXISTS idx_project_materials_material_id ON btp.project_materials(material_id);
CREATE INDEX IF NOT EXISTS idx_project_materials_phase_id ON btp.project_materials(phase_id);

-- 3. Activer RLS
ALTER TABLE btp.project_materials ENABLE ROW LEVEL SECURITY;

-- 4. Politiques RLS
DROP POLICY IF EXISTS "Users can view project materials" ON btp.project_materials;
CREATE POLICY "Users can view project materials"
ON btp.project_materials
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert project materials" ON btp.project_materials;
CREATE POLICY "Users can insert project materials"
ON btp.project_materials
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update project materials" ON btp.project_materials;
CREATE POLICY "Users can update project materials"
ON btp.project_materials
FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete project materials" ON btp.project_materials;
CREATE POLICY "Users can delete project materials"
ON btp.project_materials
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- 5. Permissions
GRANT SELECT ON btp.project_materials TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.project_materials TO authenticated;

-- 6. Trigger pour updated_at
DROP TRIGGER IF EXISTS update_project_materials_updated_at ON btp.project_materials;
CREATE TRIGGER update_project_materials_updated_at
    BEFORE UPDATE ON btp.project_materials
    FOR EACH ROW
    EXECUTE FUNCTION btp.update_timestamp();

-- 7. Commentaires
COMMENT ON TABLE btp.project_materials IS 'Table de liaison entre les projets et les matériaux';
COMMENT ON COLUMN btp.project_materials.id IS 'Identifiant unique';
COMMENT ON COLUMN btp.project_materials.project_id IS 'Référence au projet';
COMMENT ON COLUMN btp.project_materials.material_id IS 'Référence au matériau';
COMMENT ON COLUMN btp.project_materials.phase_id IS 'Référence à la phase (optionnel)';
COMMENT ON COLUMN btp.project_materials.quantity IS 'Quantité du matériau pour le projet';
COMMENT ON COLUMN btp.project_materials.created_at IS 'Date de création';
COMMENT ON COLUMN btp.project_materials.updated_at IS 'Date de dernière mise à jour';

-- 8. Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 20250813000000_create_project_materials terminée avec succès';
    RAISE NOTICE '   - Table btp.project_materials créée';
    RAISE NOTICE '   - Index créés';
    RAISE NOTICE '   - RLS activée avec politiques';
    RAISE NOTICE '   - Trigger updated_at créé';
END $$;