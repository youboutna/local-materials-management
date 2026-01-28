/**
 * User Roles Hook - Hexagonal Architecture
 * Uses UserService and AuthService for role management
 * Legacy interface maintained for backward compatibility
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { useKeycloakAuth } from '@/contexts/KeycloakAuthContext';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { AuthService } from '@/application/services/AuthService';
import { UserService } from '@/application/services/UserService';

export interface UserRole {
  id: string;
  user_id: string;
  role_name: string;
  assigned_at: string;
  assigned_by?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions?: any;
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

  // Fetch user roles via UserService
  const { data: userRoles, isLoading: rolesLoading, error: rolesError } = useQuery({
    queryKey: ['userRoles', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log('Fetching user roles for:', userId);
      
      try {
        // Get user with roles from UserService
        const user = await userService.getUserById(userId);
        if (!user) return [];
        
        // Map single role to UserRole format for backward compatibility
        const roles: UserRole[] = user.role ? [{
          id: `${userId}-${user.role}`,
          user_id: userId,
          role_name: user.role,
          assigned_at: new Date().toISOString(),
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

  // Available roles (static list)
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
    error: rolesError
  };
};

export const useCurrentUserRoles = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { user, isAuthenticated } = useUnifiedAuth();
  const { authService, userService } = getServices();

  useEffect(() => {
    const getUser = async () => {
      try {
        const authUser = await authService.getCurrentUser();
        setCurrentUser(authUser);
      } catch (error) {
        console.error('Error getting current user:', error);
        // Fallback to UnifiedAuth user if service fails
        if (user) {
          setCurrentUser(user);
        }
      }
    };
    getUser();
  }, [user]);

  const { data: userRoles, isLoading, error } = useQuery({
    queryKey: ['currentUserRoles', currentUser?.id, user?.role],
    queryFn: async () => {
      // Start with UnifiedAuth user role if present
      const fallbackRoles = user?.role ? [String(user.role).toLowerCase()] : [];

      if (!currentUser?.id && !user?.id) return fallbackRoles;
      
      const userId = currentUser?.id || user?.id;
      console.log('Fetching current user roles for:', userId);
      
      try {
        // Get user with roles from UserService
        const userServiceUser = await userService.getUserById(userId);
        if (!userServiceUser) {
          // Fallback to user metadata role if service lookup fails
          console.log('UserService lookup failed, using metadata role:', user?.role);
          return fallbackRoles;
        }
        
        // Get roles from the userRoles array (multi-role support)
        const userRoles = userServiceUser.userRoles || [];
        const roleNames = userRoles.map(ur => String(ur.roleName || ur).toLowerCase());
        
        // Also include primary role if it exists and isn't already in the array
        const primaryRole = userServiceUser.primaryRole ? [String(userServiceUser.primaryRole).toLowerCase()] : [];
        
        // Merge all roles: userRoles + primaryRole + fallbackRoles
        const allRoles = Array.from(new Set([...roleNames, ...primaryRole, ...fallbackRoles]));
        console.log('User roles:', { userRoles: roleNames, primaryRole, fallbackRoles, merged: allRoles });
        
        return allRoles;
      } catch (error) {
        console.error('Error fetching current user roles:', error);
        // Fallback to user metadata role
        return fallbackRoles;
      }
    },
    enabled: !!currentUser?.id || !!user?.id || !!isAuthenticated,
    retry: 2,
    retryDelay: 500,
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: () => (user?.role ? [String(user.role).toLowerCase()] : [])
  });

  const hasRole = (roleName: string) => {
    return (userRoles as string[])?.includes(String(roleName).toLowerCase()) || false;
  };

  const hasAnyRole = (roleNames: string[]) => {
    const roles = (userRoles as string[]) || [];
    if (roles.length === 0 || !Array.isArray(roles)) return false;
    const wanted = roleNames.map((r) => String(r).toLowerCase());
    return wanted.some((role) => roles.includes(role));
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
      console.log('Assigning role:', roleName, 'to user:', userId);
      
      try {
        // Get current user
        const user = await userService.getUserById(userId);
        if (!user) throw new Error('User not found');
        
        // Check if user already has this role
        const currentRoles = user.userRoles || [];
        const hasRole = currentRoles.some(ur => 
          String(ur.roleName || ur).toLowerCase() === String(roleName).toLowerCase()
        );
        
        if (hasRole) {
          console.log('User already has role:', roleName);
          return; // Role already assigned
        }
        
        // Add new role to the userRoles array
        const newRole: UserRole = {
          id: `${userId}_${roleName}_${Date.now()}`,
          user_id: userId,
          role_name: roleName,
          assigned_at: new Date().toISOString(),
          assigned_by: 'current_user' // This should come from auth context
        };
        
        const updatedRoles = [...currentRoles, newRole];
        
        // Update user with new roles array
        await userService.updateUser(userId, {
          userRoles: updatedRoles
        });
        
        console.log('Role assigned successfully:', { userId, roleName, totalRoles: updatedRoles.length });
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
      console.error('Role assignment error:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'assigner le rôle.",
        variant: "destructive",
      });
    }
  });

  const removeRole = useMutation({
    mutationFn: async ({ userId, roleName }: { userId: string; roleName: string }) => {
      console.log('Removing role:', roleName, 'from user:', userId);
      
      try {
        // Get current user
        const user = await userService.getUserById(userId);
        if (!user) throw new Error('User not found');
        
        // Remove role from userRoles array
        const currentRoles = user.userRoles || [];
        const filteredRoles = currentRoles.filter(ur => 
          String(ur.roleName || ur).toLowerCase() !== String(roleName).toLowerCase()
        );
        
        // Update user with filtered roles array
        await userService.updateUser(userId, {
          userRoles: filteredRoles
        });
        
        console.log('Role removed successfully:', { userId, roleName, remainingRoles: filteredRoles.length });
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
      console.error('Role removal error:', error);
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
      return user?.userRoles || [];
    },
    getAllRoles: async () => {
      // This could be extended to fetch all available roles from the system
      return ['admin', 'manager', 'project_manager', 'employee', 'staff', 'user'];
    }
  };
};
