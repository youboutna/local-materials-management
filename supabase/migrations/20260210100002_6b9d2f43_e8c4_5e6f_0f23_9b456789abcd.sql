-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE btp.compliance_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.compliance_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.compliance_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR compliance_items
-- ============================================

-- ADMIN, DIRECTOR - Full access (case-insensitive)
DROP POLICY IF EXISTS "compliance_items_admin_director_full" ON btp.compliance_items;
CREATE POLICY "compliance_items_admin_director_full" ON btp.compliance_items
  FOR ALL TO authenticated
  USING (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') IN ('ADMIN', 'DIRECTOR')
  )
  WITH CHECK (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') IN ('ADMIN', 'DIRECTOR')
  );

-- MANAGER - Can read all, create/update only for their projects
DROP POLICY IF EXISTS "compliance_items_manager_read_all" ON btp.compliance_items;
CREATE POLICY "compliance_items_manager_read_all" ON btp.compliance_items
  FOR SELECT TO authenticated
  USING (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'MANAGER'
  );

DROP POLICY IF EXISTS "compliance_items_manager_manage" ON btp.compliance_items;
CREATE POLICY "compliance_items_manager_manage" ON btp.compliance_items
  FOR INSERT TO authenticated
  WITH CHECK (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'MANAGER'
  );

DROP POLICY IF EXISTS "compliance_items_manager_update" ON btp.compliance_items;
CREATE POLICY "compliance_items_manager_update" ON btp.compliance_items
  FOR UPDATE TO authenticated
  USING (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'MANAGER'
  )
  WITH CHECK (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'MANAGER'
  );

-- SUPPLIER - Can only read items where they are responsible
DROP POLICY IF EXISTS "compliance_items_supplier_read" ON btp.compliance_items;
CREATE POLICY "compliance_items_supplier_read" ON btp.compliance_items
  FOR SELECT TO authenticated
  USING (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'SUPPLIER' AND
    responsible = (current_setting('request.jwt.claims', true)::json ->> 'email')
  );

DROP POLICY IF EXISTS "compliance_items_supplier_update" ON btp.compliance_items;
CREATE POLICY "compliance_items_supplier_update" ON btp.compliance_items
  FOR UPDATE TO authenticated
  USING (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'SUPPLIER' AND
    responsible = (current_setting('request.jwt.claims', true)::json ->> 'email') AND
    status IN ('pending', 'in_progress')
  )
  WITH CHECK (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'SUPPLIER' AND
    responsible = (current_setting('request.jwt.claims', true)::json ->> 'email') AND
    status IN ('pending', 'in_progress')
  );

-- ============================================
-- RLS POLICIES FOR compliance_documents
-- ============================================

-- ADMIN, DIRECTOR - Full access
DROP POLICY IF EXISTS "compliance_documents_admin_director_full" ON btp.compliance_documents;
CREATE POLICY "compliance_documents_admin_director_full" ON btp.compliance_documents
  FOR ALL TO authenticated
  USING (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') IN ('ADMIN', 'DIRECTOR')
  )
  WITH CHECK (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') IN ('ADMIN', 'DIRECTOR')
  );

-- MANAGER - Can read all, manage for their project items
DROP POLICY IF EXISTS "compliance_documents_manager_read_all" ON btp.compliance_documents;
CREATE POLICY "compliance_documents_manager_read_all" ON btp.compliance_documents
  FOR SELECT TO authenticated
  USING (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'MANAGER'
  );

DROP POLICY IF EXISTS "compliance_documents_manager_manage" ON btp.compliance_documents;
CREATE POLICY "compliance_documents_manager_manage" ON btp.compliance_documents
  FOR ALL TO authenticated
  USING (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'MANAGER'
  )
  WITH CHECK (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'MANAGER'
  );

-- SUPPLIER - Can only manage documents for items they're responsible for
DROP POLICY IF EXISTS "compliance_documents_supplier_read" ON btp.compliance_documents;
CREATE POLICY "compliance_documents_supplier_read" ON btp.compliance_documents
  FOR SELECT TO authenticated
  USING (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'SUPPLIER' AND
    EXISTS (
      SELECT 1 FROM btp.compliance_items ci
      WHERE ci.id = compliance_item_id
      AND ci.responsible = (current_setting('request.jwt.claims', true)::json ->> 'email')
    )
  );

DROP POLICY IF EXISTS "compliance_documents_supplier_manage" ON btp.compliance_documents;
CREATE POLICY "compliance_documents_supplier_manage" ON btp.compliance_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'SUPPLIER' AND
    uploaded_by = (current_setting('request.jwt.claims', true)::json ->> 'email') AND
    EXISTS (
      SELECT 1 FROM btp.compliance_items ci
      WHERE ci.id = compliance_item_id
      AND ci.responsible = (current_setting('request.jwt.claims', true)::json ->> 'email')
      AND ci.status IN ('pending', 'in_progress')
    )
  );

DROP POLICY IF EXISTS "compliance_documents_supplier_delete" ON btp.compliance_documents;
CREATE POLICY "compliance_documents_supplier_delete" ON btp.compliance_documents
  FOR DELETE TO authenticated
  USING (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'SUPPLIER' AND
    uploaded_by = (current_setting('request.jwt.claims', true)::json ->> 'email') AND
    EXISTS (
      SELECT 1 FROM btp.compliance_items ci
      WHERE ci.id = compliance_item_id
      AND ci.responsible = (current_setting('request.jwt.claims', true)::json ->> 'email')
      AND ci.status IN ('pending', 'in_progress')
    )
  );

-- ============================================
-- RLS POLICIES FOR compliance_notes
-- ============================================

-- ADMIN, DIRECTOR - Full access
DROP POLICY IF EXISTS "compliance_notes_admin_director_full" ON btp.compliance_notes;
CREATE POLICY "compliance_notes_admin_director_full" ON btp.compliance_notes
  FOR ALL TO authenticated
  USING (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') IN ('ADMIN', 'DIRECTOR')
  )
  WITH CHECK (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') IN ('ADMIN', 'DIRECTOR')
  );

-- MANAGER - Can read all, add notes to items in their projects
DROP POLICY IF EXISTS "compliance_notes_manager_read_all" ON btp.compliance_notes;
CREATE POLICY "compliance_notes_manager_read_all" ON btp.compliance_notes
  FOR SELECT TO authenticated
  USING (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'MANAGER'
  );

DROP POLICY IF EXISTS "compliance_notes_manager_insert" ON btp.compliance_notes;
CREATE POLICY "compliance_notes_manager_insert" ON btp.compliance_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'MANAGER' AND
    created_by = (current_setting('request.jwt.claims', true)::json ->> 'email')
  );

-- SUPPLIER - Can read and add notes to items they're responsible for
DROP POLICY IF EXISTS "compliance_notes_supplier_read" ON btp.compliance_notes;
CREATE POLICY "compliance_notes_supplier_read" ON btp.compliance_notes
  FOR SELECT TO authenticated
  USING (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'SUPPLIER' AND
    EXISTS (
      SELECT 1 FROM btp.compliance_items ci
      WHERE ci.id = compliance_item_id
      AND ci.responsible = (current_setting('request.jwt.claims', true)::json ->> 'email')
    )
  );

DROP POLICY IF EXISTS "compliance_notes_supplier_insert" ON btp.compliance_notes;
CREATE POLICY "compliance_notes_supplier_insert" ON btp.compliance_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'SUPPLIER' AND
    created_by = (current_setting('request.jwt.claims', true)::json ->> 'email') AND
    EXISTS (
      SELECT 1 FROM btp.compliance_items ci
      WHERE ci.id = compliance_item_id
      AND ci.responsible = (current_setting('request.jwt.claims', true)::json ->> 'email')
    )
  );

-- ============================================
-- RLS POLICIES FOR compliance_audit_log
-- ============================================

-- Read-only policies for audit log

-- ADMIN, DIRECTOR - Read access
DROP POLICY IF EXISTS "compliance_audit_admin_director_read" ON btp.compliance_audit_log;
CREATE POLICY "compliance_audit_admin_director_read" ON btp.compliance_audit_log
  FOR SELECT TO authenticated
  USING (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') IN ('ADMIN', 'DIRECTOR')
  );

-- MANAGER - Read access to their project items
DROP POLICY IF EXISTS "compliance_audit_manager_read" ON btp.compliance_audit_log;
CREATE POLICY "compliance_audit_manager_read" ON btp.compliance_audit_log
  FOR SELECT TO authenticated
  USING (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'MANAGER'
  );

-- SUPPLIER - Read access to their own items
DROP POLICY IF EXISTS "compliance_audit_supplier_read" ON btp.compliance_audit_log;
CREATE POLICY "compliance_audit_supplier_read" ON btp.compliance_audit_log
  FOR SELECT TO authenticated
  USING (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'SUPPLIER' AND
    EXISTS (
      SELECT 1 FROM btp.compliance_items ci
      WHERE ci.id = compliance_item_id
      AND ci.responsible = (current_setting('request.jwt.claims', true)::json ->> 'email')
    )
  );