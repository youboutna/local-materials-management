-- First clean up invalid project references in documents table
UPDATE public.documents 
SET project_id = NULL 
WHERE project_id IS NOT NULL 
AND project_id NOT IN (SELECT id FROM public.projects);

-- Now add the foreign key constraint
ALTER TABLE public.documents 
ADD CONSTRAINT documents_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

-- Create a function for secure project search (only returns title and project_reference for autocomplete)
CREATE OR REPLACE FUNCTION public.search_projects_autocomplete(search_term text DEFAULT '')
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
    FROM public.projects p
    WHERE 
        (search_term = '' OR 
         p.title ILIKE '%' || search_term || '%' OR 
         p.project_reference ILIKE '%' || search_term || '%')
    ORDER BY p.title
    LIMIT 50;
$$;