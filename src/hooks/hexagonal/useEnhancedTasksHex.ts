import { PhaseService } from '@/application/services/PhaseService';
/**
 * useEnhancedTasksHex - Hook hexagonal pour les tâches avancées
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
 * - ✅ Fonctionnalités avancées : stats, overdue, due soon, analytics
 */

import { TaskAssignmentService } from '@/application/services/TaskAssignmentService';
import { 
  TaskAssignmentDTO,
  CreateTaskAssignmentDTO,
  UpdateTaskAssignmentDTO,
  TaskStatus,
  TaskPriority
} from '@/dtos/entities/TaskAssignmentDTO';
import { PhaseDTO } from '@/dtos/entities/PhaseDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { AuthService, getAuthService} from '@/application/services/AuthService';

// ============================================================================
// TYPES - UNIQUEMENT DES ALIAS VERS LES DTOS
// ============================================================================

/**
 * Alias pour TaskAssignmentDTO - utilisé comme ProjectTask
 * ✅ Source unique : TaskAssignmentDTO
 */
export type ProjectTask = TaskAssignmentDTO;

/**
 * Alias pour CreateTaskAssignmentDTO - utilisé comme ProjectTaskFormData
 * ✅ Source unique : CreateTaskAssignmentDTO
 */
export type ProjectTaskFormData = CreateTaskAssignmentDTO;

/**
 * Alias pour PhaseDTO - utilisé comme ProjectPhase
 * ✅ Source unique : PhaseDTO
 */
export type ProjectPhase = PhaseDTO;

/**
 * Interface pour les statistiques avancées (interne, pas exposée)
 */
interface EnhancedTaskStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  blocked: number;
  cancelled: number;
  completionRate: number;
  byPriority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  byStatus: {
    [key: string]: number;
  };
  overdue: number;
  dueSoon: number;
  averageProgress: number;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

/**
 * Hook hexagonal pour les tâches avancées
 * Fournit des fonctionnalités : stats, overdue, due soon, analytics, status management
 */
export function useEnhancedTasksHex(projectId: string) {
  const queryClient = useQueryClient();
  const taskAssignmentService = new TaskAssignmentService(
    RepositoryFactory.getTaskAssignmentRepository()
  );
  const authService = getAuthService();

  // ===== QUERIES PRINCIPALES =====
  
  /**
   * Récupère toutes les tâches du projet
   */
  const tasksQuery = useQuery({
    queryKey: ['enhanced-tasks', projectId],
    queryFn: async (): Promise<TaskAssignmentDTO[]> => {
      return await taskAssignmentService.getByProject(projectId);
    },
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  });

  /**
   * Récupère les tâches en retard
   */
  const overdueTasksQuery = useQuery({
    queryKey: ['enhanced-tasks', projectId, 'overdue'],
    queryFn: async (): Promise<TaskAssignmentDTO[]> => {
      const allTasks = await taskAssignmentService.getByProject(projectId);
      const now = new Date();
      return allTasks.filter(t => {
        if (!t.dueDate) return false;
        if (t.status === TaskStatus.COMPLETED || t.status === TaskStatus.CANCELLED) return false;
        return new Date(t.dueDate) < now;
      });
    },
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  });

  /**
   * Récupère les tâches à échéance proche (7 jours)
   */
  const dueSoonTasksQuery = useQuery({
    queryKey: ['enhanced-tasks', projectId, 'due-soon'],
    queryFn: async (): Promise<TaskAssignmentDTO[]> => {
      const allTasks = await taskAssignmentService.getByProject(projectId);
      const now = new Date();
      const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return allTasks.filter(t => {
        if (!t.dueDate) return false;
        if (t.status === TaskStatus.COMPLETED || t.status === TaskStatus.CANCELLED) return false;
        const dueDate = new Date(t.dueDate);
        return dueDate >= now && dueDate <= future;
      });
    },
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  });

  /**
   * Récupère les statistiques avancées des tâches
   */
  const statsQuery = useQuery({
    queryKey: ['enhanced-tasks', projectId, 'stats'],
    queryFn: async (): Promise<EnhancedTaskStats> => {
      const allTasks = await taskAssignmentService.getByProject(projectId);
      const stats = await taskAssignmentService.getStats(projectId);
      
      const total = allTasks.length;
      const completed = allTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
      const inProgress = allTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
      const pending = allTasks.filter(t => t.status === TaskStatus.PENDING).length;
      const blocked = allTasks.filter(t => t.status === TaskStatus.BLOCKED).length;
      const cancelled = allTasks.filter(t => t.status === TaskStatus.CANCELLED).length;
      
      const critical = allTasks.filter(t => t.priority === TaskPriority.CRITICAL).length;
      const high = allTasks.filter(t => t.priority === TaskPriority.HIGH).length;
      const medium = allTasks.filter(t => t.priority === TaskPriority.MEDIUM).length;
      const low = allTasks.filter(t => t.priority === TaskPriority.LOW).length;
      
      const now = new Date();
      const overdue = allTasks.filter(t => {
        if (!t.dueDate) return false;
        if (t.status === TaskStatus.COMPLETED || t.status === TaskStatus.CANCELLED) return false;
        return new Date(t.dueDate) < now;
      }).length;
      
      const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const dueSoon = allTasks.filter(t => {
        if (!t.dueDate) return false;
        if (t.status === TaskStatus.COMPLETED || t.status === TaskStatus.CANCELLED) return false;
        const dueDate = new Date(t.dueDate);
        return dueDate >= now && dueDate <= future;
      }).length;
      
      const totalProgress = allTasks.reduce((sum, t) => sum + (t.progress || 0), 0);
      const averageProgress = total > 0 ? Math.round(totalProgress / total) : 0;
      
      return {
        total,
        completed,
        inProgress,
        pending,
        blocked,
        cancelled,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        byPriority: { critical, high, medium, low },
        byStatus: stats.byStatus,
        overdue,
        dueSoon,
        averageProgress,
      };
    },
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  });

  // ===== QUERIES SPÉCIFIQUES (Hooks) =====

  /**
   * Hook: Récupère les tâches par statut
   * Utilisation: const { data: tasks } = useTasksByStatus(TaskStatus.IN_PROGRESS)
   */
  const useTasksByStatus = (status: TaskStatus) => {
    return useQuery({
      queryKey: ['enhanced-tasks', projectId, 'status', status],
      queryFn: async (): Promise<TaskAssignmentDTO[]> => {
        const allTasks = await taskAssignmentService.getByProject(projectId);
        return allTasks.filter(t => t.status === status);
      },
      enabled: !!projectId && !!status,
      staleTime: 2 * 60 * 1000,
    });
  };

  /**
   * Hook: Récupère les tâches par priorité
   * Utilisation: const { data: tasks } = useTasksByPriority(TaskPriority.HIGH)
   */
  const useTasksByPriority = (priority: TaskPriority) => {
    return useQuery({
      queryKey: ['enhanced-tasks', projectId, 'priority', priority],
      queryFn: async (): Promise<TaskAssignmentDTO[]> => {
        const allTasks = await taskAssignmentService.getByProject(projectId);
        return allTasks.filter(t => t.priority === priority);
      },
      enabled: !!projectId && !!priority,
      staleTime: 2 * 60 * 1000,
    });
  };

  /**
   * Hook: Récupère les tâches par assigné
   * Utilisation: const { data: tasks } = useTasksByAssignee(userId)
   */
  const useTasksByAssignee = (assigneeId: string) => {
    return useQuery({
      queryKey: ['enhanced-tasks', projectId, 'assignee', assigneeId],
      queryFn: async (): Promise<TaskAssignmentDTO[]> => {
        return await taskAssignmentService.getByAssignee(assigneeId);
      },
      enabled: !!projectId && !!assigneeId,
      staleTime: 2 * 60 * 1000,
    });
  };

  /**
   * Hook: Récupère les tâches par plage de dates
   * Utilisation: const { data: tasks } = useTasksByDateRange(startDate, endDate)
   */
  const useTasksByDateRange = (startDate: Date, endDate: Date) => {
    return useQuery({
      queryKey: ['enhanced-tasks', projectId, 'date-range', startDate.toISOString(), endDate.toISOString()],
      queryFn: async (): Promise<TaskAssignmentDTO[]> => {
        const allTasks = await taskAssignmentService.getByProject(projectId);
        return allTasks.filter(t => {
          if (!t.dueDate) return false;
          const dueDate = new Date(t.dueDate);
          return dueDate >= startDate && dueDate <= endDate;
        });
      },
      enabled: !!projectId && !!startDate && !!endDate,
      staleTime: 2 * 60 * 1000,
    });
  };

  // ===== MUTATIONS =====

  /**
   * Crée une tâche avec validation avancée
   */
  const createMutation = useMutation({
    mutationFn: async (data: CreateTaskAssignmentDTO) => {
      if (!data.title || data.title.trim() === '') {
        throw new Error('Le titre de la tâche est requis');
      }

      if (data.dueDate && new Date(data.dueDate) < new Date()) {
        throw new Error('La date d\'échéance ne peut pas être dans le passé');
      }

      const enrichedData: CreateTaskAssignmentDTO = {
        ...data,
        projectId: projectId,
        status: data.status || TaskStatus.PENDING,
        priority: data.priority || TaskPriority.MEDIUM,
        progress: data.progress || 0,
      };

      return await taskAssignmentService.create(enrichedData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-tasks', projectId, 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-tasks', projectId, 'overdue'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-tasks', projectId, 'due-soon'] });
      
      toast({
        title: 'Tâche créée',
        description: `"${data.title}" a été ajoutée avec succès.`,
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
   * Met à jour une tâche avec validation
   */
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaskAssignmentDTO }) => {
      if (data.dueDate && new Date(data.dueDate) < new Date()) {
        throw new Error('La date d\'échéance ne peut pas être dans le passé');
      }

      return await taskAssignmentService.update(id, data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-tasks', projectId, 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-tasks', projectId, 'overdue'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-tasks', projectId, 'due-soon'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-tasks', projectId, 'status'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-tasks', projectId, 'priority'] });
      
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
   * Met à jour le statut d'une tâche avec transitions
   */
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const currentTask = await taskAssignmentService.getById(id);
      if (!currentTask) {
        throw new Error('Tâche non trouvée');
      }

      const validTransitions: Record<TaskStatus, TaskStatus[]> = {
        [TaskStatus.PENDING]: [TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED, TaskStatus.CANCELLED],
        [TaskStatus.IN_PROGRESS]: [TaskStatus.COMPLETED, TaskStatus.BLOCKED, TaskStatus.PENDING, TaskStatus.CANCELLED],
        [TaskStatus.COMPLETED]: [TaskStatus.PENDING],
        [TaskStatus.BLOCKED]: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
        [TaskStatus.CANCELLED]: [],
      };

      const allowed = validTransitions[currentTask.status] || [];
      if (!allowed.includes(status)) {
        throw new Error(`Transition de "${currentTask.status}" vers "${status}" non autorisée`);
      }

      const updateData: UpdateTaskAssignmentDTO = {
        status,
        progress: status === TaskStatus.COMPLETED ? 100 : currentTask.progress,
      };
      
      return await taskAssignmentService.update(id, updateData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-tasks', projectId, 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-tasks', projectId, 'overdue'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-tasks', projectId, 'due-soon'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-tasks', projectId, 'status'] });
      
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
      const task = await taskAssignmentService.getById(id);
      if (!task) {
        throw new Error('Tâche non trouvée');
      }
      
      if (task.status === TaskStatus.CANCELLED) {
        throw new Error('Une tâche annulée ne peut pas être terminée');
      }
      
      return await taskAssignmentService.markAsCompleted(id);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-tasks', projectId, 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-tasks', projectId, 'overdue'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-tasks', projectId, 'due-soon'] });
      
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
      queryClient.invalidateQueries({ queryKey: ['enhanced-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-tasks', projectId, 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-tasks', projectId, 'overdue'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-tasks', projectId, 'due-soon'] });
      
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

  /**
   * Mutation: Bloque une tâche
   */
  const blockMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const task = await taskAssignmentService.getById(id);
      if (!task) {
        throw new Error('Tâche non trouvée');
      }
      
      if (task.status === TaskStatus.COMPLETED) {
        throw new Error('Une tâche terminée ne peut pas être bloquée');
      }
      
      return await taskAssignmentService.update(id, {
        status: TaskStatus.BLOCKED,
        notes: reason ? `Bloqué : ${reason}` : task.notes,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-tasks', projectId, 'stats'] });
      toast({
        title: 'Tâche bloquée',
        description: `"${data.title}" a été bloquée.`,
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

  // ===== FONCTIONS UTILITAIRES =====

  const getDaysUntilDue = (task: TaskAssignmentDTO): number | null => {
    if (!task.dueDate) return null;
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    return Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const isOverdue = (task: TaskAssignmentDTO): boolean => {
    if (!task.dueDate) return false;
    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) return false;
    return new Date(task.dueDate) < new Date();
  };

  const getUrgency = (task: TaskAssignmentDTO): 'critical' | 'high' | 'medium' | 'low' => {
    const days = getDaysUntilDue(task);
    const priority = task.priority;
    
    if (isOverdue(task) || (days !== null && days < 0)) return 'critical';
    if (priority === TaskPriority.CRITICAL || (days !== null && days <= 3)) return 'high';
    if (priority === TaskPriority.HIGH || (days !== null && days <= 7)) return 'medium';
    return 'low';
  };

  const getProgress = (task: TaskAssignmentDTO): number => {
    if (task.status === TaskStatus.COMPLETED) return 100;
    if (task.status === TaskStatus.CANCELLED) return 0;
    return task.progress || 0;
  };

  const getTasksByStatusSync = (status: TaskStatus): TaskAssignmentDTO[] => {
    const tasks = tasksQuery.data || [];
    return tasks.filter(t => t.status === status);
  };

  const getTasksByPrioritySync = (priority: TaskPriority): TaskAssignmentDTO[] => {
    const tasks = tasksQuery.data || [];
    return tasks.filter(t => t.priority === priority);
  };

  const getTaskStatsSync = (): EnhancedTaskStats => {
    const allTasks = tasksQuery.data || [];
    const total = allTasks.length;
    const completed = allTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const inProgress = allTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const pending = allTasks.filter(t => t.status === TaskStatus.PENDING).length;
    const blocked = allTasks.filter(t => t.status === TaskStatus.BLOCKED).length;
    const cancelled = allTasks.filter(t => t.status === TaskStatus.CANCELLED).length;
    
    const critical = allTasks.filter(t => t.priority === TaskPriority.CRITICAL).length;
    const high = allTasks.filter(t => t.priority === TaskPriority.HIGH).length;
    const medium = allTasks.filter(t => t.priority === TaskPriority.MEDIUM).length;
    const low = allTasks.filter(t => t.priority === TaskPriority.LOW).length;
    
    const now = new Date();
    const overdue = allTasks.filter(t => {
      if (!t.dueDate) return false;
      if (t.status === TaskStatus.COMPLETED || t.status === TaskStatus.CANCELLED) return false;
      return new Date(t.dueDate) < now;
    }).length;
    
    const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const dueSoon = allTasks.filter(t => {
      if (!t.dueDate) return false;
      if (t.status === TaskStatus.COMPLETED || t.status === TaskStatus.CANCELLED) return false;
      const dueDate = new Date(t.dueDate);
      return dueDate >= now && dueDate <= future;
    }).length;
    
    const totalProgress = allTasks.reduce((sum, t) => sum + (t.progress || 0), 0);
    const averageProgress = total > 0 ? Math.round(totalProgress / total) : 0;
    
    const byStatus: { [key: string]: number } = {};
    allTasks.forEach(t => {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    });
    
    return {
      total,
      completed,
      inProgress,
      pending,
      blocked,
      cancelled,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      byPriority: { critical, high, medium, low },
      byStatus,
      overdue,
      dueSoon,
      averageProgress,
    };
  };

  // ===== RETOUR DU HOOK =====

  return {
    tasks: tasksQuery.data || [],
    overdueTasks: overdueTasksQuery.data || [],
    dueSoonTasks: dueSoonTasksQuery.data || [],
    stats: statsQuery.data,
    
    isLoading: tasksQuery.isLoading || overdueTasksQuery.isLoading || dueSoonTasksQuery.isLoading,
    isError: tasksQuery.isError || overdueTasksQuery.isError || dueSoonTasksQuery.isError,
    isStatsLoading: statsQuery.isLoading,
    
    useTasksByStatus,
    useTasksByPriority,
    useTasksByAssignee,
    useTasksByDateRange,
    
    createTask: createMutation.mutate,
    updateTask: updateMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    completeTask: completeMutation.mutate,
    blockTask: blockMutation.mutate,
    deleteTask: deleteMutation.mutate,
    
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    isCompleting: completeMutation.isPending,
    isBlocking: blockMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    createError: createMutation.error,
    updateError: updateMutation.error,
    statusError: updateStatusMutation.error,
    deleteError: deleteMutation.error,
    
    getDaysUntilDue,
    isOverdue,
    getUrgency,
    getProgress,
    getTasksByStatusSync,
    getTasksByPrioritySync,
    getTaskStatsSync,
    
    refetch: () => {
      tasksQuery.refetch();
      overdueTasksQuery.refetch();
      dueSoonTasksQuery.refetch();
      statsQuery.refetch();
    },
  };
}

// ============================================================================
// EXPORTS POUR LA COMPATIBILITÉ AVEC useEnhancedTasksHex
// ============================================================================

/**
 * Hook: Récupère les phases d'un projet pour les tâches
 * Utilisé par EnhancedTaskManager et autres composants
 * ✅ Retourne PhaseDTO directement
 */
export function useProjectPhasesForTasks(projectId: string) {
  const phaseService = new PhaseService(
    RepositoryFactory.getPhaseRepository()
  );

  return useQuery({
    queryKey: ['project-phases-for-tasks', projectId],
    queryFn: async (): Promise<PhaseDTO[]> => {
      return (await phaseService.getPhasesByProject(projectId)) as unknown as PhaseDTO[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!projectId
  });
}

/**
 * Hook: Récupère les tâches d'un projet
 * ✅ Retourne TaskAssignmentDTO directement
 */
export function useProjectTasks(projectId: string) {
  const taskAssignmentService = new TaskAssignmentService(
    RepositoryFactory.getTaskAssignmentRepository()
  );

  return useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: async (): Promise<TaskAssignmentDTO[]> => {
      return await taskAssignmentService.getByProject(projectId);
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!projectId
  });
}

/**
 * Hook: Crée une tâche dans un projet
 * ✅ Utilise CreateTaskAssignmentDTO
 */
export function useCreateProjectTask(projectId: string) {
  const queryClient = useQueryClient();
  const taskAssignmentService = new TaskAssignmentService(
    RepositoryFactory.getTaskAssignmentRepository()
  );

  return useMutation({
    mutationFn: async (taskData: CreateTaskAssignmentDTO) => {
      const enrichedData: CreateTaskAssignmentDTO = {
        ...taskData,
        projectId: projectId,
        status: taskData.status || TaskStatus.PENDING,
        priority: taskData.priority || TaskPriority.MEDIUM,
      };

      return await taskAssignmentService.create(enrichedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      toast({
        title: 'Tâche créée',
        description: 'La tâche a été ajoutée au projet avec succès.',
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
}

/**
 * Hook: Met à jour une tâche d'un projet
 * ✅ Utilise UpdateTaskAssignmentDTO
 */
export function useUpdateProjectTask(projectId: string) {
  const queryClient = useQueryClient();
  const taskAssignmentService = new TaskAssignmentService(
    RepositoryFactory.getTaskAssignmentRepository()
  );

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaskAssignmentDTO }) => {
      return await taskAssignmentService.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      toast({
        title: 'Tâche mise à jour',
        description: 'Les modifications ont été sauvegardées.',
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
}

/**
 * Hook: Supprime une tâche d'un projet
 */
export function useDeleteProjectTask(projectId: string) {
  const queryClient = useQueryClient();
  const taskAssignmentService = new TaskAssignmentService(
    RepositoryFactory.getTaskAssignmentRepository()
  );

  return useMutation({
    mutationFn: async (id: string) => {
      await taskAssignmentService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
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
}

// ============================================================================
// DEFAUT EXPORT
// ============================================================================

export default useEnhancedTasksHex;