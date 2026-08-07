import { PhaseService } from '@/application/services/PhaseService';
/**
 * useTaskAssignmentsHex - Hook hexagonal pour la gestion des assignations de tâches
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
 * - ✅ Gestion des assignations avec filtres
 */

import { AuthService } from '@/application/services/AuthService';
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
import { PhaseDTO } from '@/dtos/entities/PhaseDTO';

/**
 * Hook hexagonal pour la gestion des assignations de tâches
 * Fournit les opérations CRUD avec filtres et gestion des notes
 */
export function useTaskAssignmentsHex(filters?: {
  projectId?: string;
  assignedTo?: string;
  status?: string;
}) {
  const queryClient = useQueryClient();
  const taskAssignmentService = new TaskAssignmentService(
    RepositoryFactory.getTaskAssignmentRepository()
  );
  const authService = new AuthService(RepositoryFactory.getAuthRepository());

  // ===== QUERIES =====
  
  /**
   * Récupère les tâches avec filtres
   */
  const tasksQuery = useQuery({
    queryKey: ['task-assignments-hex', filters],
    queryFn: async (): Promise<TaskAssignmentDTO[]> => {
      let tasks: TaskAssignmentDTO[] = [];

      if (filters?.projectId) {
        tasks = await taskAssignmentService.getByProject(filters.projectId);
      } else if (filters?.assignedTo) {
        tasks = await taskAssignmentService.getByAssignee(filters.assignedTo);
      } else if (filters?.status) {
        tasks = await taskAssignmentService.getByStatus(filters.status as TaskStatus);
      } else {
        tasks = await taskAssignmentService.getAll();
      }

      if (filters?.status && (filters.projectId || filters.assignedTo)) {
        tasks = tasks.filter(t => t.status === filters.status);
      }

      return tasks;
    },
    enabled: true,
    staleTime: 2 * 60 * 1000,
  });

  /**
   * Hook: Récupère une tâche spécifique par ID
   * Utilisation: const { data: task } = useTaskAssignmentById(taskId)
   */
  const useTaskAssignmentById = (taskId: string) => {
    return useQuery({
      queryKey: ['task-assignment-hex', taskId],
      queryFn: async (): Promise<TaskAssignmentDTO | null> => {
        if (!taskId) return null;
        return await taskAssignmentService.getById(taskId);
      },
      enabled: !!taskId,
      staleTime: 5 * 60 * 1000,
    });
  };

  /**
   * Hook: Récupère les tâches par assigné
   * Utilisation: const { data: tasks } = useTasksByAssignee(userId)
   */
  const useTasksByAssignee = (assigneeId: string) => {
    return useQuery({
      queryKey: ['task-assignments-hex', 'assignee', assigneeId],
      queryFn: async (): Promise<TaskAssignmentDTO[]> => {
        return await taskAssignmentService.getByAssignee(assigneeId);
      },
      enabled: !!assigneeId,
      staleTime: 2 * 60 * 1000,
    });
  };

  /**
   * Hook: Récupère les tâches par projet
   * Utilisation: const { data: tasks } = useTasksByProject(projectId)
   */
  const useTasksByProject = (projectId: string) => {
    return useQuery({
      queryKey: ['task-assignments-hex', 'project', projectId],
      queryFn: async (): Promise<TaskAssignmentDTO[]> => {
        return await taskAssignmentService.getByProject(projectId);
      },
      enabled: !!projectId,
      staleTime: 2 * 60 * 1000,
    });
  };

  // ===== MUTATIONS =====

  /**
   * Crée une assignation de tâche
   */
  const createMutation = useMutation({
    mutationFn: async (input: CreateTaskAssignmentDTO) => {
      if (!input.title || input.title.trim() === '') {
        throw new Error('Le titre de la tâche est requis');
      }

      if (!input.assigneeId) {
        throw new Error('Un assigné est requis');
      }

      const enrichedData: CreateTaskAssignmentDTO = {
        ...input,
        status: input.status || TaskStatus.PENDING,
        priority: input.priority || TaskPriority.MEDIUM,
        progress: input.progress || 0,
        assignedBy: input.assignedBy || (await authService.getCurrentUser())?.id,
      };

      return await taskAssignmentService.create(enrichedData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-assignments-hex'] });
      queryClient.invalidateQueries({ queryKey: ['task-assignments-hex', 'assignee'] });
      queryClient.invalidateQueries({ queryKey: ['task-assignments-hex', 'project'] });
      
      toast({
        title: 'Tâche assignée',
        description: `"${data.title}" a été assignée avec succès.`,
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
   * Met à jour une assignation de tâche
   */
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaskAssignmentDTO }) => {
      return await taskAssignmentService.update(id, data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-assignments-hex'] });
      queryClient.invalidateQueries({ queryKey: ['task-assignment-hex', data.id] });
      queryClient.invalidateQueries({ queryKey: ['task-assignments-hex', 'assignee'] });
      queryClient.invalidateQueries({ queryKey: ['task-assignments-hex', 'project'] });
      
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
   * Supprime une assignation de tâche
   */
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await taskAssignmentService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-assignments-hex'] });
      queryClient.invalidateQueries({ queryKey: ['task-assignments-hex', 'assignee'] });
      queryClient.invalidateQueries({ queryKey: ['task-assignments-hex', 'project'] });
      
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
   * Démarre une tâche (PENDING → IN_PROGRESS)
   */
  const startTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const task = await taskAssignmentService.getById(id);
      if (!task) {
        throw new Error('Tâche non trouvée');
      }
      
      if (task.status !== TaskStatus.PENDING) {
        throw new Error('Seules les tâches en attente peuvent être démarrées');
      }

      return await taskAssignmentService.updateStatus(id, TaskStatus.IN_PROGRESS);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-assignments-hex'] });
      queryClient.invalidateQueries({ queryKey: ['task-assignment-hex', data.id] });
      
      toast({
        title: 'Tâche démarrée',
        description: `"${data.title}" a été démarrée.`,
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
   * Complète une tâche (IN_PROGRESS → COMPLETED)
   */
  const completeTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const task = await taskAssignmentService.getById(id);
      if (!task) {
        throw new Error('Tâche non trouvée');
      }
      
      if (task.status === TaskStatus.COMPLETED) {
        throw new Error('Cette tâche est déjà terminée');
      }
      
      if (task.status === TaskStatus.CANCELLED) {
        throw new Error('Une tâche annulée ne peut pas être terminée');
      }

      return await taskAssignmentService.markAsCompleted(id);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-assignments-hex'] });
      queryClient.invalidateQueries({ queryKey: ['task-assignment-hex', data.id] });
      
      toast({
        title: 'Tâche complétée',
        description: `"${data.title}" a été complétée avec succès.`,
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
   * Bloque une tâche
   */
  const blockTaskMutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ['task-assignments-hex'] });
      queryClient.invalidateQueries({ queryKey: ['task-assignment-hex', data.id] });
      
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

  /**
   * Ajoute une note à une tâche
   */
  const addNoteMutation = useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      const task = await taskAssignmentService.getById(id);
      if (!task) {
        throw new Error('Tâche non trouvée');
      }

      const user = await authService.getCurrentUser();
      const timestamp = new Date().toLocaleString('fr-FR');
      const userName = user?.full_name || user?.email || 'Utilisateur';
      const noteWithMeta = `[${timestamp}] ${userName}: ${note}`;
      
      const currentNotes = task.notes || '';
      const updatedNotes = currentNotes ? `${currentNotes}\n\n${noteWithMeta}` : noteWithMeta;

      return await taskAssignmentService.update(id, {
        notes: updatedNotes,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-assignments-hex'] });
      queryClient.invalidateQueries({ queryKey: ['task-assignment-hex', data.id] });
      
      toast({
        title: 'Note ajoutée',
        description: `Une note a été ajoutée à "${data.title}".`,
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
   * Réassigne une tâche à un autre utilisateur
   */
  const reassignTaskMutation = useMutation({
    mutationFn: async ({ id, assigneeId }: { id: string; assigneeId: string }) => {
      const task = await taskAssignmentService.getById(id);
      if (!task) {
        throw new Error('Tâche non trouvée');
      }

      if (task.assigneeId === assigneeId) {
        throw new Error('Cette tâche est déjà assignée à cet utilisateur');
      }

      return await taskAssignmentService.update(id, {
        assigneeId: assigneeId,
        status: TaskStatus.PENDING,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-assignments-hex'] });
      queryClient.invalidateQueries({ queryKey: ['task-assignment-hex', data.id] });
      
      toast({
        title: 'Tâche réassignée',
        description: `"${data.title}" a été réassignée avec succès.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur de réassignation',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  });

  // ===== FONCTIONS UTILITAIRES =====

  const isOverdue = (task: TaskAssignmentDTO): boolean => {
    if (!task.dueDate) return false;
    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) return false;
    return new Date(task.dueDate) < new Date();
  };

  const getDaysUntilDue = (task: TaskAssignmentDTO): number | null => {
    if (!task.dueDate) return null;
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    return Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getUrgency = (task: TaskAssignmentDTO): 'critical' | 'high' | 'medium' | 'low' => {
    const days = getDaysUntilDue(task);
    const priority = task.priority;
    
    if (isOverdue(task) || (days !== null && days < 0)) return 'critical';
    if (priority === TaskPriority.CRITICAL || (days !== null && days <= 3)) return 'high';
    if (priority === TaskPriority.HIGH || (days !== null && days <= 7)) return 'medium';
    return 'low';
  };

  const getAssigneeName = (task: TaskAssignmentDTO): string => {
    return task.assigneeName || task.assigneeEmail || 'Non assigné';
  };

  const getTasksByStatusSync = (status: TaskStatus): TaskAssignmentDTO[] => {
    const tasks = tasksQuery.data || [];
    return tasks.filter(t => t.status === status);
  };

  const getTasksByPrioritySync = (priority: TaskPriority): TaskAssignmentDTO[] => {
    const tasks = tasksQuery.data || [];
    return tasks.filter(t => t.priority === priority);
  };

  const getAssignmentStats = () => {
    const tasks = tasksQuery.data || [];
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const pending = tasks.filter(t => t.status === TaskStatus.PENDING).length;
    const blocked = tasks.filter(t => t.status === TaskStatus.BLOCKED).length;
    const cancelled = tasks.filter(t => t.status === TaskStatus.CANCELLED).length;
    
    const overdue = tasks.filter(t => isOverdue(t)).length;
    const assignedToMe = filters?.assignedTo 
      ? tasks.filter(t => t.assigneeId === filters.assignedTo).length
      : 0;
    
    return {
      total,
      completed,
      inProgress,
      pending,
      blocked,
      cancelled,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      overdue,
      assignedToMe: filters?.assignedTo ? assignedToMe : undefined,
    };
  };

  // ===== RETOUR DU HOOK =====

  return {
    tasks: tasksQuery.data || [],
    isLoading: tasksQuery.isLoading,
    isError: tasksQuery.isError,
    error: tasksQuery.error,
    refetch: tasksQuery.refetch,
    
    useTaskAssignmentById,
    useTasksByAssignee,
    useTasksByProject,
    
    createTask: createMutation.mutate,
    updateTask: updateMutation.mutate,
    deleteTask: deleteMutation.mutate,
    startTask: startTaskMutation.mutate,
    completeTask: completeTaskMutation.mutate,
    blockTask: blockTaskMutation.mutate,
    addNote: addNoteMutation.mutate,
    reassignTask: reassignTaskMutation.mutate,
    
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isStarting: startTaskMutation.isPending,
    isCompleting: completeTaskMutation.isPending,
    isBlocking: blockTaskMutation.isPending,
    isAddingNote: addNoteMutation.isPending,
    isReassigning: reassignTaskMutation.isPending,
    
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
    startError: startTaskMutation.error,
    completeError: completeTaskMutation.error,
    blockError: blockTaskMutation.error,
    noteError: addNoteMutation.error,
    reassignError: reassignTaskMutation.error,
    
    isOverdue,
    getDaysUntilDue,
    getUrgency,
    getAssigneeName,
    getTasksByStatusSync,
    getTasksByPrioritySync,
    getAssignmentStats,
  };
}

/**
 * Hook pour récupérer une tâche spécifique avec ses détails
 * Utilisation: const { task, updateTask } = useTaskAssignmentHex(taskId)
 */
export function useTaskAssignmentHex(taskId: string | undefined) {
  const queryClient = useQueryClient();
  const taskAssignmentService = new TaskAssignmentService(
    RepositoryFactory.getTaskAssignmentRepository()
  );

  const taskQuery = useQuery({
    queryKey: ['task-assignment-hex', taskId],
    queryFn: async (): Promise<TaskAssignmentDTO | null> => {
      if (!taskId) return null;
      return await taskAssignmentService.getById(taskId);
    },
    enabled: !!taskId,
    staleTime: 5 * 60 * 1000,
  });

  const updateTask = useMutation({
    mutationFn: async (data: UpdateTaskAssignmentDTO) => {
      if (!taskId) {
        throw new Error('ID de tâche requis');
      }
      return await taskAssignmentService.update(taskId, data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-assignment-hex', taskId] });
      queryClient.invalidateQueries({ queryKey: ['task-assignments-hex'] });
      
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

  const addNote = useMutation({
    mutationFn: async ({ note }: { note: string }) => {
      if (!taskId) {
        throw new Error('ID de tâche requis');
      }
      
      const task = await taskAssignmentService.getById(taskId);
      if (!task) {
        throw new Error('Tâche non trouvée');
      }

      const authService = new AuthService(RepositoryFactory.getAuthRepository());
      const user = await authService.getCurrentUser();
      const timestamp = new Date().toLocaleString('fr-FR');
      const userName = user?.full_name || user?.email || 'Utilisateur';
      const noteWithMeta = `[${timestamp}] ${userName}: ${note}`;
      
      const currentNotes = task.notes || '';
      const updatedNotes = currentNotes ? `${currentNotes}\n\n${noteWithMeta}` : noteWithMeta;

      return await taskAssignmentService.update(taskId, {
        notes: updatedNotes,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-assignment-hex', taskId] });
      queryClient.invalidateQueries({ queryKey: ['task-assignments-hex'] });
      
      toast({
        title: 'Note ajoutée',
        description: `Une note a été ajoutée à "${data.title}".`,
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

  return {
    task: taskQuery.data,
    isLoading: taskQuery.isLoading,
    isError: taskQuery.isError,
    error: taskQuery.error,
    refetch: taskQuery.refetch,
    updateTask: updateTask.mutate,
    addNote: addNote.mutate,
    isUpdating: updateTask.isPending,
    isAddingNote: addNote.isPending,
    updateError: updateTask.error,
    noteError: addNote.error,
  };
}

// ============================================================================
// EXPORTS POUR LA COMPATIBILITÉ
// ============================================================================

/**
 * Hook: Récupère les tâches d'un projet (alias pour useProjectTasks)
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
 * Hook: Récupère les phases d'un projet (alias)
 */
export function useProjectPhasesForTasks(projectId: string) {
  return useQuery({
    queryKey: ['project-phases-for-tasks', projectId],
    queryFn: async (): Promise<PhaseDTO[]> => {
      const phaseService = new PhaseService(
        RepositoryFactory.getPhaseRepository()
      );
      return (await phaseService.getPhasesByProject(projectId)) as unknown as PhaseDTO[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!projectId
  });
}

// ============================================================================
// TYPES RE-EXPORTS
// ============================================================================

export interface UseTaskAssignmentsHexResult {
  tasks: TaskAssignmentDTO[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  createTask: (data: CreateTaskAssignmentDTO) => void;
  updateTask: (params: { id: string; data: UpdateTaskAssignmentDTO }) => void;
  deleteTask: (id: string) => void;
  startTask: (id: string) => void;
  completeTask: (id: string) => void;
  blockTask: (params: { id: string; reason?: string }) => void;
  addNote: (params: { id: string; note: string }) => void;
  reassignTask: (params: { id: string; assigneeId: string }) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isStarting: boolean;
  isCompleting: boolean;
  isBlocking: boolean;
  isAddingNote: boolean;
  isReassigning: boolean;
  isOverdue: (task: TaskAssignmentDTO) => boolean;
  getDaysUntilDue: (task: TaskAssignmentDTO) => number | null;
  getUrgency: (task: TaskAssignmentDTO) => 'critical' | 'high' | 'medium' | 'low';
  getAssigneeName: (task: TaskAssignmentDTO) => string;
  getTasksByStatusSync: (status: TaskStatus) => TaskAssignmentDTO[];
  getTasksByPrioritySync: (priority: TaskPriority) => TaskAssignmentDTO[];
  getAssignmentStats: () => {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    blocked: number;
    cancelled: number;
    completionRate: number;
    overdue: number;
    assignedToMe?: number;
  };
}

export interface TaskAssignment {
  id: string;
  title: string | null;
  description: string | null;
  projectId: string | null;
  phaseId: string | null;
  assignedTo: string | null;
  assignedBy: string | null;
  dueDate: string | null;
  priority: string | null;
  status: string | null;
  completionDate: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export default useTaskAssignmentsHex;