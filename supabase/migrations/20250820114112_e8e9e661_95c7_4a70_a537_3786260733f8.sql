-- Fix documents table to have proper foreign key to projects table
-- Also create a secure project search for supplier portal

-- Add missing columns to projects table
ALTER TABLE btp.projects 
ADD COLUMN IF NOT EXISTS current_stage TEXT,
ADD COLUMN IF NOT EXISTS reference TEXT;

-- First, add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'documents_project_id_fkey'
        AND table_name = 'documents'
    ) THEN
        ALTER TABLE btp.documents 
        ADD CONSTRAINT documents_project_id_fkey 
        FOREIGN KEY (project_id) REFERENCES btp.projects(id) ON DELETE SET NULL;
    END IF;
END $$;

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