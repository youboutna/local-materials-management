-- Update existing workflow steps with proper dates and required documents
UPDATE tender_steps SET
  title = 'Préparation du dossier technique',
  description = 'Préparer et rassembler tous les documents techniques nécessaires pour le marché',
  status = 'in_progress',
  procurement_phase = 'preparation',
  procurement_stage = 'documentation',
  required_documents = ARRAY['Cahier des charges technique', 'Plans architecturaux', 'Devis estimatif'],
  due_date = '2024-12-31',
  submission_date = '2024-11-30',
  review_deadline = '2024-12-15',
  approval_deadline = '2024-12-20',
  updated_at = NOW()
WHERE id = '8602c18c-663c-4906-aea7-efef1055c043';

-- Update the second step
UPDATE tender_steps SET
  title = 'Publication de l''avis d''appel d''offres',
  description = 'Publier l''avis d''appel d''offres sur les plateformes officielles',
  status = 'pending',
  procurement_phase = 'publication',
  procurement_stage = 'publication_avis',
  required_documents = ARRAY['Avis d''appel d''offres', 'Dossier de consultation', 'Règlement de consultation'],
  due_date = '2025-01-15',
  submission_date = NULL,
  review_deadline = '2025-01-10',
  approval_deadline = '2025-01-12',
  updated_at = NOW()
WHERE tender_id = '3da4363a-2b56-44b5-a3f8-bf74e6642a60' AND step_number = 2;