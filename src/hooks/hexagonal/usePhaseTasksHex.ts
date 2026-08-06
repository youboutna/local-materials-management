/**
 * usePhaseTasksHex - Hook hexagonal pour la gestion des tâches par phase
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
 * - ✅ Gestion des tâches par phase
 */

import { TaskAssignmentService } from '@/application/services/TaskAssignmentService';
import { 
  TaskAssignmentDTO,
  CreateTaskAssignmentDTO,
  UpdateTaskAssignmentDTO,
  TaskStatus,
  TaskPriority
} from '@/dtos/entities/TaskAssignmentDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

/**
 * Hook hexagonal pour la gestion des tâches d'une phase
 * Fournit les opérations CRUD spécifiques à une phase
 */
export function usePhaseTasksHex(phaseId: string) {
  const queryClient = useQueryClient();
  const taskAssignmentService = new TaskAssignmentService(
    RepositoryFactory.getTaskAssignmentRepository()
  );

  // ===== QUERIES =====
  
  /**
   * Récupère toutes les tâches de la phase
   */
  const tasksQuery = useQuery({
    queryKey: ['phase-tasks-hex', phaseId],
    queryFn: async (): Promise<TaskAssignmentDTO[]> => {
      return await taskAssignmentService.getByPhase(phaseId);
    },
    enabled: !!phaseId,
    staleTime: 2 * 60 * 1000,
  });

  /**
   * Hook: Récupère les tâches de la phase par statut
   * Utilisation: const { data: tasks } = usePhaseTasksByStatus(TaskStatus.IN_PROGRESS)
   */
  const usePhaseTasksByStatus = (status: TaskStatus) => {
    return useQuery({
      queryKey: ['phase-tasks-hex', phaseId, 'status', status],
      queryFn: async (): Promise<TaskAssignmentDTO[]> => {
        const allTasks = await taskAssignmentService.getByPhase(phaseId);
        return allTasks.filter(t => t.status === status);
      },
      enabled: !!phaseId && !!status,
      staleTime: 2 * 60 * 1000,
    });
  };

  /**
   * Hook: Récupère les tâches de la phase par priorité
   * Utilisation: const { data: tasks } = usePhaseTasksByPriority(TaskPriority.HIGH)
   */
  const usePhaseTasksByPriority = (priority: TaskPriority) => {
    return useQuery({
      queryKey: ['phase-tasks-hex', phaseId, 'priority', priority],
      queryFn: async (): Promise<TaskAssignmentDTO[]> => {
        const allTasks = await taskAssignmentService.getByPhase(phaseId);
        return allTasks.filter(t => t.priority === priority);
      },
      enabled: !!phaseId && !!priority,
      staleTime: 2 * 60 * 1000,
    });
  };

  /**
   * Hook: Récupère les statistiques des tâches de la phase
   * Utilisation: const { data: stats } = usePhaseTaskStats()
   */
  const usePhaseTaskStats = () => {
    return useQuery({
      queryKey: ['phase-tasks-hex', phaseId, 'stats'],
      queryFn: async () => {
        const tasks = await taskAssignmentService.getByPhase(phaseId);
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
        
        return {
          total,
          completed,
          inProgress,
          pending,
          blocked,
          cancelled,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
          byPriority: { critical, high, medium, low },
        };
      },
      enabled: !!phaseId,
      staleTime: 2 * 60 * 1000,
    });
  };

  // ===== MUTATIONS =====

  /**
   * Crée une tâche dans la phase
   */
  const createMutation = useMutation({
    mutationFn: async (taskData: CreateTaskAssignmentDTO) => {
      // Validation
      if (!taskData.title || taskData.title.trim() === '') {
        throw new Error('Le titre de la tâche est requis');
      }

      // Enrichissement avec phaseId
      const enrichedData: CreateTaskAssignmentDTO = {
        ...taskData,
        phaseId: phaseId,
        status: taskData.status || TaskStatus.PENDING,
        priority: taskData.priority || TaskPriority.MEDIUM,
        progress: taskData.progress || 0,
      };

      return await taskAssignmentService.create(enrichedData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['phase-tasks-hex', phaseId] });
      queryClient.invalidateQueries({ queryKey: ['phase-tasks-hex', phaseId, 'stats'] });
      
      toast({
        title: 'Tâche créée',
        description: `"${data.title}" a été ajoutée à la phase avec succès.`,
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
   * Met à jour une tâche de la phase
   */
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaskAssignmentDTO }) => {
      // Vérifier que la tâche appartient à la phase
      const task = await taskAssignmentService.getById(id);
      if (!task) {
        throw new Error('Tâche non trouvée');
      }
      if (task.phaseId !== phaseId) {
        throw new Error('Cette tâche n\'appartient pas à cette phase');
      }

      return await taskAssignmentService.update(id, data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['phase-tasks-hex', phaseId] });
      queryClient.invalidateQueries({ queryKey: ['phase-tasks-hex', phaseId, 'stats'] });
      
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
   * Met à jour le statut d'une tâche de la phase
   */
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      // Vérifier que la tâche appartient à la phase
      const task = await taskAssignmentService.getById(id);
      if (!task) {
        throw new Error('Tâche non trouvée');
      }
      if (task.phaseId !== phaseId) {
        throw new Error('Cette tâche n\'appartient pas à cette phase');
      }

      const updateData: UpdateTaskAssignmentDTO = {
        status,
        progress: status === TaskStatus.COMPLETED ? 100 : task.progress,
      };
      
      return await taskAssignmentService.update(id, updateData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['phase-tasks-hex', phaseId] });
      queryClient.invalidateQueries({ queryKey: ['phase-tasks-hex', phaseId, 'stats'] });
      
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
   * Marque une tâche de la phase comme terminée
   */
  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      // Vérifier que la tâche appartient à la phase
      const task = await taskAssignmentService.getById(id);
      if (!task) {
        throw new Error('Tâche non trouvée');
      }
      if (task.phaseId !== phaseId) {
        throw new Error('Cette tâche n\'appartient pas à cette phase');
      }

      return await taskAssignmentService.markAsCompleted(id);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['phase-tasks-hex', phaseId] });
      queryClient.invalidateQueries({ queryKey: ['phase-tasks-hex', phaseId, 'stats'] });
      
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
   * Supprime une tâche de la phase
   */
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Vérifier que la tâche appartient à la phase
      const task = await taskAssignmentService.getById(id);
      if (!task) {
        throw new Error('Tâche non trouvée');
      }
      if (task.phaseId !== phaseId) {
        throw new Error('Cette tâche n\'appartient pas à cette phase');
      }

      await taskAssignmentService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-tasks-hex', phaseId] });
      queryClient.invalidateQueries({ queryKey: ['phase-tasks-hex', phaseId, 'stats'] });
      
      toast({
        title: 'Tâche supprimée',
        description: 'La tâche a été supprimée de la phase avec succès.',
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
   * Déplace une tâche vers une autre phase
   */
  const moveToPhaseMutation = useMutation({
    mutationFn: async ({ taskId, targetPhaseId }: { taskId: string; targetPhaseId: string }) => {
      // Vérifier que la tâche appartient à la phase actuelle
      const task = await taskAssignmentService.getById(taskId);
      if (!task) {
        throw new Error('Tâche non trouvée');
      }
      if (task.phaseId !== phaseId) {
        throw new Error('Cette tâche n\'appartient pas à cette phase');
      }

      // Déplacer vers la nouvelle phase
      return await taskAssignmentService.update(taskId, {
        phaseId: targetPhaseId,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['phase-tasks-hex', phaseId] });
      queryClient.invalidateQueries({ queryKey: ['phase-tasks-hex', data.phaseId || ''] });
      queryClient.invalidateQueries({ queryKey: ['phase-tasks-hex', phaseId, 'stats'] });
      
      toast({
        title: 'Tâche déplacée',
        description: `"${data.title}" a été déplacée vers une autre phase.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur de déplacement',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  });

  // ===== FONCTIONS UTILITAIRES =====

  /**
   * Vérifie si une tâche est en retard
   */
  const isOverdue = (task: TaskAssignmentDTO): boolean => {
    if (!task.dueDate) return false;
    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) return false;
    return new Date(task.dueDate) < new Date();
  };

  /**
   * Récupère les jours restants avant l'échéance
   */
  const getDaysUntilDue = (task: TaskAssignmentDTO): number | null => {
    if (!task.dueDate) return null;
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    return Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
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
   * Récupère la progression d'une tâche
   */
  const getProgress = (task: TaskAssignmentDTO): number => {
    if (task.status === TaskStatus.COMPLETED) return 100;
    if (task.status === TaskStatus.CANCELLED) return 0;
    return task.progress || 0;
  };

  /**
   * Récupère les tâches par statut (synchrone)
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
   * Calcule le progrès de la phase basé sur les tâches
   */
  const getPhaseProgress = (): number => {
    const tasks = tasksQuery.data || [];
    if (tasks.length === 0) return 0;
    
    const completed = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    return Math.round((completed / tasks.length) * 100);
  };

  /**
   * Récupère les statistiques de la phase (synchrone)
   */
  const getPhaseTaskStatsSync = () => {
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
    
    const overdue = tasks.filter(t => isOverdue(t)).length;
    
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
      progress: getPhaseProgress(),
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
    usePhaseTasksByStatus,
    usePhaseTasksByPriority,
    usePhaseTaskStats,
    
    // Mutations
    createTask: createMutation.mutate,
    updateTask: updateMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    completeTask: completeMutation.mutate,
    deleteTask: deleteMutation.mutate,
    moveToPhase: moveToPhaseMutation.mutate,
    
    // États des mutations
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    isCompleting: completeMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isMoving: moveToPhaseMutation.isPending,
    
    // Erreurs des mutations
    createError: createMutation.error,
    updateError: updateMutation.error,
    statusError: updateStatusMutation.error,
    deleteError: deleteMutation.error,
    moveError: moveToPhaseMutation.error,
    
    // Fonctions utilitaires
    isOverdue,
    getDaysUntilDue,
    getUrgency,
    getProgress,
    getTasksByStatusSync,
    getTasksByPrioritySync,
    getPhaseProgress,
    getPhaseTaskStatsSync,
  };
}