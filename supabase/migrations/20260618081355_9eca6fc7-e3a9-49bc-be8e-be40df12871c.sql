CREATE OR REPLACE FUNCTION btp.normalize_project_stakeholder_entity_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = btp, public
AS $$
BEGIN
  IF NEW.stakeholder_entity_type IS NULL OR btrim(NEW.stakeholder_entity_type) = '' THEN
    NEW.stakeholder_entity_type := CASE
      WHEN NEW.employee_id IS NOT NULL THEN 'employee'
      WHEN NEW.supplier_id IS NOT NULL THEN 'supplier'
      WHEN NEW.external_name IS NOT NULL OR NEW.external_email IS NOT NULL OR NEW.external_phone IS NOT NULL THEN 'external'
      ELSE NULL
    END;
  END IF;

  NEW.stakeholder_entity_type := lower(NEW.stakeholder_entity_type);

  IF NEW.stakeholder_entity_type IN ('person', 'team', 'department') THEN
    NEW.stakeholder_entity_type := 'employee';
  ELSIF NEW.stakeholder_entity_type IN ('organization', 'organisation', 'vendor', 'contractor') THEN
    NEW.stakeholder_entity_type := 'supplier';
  END IF;

  IF NEW.stakeholder_entity_type = 'employee' THEN
    NEW.supplier_id := NULL;
  ELSIF NEW.stakeholder_entity_type = 'supplier' THEN
    NEW.employee_id := NULL;
  ELSIF NEW.stakeholder_entity_type = 'external' THEN
    NEW.employee_id := NULL;
    NEW.supplier_id := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_project_stakeholder_entity_type ON btp.project_stakeholders;
CREATE TRIGGER normalize_project_stakeholder_entity_type
BEFORE INSERT OR UPDATE ON btp.project_stakeholders
FOR EACH ROW
EXECUTE FUNCTION btp.normalize_project_stakeholder_entity_type();

ALTER TABLE btp.project_stakeholders
  DROP CONSTRAINT IF EXISTS stakeholder_entity_check,
  DROP CONSTRAINT IF EXISTS project_stakeholders_stakeholder_entity_type_check;

ALTER TABLE btp.project_stakeholders
  ADD CONSTRAINT project_stakeholders_stakeholder_entity_type_check
  CHECK (stakeholder_entity_type IN ('employee', 'supplier', 'external')),
  ADD CONSTRAINT stakeholder_entity_check
  CHECK (
    (stakeholder_entity_type = 'employee' AND employee_id IS NOT NULL AND supplier_id IS NULL)
    OR (stakeholder_entity_type = 'supplier' AND supplier_id IS NOT NULL AND employee_id IS NULL)
    OR (stakeholder_entity_type = 'external' AND employee_id IS NULL AND supplier_id IS NULL AND (external_name IS NOT NULL OR external_email IS NOT NULL OR external_phone IS NOT NULL))
  );

GRANT USAGE ON SCHEMA btp TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.project_stakeholders TO authenticated;
GRANT ALL ON btp.project_stakeholders TO service_role;

CREATE TABLE IF NOT EXISTS btp.compliance_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('regulatory', 'insurance', 'bank_guarantee', 'technical', 'environmental', 'health_safety', 'quality', 'financial', 'data_protection', 'labor_law', 'procurement')),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'approved', 'rejected', 'requires_action')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  deadline date,
  responsible text NOT NULL,
  project_id uuid NOT NULL REFERENCES btp.projects(id) ON DELETE CASCADE,
  bank_guarantee_id uuid REFERENCES btp.bank_guarantees(id) ON DELETE SET NULL,
  category text,
  subcategory text,
  compliance_level text DEFAULT 'partial' CHECK (compliance_level IN ('none', 'partial', 'full', 'exempt')),
  last_reviewed date,
  next_review date,
  external_references text[] DEFAULT '{}',
  risk_level text DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  mitigation_required boolean NOT NULL DEFAULT false,
  mitigation_plan text,
  created_by text NOT NULL,
  updated_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.compliance_items TO authenticated;
GRANT ALL ON btp.compliance_items TO service_role;

ALTER TABLE btp.compliance_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage btp compliance items" ON btp.compliance_items;
CREATE POLICY "Authenticated users can manage btp compliance items"
ON btp.compliance_items
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM btp.projects p WHERE p.id = compliance_items.project_id))
WITH CHECK (EXISTS (SELECT 1 FROM btp.projects p WHERE p.id = compliance_items.project_id));

CREATE TABLE IF NOT EXISTS btp.compliance_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  compliance_item_id uuid NOT NULL REFERENCES btp.compliance_items(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES btp.documents(id) ON DELETE CASCADE,
  category text NOT NULL,
  subcategory text,
  is_required boolean NOT NULL DEFAULT false,
  uploaded_by text,
  file_url text,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.compliance_documents TO authenticated;
GRANT ALL ON btp.compliance_documents TO service_role;

ALTER TABLE btp.compliance_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage btp compliance documents" ON btp.compliance_documents;
CREATE POLICY "Authenticated users can manage btp compliance documents"
ON btp.compliance_documents
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM btp.compliance_items ci WHERE ci.id = compliance_documents.compliance_item_id))
WITH CHECK (EXISTS (SELECT 1 FROM btp.compliance_items ci WHERE ci.id = compliance_documents.compliance_item_id));

CREATE TABLE IF NOT EXISTS btp.compliance_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  compliance_item_id uuid NOT NULL REFERENCES btp.compliance_items(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.compliance_notes TO authenticated;
GRANT ALL ON btp.compliance_notes TO service_role;

ALTER TABLE btp.compliance_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage btp compliance notes" ON btp.compliance_notes;
CREATE POLICY "Authenticated users can manage btp compliance notes"
ON btp.compliance_notes
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM btp.compliance_items ci WHERE ci.id = compliance_notes.compliance_item_id))
WITH CHECK (EXISTS (SELECT 1 FROM btp.compliance_items ci WHERE ci.id = compliance_notes.compliance_item_id));

CREATE TABLE IF NOT EXISTS btp.compliance_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  compliance_item_id uuid NOT NULL REFERENCES btp.compliance_items(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  changed_by text NOT NULL DEFAULT 'system',
  changed_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON btp.compliance_audit_log TO authenticated;
GRANT ALL ON btp.compliance_audit_log TO service_role;

ALTER TABLE btp.compliance_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read btp compliance audit" ON btp.compliance_audit_log;
CREATE POLICY "Authenticated users can read btp compliance audit"
ON btp.compliance_audit_log
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM btp.compliance_items ci WHERE ci.id = compliance_audit_log.compliance_item_id));

DROP POLICY IF EXISTS "Authenticated users can add btp compliance audit" ON btp.compliance_audit_log;
CREATE POLICY "Authenticated users can add btp compliance audit"
ON btp.compliance_audit_log
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM btp.compliance_items ci WHERE ci.id = compliance_audit_log.compliance_item_id));

CREATE OR REPLACE FUNCTION btp.set_compliance_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = btp, public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_compliance_items_updated_at ON btp.compliance_items;
CREATE TRIGGER set_compliance_items_updated_at
BEFORE UPDATE ON btp.compliance_items
FOR EACH ROW
EXECUTE FUNCTION btp.set_compliance_updated_at();

DROP TRIGGER IF EXISTS set_compliance_documents_updated_at ON btp.compliance_documents;
CREATE TRIGGER set_compliance_documents_updated_at
BEFORE UPDATE ON btp.compliance_documents
FOR EACH ROW
EXECUTE FUNCTION btp.set_compliance_updated_at();

DROP TRIGGER IF EXISTS set_compliance_notes_updated_at ON btp.compliance_notes;
CREATE TRIGGER set_compliance_notes_updated_at
BEFORE UPDATE ON btp.compliance_notes
FOR EACH ROW
EXECUTE FUNCTION btp.set_compliance_updated_at();

CREATE INDEX IF NOT EXISTS idx_btp_compliance_items_project ON btp.compliance_items(project_id);
CREATE INDEX IF NOT EXISTS idx_btp_compliance_items_status ON btp.compliance_items(status);
CREATE INDEX IF NOT EXISTS idx_btp_compliance_items_priority ON btp.compliance_items(priority);
CREATE INDEX IF NOT EXISTS idx_btp_compliance_items_type ON btp.compliance_items(type);
CREATE INDEX IF NOT EXISTS idx_btp_compliance_items_deadline ON btp.compliance_items(deadline);
CREATE INDEX IF NOT EXISTS idx_btp_compliance_documents_item ON btp.compliance_documents(compliance_item_id);
CREATE INDEX IF NOT EXISTS idx_btp_compliance_notes_item ON btp.compliance_notes(compliance_item_id);
CREATE INDEX IF NOT EXISTS idx_btp_compliance_audit_item ON btp.compliance_audit_log(compliance_item_id);

DROP VIEW IF EXISTS public.compliance_items_with_details;
DROP VIEW IF EXISTS public.compliance_audit_log;
DROP VIEW IF EXISTS public.compliance_notes;
DROP VIEW IF EXISTS public.compliance_documents;
DROP VIEW IF EXISTS public.compliance_items;

CREATE VIEW public.compliance_items AS SELECT * FROM btp.compliance_items;
ALTER VIEW public.compliance_items SET (security_invoker = true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.compliance_items TO authenticated;
GRANT ALL ON public.compliance_items TO service_role;

CREATE VIEW public.compliance_documents AS SELECT * FROM btp.compliance_documents;
ALTER VIEW public.compliance_documents SET (security_invoker = true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.compliance_documents TO authenticated;
GRANT ALL ON public.compliance_documents TO service_role;

CREATE VIEW public.compliance_notes AS SELECT * FROM btp.compliance_notes;
ALTER VIEW public.compliance_notes SET (security_invoker = true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.compliance_notes TO authenticated;
GRANT ALL ON public.compliance_notes TO service_role;

CREATE VIEW public.compliance_audit_log AS SELECT * FROM btp.compliance_audit_log;
ALTER VIEW public.compliance_audit_log SET (security_invoker = true);
GRANT SELECT, INSERT ON public.compliance_audit_log TO authenticated;
GRANT ALL ON public.compliance_audit_log TO service_role;

CREATE VIEW public.compliance_items_with_details AS
SELECT
  ci.*,
  COALESCE(json_agg(DISTINCT jsonb_build_object(
    'id', cd.id,
    'document_id', cd.document_id,
    'category', cd.category,
    'subcategory', cd.subcategory,
    'is_required', cd.is_required,
    'uploaded_by', cd.uploaded_by,
    'file_url', cd.file_url,
    'uploaded_at', cd.uploaded_at,
    'created_at', cd.created_at
  )) FILTER (WHERE cd.id IS NOT NULL), '[]'::json) AS documents,
  COALESCE(json_agg(DISTINCT jsonb_build_object(
    'id', cn.id,
    'note', cn.note,
    'created_by', cn.created_by,
    'created_at', cn.created_at
  )) FILTER (WHERE cn.id IS NOT NULL), '[]'::json) AS notes
FROM btp.compliance_items ci
LEFT JOIN btp.compliance_documents cd ON ci.id = cd.compliance_item_id
LEFT JOIN btp.compliance_notes cn ON ci.id = cn.compliance_item_id
GROUP BY ci.id;
ALTER VIEW public.compliance_items_with_details SET (security_invoker = true);
GRANT SELECT ON public.compliance_items_with_details TO authenticated;
GRANT ALL ON public.compliance_items_with_details TO service_role;

NOTIFY pgrst, 'reload schema';