ALTER TABLE btp.organizational_hierarchy ALTER COLUMN employee_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.get_project_hierarchy(project_id_param uuid)
 RETURNS TABLE(hierarchy_id uuid, employee_id uuid, employee_name text, position_title text, department text, level integer, parent_id uuid, organization_name text, can_approve_projects boolean, can_approve_payments boolean, notification_preferences jsonb, employee_email text, employee_phone text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'btp', 'public'
AS $function$
  SELECT oh.id, oh.employee_id, e.full_name, oh.position_title, oh.department,
    oh.level, oh.parent_id, org.name, oh.can_approve_projects,
    oh.can_approve_payments, oh.notification_preferences, e.email, e.phone
  FROM btp.organizational_hierarchy oh
  LEFT JOIN btp.employees e ON oh.employee_id = e.id AND e.is_active = true
  JOIN btp.organizations org ON oh.organization_id = org.id
  WHERE org.is_active = true
    AND EXISTS (
      SELECT 1 FROM btp.project_organizations po
      WHERE po.organization_id = org.id AND po.project_id = project_id_param
    )
  ORDER BY oh.level ASC, oh.position_title;
$function$;

CREATE OR REPLACE FUNCTION public.get_hierarchy_chain(employee_id_param uuid, direction text DEFAULT 'up'::text)
 RETURNS TABLE(hierarchy_id uuid, employee_id uuid, employee_name text, position_title text, department text, level integer, distance integer, employee_email text, employee_phone text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'btp', 'public'
AS $function$
  WITH RECURSIVE hierarchy_chain AS (
    SELECT oh.id AS hierarchy_id, oh.employee_id, e.full_name AS employee_name,
           oh.position_title, oh.department, oh.level, 0 AS distance,
           e.email AS employee_email, e.phone AS employee_phone, oh.parent_id
    FROM btp.organizational_hierarchy oh
    LEFT JOIN btp.employees e ON oh.employee_id = e.id
    WHERE oh.employee_id = employee_id_param
    UNION ALL
    SELECT oh.id, oh.employee_id, e.full_name, oh.position_title, oh.department,
           oh.level, hc.distance + 1, e.email, e.phone, oh.parent_id
    FROM btp.organizational_hierarchy oh
    LEFT JOIN btp.employees e ON oh.employee_id = e.id
    JOIN hierarchy_chain hc ON (
      CASE WHEN direction = 'up' THEN oh.id = hc.parent_id
           WHEN direction = 'down' THEN oh.parent_id = hc.hierarchy_id END)
    WHERE hc.distance < 5
  )
  SELECT hierarchy_id, employee_id, employee_name, position_title, department,
         level, distance, employee_email, employee_phone
  FROM hierarchy_chain WHERE distance > 0 ORDER BY distance, level;
$function$;