/**
 * Hexagonal hook for dashboard access control
 * Checks user roles and permissions
 */
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/use-auth';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';
import { DEV_MODE, DEV_USER, DEV_CONFIG } from '@/config/constants';

export interface DashboardAccess {
  hasAccess: boolean;
  userRoles: string[];
  loading: boolean;
}

const ALLOWED_ROLES = ['admin', 'director', 'project_manager'];

export const useDashboardAccessHex = (userId: string | undefined) => {
  const { user, loading: authLoading } = useAuth();
  const { userRoles, hasAnyRole, isLoading: rolesLoading } = useCurrentUserRoles();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-access', userId || user?.id],
    queryFn: async (): Promise<{ hasAccess: boolean; userRoles: string[] }> => {
      const currentUserId = userId || user?.id;
      
      if (!currentUserId) {
        return { hasAccess: false, userRoles: [] };
      }

      try {
        // Check if user has any of the allowed roles
        const hasRequiredRole = hasAnyRole(ALLOWED_ROLES);
        
        return { 
          hasAccess: hasRequiredRole, 
          userRoles: userRoles || []
        };
      } catch (error) {
        console.error('Error in dashboard access check:', error);
        return { hasAccess: false, userRoles: [] };
      }
    },
    enabled: !!user, // Only run if user is authenticated
    staleTime: 30_000, // 30 seconds
    retry: 1,
  });

  return {
    hasAccess: data?.hasAccess ?? false,
    userRoles: data?.userRoles ?? [],
    loading: authLoading || rolesLoading || isLoading,
    allowedRoles: ALLOWED_ROLES,
    refetch,
  };
};

export const useCheckAuthHex = () => {
  const { user, loading } = useAuth();

  // DEV_MODE no longer auto-injects DEV_USER. The user must sign in via the
  // Auth page — LocalAuthAdapter validates credentials against DEV_USERS and
  // populates the AuthContext session on success.
  return {
    data: { user },
    isLoading: loading,
    error: null,
    refetch: () => Promise.resolve()
  };
};
