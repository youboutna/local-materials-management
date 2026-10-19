ALTER TABLE btp.project_operation_entries ADD COLUMN IF NOT EXISTS policy_snapshot jsonb;
CREATE OR REPLACE FUNCTION btp.snapshot_operation_policy() RETURNS trigger LANGUAGE plpgsql SET search_path=btp,pg_temp AS $$ BEGIN
 IF NEW.status='validated' AND (TG_OP='INSERT' OR OLD.status='draft') THEN
 SELECT jsonb_agg(jsonb_build_object('code',code,'version',metadata->>'version','metadata',metadata,'projectId',project_id)) INTO NEW.policy_snapshot FROM btp.referential_items WHERE domain='operation_context' AND code=NEW.context_code AND is_active AND (project_id IS NULL OR project_id=NEW.project_id);
 END IF;
 RETURN NEW; END $$;
CREATE TRIGGER a_snapshot_operation_policy BEFORE INSERT OR UPDATE ON btp.project_operation_entries FOR EACH ROW EXECUTE FUNCTION btp.snapshot_operation_policy();