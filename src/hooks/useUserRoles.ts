/**
 * User Roles Hook - Hexagonal Architecture
 * Uses UserService and AuthService for role management
 * Legacy interface maintained for backward compatibility
 */

import { AuthService } from '@/application/services/AuthService';
import { UserService } from '@/application/services/UserService';
import { DEV_MODE, getActiveDevRole } from '@/config/constants';
import { toast } from '@/hooks/use-toast';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import { UserRole } from '@/dtos/entities/AuthDTO';
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

// Initialize services
const getServices = () => {
  const authRepository = RepositoryFactory.getAuthRepository();
  const userRepository = RepositoryFactory.getUserRepository();
  return {
    authService: new AuthService(authRepository),
    userService: new UserService(userRepository)
  };
};

export const useUserRoles = (userId?: string) => {
  const { userService } = getServices();

  const { data: userRoles, isLoading: rolesLoading, error: rolesError } = useQuery({
    queryKey: ['userRoles', userId, DEV_MODE ? getActiveDevRole().role : null],
    queryFn: async () => {
      if (!userId) return [];
      if (DEV_MODE) {
        const role = getActiveDevRole().role;
        return [{ id: `${userId}-${role}`, roleName: role, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }] as UserRole[];
      }
      
      try {
        const user = await userService.getUserById(userId);
        if (!user) return [];
        
        const roles: UserRole[] = user.role ? [{
          id: `${userId}-${user.role}`,
          roleName: String(user.role),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }] : [];
        
        return roles;
      } catch (error) {
        console.error('Error fetching user roles:', error);
        return [];
      }
    },
    enabled: !!userId,
    retry: 3,
    retryDelay: 1000
  });

  const availableRoles = [
    { id: 'admin', name: 'admin', description: 'Administrator' },
    { id: 'director', name: 'director', description: 'Director' },
    { id: 'manager', name: 'manager', description: 'Manager' },
    { id: 'agent', name: 'agent', description: 'Agent' },
    { id: 'supplier', name: 'supplier', description: 'Supplier' },
    { id: 'user', name: 'user', description: 'User' }
  ];

  return {
    userRoles: userRoles || [],
    availableRoles,
    isLoading: rolesLoading,
    error: rolesError as string | null
  };
};

export const useCurrentUserRoles = () => {
  const [currentUser, setCurrentUser] = useState<UserRole | null>(null);
  const { user, isAuthenticated } = useUnifiedAuth();
  const { authService, userService } = getServices();

  const loadCurrentUser = useCallback(async () => {
    if (!user?.id) return;
    if (DEV_MODE) {
      setCurrentUser({
        id: user.id,
        roleName: getActiveDevRole().role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return;
    }
    const userData = await userService.getUserById(user.id);
    setCurrentUser(userData ? {
      roleName: String(userData.role || ''),
      id: userData.id || user.id,
      created_at: userData.createdAt?.toISOString?.() || new Date().toISOString(),
      updated_at: userData.updatedAt?.toISOString?.() || new Date().toISOString(),
    } : null);
  }, [user?.id, userService]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadCurrentUser();
    }
  }, [isAuthenticated, user, loadCurrentUser]);

  const { data: userRoles, isLoading, error } = useQuery({
    queryKey: ['currentUserRoles', currentUser?.id, user?.role, DEV_MODE ? getActiveDevRole().role : null],
    queryFn: async () => {
      // DEV_MODE: no network — resolve roles from local DEV_USER profile.
      if (DEV_MODE) {
        const devRole = getActiveDevRole().role;
        return Array.from(new Set([devRole, String(user?.role || '').toLowerCase()].filter(Boolean)));
      }

      const fallbackRoles = user?.role ? [String(user.role).toLowerCase()] : [];

      const userId = currentUser?.id || user?.id;
      if (!userId) return fallbackRoles;
      
      try {
        const userServiceUser = await userService.getUserById(userId);
        if (!userServiceUser) {
          return fallbackRoles;
        }
        
        // Get roles from the userRoles array (multi-role support)
        const userRolesEntities = userServiceUser.userRoles || [];
        const roleNames = userRolesEntities.map(ur => String(ur.roleName || ur).toLowerCase());
        
        // Also include primary role
        const primaryRole = userServiceUser.role ? [String(userServiceUser.role).toLowerCase()] : [];
        
        const allRoles = Array.from(new Set([...roleNames, ...primaryRole, ...fallbackRoles]));
        
        return allRoles;
      } catch (error) {
        console.error('Error fetching current user roles:', error);
        return fallbackRoles;
      }
    },
    enabled: !!currentUser?.id || !!user?.id || !!isAuthenticated,
    retry: DEV_MODE ? 0 : 2,
    retryDelay: 500,
    staleTime: 5 * 60 * 1000,
    placeholderData: () => {
      if (DEV_MODE) return [getActiveDevRole().role];
      return user?.role ? [String(user.role).toLowerCase()] : [];
    }
  });

  const hasRole = (roleName: string) => {
    return (userRoles as string[])?.includes(String(roleName).toLowerCase()) || false;
  };

  const hasAnyRole = (roleNames: string[]): boolean => {
    const roles = userRoles || [];
    return roleNames.some(role => roles.includes(role.toLowerCase()));
  };

  const hasAllRoles = (roleNames: string[]) => {
    const roles = (userRoles as string[]) || [];
    if (roles.length === 0 || !Array.isArray(roles)) return false;
    const wanted = roleNames.map((r) => String(r).toLowerCase());
    return wanted.every((role) => roles.includes(role));
  };

  const getRoleCount = () => {
    return (userRoles as string[])?.length || 0;
  };

  const getRoleNames = () => {
    return (userRoles as string[]) || [];
  };

  const isSuperAdmin = () => {
    return hasRole('super_admin') || hasRole('admin');
  };

  const isManager = () => {
    return hasRole('manager') || hasRole('project_manager') || isSuperAdmin();
  };

  const isEmployee = () => {
    return hasRole('employee') || hasRole('staff') || isManager();
  };

  return {
    userRoles: (userRoles as string[]) || [],
    hasRole,
    hasAnyRole,
    hasAllRoles,
    getRoleCount,
    getRoleNames,
    isSuperAdmin,
    isManager,
    isEmployee,
    isLoading,
    currentUser,
    error
  };
};

export const useRoleManagement = () => {
  const queryClient = useQueryClient();
  const { userService } = getServices();

  const assignRole = useMutation({
    mutationFn: async ({ userId, roleName }: { userId: string; roleName: string }) => {
      try {
        const user = await userService.getUserById(userId);
        if (!user) throw new Error('User not found');
        
        const currentRoles = user.userRoles || [];
        const hasRole = currentRoles.some(ur => 
          String(ur.roleName || ur).toLowerCase() === String(roleName).toLowerCase()
        );
        
        if (hasRole) {
          return;
        }
        
        // Update user role via service
        await userService.updateUser(userId, {
          role: roleName as any
        });
      } catch (error) {
        console.error('Error assigning role:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRoles'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserRoles'] });
      toast({
        title: "Rôle assigné",
        description: "Le rôle a été assigné avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible d'assigner le rôle.",
        variant: "destructive",
      });
    }
  });

  const removeRole = useMutation({
    mutationFn: async ({ userId, roleName }: { userId: string; roleName: string }) => {
      try {
        const user = await userService.getUserById(userId);
        if (!user) throw new Error('User not found');
        
        // Reset to default role
        await userService.updateUser(userId, {
          role: 'agent' as any
        });
      } catch (error) {
        console.error('Error removing role:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRoles'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserRoles'] });
      toast({
        title: "Rôle retiré",
        description: "Le rôle a été retiré avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de retirer le rôle.",
        variant: "destructive",
      });
    }
  });

  return {
    assignRole,
    removeRole,
    getUserRoles: async (userId: string) => {
      const user = await userService.getUserById(userId);
      if (!user) return [];
      return user.userRoles?.map(ur => String(ur.roleName)) || [];
    },
    getAllRoles: async () => {
      return ['admin', 'manager', 'project_manager', 'employee', 'staff', 'user'];
    }
  };
};