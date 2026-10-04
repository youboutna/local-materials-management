-- Alignement UI -> DB pour les tâches (btp.task_assignments)
ALTER TABLE btp.task_assignments ADD COLUMN IF NOT EXISTS step_id uuid;
ALTER TABLE btp.task_assignments ADD COLUMN IF NOT EXISTS assigned_to uuid;
ALTER TABLE btp.task_assignments ADD COLUMN IF NOT EXISTS assigned_by uuid;
ALTER TABLE btp.task_assignments ADD COLUMN IF NOT EXISTS assignee_type text;
ALTER TABLE btp.task_assignments ADD COLUMN IF NOT EXISTS assignee_name text;
ALTER TABLE btp.task_assignments ADD COLUMN IF NOT EXISTS assignee_email text;
ALTER TABLE btp.task_assignments ADD COLUMN IF NOT EXISTS progress integer DEFAULT 0;
ALTER TABLE btp.task_assignments ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE btp.task_assignments ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE btp.task_assignments ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE btp.task_assignments ADD COLUMN IF NOT EXISTS estimated_duration integer;
ALTER TABLE btp.task_assignments ADD COLUMN IF NOT EXISTS actual_duration integer;

CREATE INDEX IF NOT EXISTS idx_btp_task_assignments_phase ON btp.task_assignments (phase_id);
CREATE INDEX IF NOT EXISTS idx_btp_task_assignments_project ON btp.task_assignments (project_id);
CREATE INDEX IF NOT EXISTS idx_btp_task_assignments_assigned_to ON btp.task_assignments (assigned_to);

NOTIFY pgrst, 'reload schema';