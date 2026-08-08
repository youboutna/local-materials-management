/**
 * Hexagonal hook for user management
 */

import { AuthService, getAuthService} from '@/application/services/AuthService';
import { UserService, getUserService} from '@/application/services/UserService';
import { toast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQueryClient } from '@tanstack/react-query';

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
  const authService = getAuthService();
  const userService = getUserService();

  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserData) => {
      const authData = await authService.signUp({
        email: data.email,
        password: data.password,
      });

      if (!authData) {
        throw new Error('La création de l\'utilisateur a échoué');
      }

      // Update profile
      try {
        await userService.updateProfile(authData.id, {
          fullName: data.full_name,
          phone: data.phone,
        });
      } catch (profileError) {
        console.warn('Profile update warning:', profileError);
      }

      // Assign role if specified
      if (data.role) {
        try {
          await authService.assignUserRole(authData.id, data.role);
        } catch (roleError) {
          console.warn('Role assignment warning:', roleError);
        }
      }

      return authData;
    },
    onSuccess: (authData, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Succès', description: `Utilisateur "${variables.full_name}" créé avec succès` });
    },
    onError: (error: Error, variables) => {
      toast({ title: 'Erreur de création', description: `Impossible de créer l'utilisateur "${variables.full_name}"`, variant: 'destructive' });
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: UpdateUserData }) => {
      await userService.updateProfile(userId, {
        fullName: data.full_name,
        phone: data.phone,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast({ title: 'Succès', description: 'Profil mis à jour avec succès' });
    },
    onError: () => {
      toast({ title: 'Erreur de mise à jour', description: 'Impossible de mettre à jour le profil', variant: 'destructive' });
    }
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await authService.assignUserRole(userId, role);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast({ title: 'Succès', description: `Rôle "${variables.role}" assigné avec succès` });
    },
    onError: (error: Error, variables) => {
      toast({ title: 'Erreur d\'assignation', description: `Impossible d'assigner le rôle "${variables.role}"`, variant: 'destructive' });
    }
  });

  const getCurrentUser = async () => {
    return await authService.getCurrentUser();
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
