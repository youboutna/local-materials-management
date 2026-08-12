/**
 * Hexagonal hook for btp.task_dependencies (par lot de tâches)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getTaskDependencyService } from '@/application/services/TaskDependencyService';
import type { TaskDependencyRow } from '@/domain/repositories/ITaskDependencyRepository';

export function useProjectTaskDependenciesHex(projectId?: string, taskIds: string[] = []) {
  const service = getTaskDependencyService();
  const queryClient = useQueryClient();

  const query = useQuery<TaskDependencyRow[]>({
    queryKey: ['task-dependencies', projectId, taskIds.length],
    queryFn: () => service.getByTaskIds(taskIds),
    enabled: taskIds.length > 0,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['task-dependencies'] });

  const createMutation = useMutation({
    mutationFn: ({
      taskId,
      dependsOnTaskId,
      dependencyType,
      lagDays,
    }: {
      taskId: string;
      dependsOnTaskId: string;
      dependencyType?: string;
      lagDays?: number;
    }) => service.create(taskId, dependsOnTaskId, { dependencyType, lagDays }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => service.remove(id),
    onSuccess: invalidate,
  });

  return {
    dependencies: query.data ?? [],
    isLoading: query.isLoading,
    createDependency: createMutation.mutateAsync,
    deleteDependency: deleteMutation.mutateAsync,
    isSaving: createMutation.isPending || deleteMutation.isPending,
  };
}
