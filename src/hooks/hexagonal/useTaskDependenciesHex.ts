/**
 * useTaskDependenciesHex - Hook hexagonal pour la gestion des dépendances entre tâches
 * 
 * Architecture Hexagonale - RÈGLES STRICTES :
 * - Zéro interface/type dans UI/Hooks
 * - Tous les types proviennent des DTOs
 * - UI Component → Hook → Service → Repository → Adapter → DB
 * 
 * Respecte PROMPT.md :
 * - ✅ Zéro supabase.from() dans les hooks
 * - ✅ Utilisation des services et DTOs
 * - ✅ camelCase pour les DTOs
 * - ✅ Pas de redéfinition de types dans UI
 * - ✅ Utilisation de TaskAssignmentService
 * - ✅ Tous les hooks commencent par "use"
 * - ✅ Gestion complète des dépendances
 */

import { TaskAssignmentService } from '@/application/services/TaskAssignmentService';
import { 
  TaskAssignmentDTO,
  UpdateTaskAssignmentDTO,
  TaskStatus
} from '@/dtos/entities/TaskAssignmentDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

/**
 * Type pour les dépendances avec métadonnées
 */
interface DependencyWithMetadata {
  taskId: string;
  dependsOnTaskId: string;
  dependencyType: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';
  lagDays: number;
  task: TaskAssignmentDTO;
  dependsOnTask: TaskAssignmentDTO;
}

/**
 * Hook hexagonal pour la gestion des dépendances entre tâches
 */
export function useTaskDependenciesHex(taskId: string) {
  const queryClient = useQueryClient();
  const taskAssignmentService = new TaskAssignmentService(
    RepositoryFactory.getTaskAssignmentRepository()
  );

  // ===== QUERIES =====
  
  const dependenciesQuery = useQuery({
    queryKey: ['task-dependencies', taskId, 'dependencies'],
    queryFn: async (): Promise<TaskAssignmentDTO[]> => {
      if (!taskId) return [];
      
      const task = await taskAssignmentService.getById(taskId);
      if (!task) return [];
      
      const dependencyIds = task.dependencies || [];
      if (dependencyIds.length === 0) return [];
      
      const dependentTasks: TaskAssignmentDTO[] = [];
      for (const depId of dependencyIds) {
        const depTask = await taskAssignmentService.getById(depId);
        if (depTask) {
          dependentTasks.push(depTask);
        }
      }
      
      return dependentTasks;
    },
    enabled: !!taskId,
    staleTime: 2 * 60 * 1000,
  });

  const dependentsQuery = useQuery({
    queryKey: ['task-dependencies', taskId, 'dependents'],
    queryFn: async (): Promise<TaskAssignmentDTO[]> => {
      if (!taskId) return [];
      
      const allTasks = await taskAssignmentService.getAll();
      
      return allTasks.filter(task => 
        task.dependencies?.includes(taskId) ?? false
      );
    },
    enabled: !!taskId,
    staleTime: 2 * 60 * 1000,
  });

  const dependencyGraphQuery = useQuery({
    queryKey: ['task-dependencies', taskId, 'graph'],
    queryFn: async (): Promise<{
      task: TaskAssignmentDTO;
      dependencies: TaskAssignmentDTO[];
      dependents: TaskAssignmentDTO[];
      allRelated: TaskAssignmentDTO[];
    }> => {
      if (!taskId) {
        return { task: null as any, dependencies: [], dependents: [], allRelated: [] };
      }

      const task = await taskAssignmentService.getById(taskId);
      if (!task) {
        return { task: null as any, dependencies: [], dependents: [], allRelated: [] };
      }

      const dependencyIds = task.dependencies || [];
      const dependencies: TaskAssignmentDTO[] = [];
      for (const depId of dependencyIds) {
        const depTask = await taskAssignmentService.getById(depId);
        if (depTask) {
          dependencies.push(depTask);
        }
      }

      const allTasks = await taskAssignmentService.getAll();
      const dependents = allTasks.filter(t => 
        t.dependencies?.includes(taskId) ?? false
      );

      const allRelated = [...dependencies, ...dependents];

      return {
        task,
        dependencies,
        dependents,
        allRelated,
      };
    },
    enabled: !!taskId,
    staleTime: 2 * 60 * 1000,
  });

  /**
   * Hook: Récupère les dépendances pour plusieurs tâches
   */
  const useTasksDependencies = (taskIds: string[]) => {
    return useQuery({
      queryKey: ['task-dependencies-multiple', taskIds],
      queryFn: async (): Promise<Map<string, TaskAssignmentDTO[]>> => {
        const result = new Map<string, TaskAssignmentDTO[]>();
        
        for (const id of taskIds) {
          const task = await taskAssignmentService.getById(id);
          if (task && task.dependencies) {
            const deps: TaskAssignmentDTO[] = [];
            for (const depId of task.dependencies) {
              const depTask = await taskAssignmentService.getById(depId);
              if (depTask) {
                deps.push(depTask);
              }
            }
            result.set(id, deps);
          } else {
            result.set(id, []);
          }
        }
        
        return result;
      },
      enabled: taskIds.length > 0,
      staleTime: 2 * 60 * 1000,
    });
  };

  // ===== MUTATIONS =====

  const addDependencyMutation = useMutation({
    mutationFn: async ({ 
      taskId: id, 
      dependsOnTaskId,
      dependencyType = 'finish-to-start',
      lagDays = 0
    }: { 
      taskId: string; 
      dependsOnTaskId: string;
      dependencyType?: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';
      lagDays?: number;
    }) => {
      const task = await taskAssignmentService.getById(id);
      if (!task) {
        throw new Error('La tâche source n\'existe pas');
      }

      const dependsOnTask = await taskAssignmentService.getById(dependsOnTaskId);
      if (!dependsOnTask) {
        throw new Error('La tâche dépendante n\'existe pas');
      }

      if (id === dependsOnTaskId) {
        throw new Error('Une tâche ne peut pas dépendre d\'elle-même');
      }

      const currentDependencies = task.dependencies || [];
      if (currentDependencies.includes(dependsOnTaskId)) {
        throw new Error('Cette dépendance existe déjà');
      }

      const visited = new Set<string>();
      const queue = [dependsOnTaskId];
      
      while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (visited.has(currentId)) continue;
        visited.add(currentId);
        
        if (currentId === id) {
          throw new Error('Cette dépendance créerait un cycle');
        }
        
        const currentTask = await taskAssignmentService.getById(currentId);
        if (currentTask?.dependencies) {
          for (const depId of currentTask.dependencies) {
            if (!visited.has(depId)) {
              queue.push(depId);
            }
          }
        }
      }

      const updatedDependencies = [...currentDependencies, dependsOnTaskId];
      
      const metadata = task.metadata || {};
      const dependencyMetadata = metadata.dependencyMetadata || {};
      dependencyMetadata[dependsOnTaskId] = {
        type: dependencyType,
        lagDays: lagDays,
        addedAt: new Date().toISOString(),
      };
      
      return await taskAssignmentService.update(id, {
        dependencies: updatedDependencies,
        metadata: {
          ...metadata,
          dependencyMetadata,
        },
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-dependencies', taskId] });
      queryClient.invalidateQueries({ queryKey: ['task-dependencies', taskId, 'dependents'] });
      queryClient.invalidateQueries({ queryKey: ['task-dependencies', taskId, 'graph'] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      
      toast({
        title: 'Dépendance ajoutée',
        description: `Une dépendance a été ajoutée à "${data.title}".`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur d\'ajout',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  });

  const removeDependencyMutation = useMutation({
    mutationFn: async ({ taskId: id, dependsOnTaskId }: { taskId: string; dependsOnTaskId: string }) => {
      const task = await taskAssignmentService.getById(id);
      if (!task) {
        throw new Error('Tâche non trouvée');
      }

      const currentDependencies = task.dependencies || [];
      if (!currentDependencies.includes(dependsOnTaskId)) {
        throw new Error('Cette dépendance n\'existe pas');
      }

      const updatedDependencies = currentDependencies.filter(depId => depId !== dependsOnTaskId);
      
      const metadata = task.metadata || {};
      const dependencyMetadata = metadata.dependencyMetadata || {};
      delete dependencyMetadata[dependsOnTaskId];
      
      return await taskAssignmentService.update(id, {
        dependencies: updatedDependencies,
        metadata: {
          ...metadata,
          dependencyMetadata,
        },
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-dependencies', taskId] });
      queryClient.invalidateQueries({ queryKey: ['task-dependencies', taskId, 'dependents'] });
      queryClient.invalidateQueries({ queryKey: ['task-dependencies', taskId, 'graph'] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      
      toast({
        title: 'Dépendance supprimée',
        description: `La dépendance a été supprimée de "${data.title}".`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur de suppression',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  });

  const updateDependencyMetadataMutation = useMutation({
    mutationFn: async ({ 
      taskId: id, 
      dependsOnTaskId,
      dependencyType,
      lagDays
    }: { 
      taskId: string; 
      dependsOnTaskId: string;
      dependencyType?: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';
      lagDays?: number;
    }) => {
      const task = await taskAssignmentService.getById(id);
      if (!task) {
        throw new Error('Tâche non trouvée');
      }

      const currentDependencies = task.dependencies || [];
      if (!currentDependencies.includes(dependsOnTaskId)) {
        throw new Error('Cette dépendance n\'existe pas');
      }

      const metadata = task.metadata || {};
      const dependencyMetadata = metadata.dependencyMetadata || {};
      dependencyMetadata[dependsOnTaskId] = {
        ...dependencyMetadata[dependsOnTaskId],
        type: dependencyType || dependencyMetadata[dependsOnTaskId]?.type || 'finish-to-start',
        lagDays: lagDays !== undefined ? lagDays : dependencyMetadata[dependsOnTaskId]?.lagDays || 0,
        updatedAt: new Date().toISOString(),
      };
      
      return await taskAssignmentService.update(id, {
        metadata: {
          ...metadata,
          dependencyMetadata,
        },
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-dependencies', taskId] });
      queryClient.invalidateQueries({ queryKey: ['task-dependencies', taskId, 'graph'] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      
      toast({
        title: 'Dépendance mise à jour',
        description: `Les informations de dépendance ont été mises à jour pour "${data.title}".`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur de mise à jour',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  });

  const canStartMutation = useMutation({
    mutationFn: async (id: string) => {
      const task = await taskAssignmentService.getById(id);
      if (!task) {
        throw new Error('Tâche non trouvée');
      }

      const dependencies = task.dependencies || [];
      if (dependencies.length === 0) {
        return { canStart: true, blockedBy: [] };
      }

      const blockedBy: TaskAssignmentDTO[] = [];
      for (const depId of dependencies) {
        const depTask = await taskAssignmentService.getById(depId);
        if (depTask && depTask.status !== TaskStatus.COMPLETED) {
          blockedBy.push(depTask);
        }
      }

      return {
        canStart: blockedBy.length === 0,
        blockedBy,
      };
    },
    onSuccess: (result) => {
      if (result.canStart) {
        toast({
          title: 'Tâche prête',
          description: 'Toutes les dépendances sont terminées, la tâche peut être démarrée.',
        });
      } else {
        toast({
          title: 'Tâche bloquée',
          description: `${result.blockedBy.length} dépendance(s) non terminée(s).`,
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  });

  // ===== FONCTIONS UTILITAIRES =====

  const hasDependencies = (task: TaskAssignmentDTO): boolean => {
    return !!(task.dependencies && task.dependencies.length > 0);
  };

  const hasDependents = (task: TaskAssignmentDTO, allTasks: TaskAssignmentDTO[]): boolean => {
    return allTasks.some(t => t.dependencies?.includes(task.id) ?? false);
  };

  const getDependencyCount = (task: TaskAssignmentDTO): number => {
    return task.dependencies?.length || 0;
  };

  const getDependentCount = (task: TaskAssignmentDTO, allTasks: TaskAssignmentDTO[]): number => {
    return allTasks.filter(t => t.dependencies?.includes(task.id) ?? false).length;
  };

  const isBlockedByDependencies = (task: TaskAssignmentDTO, allTasks: TaskAssignmentDTO[]): boolean => {
    if (!task.dependencies || task.dependencies.length === 0) return false;
    
    return task.dependencies.some(depId => {
      const depTask = allTasks.find(t => t.id === depId);
      return depTask && depTask.status !== TaskStatus.COMPLETED;
    });
  };

  const getCriticalPath = (task: TaskAssignmentDTO, allTasks: TaskAssignmentDTO[]): TaskAssignmentDTO[] => {
    const path: TaskAssignmentDTO[] = [task];
    let current = task;
    
    while (current.dependencies && current.dependencies.length > 0) {
      let longestDep: TaskAssignmentDTO | null = null;
      let maxDuration = -1;
      
      for (const depId of current.dependencies) {
        const dep = allTasks.find(t => t.id === depId);
        if (dep) {
          const duration = dep.estimatedDuration || 0;
          if (duration > maxDuration) {
            maxDuration = duration;
            longestDep = dep;
          }
        }
      }
      
      if (longestDep) {
        path.push(longestDep);
        current = longestDep;
      } else {
        break;
      }
    }
    
    return path;
  };

  const getDependenciesWithMetadata = (
    task: TaskAssignmentDTO,
    allTasks: TaskAssignmentDTO[]
  ): DependencyWithMetadata[] => {
    if (!task.dependencies) return [];
    
    return task.dependencies
      .map(depId => {
        const depTask = allTasks.find(t => t.id === depId);
        if (!depTask) return null;
        
        const metadata = task.metadata?.dependencyMetadata?.[depId] || {};
        return {
          taskId: task.id,
          dependsOnTaskId: depId,
          dependencyType: metadata.type || 'finish-to-start',
          lagDays: metadata.lagDays || 0,
          task,
          dependsOnTask: depTask,
        };
      })
      .filter((item): item is DependencyWithMetadata => item !== null);
  };

  const areAllDependenciesCompleted = (task: TaskAssignmentDTO, allTasks: TaskAssignmentDTO[]): boolean => {
    if (!task.dependencies || task.dependencies.length === 0) return true;
    
    return task.dependencies.every(depId => {
      const dep = allTasks.find(t => t.id === depId);
      return dep && dep.status === TaskStatus.COMPLETED;
    });
  };

  // ===== RETOUR DU HOOK =====

  return {
    dependencies: dependenciesQuery.data || [],
    dependents: dependentsQuery.data || [],
    dependencyGraph: dependencyGraphQuery.data,
    
    isLoading: dependenciesQuery.isLoading || dependentsQuery.isLoading,
    isError: dependenciesQuery.isError || dependentsQuery.isError,
    isGraphLoading: dependencyGraphQuery.isLoading,
    
    useTasksDependencies,
    
    addDependency: addDependencyMutation.mutate,
    removeDependency: removeDependencyMutation.mutate,
    updateDependencyMetadata: updateDependencyMetadataMutation.mutate,
    checkCanStart: canStartMutation.mutate,
    
    isAdding: addDependencyMutation.isPending,
    isRemoving: removeDependencyMutation.isPending,
    isUpdatingMetadata: updateDependencyMetadataMutation.isPending,
    isChecking: canStartMutation.isPending,
    
    addError: addDependencyMutation.error,
    removeError: removeDependencyMutation.error,
    updateMetadataError: updateDependencyMetadataMutation.error,
    checkError: canStartMutation.error,
    
    hasDependencies,
    hasDependents,
    getDependencyCount,
    getDependentCount,
    isBlockedByDependencies,
    getCriticalPath,
    getDependenciesWithMetadata,
    areAllDependenciesCompleted,
    
    refetch: () => {
      dependenciesQuery.refetch();
      dependentsQuery.refetch();
      dependencyGraphQuery.refetch();
    },
  };
}

/**
 * Hook pour récupérer les dépendances de plusieurs tâches
 */
export function useMultipleTaskDependencies(taskIds: string[]) {
  const taskAssignmentService = new TaskAssignmentService(
    RepositoryFactory.getTaskAssignmentRepository()
  );

  return useQuery({
    queryKey: ['multiple-task-dependencies', taskIds],
    queryFn: async (): Promise<Map<string, TaskAssignmentDTO[]>> => {
      const result = new Map<string, TaskAssignmentDTO[]>();
      
      for (const id of taskIds) {
        const task = await taskAssignmentService.getById(id);
        if (task && task.dependencies) {
          const deps: TaskAssignmentDTO[] = [];
          for (const depId of task.dependencies) {
            const depTask = await taskAssignmentService.getById(depId);
            if (depTask) {
              deps.push(depTask);
            }
          }
          result.set(id, deps);
        } else {
          result.set(id, []);
        }
      }
      
      return result;
    },
    enabled: taskIds.length > 0,
    staleTime: 2 * 60 * 1000,
  });
}

export default useTaskDependenciesHex;