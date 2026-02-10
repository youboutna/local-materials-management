/**
 * Hexagonal hook for task dependencies
 * Uses TaskService/adapter instead of direct Supabase access
 */

import { useQuery } from '@tanstack/react-query';
import { TaskService } from '@/application/services/TaskService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  dependencyType: string | null;
  lagDays: number | null;
}

// Hook: Fetch task dependencies for given tasks
export function useTaskDependenciesHex(taskIds: string[]) {
  return useQuery({
    queryKey: ['task-dependencies', taskIds],
    queryFn: async (): Promise<TaskDependency[]> => {
      if (!taskIds || taskIds.length === 0) return [];
      
      const service = new TaskService(RepositoryFactory.getTaskRepository());
      return await service.getTaskDependencies(taskIds);
    },
    enabled: !!taskIds && taskIds.length > 0,
  });
}
