-- Enable RLS and open access for workflow tables used by the UI
-- NOTE: This migration is to unblock fetching, updating dates, status and uploading/associating documents for tender workflow steps.

-- 1) Ensure RLS is enabled
ALTER TABLE IF EXISTS public.tender_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tender_step_documents ENABLE ROW LEVEL SECURITY;

-- 2) Create permissive policies for anon/auth (testing + demo)
-- tender_steps policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tender_steps' AND policyname = 'Allow select on tender_steps'
  ) THEN
    CREATE POLICY "Allow select on tender_steps" ON public.tender_steps FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tender_steps' AND policyname = 'Allow insert on tender_steps'
  ) THEN
    CREATE POLICY "Allow insert on tender_steps" ON public.tender_steps FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tender_steps' AND policyname = 'Allow update on tender_steps'
  ) THEN
    CREATE POLICY "Allow update on tender_steps" ON public.tender_steps FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tender_steps' AND policyname = 'Allow delete on tender_steps'
  ) THEN
    CREATE POLICY "Allow delete on tender_steps" ON public.tender_steps FOR DELETE USING (true);
  END IF;
END $$;

-- tender_step_documents policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tender_step_documents' AND policyname = 'Allow select on tender_step_documents'
  ) THEN
    CREATE POLICY "Allow select on tender_step_documents" ON public.tender_step_documents FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tender_step_documents' AND policyname = 'Allow insert on tender_step_documents'
  ) THEN
    CREATE POLICY "Allow insert on tender_step_documents" ON public.tender_step_documents FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tender_step_documents' AND policyname = 'Allow update on tender_step_documents'
  ) THEN
    CREATE POLICY "Allow update on tender_step_documents" ON public.tender_step_documents FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tender_step_documents' AND policyname = 'Allow delete on tender_step_documents'
  ) THEN
    CREATE POLICY "Allow delete on tender_step_documents" ON public.tender_step_documents FOR DELETE USING (true);
  END IF;
END $$;

-- 3) Attach update timestamps/logic trigger to tender_steps (optional but useful)
-- This trigger updates actual_completion_date when status changes and ensures updated_at is refreshed
DROP TRIGGER IF EXISTS tender_steps_update_dates ON public.tender_steps;
CREATE TRIGGER tender_steps_update_dates
BEFORE UPDATE ON public.tender_steps
FOR EACH ROW
EXECUTE FUNCTION public.update_tender_step_dates();

-- 4) Make sure these tables are enabled for realtime if needed (non-critical)
-- COMMENTED OUT by default:
-- ALTER TABLE public.tender_steps REPLICA IDENTITY FULL;
-- ALTER TABLE public.tender_step_documents REPLICA IDENTITY FULL;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.tender_steps;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.tender_step_documents;