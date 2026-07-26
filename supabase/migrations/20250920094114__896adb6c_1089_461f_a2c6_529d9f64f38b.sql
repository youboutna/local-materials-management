-- Update some published tenders to be in phase 2 with future deadlines for supplier portal testing

-- Update tender "tttt" to phase 2 with future deadline
UPDATE tenders 
SET current_phase = 2, 
    deadline_date = '2025-12-30'::date
WHERE id = '0412316d-93bd-4e51-9783-5a75cdf92297';

-- Update "Appel d'offre traveaux projet ligne ndb-nkc" to phase 2 with future deadline  
UPDATE tenders
SET current_phase = 2,
    deadline_date = '2025-12-31'::date
WHERE id = '3da4363a-2b56-44b5-a3f8-bf74e6642a60';

-- Update "Demande de cotation à compétition ouverte" to phase 2 with future deadline
UPDATE tenders
SET current_phase = 2, 
    deadline_date = '2026-01-15'::date
WHERE id = '8c5ba917-af54-4dbf-8fa3-396b45f895e2';

-- Update "acquisition de" to phase 2 with future deadline
UPDATE tenders
SET current_phase = 2,
    deadline_date = '2025-11-30'::date  
WHERE id = '4be7ccea-6d44-4289-9f0e-9569d6d9b4af';