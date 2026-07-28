-- Enable RLS and create proper policies for tender_steps
ALTER TABLE btp.tender_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access to tender_steps" ON btp.tender_steps;
CREATE POLICY "Users can view tender steps" ON btp.tender_steps 
FOR SELECT USING (true);

CREATE POLICY "Users can manage tender steps" ON btp.tender_steps 
FOR ALL USING (true);

-- Enable RLS and create proper policies for tender_step_documents  
ALTER TABLE btp.tender_step_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access to tender_step_documents" ON btp.tender_step_documents;
CREATE POLICY "Users can view tender step documents" ON btp.tender_step_documents 
FOR SELECT USING (true);

CREATE POLICY "Users can manage tender step documents" ON btp.tender_step_documents 
FOR ALL USING (true);