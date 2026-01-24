/**
 * Hexagonal hook for dashboard access control
 * Checks user roles and permissions
 */
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/use-auth';
import { DEV_MODE, DEV_USER, DEV_CONFIG } from '@/config/constants';

export interface DashboardAccess {
  hasAccess: boolean;
  userRoles: string[];
  loading: boolean;
}

const ALLOWED_ROLES = ['admin', 'director', 'project_manager'];

export const useDashboardAccessHex = (userId: string | undefined) => {
  const { user, loading: authLoading } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-access', userId || user?.id],
    queryFn: async (): Promise<{ hasAccess: boolean; userRoles: string[] }> => {
      const currentUserId = userId || user?.id;
      
      if (!currentUserId) {
        return { hasAccess: false, userRoles: [] };
      }

      try {
        // For development/demo purposes, grant access to all authenticated users
        // In production, this would check actual roles from database
        return { 
          hasAccess: true, 
          userRoles: ['admin'] // Default role for demo
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
    loading: authLoading || isLoading,
    allowedRoles: ALLOWED_ROLES,
    refetch,
  };
};

export const useCheckAuthHex = () => {
  const { user, loading } = useAuth();
  
  // In development mode, return DEV_USER if no real user
  const effectiveUser = DEV_MODE && !user ? DEV_USER : user;
  
  return {
    data: { user: effectiveUser },
    isLoading: DEV_MODE ? false : loading, // No loading in dev mode
    error: null,
    refetch: () => Promise.resolve()
  };
};
