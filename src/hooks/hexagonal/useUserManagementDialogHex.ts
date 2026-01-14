/**
 * Hexagonal hook for User Management Dialog
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
      const { data: result, error } = await supabase.auth.signUp({
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

      if (error) throw error;
      
      if (result.user) {
        // Update profile
        await supabase
          .from('profiles')
          .upsert({
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
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          phone: data.phone,
          national_id: data.national_id
        })
        .eq('id', data.userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
}
