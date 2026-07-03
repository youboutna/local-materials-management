-- Lot 1: Tenders — create missing btp mirror tables, backfill, RLS, GRANTs, triggers.

-- ============================================================
-- 1. CREATE btp mirrors from public (structure + defaults + indexes)
-- ============================================================
CREATE TABLE IF NOT EXISTS btp.tender_estimates (LIKE public.tender_estimates INCLUDING ALL);
CREATE TABLE IF NOT EXISTS btp.tender_estimate_items (LIKE public.tender_estimate_items INCLUDING ALL);
CREATE TABLE IF NOT EXISTS btp.tender_document_submissions (LIKE public.tender_document_submissions INCLUDING ALL);
CREATE TABLE IF NOT EXISTS btp.tender_submission_documents (LIKE public.tender_submission_documents INCLUDING ALL);
CREATE TABLE IF NOT EXISTS btp.tender_suppliers (LIKE public.tender_suppliers INCLUDING ALL);
CREATE TABLE IF NOT EXISTS btp.tender_workflow_status (LIKE public.tender_workflow_status INCLUDING ALL);
CREATE TABLE IF NOT EXISTS btp.tender_sharing_access_logs (LIKE public.tender_sharing_access_logs INCLUDING ALL);
CREATE TABLE IF NOT EXISTS btp.submission_access_logs (LIKE public.submission_access_logs INCLUDING ALL);

-- ============================================================
-- 2. Foreign keys (all pointing to btp where possible)
-- ============================================================
DO $$ BEGIN
  -- tender_estimate_items -> tender_estimates
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='tender_estimate_items_estimate_id_fkey' AND connamespace='btp'::regnamespace) THEN
    ALTER TABLE btp.tender_estimate_items
      ADD CONSTRAINT tender_estimate_items_estimate_id_fkey
      FOREIGN KEY (estimate_id) REFERENCES btp.tender_estimates(id) ON DELETE CASCADE;
  END IF;

  -- tender_submission_documents -> btp.tender_submissions + btp.documents
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='tender_submission_documents_submission_id_fkey' AND connamespace='btp'::regnamespace) THEN
    ALTER TABLE btp.tender_submission_documents
      ADD CONSTRAINT tender_submission_documents_submission_id_fkey
      FOREIGN KEY (submission_id) REFERENCES btp.tender_submissions(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='tender_submission_documents_document_id_fkey' AND connamespace='btp'::regnamespace) THEN
    ALTER TABLE btp.tender_submission_documents
      ADD CONSTRAINT tender_submission_documents_document_id_fkey
      FOREIGN KEY (document_id) REFERENCES btp.documents(id) ON DELETE CASCADE;
  END IF;

  -- tender_suppliers -> btp.tenders
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='tender_suppliers_tender_id_fkey' AND connamespace='btp'::regnamespace) THEN
    ALTER TABLE btp.tender_suppliers
      ADD CONSTRAINT tender_suppliers_tender_id_fkey
      FOREIGN KEY (tender_id) REFERENCES btp.tenders(id) ON DELETE CASCADE;
  END IF;

  -- tender_workflow_status -> btp.tenders
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='tender_workflow_status_tender_id_fkey' AND connamespace='btp'::regnamespace) THEN
    ALTER TABLE btp.tender_workflow_status
      ADD CONSTRAINT tender_workflow_status_tender_id_fkey
      FOREIGN KEY (tender_id) REFERENCES btp.tenders(id) ON DELETE CASCADE;
  END IF;

  -- tender_sharing_access_logs -> btp.tender_sharing_secrets
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='tender_sharing_access_logs_sharing_secret_id_fkey' AND connamespace='btp'::regnamespace) THEN
    ALTER TABLE btp.tender_sharing_access_logs
      ADD CONSTRAINT tender_sharing_access_logs_sharing_secret_id_fkey
      FOREIGN KEY (sharing_secret_id) REFERENCES btp.tender_sharing_secrets(id) ON DELETE CASCADE;
  END IF;

  -- submission_access_logs -> btp.tender_submissions
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='submission_access_logs_submission_id_fkey' AND connamespace='btp'::regnamespace) THEN
    ALTER TABLE btp.submission_access_logs
      ADD CONSTRAINT submission_access_logs_submission_id_fkey
      FOREIGN KEY (submission_id) REFERENCES btp.tender_submissions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 3. Backfill data from public → btp (idempotent)
-- ============================================================
INSERT INTO btp.tender_estimates              SELECT * FROM public.tender_estimates              ON CONFLICT (id) DO NOTHING;
INSERT INTO btp.tender_estimate_items         SELECT * FROM public.tender_estimate_items         ON CONFLICT (id) DO NOTHING;
INSERT INTO btp.tender_document_submissions   SELECT * FROM public.tender_document_submissions   ON CONFLICT (id) DO NOTHING;
INSERT INTO btp.tender_submission_documents   SELECT * FROM public.tender_submission_documents   ON CONFLICT (id) DO NOTHING;
INSERT INTO btp.tender_suppliers              SELECT * FROM public.tender_suppliers              ON CONFLICT DO NOTHING;
INSERT INTO btp.tender_workflow_status        SELECT * FROM public.tender_workflow_status        ON CONFLICT (id) DO NOTHING;
INSERT INTO btp.tender_sharing_access_logs    SELECT * FROM public.tender_sharing_access_logs    ON CONFLICT (id) DO NOTHING;
INSERT INTO btp.submission_access_logs        SELECT * FROM public.submission_access_logs        ON CONFLICT (id) DO NOTHING;

-- Backfill previously-created btp mirrors that may have drifted (idempotent)
INSERT INTO btp.tenders                       SELECT * FROM public.tenders                       ON CONFLICT (id) DO NOTHING;
INSERT INTO btp.tender_submissions            SELECT * FROM public.tender_submissions            ON CONFLICT (id) DO NOTHING;
INSERT INTO btp.tender_lots                   SELECT * FROM public.tender_lots                   ON CONFLICT (id) DO NOTHING;
INSERT INTO btp.tender_lot_documents          SELECT * FROM public.tender_lot_documents          ON CONFLICT (id) DO NOTHING;
INSERT INTO btp.tender_sharing_secrets        SELECT * FROM public.tender_sharing_secrets        ON CONFLICT (id) DO NOTHING;
INSERT INTO btp.submission_activity_logs      SELECT * FROM public.submission_activity_logs      ON CONFLICT (id) DO NOTHING;
INSERT INTO btp.document_validation_logs      SELECT * FROM public.document_validation_logs      ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. GRANTs (all btp tender_* tables)
-- ============================================================
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'tender_estimates','tender_estimate_items','tender_document_submissions',
    'tender_submission_documents','tender_suppliers','tender_workflow_status',
    'tender_sharing_access_logs','submission_access_logs',
    'tenders','tender_submissions','tender_lots','tender_lot_documents',
    'tender_sharing_secrets','submission_activity_logs','document_validation_logs',
    'tender_documents','tender_steps','tender_step_documents'
  ])
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON btp.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON btp.%I TO service_role', t);
    EXECUTE format('ALTER TABLE btp.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- ============================================================
-- 5. Policies (simple authenticated CRUD + admin override + system insert for logs)
-- ============================================================

-- tender_estimates
DROP POLICY IF EXISTS "auth_all" ON btp.tender_estimates;
CREATE POLICY "auth_all" ON btp.tender_estimates FOR ALL TO authenticated
  USING (submitted_by = auth.uid() OR public.is_current_user_admin())
  WITH CHECK (submitted_by = auth.uid() OR public.is_current_user_admin());

-- tender_estimate_items
DROP POLICY IF EXISTS "auth_all" ON btp.tender_estimate_items;
CREATE POLICY "auth_all" ON btp.tender_estimate_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM btp.tender_estimates te WHERE te.id = estimate_id AND (te.submitted_by = auth.uid() OR public.is_current_user_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM btp.tender_estimates te WHERE te.id = estimate_id AND (te.submitted_by = auth.uid() OR public.is_current_user_admin())));

-- tender_document_submissions
DROP POLICY IF EXISTS "own_read" ON btp.tender_document_submissions;
DROP POLICY IF EXISTS "own_write" ON btp.tender_document_submissions;
DROP POLICY IF EXISTS "admin_all" ON btp.tender_document_submissions;
CREATE POLICY "own_read"  ON btp.tender_document_submissions FOR SELECT TO authenticated USING (submitted_by = auth.uid() OR public.is_current_user_admin());
CREATE POLICY "own_write" ON btp.tender_document_submissions FOR INSERT TO authenticated WITH CHECK (submitted_by = auth.uid());
CREATE POLICY "admin_all" ON btp.tender_document_submissions FOR UPDATE TO authenticated USING (public.is_current_user_admin());

-- tender_submission_documents
DROP POLICY IF EXISTS "auth_all" ON btp.tender_submission_documents;
CREATE POLICY "auth_all" ON btp.tender_submission_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- tender_suppliers
DROP POLICY IF EXISTS "auth_all" ON btp.tender_suppliers;
CREATE POLICY "auth_all" ON btp.tender_suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- tender_workflow_status
DROP POLICY IF EXISTS "auth_all" ON btp.tender_workflow_status;
CREATE POLICY "auth_all" ON btp.tender_workflow_status FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- tender_sharing_access_logs
DROP POLICY IF EXISTS "auth_read" ON btp.tender_sharing_access_logs;
DROP POLICY IF EXISTS "sys_insert" ON btp.tender_sharing_access_logs;
CREATE POLICY "auth_read"  ON btp.tender_sharing_access_logs FOR SELECT TO authenticated USING (public.is_current_user_admin());
CREATE POLICY "sys_insert" ON btp.tender_sharing_access_logs FOR INSERT TO authenticated WITH CHECK (true);

-- submission_access_logs
DROP POLICY IF EXISTS "admin_read" ON btp.submission_access_logs;
DROP POLICY IF EXISTS "owner_read" ON btp.submission_access_logs;
DROP POLICY IF EXISTS "sys_insert" ON btp.submission_access_logs;
CREATE POLICY "admin_read" ON btp.submission_access_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role_name = ANY(ARRAY['admin','manager','director','evaluator'])));
CREATE POLICY "owner_read" ON btp.submission_access_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM btp.tender_submissions ts WHERE ts.id = submission_id AND ts.user_id = auth.uid()));
CREATE POLICY "sys_insert" ON btp.submission_access_logs FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- 6. Triggers: updated_at + status logging
-- ============================================================
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['tender_estimates','tender_estimate_items','tender_document_submissions','tender_workflow_status'])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON btp.%I', t);
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON btp.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t);
  END LOOP;
END $$;

-- ============================================================
-- 7. Lock down public copies (read-only until Lot cleanup)
-- ============================================================
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'tender_estimates','tender_estimate_items','tender_document_submissions',
    'tender_submission_documents','tender_suppliers','tender_workflow_status',
    'tender_sharing_access_logs','submission_access_logs',
    'tenders','tender_submissions','tender_lots','tender_lot_documents',
    'tender_sharing_secrets','submission_activity_logs','document_validation_logs'
  ])
  LOOP
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE ON public.%I FROM authenticated, anon', t);
  END LOOP;
END $$;