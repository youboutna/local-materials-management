-- Migration: Create compliance indexes
-- Created: 2026-02-10 10:00:01
-- Hash: 5a8c1e32-f7b3-4c5d-9e12-8a3456789012
-- Description: Add performance indexes to compliance tables

-- Indexes for compliance_items
CREATE INDEX idx_compliance_items_project ON btp.compliance_items(project_id);
CREATE INDEX idx_compliance_items_status ON btp.compliance_items(status);
CREATE INDEX idx_compliance_items_priority ON btp.compliance_items(priority);
CREATE INDEX idx_compliance_items_type ON btp.compliance_items(type);
CREATE INDEX idx_compliance_items_deadline ON btp.compliance_items(deadline);
CREATE INDEX idx_compliance_items_bank_guarantee ON btp.compliance_items(bank_guarantee_id);
CREATE INDEX idx_compliance_items_created_by ON btp.compliance_items(created_by);
CREATE INDEX idx_compliance_items_responsible ON btp.compliance_items(responsible);

-- Indexes for compliance_documents
CREATE INDEX idx_compliance_documents_item ON btp.compliance_documents(compliance_item_id);
CREATE INDEX idx_compliance_documents_category ON btp.compliance_documents(category);
CREATE INDEX idx_compliance_documents_uploaded_by ON btp.compliance_documents(uploaded_by);

-- Indexes for compliance_notes
CREATE INDEX idx_compliance_notes_item ON btp.compliance_notes(compliance_item_id);
CREATE INDEX idx_compliance_notes_created_by ON btp.compliance_notes(created_by);

-- Indexes for compliance_audit_log
CREATE INDEX idx_compliance_audit_item ON btp.compliance_audit_log(compliance_item_id);
CREATE INDEX idx_compliance_audit_changed_at ON btp.compliance_audit_log(changed_at);
CREATE INDEX idx_compliance_audit_changed_by ON btp.compliance_audit_log(changed_by);