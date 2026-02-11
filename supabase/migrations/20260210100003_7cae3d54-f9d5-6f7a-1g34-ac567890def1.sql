-- Migration: Create compliance triggers and views
-- Created: 2026-02-10 10:00:03
-- Hash: 7cae3d54-f9d5-6f7a-1g34-ac567890def1
-- Description: Create triggers for auto-updating timestamps and audit logging, and create views

-- ============================================
-- TRIGGER FOR AUTO-UPDATING updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_compliance_item_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = current_setting('request.jwt.claims', true)::json ->> 'email';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_compliance_items_updated_at
  BEFORE UPDATE ON compliance_items
  FOR EACH ROW
  EXECUTE FUNCTION update_compliance_item_updated_at();

-- ============================================
-- TRIGGER FOR AUDIT LOGGING
-- ============================================
CREATE OR REPLACE FUNCTION log_compliance_item_changes()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
BEGIN
  user_email := current_setting('request.jwt.claims', true)::json ->> 'email';
  
  IF TG_OP = 'UPDATE' THEN
    -- Log changes to status
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO compliance_audit_log (compliance_item_id, field_name, old_value, new_value, changed_by)
      VALUES (NEW.id, 'status', OLD.status, NEW.status, user_email);
    END IF;
    
    -- Log changes to priority
    IF OLD.priority IS DISTINCT FROM NEW.priority THEN
      INSERT INTO compliance_audit_log (compliance_item_id, field_name, old_value, new_value, changed_by)
      VALUES (NEW.id, 'priority', OLD.priority, NEW.priority, user_email);
    END IF;
    
    -- Log changes to deadline
    IF OLD.deadline IS DISTINCT FROM NEW.deadline THEN
      INSERT INTO compliance_audit_log (compliance_item_id, field_name, old_value, new_value, changed_by)
      VALUES (NEW.id, 'deadline', OLD.deadline::text, NEW.deadline::text, user_email);
    END IF;
    
    -- Log changes to responsible person
    IF OLD.responsible IS DISTINCT FROM NEW.responsible THEN
      INSERT INTO compliance_audit_log (compliance_item_id, field_name, old_value, new_value, changed_by)
      VALUES (NEW.id, 'responsible', OLD.responsible, NEW.responsible, user_email);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER compliance_items_audit_trigger
  AFTER UPDATE ON compliance_items
  FOR EACH ROW
  EXECUTE FUNCTION log_compliance_item_changes();

-- ============================================
-- VIEW FOR COMPLETE COMPLIANCE DATA
-- ============================================
CREATE VIEW compliance_items_with_details AS
SELECT 
  ci.*,
  COALESCE(
    json_agg(DISTINCT jsonb_build_object(
      'id', cd.id,
      'document_id', cd.document_id,
      'category', cd.category,
      'subcategory', cd.subcategory,
      'is_required', cd.is_required,
      'uploaded_by', cd.uploaded_by,
      'created_at', cd.created_at
    )) FILTER (WHERE cd.id IS NOT NULL),
    '[]'::json
  ) as documents,
  COALESCE(
    json_agg(DISTINCT jsonb_build_object(
      'id', cn.id,
      'note', cn.note,
      'created_by', cn.created_by,
      'created_at', cn.created_at
    )) FILTER (WHERE cn.id IS NOT NULL),
    '[]'::json
  ) as notes,
  bg.* as bank_guarantee
FROM compliance_items ci
LEFT JOIN compliance_documents cd ON ci.id = cd.compliance_item_id
LEFT JOIN compliance_notes cn ON ci.id = cn.compliance_item_id
LEFT JOIN bank_guarantees bg ON ci.bank_guarantee_id = bg.id
GROUP BY ci.id, bg.id;

-- Enable RLS on the view
ALTER VIEW compliance_items_with_details SET (security_invoker = true);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant permissions to authenticated users
GRANT ALL ON compliance_items TO authenticated;
GRANT ALL ON compliance_documents TO authenticated;
GRANT ALL ON compliance_notes TO authenticated;
GRANT ALL ON compliance_audit_log TO authenticated;
GRANT SELECT ON compliance_items_with_details TO authenticated;