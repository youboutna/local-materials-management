/**
 * Hexagonal hook for user management
 * Replaces direct supabase.auth calls in UserManagementDialog.tsx
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { AuthService } from '@/application/services/AuthService';
import { UserService } from '@/application/services/UserService';
import { RepositoryFactory } from '@/repositories/RepositoryFactory';

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
  const authService = new AuthService(RepositoryFactory.getAuthRepository());
  const userService = new UserService(RepositoryFactory.getUserRepository());

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserData) => {
      // Sign up user using AuthService
      const authData = await authService.signUp({
        email: data.email,
        password: data.password,
        // Remove options as it's not in RegisterData type
      });

      if (!authData) throw new Error('User creation failed');

      // Update profile using UserService
      try {
        await userService.updateProfile(authData.id, {
          full_name: data.full_name,
          phone: data.phone,
          national_id: data.national_id
        });
      } catch (profileError) {
        console.warn('Profile update warning:', profileError);
      }

      // Assign role if specified using AuthService
      if (data.role) {
        try {
          await authService.assignUserRole(authData.id, data.role);
        } catch (roleError) {
          console.warn('Role assignment warning:', roleError);
        }
      }

      return authData;
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
      await userService.updateProfile(userId, data);
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
      await authService.assignUserRole(userId, role);
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
    const user = await authService.getCurrentUser();
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
