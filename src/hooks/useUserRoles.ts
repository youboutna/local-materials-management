/**
 * User Roles Hook - Hexagonal Architecture
 * Uses UserService and AuthService for role management
 * Legacy interface maintained for backward compatibility
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
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
        
        // Map to UserRole format for backward compatibility
        const roles: UserRole[] = (user.roles || []).map((roleName: string, index: number) => ({
          id: `${userId}-${roleName}-${index}`,
          user_id: userId,
          role_name: roleName,
          assigned_at: new Date().toISOString(),
        }));
        
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
  const { profile, isAuthenticated } = useKeycloakAuth();
  const { authService, userService } = getServices();

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };
    getUser();
  }, []);

  const { data: userRoles, isLoading, error } = useQuery({
    queryKey: ['currentUserRoles', currentUser?.id, profile?.role],
    queryFn: async () => {
      // Start with profile role if present
      const fallbackRoles = profile?.role ? [String(profile.role).toLowerCase()] : [];

      if (!currentUser?.id) return fallbackRoles;
      
      console.log('Fetching current user roles for:', currentUser.id);
      
      try {
        // Get user with roles from UserService
        const user = await userService.getUserById(currentUser.id);
        if (!user) return fallbackRoles;
        
        const dbRoles = (user.roles || []).map((r: string) => String(r).toLowerCase());
        const merged = Array.from(new Set([...dbRoles, ...fallbackRoles]));
        return merged;
      } catch (error) {
        console.error('Error fetching current user roles:', error);
        return fallbackRoles;
      }
    },
    enabled: !!currentUser?.id || !!profile?.role || !!isAuthenticated,
    retry: 2,
    retryDelay: 500,
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: () => (profile?.role ? [String(profile.role).toLowerCase()] : [])
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

  return {
    userRoles: (userRoles as string[]) || [],
    hasRole,
    hasAnyRole,
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
        
        // Add role to user's roles array
        const currentRoles = user.roles || [];
        if (!currentRoles.includes(roleName)) {
          await userService.updateUser(userId, {
            roles: [...currentRoles, roleName]
          });
        }
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
        
        // Remove role from user's roles array
        const currentRoles = user.roles || [];
        await userService.updateUser(userId, {
          roles: currentRoles.filter((r: string) => r !== roleName)
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
    removeRole
  };
};
