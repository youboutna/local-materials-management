/** path: src/hooks/useUserRoles.ts
 * User Roles Hook - Hexagonal Architecture
 * Uses UserService and AuthService for role management
 * Legacy interface maintained for backward compatibility
 *
 * ⚠️ Un utilisateur peut avoir PLUSIEURS rôles.
 */

import { getAuthService } from '@/application/services/AuthService';
import { getUserService } from '@/application/services/UserService';
import { DEV_MODE, getActiveDevRole, IS_LOCAL_BYPASS } from '@/config/constants';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/hexagonal/useAuth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

// ────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────

export interface UserRole {
  id: string;
  roleName: string;
  permissions?: Record<string, boolean>;
  created_at?: string;
  updated_at?: string;
}

interface UserPermission {
  id: string;
  name: string;
  description?: string;
  scope: string[];
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions?: UserPermission[];
  created_at: string;
  updated_at: string;
}

// ────────────────────────────────────────────────────────────
// CONSTANTES
// ────────────────────────────────────────────────────────────

const ROLE_PRIORITY: string[] = [
  'admin',
  'super_admin',
  'director',
  'manager',
  'inspector',
  'supervisor',
  'project_manager',
  'project',
  'project_project',
  'supplier',
  'consultant',
  'public',
  'user',
];

const AVAILABLE_ROLES = [
  'admin',
  'super_admin',
  'director',
  'manager',
  'project_manager',
  'inspector',
  'supervisor',
  'supplier',
  'consultant',
  'agent',
  'project',
  'project_project',
  'public',
  'user',
];

// ────────────────────────────────────────────────────────────
// HELPERS INTERNES
// ────────────────────────────────────────────────────────────

async function fetchUserRoles(userId: string): Promise<string[]> {
  if (!userId) return [];
  const roles = await getAuthService().getUserRoles(userId);
  return roles.map((role) => role.roleName);
}

async function fetchUsersRoles(userIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (!userIds || userIds.length === 0) return map;
  const roleEntries = await Promise.all(
    userIds.map(async (userId) => [userId, await fetchUserRoles(userId)] as const),
  );
  roleEntries.forEach(([userId, roles]) => map.set(userId, roles));
  return map;
}

function pickPrimaryRole(roles: string[]): string {
  if (!roles || roles.length === 0) return 'user';
  for (const p of ROLE_PRIORITY) if (roles.includes(p)) return p;
  return roles[0];
}

const getServices = () => ({
  authService: getAuthService(),
  userService: getUserService(),
});

// ────────────────────────────────────────────────────────────
// HOOK 1 — useUserRoles(userId)
// ────────────────────────────────────────────────────────────

export const useUserRoles = (userId?: string) => {
  const { userService } = getServices();

  const {
    data: userRoles,
    isLoading: rolesLoading,
    error: rolesError,
    refetch,
  } = useQuery({
    queryKey: ['userRoles', userId, DEV_MODE ? getActiveDevRole().role : null],
    queryFn: async (): Promise<UserRole[]> => {
      if (!userId) return [];

      if (IS_LOCAL_BYPASS) {
        const role = getActiveDevRole().role;
        return [
          {
            id: `${userId}-${role}`,
            roleName: role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
      }

      const roleNames = await fetchUserRoles(userId);

      if (roleNames.length === 0) {
        const user = await userService.getUserById(userId);
        const legacyRole = (user as { role?: string } | null)?.role;
        if (legacyRole && typeof legacyRole === 'string') {
          return [
            {
              id: `${userId}-legacy-${legacyRole}`,
              roleName: legacyRole,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ];
        }
        return [];
      }

      return roleNames.map((roleName) => ({
        id: `${userId}-${roleName}`,
        roleName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
    },
    enabled: !!userId,
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000,
  });

  const availableRoles: Role[] = AVAILABLE_ROLES.map((r) => ({
    id: r,
    name: r,
    description: r,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  return {
    userRoles: userRoles || [],
    availableRoles,
    isLoading: rolesLoading,
    error: (rolesError as Error)?.message ?? null,
    refetch,
  };
};

// ────────────────────────────────────────────────────────────
// HOOK 2 — useCurrentUserRoles()
// ────────────────────────────────────────────────────────────

export const useCurrentUserRoles = () => {
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const { user, isAuthenticated } = useAuth();

  const loadCurrentUser = useCallback(async () => {
    if (!user?.id) return;
    setCurrentUser({ id: user.id });
  }, [user?.id]);

  useEffect(() => {
    if (isAuthenticated && user) loadCurrentUser();
  }, [isAuthenticated, user, loadCurrentUser]);

  const {
    data: userRoles,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      'currentUserRoles',
      currentUser?.id,
      user?.role,
      DEV_MODE ? getActiveDevRole().role : null,
    ],
    queryFn: async (): Promise<string[]> => {
      if (IS_LOCAL_BYPASS) {
        const devRole = getActiveDevRole().role;
        return Array.from(
          new Set([devRole, String(user?.role || '').toLowerCase()].filter(Boolean))
        );
      }

      const fallbackRoles = user?.role ? [String(user.role).toLowerCase()] : [];
      const userId = currentUser?.id || user?.id;
      if (!userId) return fallbackRoles;

      const roles = await fetchUserRoles(userId);
      if (roles.length === 0) return fallbackRoles;
      const normalized = roles.map((r) => r.toLowerCase());
      return Array.from(new Set([...normalized, ...fallbackRoles]));
    },
    enabled: !!currentUser?.id || !!user?.id || !!isAuthenticated,
    retry: IS_LOCAL_BYPASS ? 0 : 2,
    retryDelay: 500,
    staleTime: 5 * 60 * 1000,
    placeholderData: () => {
      if (IS_LOCAL_BYPASS) return [getActiveDevRole().role];
      return user?.role ? [String(user.role).toLowerCase()] : [];
    },
  });

  const roles = (userRoles as string[]) || [];

  const hasRole = (roleName: string): boolean =>
    roles.includes(String(roleName).toLowerCase());

  const hasAnyRole = (roleNames: string[]): boolean =>
    roleNames.some((role) => roles.includes(role.toLowerCase()));

  const hasAllRoles = (roleNames: string[]): boolean => {
    if (roles.length === 0) return false;
    const wanted = roleNames.map((r) => String(r).toLowerCase());
    return wanted.every((role) => roles.includes(role));
  };

  const getRoleCount = (): number => roles.length;
  const getRoleNames = (): string[] => roles;
  const getPrimaryRole = (): string => pickPrimaryRole(roles);

  const isSuperAdmin = (): boolean => hasAnyRole(['super_admin', 'admin']);
  const isManager = (): boolean =>
    hasAnyRole(['manager', 'project_manager']) || isSuperAdmin();
  const isDirector = (): boolean => hasRole('director');
  const isEmployee = (): boolean => hasAnyRole(['employee', 'staff']) || isManager();

  return {
    userRoles: roles,
    currentUser,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    getRoleCount,
    getRoleNames,
    getPrimaryRole,
    isSuperAdmin,
    isManager,
    isDirector,
    isEmployee,
    isLoading,
    error: (error as Error)?.message ?? null,
    refetch,
  };
};

// ────────────────────────────────────────────────────────────
// HOOK 3 — useRoleManagement()
// ────────────────────────────────────────────────────────────

export const useRoleManagement = () => {
  const queryClient = useQueryClient();
  const { authService } = getServices();

  const assignRole = useMutation({
    mutationFn: async ({
      userId,
      roleName,
    }: {
      userId: string;
      roleName: string;
    }) => {
      await authService.ensureUserRoleAssigned(userId, roleName);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userRoles', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['currentUserRoles'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Rôle assigné',
        description: `Le rôle "${variables.roleName}" a été assigné avec succès.`,
      });
    },
    onError: (error) => {
      console.error('[useRoleManagement.assignRole] Error:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'assigner le rôle.",
        variant: 'destructive',
      });
    },
  });

  const removeRole = useMutation({
    mutationFn: async ({
      userId,
      roleName,
    }: {
      userId: string;
      roleName: string;
    }) => {
      await authService.revokeUserRole(userId, roleName);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userRoles', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['currentUserRoles'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Rôle retiré',
        description: `Le rôle "${variables.roleName}" a été retiré avec succès.`,
      });
    },
    onError: (error) => {
      console.error('[useRoleManagement.removeRole] Error:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de retirer le rôle.',
        variant: 'destructive',
      });
    },
  });

  const getUserRoles = async (userId: string): Promise<string[]> => {
    try {
      return await fetchUserRoles(userId);
    } catch (err) {
      console.error('[useRoleManagement.getUserRoles] Error:', err);
      throw err;
    }
  };

  const getUsersRoles = async (userIds: string[]): Promise<Map<string, string[]>> => {
    try {
      return await fetchUsersRoles(userIds);
    } catch (err) {
      console.error('[useRoleManagement.getUsersRoles] Error:', err);
      throw err;
    }
  };

  const getAllRoles = async (): Promise<string[]> => [...AVAILABLE_ROLES];

  return {
    assignRole,
    removeRole,
    getUserRoles,
    getUsersRoles,
    getAllRoles,
  };
};