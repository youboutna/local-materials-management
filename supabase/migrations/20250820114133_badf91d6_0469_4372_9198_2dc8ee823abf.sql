-- First clean up invalid project references in documents table
UPDATE btp.documents 
SET project_id = NULL 
WHERE project_id IS NOT NULL 
AND project_id NOT IN (SELECT id FROM btp.projects);

-- Now add the foreign key constraint
/* ALTER TABLE btp.documents 
ADD CONSTRAINT IF NOT EXISTS documents_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES btp.projects(id) ON DELETE SET NULL;*/

-- Create a function for secure project search (only returns title and reference for autocomplete)
CREATE OR REPLACE FUNCTION btp.search_projects_autocomplete(search_term text DEFAULT '')
RETURNS TABLE(
    id uuid,
    title text,
    reference text
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        p.id,
        p.title,
        COALESCE(p.reference, '') as reference
    FROM btp.projects p
    WHERE 
        (search_term = '' OR 
         p.title ILIKE '%' || search_term || '%' OR 
         p.reference ILIKE '%' || search_term || '%')
    ORDER BY p.title
    LIMIT 50;
$$;