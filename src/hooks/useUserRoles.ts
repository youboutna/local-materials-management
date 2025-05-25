
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
  const { data: userRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ['userRoles', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      return data as UserRole[];
    },
    enabled: !!userId
  });

  // Fetch all available roles
  const { data: availableRoles, isLoading: availableRolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Role[];
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
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role_name')
        .eq('user_id', currentUser.id);
      
      if (error) throw error;
      return data.map(r => r.role_name);
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
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role_name: roleName });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRoles'] });
      toast({
        title: "Rôle assigné",
        description: "Le rôle a été assigné avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'assigner le rôle.",
        variant: "destructive",
      });
    }
  });

  const removeRole = useMutation({
    mutationFn: async ({ userId, roleName }: { userId: string; roleName: string }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role_name', roleName);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRoles'] });
      toast({
        title: "Rôle retiré",
        description: "Le rôle a été retiré avec succès.",
      });
    },
    onError: () => {
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
