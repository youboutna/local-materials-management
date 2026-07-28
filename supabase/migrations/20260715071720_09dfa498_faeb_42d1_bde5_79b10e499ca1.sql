ALTER TABLE btp.project_phases DROP CONSTRAINT IF EXISTS project_phases_status_check;
ALTER TABLE btp.project_phases ADD CONSTRAINT project_phases_status_check
  CHECK (status = ANY (ARRAY['not_started','pending','planned','in_progress','completed','delayed','cancelled','on_hold']));