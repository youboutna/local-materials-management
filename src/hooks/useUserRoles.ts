
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
  // Fetch user roles using RPC functions to work around type issues
  const { data: userRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ['userRoles', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log('Fetching user roles for:', userId);
      
      // Use a raw query since the table isn't in the types yet
      const { data, error } = await supabase
        .rpc('get_user_roles', { target_user_id: userId });
      
      if (error) {
        console.error('Error fetching user roles:', error);
        // Fallback to direct query with type assertion
        const { data: fallbackData, error: fallbackError } = await (supabase as any)
          .from('user_roles')
          .select('*')
          .eq('user_id', userId);
        
        if (fallbackError) throw fallbackError;
        return fallbackData as UserRole[] || [];
      }
      
      return data || [];
    },
    enabled: !!userId
  });

  // Fetch all available roles
  const { data: availableRoles, isLoading: availableRolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      console.log('Fetching available roles');
      
      // Use type assertion for the roles table
      const { data, error } = await (supabase as any)
        .from('roles')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching roles:', error);
        throw error;
      }
      return data as Role[] || [];
    }
  });

  return {
    userRoles: userRoles || [],
    availableRoles: availableRoles || [],
    isLoading: rolesLoading || availableRolesLoading,
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

  const { data: userRoles, isLoading } = useQuery({
    queryKey: ['currentUserRoles', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      
      console.log('Fetching current user roles for:', currentUser.id);
      
      // Use type assertion for the user_roles table
      const { data, error } = await (supabase as any)
        .from('user_roles')
        .select('role_name')
        .eq('user_id', currentUser.id);
      
      if (error) {
        console.error('Error fetching current user roles:', error);
        throw error;
      }
      return data?.map((r: any) => r.role_name) || [];
    },
    enabled: !!currentUser?.id
  });

  const hasRole = (roleName: string) => {
    return userRoles?.includes(roleName) || false;
  };

  const hasAnyRole = (roleNames: string[]) => {
    return roleNames.some(role => hasRole(role));
  };

  return {
    userRoles: userRoles || [],
    hasRole,
    hasAnyRole,
    isLoading,
    currentUser
  };
};

export const useRoleManagement = () => {
  const queryClient = useQueryClient();

  const assignRole = useMutation({
    mutationFn: async ({ userId, roleName }: { userId: string; roleName: string }) => {
      console.log('Assigning role:', roleName, 'to user:', userId);
      
      // Use type assertion for the user_roles table
      const { error } = await (supabase as any)
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
      
      // Use type assertion for the user_roles table
      const { error } = await (supabase as any)
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
