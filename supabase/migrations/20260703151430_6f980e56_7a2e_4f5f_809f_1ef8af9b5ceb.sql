
-- 1. Créer les tables manquantes dans btp
DO $mig$
DECLARE
  t text;
  tables text[] := ARRAY[
    'project_milestones','project_comments','project_alerts',
    'project_resources','project_risks','phase_employees',
    'phase_materials','task_dependencies','risk_task_relations',
    'resource_assignments','workflow_status'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('CREATE TABLE IF NOT EXISTS btp.%I (LIKE public.%I INCLUDING ALL)', t, t);
  END LOOP;
END $mig$;

-- 2. Copier les données en excluant les colonnes générées
DO $mig$
DECLARE
  t text;
  tables text[] := ARRAY[
    'project_milestones','project_comments','project_alerts',
    'project_resources','project_risks','phase_employees',
    'phase_materials','task_dependencies','risk_task_relations',
    'resource_assignments','workflow_status'
  ];
  cnt bigint;
  col_list text;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('SELECT count(*) FROM btp.%I', t) INTO cnt;
    IF cnt = 0 THEN
      SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
        INTO col_list
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name=t
        AND is_generated = 'NEVER';
      EXECUTE format('INSERT INTO btp.%I (%s) SELECT %s FROM public.%I', t, col_list, col_list, t);
    END IF;
  END LOOP;
END $mig$;

-- 3. GRANTs + RLS
DO $mig$
DECLARE
  t text;
  tables text[] := ARRAY[
    'project_milestones','project_comments','project_alerts',
    'project_resources','project_risks','phase_employees',
    'phase_materials','task_dependencies','risk_task_relations',
    'resource_assignments','workflow_status'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON btp.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON btp.%I TO service_role', t);
    EXECUTE format('ALTER TABLE btp.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $mig$;

-- 4. Recopier les policies depuis public
DO $mig$
DECLARE
  r record;
  tables text[] := ARRAY[
    'project_milestones','project_comments','project_alerts',
    'project_resources','project_risks','phase_employees',
    'phase_materials','task_dependencies','risk_task_relations',
    'resource_assignments','workflow_status'
  ];
BEGIN
  FOR r IN
    SELECT * FROM pg_policies
    WHERE schemaname='public' AND tablename = ANY(tables)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.%I', r.policyname, r.tablename);
    EXECUTE format(
      'CREATE POLICY %I ON btp.%I AS %s FOR %s TO %s %s %s',
      r.policyname, r.tablename, r.permissive, r.cmd,
      array_to_string(r.roles::text[], ','),
      CASE WHEN r.qual IS NOT NULL THEN 'USING ('||r.qual||')' ELSE '' END,
      CASE WHEN r.with_check IS NOT NULL THEN 'WITH CHECK ('||r.with_check||')' ELSE '' END
    );
  END LOOP;
END $mig$;

-- 5. Triggers updated_at
DO $mig$
DECLARE
  t text;
  tables text[] := ARRAY[
    'project_milestones','project_comments','project_alerts',
    'project_resources','project_risks','phase_employees',
    'phase_materials','task_dependencies','risk_task_relations',
    'resource_assignments','workflow_status'
  ];
  has_col boolean;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    SELECT EXISTS(
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='btp' AND table_name=t AND column_name='updated_at'
    ) INTO has_col;
    IF has_col THEN
      EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON btp.%I', t);
      EXECUTE format(
        'CREATE TRIGGER set_updated_at BEFORE UPDATE ON btp.%I FOR EACH ROW EXECUTE FUNCTION btp.update_updated_at_column()',
        t
      );
    END IF;
  END LOOP;
END $mig$;

-- 6. Refactor fonctions SECURITY DEFINER → source btp
CREATE OR REPLACE FUNCTION btp.get_project_hierarchy(project_id_param uuid)
 RETURNS TABLE(hierarchy_id uuid, employee_id uuid, employee_name text, position_title text, department text, level integer, parent_id uuid, organization_name text, can_approve_projects boolean, can_approve_payments boolean, notification_preferences jsonb, employee_email text, employee_phone text)
 LANGUAGE sql SECURITY DEFINER SET search_path TO 'btp', 'public'
AS $function$
  SELECT oh.id, oh.employee_id, e.full_name, oh.position_title, oh.department,
    oh.level, oh.parent_id, org.name, oh.can_approve_projects,
    oh.can_approve_payments, oh.notification_preferences, e.email, e.phone
  FROM btp.organizational_hierarchy oh
  JOIN btp.employees e ON oh.employee_id = e.id
  JOIN btp.organizations org ON oh.organization_id = org.id
  JOIN btp.project_organizations po ON org.id = po.organization_id
  WHERE po.project_id = project_id_param AND e.is_active = true AND org.is_active = true
  ORDER BY oh.level ASC, oh.position_title;
$function$;

CREATE OR REPLACE FUNCTION btp.get_hierarchy_chain(employee_id_param uuid, direction text DEFAULT 'up')
 RETURNS TABLE(hierarchy_id uuid, employee_id uuid, employee_name text, position_title text, department text, level integer, distance integer, employee_email text, employee_phone text)
 LANGUAGE sql SECURITY DEFINER SET search_path TO 'btp', 'public'
AS $function$
  WITH RECURSIVE hierarchy_chain AS (
    SELECT oh.id AS hierarchy_id, oh.employee_id, e.full_name AS employee_name,
           oh.position_title, oh.department, oh.level, 0 AS distance,
           e.email AS employee_email, e.phone AS employee_phone, oh.parent_id
    FROM btp.organizational_hierarchy oh
    JOIN btp.employees e ON oh.employee_id = e.id
    WHERE oh.employee_id = employee_id_param
    UNION ALL
    SELECT oh.id, oh.employee_id, e.full_name, oh.position_title, oh.department,
           oh.level, hc.distance + 1, e.email, e.phone, oh.parent_id
    FROM btp.organizational_hierarchy oh
    JOIN btp.employees e ON oh.employee_id = e.id
    JOIN hierarchy_chain hc ON (
      CASE WHEN direction = 'up' THEN oh.id = hc.parent_id
           WHEN direction = 'down' THEN oh.parent_id = hc.hierarchy_id END)
    WHERE hc.distance < 5
  )
  SELECT hierarchy_id, employee_id, employee_name, position_title, department,
         level, distance, employee_email, employee_phone
  FROM hierarchy_chain WHERE distance > 0 ORDER BY distance, level;
$function$;

CREATE OR REPLACE FUNCTION btp.get_escalation_targets(project_id_param uuid, escalation_level_param text)
 RETURNS TABLE(employee_id uuid, employee_name text, employee_email text, employee_phone text, position_title text, department text, hierarchy_level integer)
 LANGUAGE sql SECURITY DEFINER SET search_path TO 'btp', 'public'
AS $function$
  SELECT oh.employee_id, e.full_name, e.email, e.phone, oh.position_title, oh.department, oh.level
  FROM btp.organizational_hierarchy oh
  JOIN btp.employees e ON oh.employee_id = e.id
  JOIN btp.organizations org ON oh.organization_id = org.id
  JOIN btp.project_organizations po ON org.id = po.organization_id
  WHERE po.project_id = project_id_param AND e.is_active = true AND org.is_active = true
    AND (CASE escalation_level_param
      WHEN 'team' THEN oh.level >= 3
      WHEN 'supervisor' THEN oh.level = 2 AND (oh.position_title ILIKE '%supervisor%' OR oh.position_title ILIKE '%chef%')
      WHEN 'manager' THEN oh.level = 2 AND (oh.position_title ILIKE '%manager%' OR oh.position_title ILIKE '%responsable%')
      WHEN 'director' THEN oh.level = 1 AND (oh.position_title ILIKE '%director%' OR oh.position_title ILIKE '%directeur%')
      ELSE true END)
  ORDER BY oh.level ASC, oh.position_title;
$function$;

CREATE OR REPLACE FUNCTION btp.search_projects_autocomplete(search_term text DEFAULT '')
 RETURNS TABLE(id uuid, title text, project_reference text)
 LANGUAGE sql SECURITY DEFINER SET search_path TO 'btp', 'public'
AS $function$
  SELECT p.id, p.title, COALESCE(p.project_reference, '')
  FROM btp.projects p
  WHERE (search_term = '' OR p.title ILIKE '%'||search_term||'%'
         OR p.project_reference ILIKE '%'||search_term||'%')
  ORDER BY p.title LIMIT 50;
$function$;
