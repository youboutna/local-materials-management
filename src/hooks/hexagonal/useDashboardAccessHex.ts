/**
 * Hexagonal hook for dashboard access control
 * Checks user roles and permissions
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardAccess {
  hasAccess: boolean;
  userRoles: string[];
  loading: boolean;
}

const ALLOWED_ROLES = ['admin', 'director', 'project_manager'];

export const useDashboardAccessHex = (userId: string | undefined) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-access', userId],
    queryFn: async (): Promise<{ hasAccess: boolean; userRoles: string[] }> => {
      if (!userId) {
        return { hasAccess: false, userRoles: [] };
      }

      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role_name')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user roles:', error);
        return { hasAccess: false, userRoles: [] };
      }

      const userRoleNames = roles?.map((r) => r.role_name) || [];
      const hasRequiredRole = userRoleNames.some((role) =>
        ALLOWED_ROLES.includes(role)
      );

      return { hasAccess: hasRequiredRole, userRoles: userRoleNames };
    },
    enabled: !!userId,
  });

  return {
    hasAccess: data?.hasAccess ?? false,
    userRoles: data?.userRoles ?? [],
    loading: isLoading,
    allowedRoles: ALLOWED_ROLES,
    refetch,
  };
};

export const useCheckAuthHex = () => {
  return useQuery({
    queryKey: ['check-auth'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });
};
