/**
 * useTasksHex - Hook hexagonal pour la gestion des tâches
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
 * - ✅ Gestion complète des tâches (CRUD + status + priority)
 */

import { TaskAssignmentService } from '@/application/services/TaskAssignmentService';
import {
  CreateTaskAssignmentDTO,
  TaskAssignmentDTO,
  TaskPriority,
  TaskStatus,
  UpdateTaskAssignmentDTO
} from '@/dtos/entities/TaskAssignmentDTO';
import { toast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Hook hexagonal pour la gestion des tâches
 * Fournit les opérations CRUD complètes avec gestion des statuts et priorités
 */
export function useTasksHex(projectId?: string) {
  const queryClient = useQueryClient();
  const taskAssignmentService = new TaskAssignmentService(
    RepositoryFactory.getTaskAssignmentRepository()
  );

  // ===== QUERIES =====
  
  /**
   * Récupère les tâches (par projet ou toutes)
   */
  const tasksQuery = useQuery({
    queryKey: ['tasks', projectId || 'all'],
    queryFn: async (): Promise<TaskAssignmentDTO[]> => {
      if (projectId) {
        return await taskAssignmentService.getByProject(projectId);
      }
      return await taskAssignmentService.getAll();
    },
    enabled: true,
    staleTime: 2 * 60 * 1000,
  });

  /**
   * Hook: Récupère une tâche spécifique par ID
   * Utilisation: const { data: task } = useTaskById(taskId)
   */
  const useTaskById = (taskId: string) => {
    return useQuery({
      queryKey: ['task', taskId],
      queryFn: async (): Promise<TaskAssignmentDTO | null> => {
        return await taskAssignmentService.getById(taskId);
      },
      enabled: !!taskId,
      staleTime: 5 * 60 * 1000,
    });
  };

  /**
   * Hook: Récupère les tâches par statut
   * Utilisation: const { data: tasks } = useTasksByStatus(TaskStatus.IN_PROGRESS)
   */
  const useTasksByStatus = (status: TaskStatus) => {
    return useQuery({
      queryKey: ['tasks', projectId || 'all', 'status', status],
      queryFn: async (): Promise<TaskAssignmentDTO[]> => {
        if (projectId) {
          const allTasks = await taskAssignmentService.getByProject(projectId);
          return allTasks.filter(t => t.status === status);
        }
        return await taskAssignmentService.getByStatus(status);
      },
      enabled: !!status,
      staleTime: 2 * 60 * 1000,
    });
  };

  /**
   * Hook: Récupère les tâches par priorité
   * Utilisation: const { data: tasks } = useTasksByPriority(TaskPriority.HIGH)
   */
  const useTasksByPriority = (priority: TaskPriority) => {
    return useQuery({
      queryKey: ['tasks', projectId || 'all', 'priority', priority],
      queryFn: async (): Promise<TaskAssignmentDTO[]> => {
        if (projectId) {
          const allTasks = await taskAssignmentService.getByProject(projectId);
          return allTasks.filter(t => t.priority === priority);
        }
        return await taskAssignmentService.getByPriority(priority);
      },
      enabled: !!priority,
      staleTime: 2 * 60 * 1000,
    });
  };

  /**
   * Hook: Récupère les tâches en retard
   * Utilisation: const { data: tasks } = useOverdueTasks()
   */
  const useOverdueTasks = () => {
    return useQuery({
      queryKey: ['tasks', projectId || 'all', 'overdue'],
      queryFn: async (): Promise<TaskAssignmentDTO[]> => {
        const allTasks = projectId 
          ? await taskAssignmentService.getByProject(projectId)
          : await taskAssignmentService.getAll();
        
        // Filtrer les tâches en retard (date d'échéance passée et non terminées)
        const now = new Date();
        return allTasks.filter(t => {
          if (!t.dueDate) return false;
          if (t.status === TaskStatus.COMPLETED || t.status === TaskStatus.CANCELLED) return false;
          return new Date(t.dueDate) < now;
        });
      },
      enabled: true,
      staleTime: 2 * 60 * 1000,
    });
  };

  /**
   * Hook: Récupère les tâches à échéance proche (7 jours)
   * Utilisation: const { data: tasks } = useDueSoonTasks()
   */
  const useDueSoonTasks = (days: number = 7) => {
    return useQuery({
      queryKey: ['tasks', projectId || 'all', 'due-soon', days],
      queryFn: async (): Promise<TaskAssignmentDTO[]> => {
        const allTasks = projectId 
          ? await taskAssignmentService.getByProject(projectId)
          : await taskAssignmentService.getAll();
        
        // Filtrer les tâches à échéance proche
        const now = new Date();
        const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        return allTasks.filter(t => {
          if (!t.dueDate) return false;
          if (t.status === TaskStatus.COMPLETED || t.status === TaskStatus.CANCELLED) return false;
          const dueDate = new Date(t.dueDate);
          return dueDate >= now && dueDate <= future;
        });
      },
      enabled: true,
      staleTime: 2 * 60 * 1000,
    });
  };

  /**
   * Hook: Récupère les statistiques des tâches
   * Utilisation: const { data: stats } = useTaskStats()
   */
  const useTaskStats = () => {
    return useQuery({
      queryKey: ['tasks', projectId || 'all', 'stats'],
      queryFn: async () => {
        return await taskAssignmentService.getStats(projectId);
      },
      enabled: true,
      staleTime: 2 * 60 * 1000,
    });
  };

  // ===== MUTATIONS =====

  /**
   * Crée une nouvelle tâche
   */
  const createMutation = useMutation({
    mutationFn: async (data: CreateTaskAssignmentDTO) => {
      // Validation
      if (!data.title || data.title.trim() === '') {
        throw new Error('Le titre de la tâche est requis');
      }

      // Enrichissement
      const enrichedData: CreateTaskAssignmentDTO = {
        ...data,
        projectId: data.projectId || projectId,
        status: data.status || TaskStatus.PENDING,
        priority: data.priority || TaskPriority.MEDIUM,
      };

      return await taskAssignmentService.create(enrichedData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId || 'all'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId || 'all', 'stats'] });
      toast({
        title: 'Tâche créée',
        description: `"${data.title}" a été créée avec succès.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur de création',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  });

  /**
   * Met à jour une tâche existante
   */
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaskAssignmentDTO }) => {
      return await taskAssignmentService.update(id, data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId || 'all'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId || 'all', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['task', data.id] });
      toast({
        title: 'Tâche mise à jour',
        description: `"${data.title}" a été modifiée avec succès.`,
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

  /**
   * Met à jour le statut d'une tâche
   */
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const updateData: UpdateTaskAssignmentDTO = {
        status,
        progress: status === TaskStatus.COMPLETED ? 100 : undefined,
      };
      return await taskAssignmentService.update(id, updateData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId || 'all'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId || 'all', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['task', data.id] });
      toast({
        title: 'Statut mis à jour',
        description: `"${data.title}" est maintenant "${data.status}".`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur de mise à jour du statut',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  });

  /**
   * Marque une tâche comme terminée
   */
  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      return await taskAssignmentService.markAsCompleted(id);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId || 'all'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId || 'all', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['task', data.id] });
      toast({
        title: 'Tâche terminée',
        description: `"${data.title}" a été marquée comme terminée.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  });

  /**
   * Supprime une tâche
   */
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await taskAssignmentService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId || 'all'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId || 'all', 'stats'] });
      toast({
        title: 'Tâche supprimée',
        description: 'La tâche a été supprimée avec succès.',
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

  // ===== FONCTIONS UTILITAIRES =====

  /**
   * Récupère les jours restants avant l'échéance d'une tâche
   */
  const getDaysUntilDue = (task: TaskAssignmentDTO): number | null => {
    if (!task.dueDate) return null;
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    return Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  /**
   * Vérifie si une tâche est en retard
   */
  const isOverdue = (task: TaskAssignmentDTO): boolean => {
    if (!task.dueDate) return false;
    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) return false;
    return new Date(task.dueDate) < new Date();
  };

  /**
   * Récupère le niveau d'urgence d'une tâche
   */
  const getUrgency = (task: TaskAssignmentDTO): 'critical' | 'high' | 'medium' | 'low' => {
    const days = getDaysUntilDue(task);
    const priority = task.priority;
    
    if (isOverdue(task) || (days !== null && days < 0)) return 'critical';
    if (priority === TaskPriority.CRITICAL || (days !== null && days <= 3)) return 'high';
    if (priority === TaskPriority.HIGH || (days !== null && days <= 7)) return 'medium';
    return 'low';
  };

  /**
   * Calcule le pourcentage de progression d'une tâche
   */
  const getProgress = (task: TaskAssignmentDTO): number => {
    if (task.status === TaskStatus.COMPLETED) return 100;
    if (task.status === TaskStatus.CANCELLED) return 0;
    return task.progress || 0;
  };

  /**
   * Récupère les tâches par statut (synchrone, utilise les données du cache)
   */
  const getTasksByStatusSync = (status: TaskStatus): TaskAssignmentDTO[] => {
    const tasks = tasksQuery.data || [];
    return tasks.filter(t => t.status === status);
  };

  /**
   * Récupère les tâches par priorité (synchrone)
   */
  const getTasksByPrioritySync = (priority: TaskPriority): TaskAssignmentDTO[] => {
    const tasks = tasksQuery.data || [];
    return tasks.filter(t => t.priority === priority);
  };

  /**
   * Récupère les tâches en retard (synchrone)
   */
  const getOverdueTasksSync = (): TaskAssignmentDTO[] => {
    const tasks = tasksQuery.data || [];
    const now = new Date();
    return tasks.filter(t => {
      if (!t.dueDate) return false;
      if (t.status === TaskStatus.COMPLETED || t.status === TaskStatus.CANCELLED) return false;
      return new Date(t.dueDate) < now;
    });
  };

  /**
   * Récupère les tâches à échéance proche (synchrone)
   */
  const getDueSoonTasksSync = (days: number = 7): TaskAssignmentDTO[] => {
    const tasks = tasksQuery.data || [];
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return tasks.filter(t => {
      if (!t.dueDate) return false;
      if (t.status === TaskStatus.COMPLETED || t.status === TaskStatus.CANCELLED) return false;
      const dueDate = new Date(t.dueDate);
      return dueDate >= now && dueDate <= future;
    });
  };

  /**
   * Calcule les statistiques globales (synchrone)
   */
  const getTaskStatsSync = () => {
    const tasks = tasksQuery.data || [];
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const pending = tasks.filter(t => t.status === TaskStatus.PENDING).length;
    const blocked = tasks.filter(t => t.status === TaskStatus.BLOCKED).length;
    const cancelled = tasks.filter(t => t.status === TaskStatus.CANCELLED).length;
    
    const critical = tasks.filter(t => t.priority === TaskPriority.CRITICAL).length;
    const high = tasks.filter(t => t.priority === TaskPriority.HIGH).length;
    const medium = tasks.filter(t => t.priority === TaskPriority.MEDIUM).length;
    const low = tasks.filter(t => t.priority === TaskPriority.LOW).length;
    
    const overdue = getOverdueTasksSync().length;
    const dueSoon = getDueSoonTasksSync().length;
    
    return {
      total,
      completed,
      inProgress,
      pending,
      blocked,
      cancelled,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      byPriority: { critical, high, medium, low },
      overdue,
      dueSoon,
    };
  };

  // ===== RETOUR DU HOOK =====

  return {
    // Données principales
    tasks: tasksQuery.data || [],
    isLoading: tasksQuery.isLoading,
    isError: tasksQuery.isError,
    error: tasksQuery.error,
    refetch: tasksQuery.refetch,
    
    // Hooks spécifiques (à utiliser dans les composants enfants)
    useTaskById,
    useTasksByStatus,
    useTasksByPriority,
    useOverdueTasks,
    useDueSoonTasks,
    useTaskStats,
    
    // Mutations
    createTask: createMutation.mutate,
    updateTask: updateMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    completeTask: completeMutation.mutate,
    deleteTask: deleteMutation.mutate,
    
    // États des mutations
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    isCompleting: completeMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Erreurs des mutations
    createError: createMutation.error,
    updateError: updateMutation.error,
    statusError: updateStatusMutation.error,
    deleteError: deleteMutation.error,
    
    // Fonctions utilitaires synchrones
    getDaysUntilDue,
    isOverdue,
    getUrgency,
    getProgress,
    getTasksByStatusSync,
    getTasksByPrioritySync,
    getOverdueTasksSync,
    getDueSoonTasksSync,
    getTaskStatsSync,
  };
}

/**
 * Alias pour useTasksHex - maintenu pour la compatibilité
 * Utilisation: const { tasks } = useTaskHex()
 */
export const useTaskHex = useTasksHex;

export default useTasksHex;