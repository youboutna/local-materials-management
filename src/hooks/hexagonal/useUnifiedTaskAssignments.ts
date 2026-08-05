/**
 * Hook unifié des tâches assignées (TanStack Query v5)
 * Source unique : UnifiedTaskAssignmentService → table task_assignments
 */

import { UnifiedTaskAssignmentService } from '@/application/services/UnifiedTaskAssignmentService';
import {
  CreateUnifiedTaskAssignmentDTO,
  UnifiedTaskAssignmentDTO,
  UpdateUnifiedTaskAssignmentDTO,
} from '@/dtos/entities/UnifiedTaskAssignmentDTO';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const service = new UnifiedTaskAssignmentService();

export function useUnifiedTaskAssignments(options?: { projectId?: string; phaseId?: string }) {
  const queryClient = useQueryClient();
  const { projectId, phaseId } = options ?? {};
  const queryKey = ['unified-task-assignments', projectId ?? null, phaseId ?? null];

  const { data: tasks = [], isLoading, error, refetch } = useQuery<UnifiedTaskAssignmentDTO[]>({
    queryKey,
    queryFn: async () => {
      if (phaseId) return service.getByPhase(phaseId);
      if (projectId) return service.getByProject(projectId);
      return service.getAll();
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['unified-task-assignments'] });

  const createMutation = useMutation({
    mutationFn: (dto: CreateUnifiedTaskAssignmentDTO) => service.create({ projectId, phaseId, ...dto }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUnifiedTaskAssignmentDTO }) => service.update(id, data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => service.delete(id),
  });

  const run = async <T,>(promise: Promise<T>, success: string, failure: string): Promise<T | null> => {
    try {
      const result = await promise;
      await invalidate();
      toast.success(success);
      return result;
    } catch (e) {
      toast.error(`${failure} : ${e instanceof Error ? e.message : String(e)}`);
      return null;
    }
  };

  return {
    tasks,
    isLoading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    refetch,
    createTask: (dto: CreateUnifiedTaskAssignmentDTO) =>
      run(createMutation.mutateAsync(dto), 'Tâche créée', 'Création impossible'),
    updateTask: (id: string, data: UpdateUnifiedTaskAssignmentDTO) =>
      run(updateMutation.mutateAsync({ id, data }), 'Tâche mise à jour', 'Mise à jour impossible'),
    updateStatus: (id: string, status: string) =>
      run(updateMutation.mutateAsync({ id, data: { status } }), 'Statut mis à jour', 'Mise à jour impossible'),
    deleteTask: (id: string) =>
      run(deleteMutation.mutateAsync(id), 'Tâche supprimée', 'Suppression impossible'),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
