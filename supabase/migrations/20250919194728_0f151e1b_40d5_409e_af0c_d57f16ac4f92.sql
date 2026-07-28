-- Enable RLS and open access for workflow tables used by the UI
-- NOTE: This migration is to unblock fetching, updating dates, status and uploading/associating documents for tender workflow steps.

-- 1) Ensure RLS is enabled
ALTER TABLE IF EXISTS btp.tender_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS btp.tender_step_documents ENABLE ROW LEVEL SECURITY;

-- 2) Create permissive policies for anon/auth (testing + demo)
-- tender_steps policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'btp' AND tablename = 'tender_steps' AND policyname = 'Allow select on tender_steps'
  ) THEN
    CREATE POLICY "Allow select on tender_steps" ON btp.tender_steps FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'btp' AND tablename = 'tender_steps' AND policyname = 'Allow insert on tender_steps'
  ) THEN
    CREATE POLICY "Allow insert on tender_steps" ON btp.tender_steps FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'btp' AND tablename = 'tender_steps' AND policyname = 'Allow update on tender_steps'
  ) THEN
    CREATE POLICY "Allow update on tender_steps" ON btp.tender_steps FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'btp' AND tablename = 'tender_steps' AND policyname = 'Allow delete on tender_steps'
  ) THEN
    CREATE POLICY "Allow delete on tender_steps" ON btp.tender_steps FOR DELETE USING (true);
  END IF;
END $$;

-- tender_step_documents policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'btp' AND tablename = 'tender_step_documents' AND policyname = 'Allow select on tender_step_documents'
  ) THEN
    CREATE POLICY "Allow select on tender_step_documents" ON btp.tender_step_documents FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'btp' AND tablename = 'tender_step_documents' AND policyname = 'Allow insert on tender_step_documents'
  ) THEN
    CREATE POLICY "Allow insert on tender_step_documents" ON btp.tender_step_documents FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'btp' AND tablename = 'tender_step_documents' AND policyname = 'Allow update on tender_step_documents'
  ) THEN
    CREATE POLICY "Allow update on tender_step_documents" ON btp.tender_step_documents FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'btp' AND tablename = 'tender_step_documents' AND policyname = 'Allow delete on tender_step_documents'
  ) THEN
    CREATE POLICY "Allow delete on tender_step_documents" ON btp.tender_step_documents FOR DELETE USING (true);
  END IF;
END $$;

-- 3) Create the trigger function first if it doesn't exist
CREATE OR REPLACE FUNCTION btp.update_tender_step_dates()
RETURNS TRIGGER AS $$
BEGIN
  -- Update updated_at timestamp
  NEW.updated_at = NOW();
  
  -- Set actual_completion_date when status changes to 'completed' or similar
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.actual_completion_date = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4) Attach update timestamps/logic trigger to tender_steps (optional but useful)
DROP TRIGGER IF EXISTS tender_steps_update_dates ON btp.tender_steps;
CREATE TRIGGER tender_steps_update_dates
BEFORE UPDATE ON btp.tender_steps
FOR EACH ROW
EXECUTE FUNCTION btp.update_tender_step_dates();

-- 5) Make sure these tables are enabled for realtime if needed (non-critical)
-- COMMENTED OUT by default:
-- ALTER TABLE btp.tender_steps REPLICA IDENTITY FULL;
-- ALTER TABLE btp.tender_step_documents REPLICA IDENTITY FULL;
-- ALTER PUBLICATION supabase_realtime ADD TABLE btp.tender_steps;
-- ALTER PUBLICATION supabase_realtime ADD TABLE btp.tender_step_documents;

-- 6) Add some workflow steps for testing (using btp schema)
/** INSERT INTO btp.tender_steps (
  id,
  tender_id,
  step_order,
  step_name,
  description,
  status,
  due_date,
  created_at,
  updated_at
) VALUES 
  (
    gen_random_uuid(),
    (SELECT id FROM btp.tenders LIMIT 1),
    1,
    'Step 1: Initial Review',
    'Initial review of tender documents',
    'pending',
    NOW() + INTERVAL '7 days',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM btp.tenders LIMIT 1),
    2,
    'Step 2: Technical Evaluation',
    'Technical evaluation of the proposal',
    'pending',
    NOW() + INTERVAL '14 days',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM btp.tenders LIMIT 1),
    3,
    'Step 3: Financial Review',
    'Financial review and budget analysis',
    'pending',
    NOW() + INTERVAL '21 days',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;
 **/