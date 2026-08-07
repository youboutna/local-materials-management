/**
 * useTaskListHex - Hook hexagonal pour la liste des tâches avec phases
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
 * - ✅ Utilisation de TaskAssignmentService et PhaseService
 * - ✅ Gestion des relations Phase ↔ Tâches
 * - ✅ Tous les hooks commencent par "use"
 */

import { TaskAssignmentService } from '@/application/services/TaskAssignmentService';
import { PhaseService } from '@/application/services/PhaseService';
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

/**
 * Hook hexagonal pour la liste des tâches d'un projet avec ses phases
 * Fournit les opérations CRUD sur les tâches et l'accès aux phases
 */
export function useTaskListHex(projectId: string) {
  const queryClient = useQueryClient();
  
  // Services hexagonaux
  const taskAssignmentService = new TaskAssignmentService(
    RepositoryFactory.getTaskAssignmentRepository()
  );
  const phaseService = new PhaseService(
    RepositoryFactory.getPhaseRepository()
  );

  // ===== QUERIES =====
  
  /**
   * Récupère les phases du projet via PhaseService
   */
  const phasesQuery = useQuery({
    queryKey: ['project-phases', projectId],
    queryFn: async (): Promise<PhaseDTO[]> => {
      const phases = await phaseService.getPhasesByProject(projectId);
      return phases as unknown as PhaseDTO[];
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });

  /**
   * Récupère les tâches du projet via TaskAssignmentService
   */
  const tasksQuery = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: async (): Promise<TaskAssignmentDTO[]> => {
      return await taskAssignmentService.getByProject(projectId);
    },
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  });

  // ===== QUERIES SPÉCIFIQUES (Hooks) =====

  /**
   * Hook: Récupère les tâches d'une phase spécifique
   * Utilisation: const { data: tasks } = useTasksByPhase(projectId, phaseId)
   */
  const useTasksByPhase = (phaseId: string) => {
    return useQuery({
      queryKey: ['phase-tasks', projectId, phaseId],
      queryFn: async (): Promise<TaskAssignmentDTO[]> => {
        return await taskAssignmentService.getByPhase(phaseId);
      },
      enabled: !!projectId && !!phaseId,
    });
  };

  /**
   * Hook: Récupère les statistiques des tâches par phase
   * Utilisation: const { data: stats } = usePhaseTaskStats(projectId, phaseId)
   */
  const usePhaseTaskStats = (phaseId: string) => {
    return useQuery({
      queryKey: ['phase-task-stats', projectId, phaseId],
      queryFn: async () => {
        const tasks = await taskAssignmentService.getByPhase(phaseId);
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
        const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
        const pending = tasks.filter(t => t.status === TaskStatus.PENDING).length;
        const blocked = tasks.filter(t => t.status === TaskStatus.BLOCKED).length;
        const cancelled = tasks.filter(t => t.status === TaskStatus.CANCELLED).length;
        
        return {
          total,
          completed,
          inProgress,
          pending,
          blocked,
          cancelled,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      },
      enabled: !!projectId && !!phaseId,
    });
  };

  // ===== MUTATIONS =====

  /**
   * Crée une tâche dans le projet
   */
  const createMutation = useMutation({
    mutationFn: async (taskData: CreateTaskAssignmentDTO) => {
      if (!taskData.title || taskData.title.trim() === '') {
        throw new Error('Le titre de la tâche est requis');
      }

      // Vérification de la phase si spécifiée
      if (taskData.phaseId) {
        const phases = phasesQuery.data || [];
        const phaseExists = phases.some(p => p.id === taskData.phaseId);
        if (!phaseExists) {
          throw new Error(`La phase "${taskData.phaseId}" n'existe pas dans ce projet`);
        }
      }

      const enrichedData: CreateTaskAssignmentDTO = {
        ...taskData,
        projectId: projectId,
        status: taskData.status || TaskStatus.PENDING,
        priority: taskData.priority || TaskPriority.MEDIUM,
      };

      return await taskAssignmentService.create(enrichedData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['phase-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['phase-task-stats', projectId] });
      
      toast({
        title: 'Tâche créée',
        description: `"${data.title}" a été ajoutée${data.phaseId ? ' à la phase' : ''} avec succès.`,
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
   * Met à jour une tâche du projet
   */
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaskAssignmentDTO }) => {
      if (data.phaseId) {
        const phases = phasesQuery.data || [];
        const phaseExists = phases.some(p => p.id === data.phaseId);
        if (!phaseExists) {
          throw new Error(`La phase "${data.phaseId}" n'existe pas dans ce projet`);
        }
      }

      return await taskAssignmentService.update(id, data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['phase-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['phase-task-stats', projectId] });
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
   * Déplace une tâche vers une autre phase
   */
  const moveToPhaseMutation = useMutation({
    mutationFn: async ({ taskId, phaseId }: { taskId: string; phaseId: string | null }) => {
      if (phaseId) {
        const phases = phasesQuery.data || [];
        const phaseExists = phases.some(p => p.id === phaseId);
        if (!phaseExists) {
          throw new Error(`La phase "${phaseId}" n'existe pas dans ce projet`);
        }
      }

      return await taskAssignmentService.update(taskId, {
        phaseId: phaseId || undefined,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['phase-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['phase-task-stats', projectId] });
      
      toast({
        title: 'Tâche déplacée',
        description: `"${data.title}" a été déplacée${data.phaseId ? ' vers une nouvelle phase' : ' hors des phases'}.`,
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

  /**
   * Met à jour le statut d'une tâche
   */
  const statusUpdateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const updateData: UpdateTaskAssignmentDTO = {
        status,
        progress: status === TaskStatus.COMPLETED ? 100 : undefined,
      };
      
      return await taskAssignmentService.update(id, updateData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['phase-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['phase-task-stats', projectId] });
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
   * Marquer une tâche comme terminée
   */
  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      return await taskAssignmentService.markAsCompleted(id);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['phase-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['phase-task-stats', projectId] });
      
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
   * Supprime une tâche du projet
   */
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await taskAssignmentService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['phase-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['phase-task-stats', projectId] });
      
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

  // ===== FONCTIONS UTILITAIRES (pas des hooks) =====

  /**
   * Récupère le nom d'une phase par son ID
   */
  const getPhaseName = (phaseId: string | null | undefined): string => {
    if (!phaseId) return 'Sans phase';
    const phases = phasesQuery.data || [];
    const phase = phases.find(p => p.id === phaseId);
    return phase?.name || 'Phase inconnue';
  };

  /**
   * Récupère les tâches groupées par phase
   */
  const getTasksGroupedByPhase = (): Map<string, TaskAssignmentDTO[]> => {
    const tasks = tasksQuery.data || [];
    const groups = new Map<string, TaskAssignmentDTO[]>();
    
    tasks.forEach(task => {
      const phaseId = task.phaseId || 'no-phase';
      if (!groups.has(phaseId)) {
        groups.set(phaseId, []);
      }
      groups.get(phaseId)!.push(task);
    });
    
    return groups;
  };

  /**
   * Calcule le progrès global du projet basé sur les tâches
   */
  const getOverallProgress = (): number => {
    const tasks = tasksQuery.data || [];
    if (tasks.length === 0) return 0;
    
    const completed = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    return Math.round((completed / tasks.length) * 100);
  };

  /**
   * Récupère les tâches par statut
   */
  const getTasksByStatus = (status: TaskStatus): TaskAssignmentDTO[] => {
    const tasks = tasksQuery.data || [];
    return tasks.filter(t => t.status === status);
  };

  /**
   * Récupère les tâches par priorité
   */
  const getTasksByPriority = (priority: TaskPriority): TaskAssignmentDTO[] => {
    const tasks = tasksQuery.data || [];
    return tasks.filter(t => t.priority === priority);
  };

  /**
   * Récupère les statistiques globales des tâches
   */
  const getTaskStats = () => {
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
  };

  // ===== RETOUR DU HOOK =====

  return {
    // Queries - Phases
    phases: phasesQuery.data || [],
    phasesLoading: phasesQuery.isLoading,
    phasesError: phasesQuery.error,
    
    // Queries - Tâches
    tasks: tasksQuery.data || [],
    tasksLoading: tasksQuery.isLoading,
    tasksError: tasksQuery.error,
    
    // Hooks spécifiques (à utiliser dans les composants enfants)
    useTasksByPhase,
    usePhaseTaskStats,
    
    // États combinés
    isLoading: tasksQuery.isLoading || phasesQuery.isLoading,
    isError: tasksQuery.isError || phasesQuery.isError,
    
    // Mutations
    createTask: createMutation.mutate,
    updateTask: updateMutation.mutate,
    moveToPhase: moveToPhaseMutation.mutate,
    updateStatus: statusUpdateMutation.mutate,
    completeTask: completeMutation.mutate,
    deleteTask: deleteMutation.mutate,
    
    // États des mutations
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isMoving: moveToPhaseMutation.isPending,
    isUpdatingStatus: statusUpdateMutation.isPending,
    isCompleting: completeMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Erreurs des mutations
    createError: createMutation.error,
    updateError: updateMutation.error,
    moveError: moveToPhaseMutation.error,
    statusError: statusUpdateMutation.error,
    deleteError: deleteMutation.error,
    
    // Utilitaires (fonctions pures, pas des hooks)
    getPhaseName,
    getTasksGroupedByPhase,
    getOverallProgress,
    getTasksByStatus,
    getTasksByPriority,
    getTaskStats,
    refetch: () => {
      tasksQuery.refetch();
      phasesQuery.refetch();
    },
  };
}

// ============================================================================
// EXPORTS POUR LA COMPATIBILITÉ
// ============================================================================

/**
 * Hook: Récupère les phases d'un projet pour les tâches
 * Alias pour useProjectPhasesForTasks dans index.ts
 */
export function useProjectPhasesForTasks(projectId: string) {
  const phaseService = new PhaseService(
    RepositoryFactory.getPhaseRepository()
  );

  return useQuery({
    queryKey: ['project-phases-for-tasks', projectId],
    queryFn: async (): Promise<PhaseDTO[]> => {
      const phases = await phaseService.getPhasesByProject(projectId);
      return phases as unknown as PhaseDTO[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!projectId
  });
}

/**
 * Hook: Récupère les tâches d'un projet
 * Alias pour useProjectTasks dans index.ts
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

// ============================================================================
// DEFAUT EXPORT
// ============================================================================

export default useTaskListHex;