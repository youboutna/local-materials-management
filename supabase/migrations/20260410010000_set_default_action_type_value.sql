ALTER TABLE btp.task_assignments
  ALTER COLUMN action_type SET DEFAULT 'task_assignment';
NOTIFY pgrst, 'reload schema';

BEGIN;

-- Fix action_type
ALTER TABLE btp.task_assignments
  ALTER COLUMN action_type SET DEFAULT 'task_assignment';

UPDATE btp.task_assignments
SET action_type = 'task_assignment'
WHERE action_type IS NULL;

-- Vérifier les contraintes stakeholder
DO $$
DECLARE
  v_constraint text;
BEGIN
  SELECT pg_get_constraintdef(oid)
  INTO v_constraint
  FROM pg_constraint
  WHERE conrelid = 'btp.project_stakeholders'::regclass
    AND conname = 'stakeholders_entity_consistency_check';

  RAISE NOTICE 'Contrainte stakeholder : %', v_constraint;
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;