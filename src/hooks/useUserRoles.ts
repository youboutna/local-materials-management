
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

export const useUserRoles = (userId?: string) => {
  // Fetch user roles
  const { data: userRoles, isLoading: rolesLoading, error: rolesError } = useQuery({
    queryKey: ['userRoles', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log('Fetching user roles for:', userId);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error fetching user roles:', error);
        throw error;
      }
      return data as UserRole[] || [];
    },
    enabled: !!userId,
    retry: 3,
    retryDelay: 1000
  });

  // Fetch all available roles (simplified - using role names directly)
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

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  const { data: userRoles, isLoading, error } = useQuery({
    queryKey: ['currentUserRoles', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      
      console.log('Fetching current user roles for:', currentUser.id);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role_name')
        .eq('user_id', currentUser.id);
      
      if (error) {
        console.error('Error fetching current user roles:', error);
        // Don't throw error to prevent infinite loading
        return [];
      }
      return data?.map((r: any) => r.role_name) || [];
    },
    enabled: !!currentUser?.id,
    retry: 2,
    retryDelay: 500,
    // Add stale time to prevent excessive refetching
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Set default data to prevent loading states
    placeholderData: []
  });

  const hasRole = (roleName: string) => {
    return userRoles?.includes(roleName) || false;
  };

  const hasAnyRole = (roleNames: string[]) => {
    if (!userRoles || userRoles.length === 0) return false;
    return roleNames.some(role => hasRole(role));
  };

  return {
    userRoles: userRoles || [],
    hasRole,
    hasAnyRole,
    isLoading,
    currentUser,
    error
  };
};

export const useRoleManagement = () => {
  const queryClient = useQueryClient();

  const assignRole = useMutation({
    mutationFn: async ({ userId, roleName }: { userId: string; roleName: string }) => {
      console.log('Assigning role:', roleName, 'to user:', userId);
      
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role_name: roleName });
      
      if (error) {
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
      
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role_name', roleName);
      
      if (error) {
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
