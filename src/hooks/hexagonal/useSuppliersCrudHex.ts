/**
 * Supplier Management CRUD Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SupplierMgmtFormData {
  company_name: string;
  category: string;
  status: string;
  email?: string;
  phone?: string;
  address?: string;
  nif?: string;
  specializations?: string[];
  rating?: number;
}

export function useSuppliersList() {
  return useQuery({
    queryKey: ['suppliers-list-crud'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SupplierMgmtFormData) => {
      const { error } = await supabase.from('suppliers').insert({
        company_name: data.company_name,
        category: data.category,
        status: data.status,
        email: data.email,
        phone: data.phone,
        address: data.address,
        nif: data.nif,
        specializations: data.specializations,
        rating: data.rating
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers-list-crud'] })
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SupplierMgmtFormData }) => {
      const { error } = await supabase.from('suppliers').update({
        company_name: data.company_name,
        category: data.category,
        status: data.status,
        email: data.email,
        phone: data.phone,
        address: data.address,
        nif: data.nif,
        specializations: data.specializations,
        rating: data.rating
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers-list-crud'] })
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers-list-crud'] })
  });
}
