/**
 * Hexagonal hook for user management
 * Replaces direct supabase.auth calls in UserManagementDialog.tsx
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  national_id?: string;
  role?: string;
}

interface UpdateUserData {
  full_name?: string;
  phone?: string;
  national_id?: string;
}

export function useUserManagementHex() {
  const queryClient = useQueryClient();

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserData) => {
      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            phone: data.phone,
            national_id: data.national_id
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          full_name: data.full_name,
          phone: data.phone,
          national_id: data.national_id
        });

      if (profileError) {
        console.warn('Profile update warning:', profileError);
      }

      // Assign role if specified
      if (data.role) {
        const { error: roleError } = await supabase.rpc('assign_user_role', {
          target_user_id: authData.user.id,
          role_name: data.role
        });

        if (roleError) {
          console.warn('Role assignment warning:', roleError);
        }
      }

      return authData.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Succès', description: 'Utilisateur créé' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: UpdateUserData }) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          phone: data.phone,
          national_id: data.national_id
        })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast({ title: 'Succès', description: 'Profil mis à jour' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  // Assign role mutation
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase.rpc('assign_user_role', {
        target_user_id: userId,
        role_name: role
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast({ title: 'Succès', description: 'Rôle assigné' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  // Get current user
  const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  };

  return {
    createUser: createUserMutation.mutateAsync,
    updateProfile: updateProfileMutation.mutateAsync,
    assignRole: assignRoleMutation.mutateAsync,
    getCurrentUser,
    isCreating: createUserMutation.isPending,
    isUpdating: updateProfileMutation.isPending,
    isAssigningRole: assignRoleMutation.isPending
  };
}
