-- Update first step to in_progress status for testing
UPDATE tender_steps 
SET status = 'in_progress', updated_at = NOW()
WHERE id = '8602c18c-663c-4906-aea7-efef1055c043';

-- Update RLS policy to allow users to view all tender steps for testing
DROP POLICY IF EXISTS "Allow public access to tender_steps" ON tender_steps;
CREATE POLICY "Allow public access to tender_steps" ON tender_steps FOR ALL USING (true);

-- Update RLS policy to allow users to manage tender step documents
DROP POLICY IF EXISTS "Allow public access to tender_step_documents" ON tender_step_documents;
CREATE POLICY "Allow public access to tender_step_documents" ON tender_step_documents FOR ALL USING (true);