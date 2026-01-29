/**
 * Hexagonal hook for user management
 * Provides user operations through AuthService
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
      try {
        console.info('USE_USER_MANAGEMENT_HEX_001: Starting user creation', {
          code: 'USE_USER_MANAGEMENT_HEX_001',
          message: 'Début de la création d\'utilisateur',
          email: data.email,
          fullName: data.full_name,
          role: data.role,
          stack: new Error().stack
        });

        // Sign up user using AuthService
        console.info('USE_USER_MANAGEMENT_HEX_002: Creating auth user', {
          code: 'USE_USER_MANAGEMENT_HEX_002',
          message: 'Création de l\'utilisateur d\'authentification',
          email: data.email,
          stack: new Error().stack
        });

        const authData = await authService.signUp({
          email: data.email,
          password: data.password,
        });

        if (!authData) {
          console.error('USE_USER_MANAGEMENT_HEX_003: Auth user creation failed', {
            code: 'USE_USER_MANAGEMENT_HEX_003',
            message: 'Échec de la création de l\'utilisateur d\'authentification',
            email: data.email,
            stack: new Error().stack
          });
          throw new Error('USE_USER_MANAGEMENT_HEX_003: La création de l\'utilisateur a échoué');
        }

        console.info('USE_USER_MANAGEMENT_HEX_004: Auth user created successfully', {
          code: 'USE_USER_MANAGEMENT_HEX_004',
          message: 'Utilisateur d\'authentification créé avec succès',
          userId: authData.id,
          email: data.email,
          stack: new Error().stack
        });

        // Update profile using UserService
        try {
          console.info('USE_USER_MANAGEMENT_HEX_005: Updating user profile', {
            code: 'USE_USER_MANAGEMENT_HEX_005',
            message: 'Mise à jour du profil utilisateur',
            userId: authData.id,
            fullName: data.full_name,
            stack: new Error().stack
          });

          await userService.updateProfile(authData.id, {
            full_name: data.full_name,
            phone: data.phone,
            national_id: data.national_id
          });

          console.info('USE_USER_MANAGEMENT_HEX_006: Profile updated successfully', {
            code: 'USE_USER_MANAGEMENT_HEX_006',
            message: 'Profil utilisateur mis à jour avec succès',
            userId: authData.id,
            stack: new Error().stack
          });
        } catch (profileError) {
          console.warn('USE_USER_MANAGEMENT_HEX_007: Profile update warning', {
            code: 'USE_USER_MANAGEMENT_HEX_007',
            message: 'Avertissement lors de la mise à jour du profil',
            userId: authData.id,
            technicalError: profileError,
            stack: new Error().stack
          });
        }

        // Assign role if specified using AuthService
        if (data.role) {
          try {
            console.info('USE_USER_MANAGEMENT_HEX_008: Assigning user role', {
              code: 'USE_USER_MANAGEMENT_HEX_008',
              message: 'Assignation du rôle utilisateur',
              userId: authData.id,
              role: data.role,
              stack: new Error().stack
            });

            await authService.assignUserRole(authData.id, data.role);

            console.info('USE_USER_MANAGEMENT_HEX_009: Role assigned successfully', {
              code: 'USE_USER_MANAGEMENT_HEX_009',
              message: 'Rôle utilisateur assigné avec succès',
              userId: authData.id,
              role: data.role,
              stack: new Error().stack
            });
          } catch (roleError) {
            console.warn('USE_USER_MANAGEMENT_HEX_010: Role assignment warning', {
              code: 'USE_USER_MANAGEMENT_HEX_010',
              message: 'Avertissement lors de l\'assignation du rôle',
              userId: authData.id,
              role: data.role,
              technicalError: roleError,
              stack: new Error().stack
            });
          }
        }

        console.info('USE_USER_MANAGEMENT_HEX_011: User creation completed', {
          code: 'USE_USER_MANAGEMENT_HEX_011',
          message: 'Création d\'utilisateur terminée avec succès',
          userId: authData.id,
          email: data.email,
          fullName: data.full_name,
          role: data.role,
          stack: new Error().stack
        });

        return authData;
      } catch (error) {
        console.error('USE_USER_MANAGEMENT_HEX_012: User creation failed', {
          code: 'USE_USER_MANAGEMENT_HEX_012',
          message: 'Échec de la création d\'utilisateur',
          email: data.email,
          fullName: data.full_name,
          technicalError: error,
          stack: new Error().stack
        });
        throw error;
      }
    },
    onSuccess: (authData, variables) => {
      console.info('USE_USER_MANAGEMENT_HEX_013: Create user mutation success', {
        code: 'USE_USER_MANAGEMENT_HEX_013',
        message: 'Mutation de création d\'utilisateur réussie',
        userId: authData.id,
        email: variables.email,
        stack: new Error().stack
      });
      
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ 
        title: 'Succès', 
        description: `Utilisateur "${variables.full_name}" créé avec succès` 
      });
    },
    onError: (error: Error, variables) => {
      console.error('USE_USER_MANAGEMENT_HEX_014: Create user mutation error', {
        code: 'USE_USER_MANAGEMENT_HEX_014',
        message: 'Erreur dans la mutation de création d\'utilisateur',
        email: variables.email,
        fullName: variables.full_name,
        technicalError: error,
        stack: new Error().stack
      });
      
      toast({ 
        title: 'Erreur de création', 
        description: `Impossible de créer l'utilisateur "${variables.full_name}"`,
        variant: 'destructive' 
      });
    }
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: UpdateUserData }) => {
      try {
        console.info('USE_USER_MANAGEMENT_HEX_015: Starting profile update', {
          code: 'USE_USER_MANAGEMENT_HEX_015',
          message: 'Début de la mise à jour du profil',
          userId,
          updateData: data,
          stack: new Error().stack
        });

        await userService.updateProfile(userId, data);

        console.info('USE_USER_MANAGEMENT_HEX_016: Profile updated successfully', {
          code: 'USE_USER_MANAGEMENT_HEX_016',
          message: 'Profil mis à jour avec succès',
          userId,
          stack: new Error().stack
        });
      } catch (error) {
        console.error('USE_USER_MANAGEMENT_HEX_017: Profile update failed', {
          code: 'USE_USER_MANAGEMENT_HEX_017',
          message: 'Échec de la mise à jour du profil',
          userId,
          updateData: data,
          technicalError: error,
          stack: new Error().stack
        });
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      console.info('USE_USER_MANAGEMENT_HEX_018: Update profile mutation success', {
        code: 'USE_USER_MANAGEMENT_HEX_018',
        message: 'Mutation de mise à jour de profil réussie',
        userId: variables.userId,
        stack: new Error().stack
      });
      
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast({ 
        title: 'Succès', 
        description: 'Profil mis à jour avec succès' 
      });
    },
    onError: (error: Error, variables) => {
      console.error('USE_USER_MANAGEMENT_HEX_019: Update profile mutation error', {
        code: 'USE_USER_MANAGEMENT_HEX_019',
        message: 'Erreur dans la mutation de mise à jour de profil',
        userId: variables.userId,
        technicalError: error,
        stack: new Error().stack
      });
      
      toast({ 
        title: 'Erreur de mise à jour', 
        description: 'Impossible de mettre à jour le profil',
        variant: 'destructive' 
      });
    }
  });

  // Assign role mutation
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      try {
        console.info('USE_USER_MANAGEMENT_HEX_020: Starting role assignment', {
          code: 'USE_USER_MANAGEMENT_HEX_020',
          message: 'Début de l\'assignation de rôle',
          userId,
          role,
          stack: new Error().stack
        });

        await authService.assignUserRole(userId, role);

        console.info('USE_USER_MANAGEMENT_HEX_021: Role assigned successfully', {
          code: 'USE_USER_MANAGEMENT_HEX_021',
          message: 'Rôle assigné avec succès',
          userId,
          role,
          stack: new Error().stack
        });
      } catch (error) {
        console.error('USE_USER_MANAGEMENT_HEX_022: Role assignment failed', {
          code: 'USE_USER_MANAGEMENT_HEX_022',
          message: 'Échec de l\'assignation de rôle',
          userId,
          role,
          technicalError: error,
          stack: new Error().stack
        });
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      console.info('USE_USER_MANAGEMENT_HEX_023: Assign role mutation success', {
        code: 'USE_USER_MANAGEMENT_HEX_023',
        message: 'Mutation d\'assignation de rôle réussie',
        userId: variables.userId,
        role: variables.role,
        stack: new Error().stack
      });
      
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast({ 
        title: 'Succès', 
        description: `Rôle "${variables.role}" assigné avec succès` 
      });
    },
    onError: (error: Error, variables) => {
      console.error('USE_USER_MANAGEMENT_HEX_024: Assign role mutation error', {
        code: 'USE_USER_MANAGEMENT_HEX_024',
        message: 'Erreur dans la mutation d\'assignation de rôle',
        userId: variables.userId,
        role: variables.role,
        technicalError: error,
        stack: new Error().stack
      });
      
      toast({ 
        title: 'Erreur d\'assignation', 
        description: `Impossible d'assigner le rôle "${variables.role}"`,
        variant: 'destructive' 
      });
    }
  });

  // Get current user
  const getCurrentUser = async () => {
    try {
      console.info('USE_USER_MANAGEMENT_HEX_025: Getting current user', {
        code: 'USE_USER_MANAGEMENT_HEX_025',
        message: 'Récupération de l\'utilisateur actuel',
        stack: new Error().stack
      });

      const user = await authService.getCurrentUser();

      console.info('USE_USER_MANAGEMENT_HEX_026: Current user retrieved successfully', {
        code: 'USE_USER_MANAGEMENT_HEX_026',
        message: 'Utilisateur actuel récupéré avec succès',
        userId: user?.id,
        userEmail: user?.email,
        stack: new Error().stack
      });

      return user;
    } catch (error) {
      console.error('USE_USER_MANAGEMENT_HEX_027: Get current user failed', {
        code: 'USE_USER_MANAGEMENT_HEX_027',
        message: 'Échec de la récupération de l\'utilisateur actuel',
        technicalError: error,
        stack: new Error().stack
      });
      throw error;
    }
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
