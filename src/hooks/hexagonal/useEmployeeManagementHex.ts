/**
 * Hexagonal hooks for Employee Management CRUD
 * Centralizes all employee operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Employee = Database['public']['Tables']['employees']['Row'];

export interface EmployeeFormData {
  employee_id: string;
  full_name: string;
  position?: string;
  department?: string;
  phone?: string;
  email?: string;
  hire_date?: string;
  salary?: number;
  skills?: string[];
  is_active?: boolean;
}

// Hook: Fetch employees with search
export function useEmployeesList(searchTerm: string = '') {
  return useQuery({
    queryKey: ['employees-management', searchTerm],
    queryFn: async (): Promise<Employee[]> => {
      let query = supabase
        .from('employees')
        .select('*')
        .order('full_name');

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,employee_id.ilike.%${searchTerm}%,position.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown as Employee[]) || [];
    }
  });
}

// Hook: Create employee
export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employeeData: EmployeeFormData) => {
      const { data, error } = await supabase
        .from('employees')
        .insert(employeeData as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees-management'] });
    }
  });
}

// Hook: Update employee
export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EmployeeFormData }) => {
      const { error } = await supabase
        .from('employees')
        .update(data as any)
        .eq('id', id as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees-management'] });
    }
  });
}

// Hook: Delete employee
export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees-management'] });
    }
  });
}
