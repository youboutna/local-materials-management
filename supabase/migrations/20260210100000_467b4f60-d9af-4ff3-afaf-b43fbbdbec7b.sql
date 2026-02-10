-- Migration: Create compliance tables
-- Created: 2026-02-10 10:00:00
-- Hash: 467b4f60-d9af-4ff3-afaf-b43fbbdbec7b
-- Description: Initial creation of compliance items, documents, notes, and audit log tables

-- ============================================
-- MAIN COMPLIANCE ITEMS TABLE
-- ============================================
CREATE TABLE compliance_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(50) NOT NULL CHECK (type IN ('regulatory', 'insurance', 'bank_guarantee', 'technical', 'environmental')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'approved', 'rejected')),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  deadline DATE,
  responsible VARCHAR(255) NOT NULL,
  project_id UUID NOT NULL,
  bank_guarantee_id UUID,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by VARCHAR(255),
  
  -- Foreign key constraints
  CONSTRAINT fk_compliance_items_project
    FOREIGN KEY (project_id)
    REFERENCES projects(id)
    ON DELETE CASCADE,
    
  CONSTRAINT fk_compliance_items_bank_guarantee
    FOREIGN KEY (bank_guarantee_id)
    REFERENCES bank_guarantees(id)
    ON DELETE SET NULL
);

-- ============================================
-- COMPLIANCE DOCUMENTS TABLE
-- ============================================
CREATE TABLE compliance_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  compliance_item_id UUID NOT NULL,
  document_id UUID NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  is_required BOOLEAN DEFAULT false,
  uploaded_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_compliance_documents_item
    FOREIGN KEY (compliance_item_id)
    REFERENCES compliance_items(id)
    ON DELETE CASCADE,
    
  CONSTRAINT fk_compliance_documents_document
    FOREIGN KEY (document_id)
    REFERENCES documents(id)
    ON DELETE CASCADE
);

-- ============================================
-- COMPLIANCE NOTES TABLE
-- ============================================
CREATE TABLE compliance_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  compliance_item_id UUID NOT NULL,
  note TEXT NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_compliance_notes_item
    FOREIGN KEY (compliance_item_id)
    REFERENCES compliance_items(id)
    ON DELETE CASCADE
);

-- ============================================
-- COMPLIANCE AUDIT LOG TABLE
-- ============================================
CREATE TABLE compliance_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  compliance_item_id UUID NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by VARCHAR(255) NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_compliance_audit_item
    FOREIGN KEY (compliance_item_id)
    REFERENCES compliance_items(id)
    ON DELETE CASCADE
);