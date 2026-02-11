// hooks/hexagonal/usePhaseEmployeesHex.ts - Hexagonal hook for phase employees management
// Uses RepositoryFactory instead of direct Supabase calls

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
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
  const phaseRepo = RepositoryFactory.getPhaseRepository();

  const {
    data: employees = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['phase-employees-hex', phaseId],
    queryFn: async () => {
      const data = await phaseRepo.findPhaseEmployees(phaseId);
      return (data || []) as PhaseEmployee[];
    },
    enabled: !!phaseId
  });

  const addMutation = useMutation({
    mutationFn: async (employeeData: EmployeeFormData) => {
      return await phaseRepo.addPhaseEmployee(phaseId, {
        phase_id: phaseId,
        employee_name: employeeData.employee_name,
        employee_role: employeeData.employee_role,
        daily_rate: employeeData.daily_rate || 0,
        start_date: employeeData.start_date,
        end_date: employeeData.end_date,
        employee_contact: employeeData.employee_contact
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-employees-hex', phaseId] });
      toast({ title: 'Employé ajouté', description: 'L\'employé a été assigné à la phase' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: `Erreur lors de l'ajout: ${error.message}`, variant: 'destructive' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EmployeeFormData> }) => {
      return await phaseRepo.updatePhaseEmployee(id, data);
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
      return await phaseRepo.removePhaseEmployee(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-employees-hex', phaseId] });
      toast({ title: 'Employé retiré', description: 'L\'employé a été retiré de la phase' });
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