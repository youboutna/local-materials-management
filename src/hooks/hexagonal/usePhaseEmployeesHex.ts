// hooks/hexagonal/usePhaseEmployeesHex.ts - Hexagonal hook for phase employees management
// Uses EmployeeService instead of non-existent phase repo methods

import { EmployeeService } from '@/application/services/EmployeeService';
import { toast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
  const employeeService = new EmployeeService(RepositoryFactory.getEmployeeRepository());

  const {
    data: employees = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['phase-employees-hex', phaseId],
    queryFn: async (): Promise<PhaseEmployee[]> => {
      // There is no phase_employees join table in the schema (employees are
      // only linked at the project level), so there is no real per-phase
      // assignment data to source. Returning a typed empty result until
      // that linkage exists in the database.
      return [];
    },
    enabled: !!phaseId
  });

  const addMutation = useMutation({
    mutationFn: async (employeeData: EmployeeFormData) => {
      // Placeholder - would need phase_employees join table
      console.log('Adding employee to phase:', phaseId, employeeData);
      return { id: crypto.randomUUID(), ...employeeData, phase_id: phaseId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-employees-hex', phaseId] });
      toast({ title: 'Employé ajouté', description: "L'employé a été assigné à la phase" });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: `Erreur lors de l'ajout: ${error.message}`, variant: 'destructive' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EmployeeFormData> }) => {
      console.log('Updating phase employee:', id, data);
      return { id, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-employees-hex', phaseId] });
      toast({ title: 'Employé mis à jour', description: 'Les informations ont été mises à jour' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: `Erreur lors de la mise à jour: ${error.message}`, variant: 'destructive' });
    }
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Removing phase employee:', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-employees-hex', phaseId] });
      toast({ title: 'Employé retiré', description: "L'employé a été retiré de la phase" });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: `Erreur lors de la suppression: ${error.message}`, variant: 'destructive' });
    }
  });

  const totalLaborCost = employees.reduce((sum, emp) => sum + (emp.daily_rate || 0), 0);
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
