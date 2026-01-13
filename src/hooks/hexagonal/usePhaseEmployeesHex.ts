// hooks/hexagonal/usePhaseEmployeesHex.ts - Hexagonal hook for phase employees management

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PhaseEmployee {
  id: string;
  phase_id: string;
  employee_name: string;
  employee_role: string;
  daily_rate?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  employee_contact?: string | null;
  is_primary_supplier?: boolean | null;
}

export interface EmployeeFormData {
  employee_name: string;
  employee_role: string;
  daily_rate?: number;
  start_date?: string;
  end_date?: string;
  employee_contact?: string;
}

export const usePhaseEmployeesHex = (phaseId: string) => {
  const queryClient = useQueryClient();

  // Fetch phase employees
  const {
    data: employees = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['phase-employees-hex', phaseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phase_employees')
        .select('*')
        .eq('phase_id', phaseId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data as PhaseEmployee[];
    },
    enabled: !!phaseId
  });

  const addMutation = useMutation({
    mutationFn: async (employeeData: EmployeeFormData) => {
      const { data, error } = await supabase
        .from('phase_employees')
        .insert({
          phase_id: phaseId,
          employee_name: employeeData.employee_name,
          employee_role: employeeData.employee_role,
          daily_rate: employeeData.daily_rate || 0,
          start_date: employeeData.start_date,
          end_date: employeeData.end_date,
          employee_contact: employeeData.employee_contact
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-employees-hex', phaseId] });
      toast({
        title: 'Employé ajouté',
        description: 'L\'employé a été assigné à la phase'
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: `Erreur lors de l'ajout: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Update employee
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EmployeeFormData> }) => {
      const { error } = await supabase
        .from('phase_employees')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-employees-hex', phaseId] });
      toast({
        title: 'Employé mis à jour',
        description: 'Les informations ont été mises à jour'
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: `Erreur lors de la mise à jour: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Remove employee from phase
  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('phase_employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-employees-hex', phaseId] });
      toast({
        title: 'Employé retiré',
        description: 'L\'employé a été retiré de la phase'
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: `Erreur lors de la suppression: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Calculate labor costs
  const totalLaborCost = employees.reduce((sum, emp) => {
    return sum + (emp.daily_rate || 0);
  }, 0);

  const totalEmployees = employees.length;

  return {
    employees,
    isLoading,
    error,
    refetch,
    totalLaborCost,
    totalEmployees,
    addEmployee: addMutation.mutateAsync,
    updateEmployee: updateMutation.mutateAsync,
    removeEmployee: removeMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: removeMutation.isPending
  };
};
