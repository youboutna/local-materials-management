/**
 * Hexagonal hook for task dependencies
 * Centralizes task dependency queries
 */

import { useQuery } from '@tanstack/react-query';
import { RepositoryFactory } from '@/repositories/RepositoryFactory';

export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  dependency_type: string | null;
  lag_days: number | null;
}

// Hook: Fetch task dependencies for given tasks
export function useTaskDependenciesHex(taskIds: string[]) {
  return useQuery({
    queryKey: ['task-dependencies', taskIds],
    queryFn: async (): Promise<TaskDependency[]> => {
      if (!taskIds || taskIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('task_dependencies')
        .select('*')
        .in('task_id', taskIds);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!taskIds && taskIds.length > 0,
  });
}
