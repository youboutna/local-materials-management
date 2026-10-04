UPDATE btp.boq_lines
SET document_id = COALESCE(project_id, tender_id, submission_id)
WHERE document_id IS NULL
  AND line_type = 'estimate'
  AND COALESCE(project_id, tender_id, submission_id) IS NOT NULL;