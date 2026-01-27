/**
 * Hexagonal hooks for Suppliers Management module
 * Centralizes CRUD operations for suppliers
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Supplier = Database['public']['Tables']['suppliers']['Row'];

export interface SupplierFormData {
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  rating: number;
  nif?: string;
  commerce_register_ref?: string;
}

// Hook: Fetch all suppliers
export function useSuppliersList() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async (): Promise<Supplier[]> => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data as unknown as Supplier[]) || [];
    }
  });
}

// Hook: Create supplier mutation
export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (supplierData: SupplierFormData) => {
      const { data, error } = await supabase
        .from('suppliers')
        .insert(supplierData as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    }
  });
}

// Hook: Update supplier mutation
export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SupplierFormData }) => {
      const { error } = await supabase
        .from('suppliers')
        .update(data as any)
        .eq('id', id as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    }
  });
}

// Hook: Delete supplier mutation
export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    }
  });
}
