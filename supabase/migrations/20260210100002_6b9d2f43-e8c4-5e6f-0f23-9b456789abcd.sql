-- Migration: Enable RLS and create policies
-- Created: 2026-02-10 10:00:02
-- Hash: 6b9d2f43-e8c4-5e6f-0f23-9b456789abcd
-- Description: Enable Row Level Security and create policies for all compliance tables

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE compliance_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR compliance_items
-- ============================================

-- ADMIN, DIRECTOR - Full access (case-insensitive)
CREATE POLICY "compliance_items_admin_director_full" ON compliance_items
  FOR ALL TO authenticated
  USING (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') IN ('ADMIN', 'DIRECTOR')
  )
  WITH CHECK (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') IN ('ADMIN', 'DIRECTOR')
  );

-- MANAGER - Can read all, create/update only for their projects
CREATE POLICY "compliance_items_manager_read_all" ON compliance_items
  FOR SELECT TO authenticated
  USING (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'MANAGER'
  );

CREATE POLICY "compliance_items_manager_manage" ON compliance_items
  FOR INSERT TO authenticated
  WITH CHECK (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'MANAGER' AND
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id 
      AND p.manager_id = (current_setting('request.jwt.claims', true)::json ->> 'user_id')
    )
  );

CREATE POLICY "compliance_items_manager_update" ON compliance_items
  FOR UPDATE TO authenticated
  USING (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'MANAGER' AND
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id 
      AND p.manager_id = (current_setting('request.jwt.claims', true)::json ->> 'user_id')
    )
  )
  WITH CHECK (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'MANAGER' AND
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id 
      AND p.manager_id = (current_setting('request.jwt.claims', true)::json ->> 'user_id')
    )
  );

-- SUPPLIER - Can only read items where they are responsible
CREATE POLICY "compliance_items_supplier_read" ON compliance_items
  FOR SELECT TO authenticated
  USING (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'SUPPLIER' AND
    responsible = (current_setting('request.jwt.claims', true)::json ->> 'email')
  );

CREATE POLICY "compliance_items_supplier_update" ON compliance_items
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
CREATE POLICY "compliance_documents_admin_director_full" ON compliance_documents
  FOR ALL TO authenticated
  USING (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') IN ('ADMIN', 'DIRECTOR')
  )
  WITH CHECK (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') IN ('ADMIN', 'DIRECTOR')
  );

-- MANAGER - Can read all, manage for their project items
CREATE POLICY "compliance_documents_manager_read_all" ON compliance_documents
  FOR SELECT TO authenticated
  USING (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'MANAGER'
  );

CREATE POLICY "compliance_documents_manager_manage" ON compliance_documents
  FOR ALL TO authenticated
  USING (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'MANAGER' AND
    EXISTS (
      SELECT 1 FROM compliance_items ci
      JOIN projects p ON ci.project_id = p.id
      WHERE ci.id = compliance_item_id
      AND p.manager_id = (current_setting('request.jwt.claims', true)::json ->> 'user_id')
    )
  )
  WITH CHECK (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'MANAGER' AND
    EXISTS (
      SELECT 1 FROM compliance_items ci
      JOIN projects p ON ci.project_id = p.id
      WHERE ci.id = compliance_item_id
      AND p.manager_id = (current_setting('request.jwt.claims', true)::json ->> 'user_id')
    )
  );

-- SUPPLIER - Can only manage documents for items they're responsible for
CREATE POLICY "compliance_documents_supplier_read" ON compliance_documents
  FOR SELECT TO authenticated
  USING (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'SUPPLIER' AND
    EXISTS (
      SELECT 1 FROM compliance_items ci
      WHERE ci.id = compliance_item_id
      AND ci.responsible = (current_setting('request.jwt.claims', true)::json ->> 'email')
    )
  );

CREATE POLICY "compliance_documents_supplier_manage" ON compliance_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'SUPPLIER' AND
    uploaded_by = (current_setting('request.jwt.claims', true)::json ->> 'email') AND
    EXISTS (
      SELECT 1 FROM compliance_items ci
      WHERE ci.id = compliance_item_id
      AND ci.responsible = (current_setting('request.jwt.claims', true)::json ->> 'email')
      AND ci.status IN ('pending', 'in_progress')
    )
  );

CREATE POLICY "compliance_documents_supplier_delete" ON compliance_documents
  FOR DELETE TO authenticated
  USING (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'SUPPLIER' AND
    uploaded_by = (current_setting('request.jwt.claims', true)::json ->> 'email') AND
    EXISTS (
      SELECT 1 FROM compliance_items ci
      WHERE ci.id = compliance_item_id
      AND ci.responsible = (current_setting('request.jwt.claims', true)::json ->> 'email')
      AND ci.status IN ('pending', 'in_progress')
    )
  );

-- ============================================
-- RLS POLICIES FOR compliance_notes
-- ============================================

-- ADMIN, DIRECTOR - Full access
CREATE POLICY "compliance_notes_admin_director_full" ON compliance_notes
  FOR ALL TO authenticated
  USING (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') IN ('ADMIN', 'DIRECTOR')
  )
  WITH CHECK (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') IN ('ADMIN', 'DIRECTOR')
  );

-- MANAGER - Can read all, add notes to items in their projects
CREATE POLICY "compliance_notes_manager_read_all" ON compliance_notes
  FOR SELECT TO authenticated
  USING (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'MANAGER'
  );

CREATE POLICY "compliance_notes_manager_insert" ON compliance_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'MANAGER' AND
    created_by = (current_setting('request.jwt.claims', true)::json ->> 'email') AND
    EXISTS (
      SELECT 1 FROM compliance_items ci
      JOIN projects p ON ci.project_id = p.id
      WHERE ci.id = compliance_item_id
      AND p.manager_id = (current_setting('request.jwt.claims', true)::json ->> 'user_id')
    )
  );

-- SUPPLIER - Can read and add notes to items they're responsible for
CREATE POLICY "compliance_notes_supplier_read" ON compliance_notes
  FOR SELECT TO authenticated
  USING (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'SUPPLIER' AND
    EXISTS (
      SELECT 1 FROM compliance_items ci
      WHERE ci.id = compliance_item_id
      AND ci.responsible = (current_setting('request.jwt.claims', true)::json ->> 'email')
    )
  );

CREATE POLICY "compliance_notes_supplier_insert" ON compliance_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'SUPPLIER' AND
    created_by = (current_setting('request.jwt.claims', true)::json ->> 'email') AND
    EXISTS (
      SELECT 1 FROM compliance_items ci
      WHERE ci.id = compliance_item_id
      AND ci.responsible = (current_setting('request.jwt.claims', true)::json ->> 'email')
    )
  );

-- ============================================
-- RLS POLICIES FOR compliance_audit_log
-- ============================================

-- Read-only policies for audit log

-- ADMIN, DIRECTOR - Read access
CREATE POLICY "compliance_audit_admin_director_read" ON compliance_audit_log
  FOR SELECT TO authenticated
  USING (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') IN ('ADMIN', 'DIRECTOR')
  );

-- MANAGER - Read access to their project items
CREATE POLICY "compliance_audit_manager_read" ON compliance_audit_log
  FOR SELECT TO authenticated
  USING (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'MANAGER' AND
    EXISTS (
      SELECT 1 FROM compliance_items ci
      JOIN projects p ON ci.project_id = p.id
      WHERE ci.id = compliance_item_id
      AND p.manager_id = (current_setting('request.jwt.claims', true)::json ->> 'user_id')
    )
  );

-- SUPPLIER - Read access to their own items
CREATE POLICY "compliance_audit_supplier_read" ON compliance_audit_log
  FOR SELECT TO authenticated
  USING (
    UPPER(current_setting('request.jwt.claims', true)::json ->> 'role') = 'SUPPLIER' AND
    EXISTS (
      SELECT 1 FROM compliance_items ci
      WHERE ci.id = compliance_item_id
      AND ci.responsible = (current_setting('request.jwt.claims', true)::json ->> 'email')
    )
  );