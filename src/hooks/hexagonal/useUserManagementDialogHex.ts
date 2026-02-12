/**
 * Hexagonal hook for User Management Dialog
 * Uses AuthService and UserService instead of direct Supabase access
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthService } from '@/application/services/AuthService';
import { UserService } from '@/application/services/UserService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

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
      const authService = new AuthService();
      const result = await authService.register({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        phone: data.phone,
        national_id: data.national_id
      });
      
      if (!result) {
        throw new Error('Registration failed');
      }
      
      if (result.user) {
        const userService = new UserService(RepositoryFactory.getUserRepository());
        await userService.upsertProfile({
          id: result.user.id,
          full_name: data.full_name,
          phone: data.phone,
          national_id: data.national_id
        });
      }

      return result.user;
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
        full_name: data.full_name,
        phone: data.phone,
        national_id: data.national_id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
}
