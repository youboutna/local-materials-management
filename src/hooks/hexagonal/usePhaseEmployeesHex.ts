/**
 * usePhaseEmployeesHex — main d'œuvre d'une phase (btp.phase_employees)
 *
 * Architecture : UI → Hook → PhaseEmployeeService → Repository → Adapter → DB
 * Aucun accès direct à Supabase ici.
 */

import { getPhaseEmployeeService } from '@/application/services/PhaseEmployeeService';
import type {
  PhaseEmployeeInput,
  PhaseEmployeeRow,
} from '@/domain/repositories/IPhaseEmployeeRepository';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type PhaseEmployee = PhaseEmployeeRow;
export type EmployeeFormData = Omit<PhaseEmployeeInput, 'phaseId'>;

export const usePhaseEmployeesHex = (phaseId: string) => {
  const queryClient = useQueryClient();
  const service = getPhaseEmployeeService();

  const {
    data: employees = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['phase-employees-hex', phaseId],
    queryFn: (): Promise<PhaseEmployee[]> => service.getByPhase(phaseId),
    enabled: !!phaseId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['phase-employees-hex', phaseId] });
    queryClient.invalidateQueries({ queryKey: ['phase-resource-counts'] });
  };

  const addMutation = useMutation({
    mutationFn: (data: EmployeeFormData) => service.assign({ ...data, phaseId }),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Membre ajouté', description: 'Le membre a été affecté à la phase' });
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: `Ajout impossible : ${err.message}`, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EmployeeFormData> }) => service.update(id, data),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Membre mis à jour', description: 'Les informations ont été enregistrées' });
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: `Mise à jour impossible : ${err.message}`, variant: 'destructive' });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => service.remove(id),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Membre retiré', description: 'Le membre a été retiré de la phase' });
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: `Suppression impossible : ${err.message}`, variant: 'destructive' });
    },
  });

  return {
    employees,
    isLoading,
    error: error as Error | null,
    refetch,
    totalLaborCost: service.totalDailyCost(employees),
    totalEmployees: employees.length,
    addEmployee: addMutation.mutateAsync,
    updateEmployee: updateMutation.mutateAsync,
    removeEmployee: removeMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
};
