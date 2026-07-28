-- =============================================================================
-- MIGRATION: create_autocomplete_function
-- Description: Nettoie les références invalides et crée la fonction de recherche
-- =============================================================================

-- 1. Nettoyer les références invalides dans documents
UPDATE btp.documents 
SET project_id = NULL 
WHERE project_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM btp.projects WHERE id = documents.project_id);

-- 2. Supprimer la fonction existante si elle existe avec un type de retour différent
DROP FUNCTION IF EXISTS btp.search_projects_autocomplete(text);

-- 3. Créer la fonction de recherche
CREATE OR REPLACE FUNCTION btp.search_projects_autocomplete(search_term text DEFAULT '')
RETURNS TABLE(
    id uuid,
    title text,
    project_reference text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        p.id,
        p.title,
        COALESCE(p.project_reference, '') as project_reference
    FROM btp.projects p
    WHERE 
        (search_term = '' OR 
         p.title ILIKE '%' || search_term || '%' OR 
         p.project_reference ILIKE '%' || search_term || '%')
    ORDER BY p.title
    LIMIT 50;
$$;

-- 4. Accorder les permissions
GRANT EXECUTE ON FUNCTION btp.search_projects_autocomplete(text) TO authenticated, anon;

-- 5. Commentaire
COMMENT ON FUNCTION btp.search_projects_autocomplete(text) IS 'Recherche de projets pour l''autocomplétion (retourne id, title, project_reference)';

-- 6. Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 20250820114151 terminée avec succès';
    RAISE NOTICE '   - Références invalides nettoyées dans btp.documents';
    RAISE NOTICE '   - Fonction btp.search_projects_autocomplete créée';
END $$;