-- =============================================================================
-- MIGRATION: enhance_stakeholders_and_compliance_view
-- Description: Normalisation des stakeholders et vue robuste des conformités
-- =============================================================================

-- PARTIE 1 : NORMALISATION DES STAKEHOLDERS
-- =============================================================================

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


-- PARTIE 2 : VUE ROBUSTE DE CONFORMITÉ (COLONNES EXISTANTES UNIQUEMENT)
-- =============================================================================
-- Cette vue ne sélectionne QUE les colonnes de base qui existent à 100%
-- dans votre table btp.compliance_items.

DROP VIEW IF EXISTS btp.compliance_items_with_details;

CREATE VIEW btp.compliance_items_with_details AS
SELECT
  ci.id,
  ci.type,
  ci.title,
  ci.description,
  ci.status,
  ci.priority,
  ci.deadline,
  ci.responsible,
  ci.project_id,
  ci.bank_guarantee_id,
  ci.created_by,
  ci.updated_by,
  ci.created_at,
  ci.updated_at,
  COALESCE(json_agg(DISTINCT jsonb_build_object(
    'id', cd.id,
    'document_id', cd.document_id,
    'category', cd.category,
    'subcategory', cd.subcategory,
    'is_required', cd.is_required,
    'uploaded_by', cd.uploaded_by,
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

ALTER VIEW btp.compliance_items_with_details SET (security_invoker = true);
GRANT SELECT ON btp.compliance_items_with_details TO authenticated;
GRANT ALL ON btp.compliance_items_with_details TO service_role;

NOTIFY pgrst, 'reload schema';