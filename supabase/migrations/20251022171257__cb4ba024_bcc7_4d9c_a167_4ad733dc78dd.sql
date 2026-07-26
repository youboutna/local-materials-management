-- Add foreign key relationship between supplier_payment_requests and projects
ALTER TABLE supplier_payment_requests 
DROP CONSTRAINT IF EXISTS supplier_payment_requests_project_id_fkey;

ALTER TABLE supplier_payment_requests 
ADD CONSTRAINT supplier_payment_requests_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;