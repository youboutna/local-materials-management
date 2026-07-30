-- ============================================
-- VIEW FOR COMPLETE COMPLIANCE DATA
-- ============================================

-- Suppression de la vue si elle existe déjà (pour éviter les conflits de définition)
DROP VIEW IF EXISTS compliance_items_with_details;

CREATE VIEW compliance_items_with_details AS
WITH 
-- 1. Agrégation des documents par compliance_item_id
aggregated_documents AS (
  SELECT 
    compliance_item_id,
    COALESCE(
      json_agg(
        jsonb_build_object(
          'id', cd.id,
          'document_id', cd.document_id,
          'category', cd.category,
          'subcategory', cd.subcategory,
          'is_required', cd.is_required,
          'uploaded_by', cd.uploaded_by,
          'created_at', cd.created_at
        ) ORDER BY cd.created_at DESC
      ),
      '[]'::json
    ) AS documents
  FROM btp.compliance_documents cd
  GROUP BY compliance_item_id
),
-- 2. Agrégation des notes par compliance_item_id
aggregated_notes AS (
  SELECT 
    compliance_item_id,
    COALESCE(
      json_agg(
        jsonb_build_object(
          'id', cn.id,
          'note', cn.note,
          'created_by', cn.created_by,
          'created_at', cn.created_at
        ) ORDER BY cn.created_at DESC
      ),
      '[]'::json
    ) AS notes
  FROM btp.compliance_notes cn
  GROUP BY compliance_item_id
)
-- 3. Construction de la vue finale avec jointures
SELECT 
  ci.*,
  COALESCE(ad.documents, '[]'::json) AS documents,
  COALESCE(an.notes, '[]'::json) AS notes,
  row_to_json(bg.*) AS bank_guarantee
FROM btp.compliance_items ci
LEFT JOIN aggregated_documents ad ON ci.id = ad.compliance_item_id
LEFT JOIN aggregated_notes an ON ci.id = an.compliance_item_id
LEFT JOIN btp.bank_guarantees bg ON ci.bank_guarantee_id = bg.id;

-- ============================================
-- COMMENT ON VIEW
-- ============================================
COMMENT ON VIEW compliance_items_with_details IS 'Vue complète des items de conformité avec leurs documents, notes et garanties bancaires associés';