-- Create function to get organizational hierarchy for a project
CREATE OR REPLACE FUNCTION btp.get_project_hierarchy(project_id_param uuid)
RETURNS TABLE (
  hierarchy_id uuid,
  employee_id uuid,
  employee_name text,
  position_title text,
  department text,
  level integer,
  parent_id uuid,
  organization_name text,
  can_approve_projects boolean,
  can_approve_payments boolean,
  notification_preferences jsonb,
  employee_email text,
  employee_phone text
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    oh.id as hierarchy_id,
    oh.employee_id,
    e.full_name as employee_name,
    oh.position_title,
    oh.department,
    oh.level,
    oh.parent_id,
    org.name as organization_name,
    oh.can_approve_projects,
    oh.can_approve_payments,
    oh.notification_preferences,
    e.email as employee_email,
    e.phone as employee_phone
  FROM btp.organizational_hierarchy oh
  JOIN btp.employees e ON oh.employee_id = e.id
  JOIN btp.organizations org ON oh.organization_id = org.id
  JOIN btp.project_organizations po ON org.id = po.organization_id
  WHERE po.project_id = project_id_param
    AND e.is_active = true
    AND org.is_active = true
  ORDER BY oh.level ASC, oh.position_title;
$$;

-- Create function to get hierarchy chain (subordinates and superiors)
CREATE OR REPLACE FUNCTION btp.get_hierarchy_chain(employee_id_param uuid, direction text DEFAULT 'up')
RETURNS TABLE (
  hierarchy_id uuid,
  employee_id uuid,
  employee_name text,
  position_title text,
  department text,
  level integer,
  distance integer,
  employee_email text,
  employee_phone text
)
LANGUAGE sql
SECURITY DEFINER  
AS $$
  WITH RECURSIVE hierarchy_chain AS (
    -- Base case: starting employee
    SELECT 
      oh.id as hierarchy_id,
      oh.employee_id,
      e.full_name as employee_name,
      oh.position_title,
      oh.department,
      oh.level,
      0 as distance,
      e.email as employee_email,
      e.phone as employee_phone,
      oh.parent_id
    FROM btp.organizational_hierarchy oh
    JOIN btp.employees e ON oh.employee_id = e.id
    WHERE oh.employee_id = employee_id_param
    
    UNION ALL
    
    -- Recursive case: get parent/child based on direction
    SELECT 
      oh.id as hierarchy_id,
      oh.employee_id,
      e.full_name as employee_name,
      oh.position_title,
      oh.department,
      oh.level,
      hc.distance + 1,
      e.email as employee_email,
      e.phone as employee_phone,
      oh.parent_id
    FROM btp.organizational_hierarchy oh
    JOIN btp.employees e ON oh.employee_id = e.id
    JOIN hierarchy_chain hc ON (
      CASE 
        WHEN direction = 'up' THEN oh.id = hc.parent_id
        WHEN direction = 'down' THEN oh.parent_id = hc.hierarchy_id
      END
    )
    WHERE hc.distance < 5 -- Prevent infinite recursion
  )
  SELECT 
    hierarchy_id,
    employee_id,
    employee_name,
    position_title,
    department,
    level,
    distance,
    employee_email,
    employee_phone
  FROM hierarchy_chain
  WHERE distance > 0  -- Exclude the starting employee
  ORDER BY distance, level;
$$;

-- Create function to get escalation targets based on level
CREATE OR REPLACE FUNCTION btp.get_escalation_targets(
  project_id_param uuid, 
  escalation_level_param text
)
RETURNS TABLE (
  employee_id uuid,
  employee_name text,
  employee_email text,
  employee_phone text,
  position_title text,
  department text,
  hierarchy_level integer
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    oh.employee_id,
    e.full_name as employee_name,
    e.email as employee_email,
    e.phone as employee_phone,
    oh.position_title,
    oh.department,
    oh.level as hierarchy_level
  FROM btp.organizational_hierarchy oh
  JOIN btp.employees e ON oh.employee_id = e.id
  JOIN btp.organizations org ON oh.organization_id = org.id
  JOIN btp.project_organizations po ON org.id = po.organization_id
  WHERE po.project_id = project_id_param
    AND e.is_active = true
    AND org.is_active = true
    AND (
      CASE escalation_level_param
        WHEN 'team' THEN oh.level >= 3
        WHEN 'supervisor' THEN oh.level = 2 AND (oh.position_title ILIKE '%supervisor%' OR oh.position_title ILIKE '%chef%')
        WHEN 'manager' THEN oh.level = 2 AND (oh.position_title ILIKE '%manager%' OR oh.position_title ILIKE '%responsable%')
        WHEN 'director' THEN oh.level = 1 AND (oh.position_title ILIKE '%director%' OR oh.position_title ILIKE '%directeur%')
        ELSE true
      END
    )
  ORDER BY oh.level ASC, oh.position_title;
$$;