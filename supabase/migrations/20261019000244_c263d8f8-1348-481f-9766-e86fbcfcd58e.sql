CREATE OR REPLACE FUNCTION btp.validate_linked_operation() RETURNS trigger LANGUAGE plpgsql SET search_path = btp, pg_temp AS $$
DECLARE target_project uuid; target_phase uuid; project_currency text;
BEGIN
 IF NOT workbench_private.project_workbench_access(NEW.project_id,true) THEN RAISE EXCEPTION 'Project access denied'; END IF;
 IF NEW.status NOT IN ('draft','validated','cancelled') THEN RAISE EXCEPTION 'Invalid operation status'; END IF;
 IF NEW.perspective NOT IN ('owner','contractor') THEN RAISE EXCEPTION 'Invalid perspective'; END IF;
 SELECT currency INTO project_currency FROM btp.projects WHERE id=NEW.project_id;
 IF NEW.currency IS DISTINCT FROM project_currency THEN RAISE EXCEPTION 'Operation currency differs from project'; END IF;
 IF NEW.phase_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM btp.project_phases WHERE id=NEW.phase_id AND project_id=NEW.project_id) THEN RAISE EXCEPTION 'Phase outside project'; END IF;
 IF NEW.task_id IS NOT NULL THEN SELECT project_id,phase_id INTO target_project,target_phase FROM btp.task_assignments WHERE id=NEW.task_id; IF target_project IS DISTINCT FROM NEW.project_id OR (NEW.phase_id IS NOT NULL AND target_phase IS DISTINCT FROM NEW.phase_id) THEN RAISE EXCEPTION 'Task outside project or phase'; END IF; END IF;
 IF NEW.source_line_id IS NOT NULL THEN SELECT project_id,phase_id INTO target_project,target_phase FROM btp.boq_lines WHERE id=NEW.source_line_id; IF target_project IS DISTINCT FROM NEW.project_id OR (NEW.phase_id IS NOT NULL AND target_phase IS NOT NULL AND target_phase IS DISTINCT FROM NEW.phase_id) THEN RAISE EXCEPTION 'Document line outside project or phase'; END IF; END IF;
 IF NEW.decompte_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM btp.progress_invoices WHERE id=NEW.decompte_id AND project_id=NEW.project_id) THEN RAISE EXCEPTION 'Decompte outside project'; END IF;
 IF NEW.resource_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM btp.project_resources WHERE id=NEW.resource_id AND project_id=NEW.project_id) THEN RAISE EXCEPTION 'Resource outside project'; END IF;
 IF NEW.kind='consumption' AND NEW.resource_family IS NULL THEN RAISE EXCEPTION 'Consumption requires resource family'; END IF;
 IF TG_OP='UPDATE' AND OLD.status IN ('validated','cancelled') AND (to_jsonb(NEW)-ARRAY['status','updated_at']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['status','updated_at']) THEN RAISE EXCEPTION 'Finalized operation is immutable'; END IF;
 IF TG_OP='UPDATE' AND OLD.status='cancelled' AND NEW.status<>'cancelled' THEN RAISE EXCEPTION 'Cancelled operation is immutable'; END IF;
 IF TG_OP='UPDATE' AND OLD.status='validated' AND NEW.status NOT IN ('validated','cancelled') THEN RAISE EXCEPTION 'Cancel validated operation before correction'; END IF;
 IF NEW.status='validated' AND (TG_OP='INSERT' OR OLD.status='draft') THEN NEW.validated_at=now(); NEW.validated_by=auth.uid(); END IF;
 NEW.updated_at=now(); RETURN NEW;
END $$;