-- 1. Supprimer la contrainte restrictive
ALTER TABLE btp.project_phases 
DROP CONSTRAINT IF EXISTS project_phases_phase_type_check;

-- 2. Recréer avec toutes les valeurs acceptées
ALTER TABLE btp.project_phases 
ADD CONSTRAINT project_phases_phase_type_check 
CHECK (phase_type IN (
  'standard', 'custom',
  'pre_construction', 'site_preparation', 'foundation', 
  'framing', 'structural_work', 'finishing', 'post_construction', 'handover',
  'etudes', 'travaux', 'reception', 'fabrication', 'installation',
  'analyse', 'definition', 'validation', 'execution',
  'pre_feasibility', 'design_dao', 'conception', 'preparation',
  'design', 'construction', 'cloture', 'livraison', 
  'planification', 'planning'
));

-- 3. Mettre à jour les valeurs NULL
UPDATE btp.project_phases 
SET phase_type = 'standard' 
WHERE phase_type IS NULL OR phase_type = '';

-- 4. Vérifier
SELECT * 
FROM pg_constraint 
WHERE conname = 'project_phases_phase_type_check';