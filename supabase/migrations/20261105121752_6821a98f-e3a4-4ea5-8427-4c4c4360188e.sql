ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS valid_role_name;
ALTER TABLE public.user_roles ADD CONSTRAINT valid_role_name CHECK (role_name IN (
 'public','petitionnaire','gerant','depot_manager','brand_manager','agent_dgp','agent_cnh','inspector_hse',
 'chef_service_dgp','chef_service_cnh','directeur_dgp','directeur_cnh','ministre','admin','super_admin',
 'agent','manager','director','project','project_manager','project_project','supplier','engineering_consultant',
 'consultant','inspector','prmp','viewer'));
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_status_check;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS check_user_roles_status;
ALTER TABLE public.user_roles ADD CONSTRAINT check_user_roles_status CHECK (status IN ('active','pending','inactive','expired','revoked','suspended'));