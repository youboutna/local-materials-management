/**
 * Hexagonal hook for User Management Dialog
 */

import { AuthService } from '@/application/services/AuthService';
import { UserService } from '@/application/services/UserService';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  national_id?: string;
}

export interface UpdateUserData {
  userId: string;
  full_name: string;
  phone?: string;
  national_id?: string;
}

export function useCreateUserHex() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserData) => {
      const authService = new AuthService(RepositoryFactory.getAuthRepository());
      const result = await authService.register({
        email: data.email,
        password: data.password,
      });
      
      if (!result) {
        throw new Error('Registration failed');
      }
      
      // Update profile with additional data
      if (result.id) {
        const userService = new UserService(RepositoryFactory.getUserRepository());
        await userService.updateProfile(result.id, {
          fullName: data.full_name,
          phone: data.phone,
        });
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
}

export function useUpdateUserProfileHex() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateUserData) => {
      const userService = new UserService(RepositoryFactory.getUserRepository());
      await userService.updateProfile(data.userId, {
        fullName: data.full_name,
        phone: data.phone,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
}
