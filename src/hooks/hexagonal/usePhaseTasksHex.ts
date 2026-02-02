// hooks/hexagonal/usePhaseTasksHex.ts - Hexagonal hook for phase tasks management

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useAuthUserHex } from './useAuthUserHex';
import { TaskService } from '@/application/services/TaskService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { TaskDTO, CreateTaskDTO, UpdateTaskDTO } from '@/dtos/entities/TaskDTO';
import { Task } from '@/domain/entities/Task';

export interface PhaseTask {
  id: string;
  phase_id: string | null;
  assigned_to: string | null;
  title: string;
  description?: string | null;
  priority: string | null;
  status: string | null;
  due_date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  progress?: number | null;
  created_at: string | null;
  notes?: string | null;
  assignee_name?: string | null;
  assignee_email?: string | null;
  assignee_type?: string | null;
}

export interface TaskFormData {
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  due_date?: string;
  start_date?: string;
  assigned_to?: string;
  assignee_name?: string;
  assignee_email?: string;
  assignee_type?: string;
  notes?: string;
}

interface TaskDetails {
  startDate?: string | null;
  endDate?: string | null;
  progress?: number | null;
  notes?: string | null;
}

const toPhaseTask = (task: TaskDTO): Task => Task.create({
  id: task.id,
  projectId: task.projectId,
  phaseId: task.phaseId || undefined,
  title: task.title,
  description: task.description || undefined,
  status: task.status as TaskStatus,
  priority: task.priority as TaskPriority,
  progress: task.progress || 0,
  startDate: task.startDate || undefined,
  endDate: task.endDate || undefined,
  estimatedDuration: task.estimatedDuration || undefined
});

export const usePhaseTasksHex = (phaseId: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuthUserHex();
  const taskService = new TaskService(RepositoryFactory.getTaskRepository());

  // Fetch phase tasks
  const {
    data: tasks = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['phase-tasks-hex', phaseId],
    queryFn: async (): Promise<Task[]> => {
      try {
        console.info('USE_PHASE_TASKS_HEX_001: Fetching phase tasks', {
          code: 'USE_PHASE_TASKS_HEX_001',
          message: 'Début de la récupération des tâches de phase',
          phaseId,
          stack: new Error().stack
        });

        const tasksData = await taskService.getTasksByPhase(phaseId);

        console.info('USE_PHASE_TASKS_HEX_002: Phase tasks fetched successfully', {
          code: 'USE_PHASE_TASKS_HEX_002',
          message: 'Tâches de phase récupérées avec succès',
          phaseId,
          tasksCount: tasksData.length,
          stack: new Error().stack
        });

        // Transform TaskDTO to PhaseTask interface
        return tasksData.map(toPhaseTask);
      } catch (error) {
        console.error('USE_PHASE_TASKS_HEX_003: Failed to fetch phase tasks', {
          code: 'USE_PHASE_TASKS_HEX_003',
          message: 'Échec de la récupération des tâches de phase',
          phaseId,
          technicalError: error,
          stack: new Error().stack
        });
        throw error;
      }
    },
    enabled: !!phaseId
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: TaskFormData): Promise<Task> => {
      try {
        console.info('USE_PHASE_TASKS_HEX_004: Creating task', {
          code: 'USE_PHASE_TASKS_HEX_004',
          message: 'Début de la création de tâche',
          phaseId,
          taskTitle: taskData.title,
          stack: new Error().stack
        });

        const createTaskDto: CreateTaskDTO = {
          title: taskData.title,
          description: taskData.description || '',
          priority: (taskData.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
          status: (taskData.status as 'not_started' | 'in_progress' | 'completed' | 'delayed') || 'not_started',
          progress: 0,
          startDate: '',
          endDate: '',
          estimatedDuration: 0,
          costEstimate: 0,
          phaseId: phaseId,
          assignedTo: taskData.assigned_to ? [taskData.assigned_to] : [],
          dueDate: taskData.due_date
        };

        const createdTask = await taskService.createTask(createTaskDto);

        console.info('USE_PHASE_TASKS_HEX_005: Task created successfully', {
          code: 'USE_PHASE_TASKS_HEX_005',
          message: 'Tâche créée avec succès',
          taskId: createdTask.id,
          taskTitle: createdTask.title,
          stack: new Error().stack
        });

        // Transform TaskDTO to PhaseTask interface
        return toPhaseTask(createdTask);
      } catch (error) {
        console.error('USE_PHASE_TASKS_HEX_006: Failed to create task', {
          code: 'USE_PHASE_TASKS_HEX_006',
          message: 'Échec de la création de tâche',
          phaseId,
          taskTitle: taskData.title,
          technicalError: error,
          stack: new Error().stack
        });
        throw error;
      }
    },
    onSuccess: (newTask) => {
      console.info('USE_PHASE_TASKS_HEX_007: Task creation mutation success', {
        code: 'USE_PHASE_TASKS_HEX_007',
        message: 'Mutation de création de tâche réussie',
        taskId: newTask.id,
        taskTitle: newTask.title,
        stack: new Error().stack
      });

      queryClient.invalidateQueries({ queryKey: ['phase-tasks-hex', phaseId] });
      toast({
        title: 'Succès',
        description: `Tâche "${newTask.title}" créée avec succès`
      });
    },
    onError: (error: Error, variables) => {
      console.error('USE_PHASE_TASKS_HEX_008: Task creation mutation error', {
        code: 'USE_PHASE_TASKS_HEX_008',
        message: 'Erreur dans la mutation de création de tâche',
        taskTitle: variables.title,
        technicalError: error,
        stack: new Error().stack
      });

      toast({
        title: 'Erreur de création',
        description: `Impossible de créer la tâche "${variables.title}"`,
        variant: 'destructive'
      });
    }
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TaskFormData }): Promise<Task> => {
      try {
        console.info('USE_PHASE_TASKS_HEX_009: Updating task', {
          code: 'USE_PHASE_TASKS_HEX_009',
          message: 'Début de la mise à jour de tâche',
          taskId: id,
          taskTitle: data.title,
          stack: new Error().stack
        });

        const updateTaskDto: UpdateTaskDTO = {
          title: data.title,
          description: data.description,
          priority: data.priority as 'low' | 'medium' | 'high' | 'urgent',
          status: data.status as 'not_started' | 'in_progress' | 'completed' | 'delayed',
          phaseId: phaseId,
          assignedTo: data.assigned_to ? [data.assigned_to] : [],
          dueDate: data.due_date
        };

        const updatedTask = await taskService.updateTask(id, updateTaskDto);

        console.info('USE_PHASE_TASKS_HEX_010: Task updated successfully', {
          code: 'USE_PHASE_TASKS_HEX_010',
          message: 'Tâche mise à jour avec succès',
          taskId: id,
          taskTitle: updatedTask.title,
          stack: new Error().stack
        });

        // Transform TaskDTO to PhaseTask interface
        return toPhaseTask(updatedTask);
      } catch (error) {
        console.error('USE_PHASE_TASKS_HEX_011: Failed to update task', {
          code: 'USE_PHASE_TASKS_HEX_011',
          message: 'Échec de la mise à jour de tâche',
          taskId: id,
          taskTitle: data.title,
          technicalError: error,
          stack: new Error().stack
        });
        throw error;
      }
    },
    onSuccess: (updatedTask) => {
      console.info('USE_PHASE_TASKS_HEX_012: Task update mutation success', {
        code: 'USE_PHASE_TASKS_HEX_012',
        message: 'Mutation de mise à jour de tâche réussie',
        taskId: updatedTask.id,
        taskTitle: updatedTask.title,
        stack: new Error().stack
      });

      queryClient.invalidateQueries({ queryKey: ['phase-tasks-hex', phaseId] });
      toast({
        title: 'Succès',
        description: `Tâche "${updatedTask.title}" mise à jour avec succès`
      });
    },
    onError: (error: Error, variables) => {
      console.error('USE_PHASE_TASKS_HEX_013: Task update mutation error', {
        code: 'USE_PHASE_TASKS_HEX_013',
        message: 'Erreur dans la mutation de mise à jour de tâche',
        taskId: variables.id,
        taskTitle: variables.data.title,
        technicalError: error,
        stack: new Error().stack
      });

      toast({
        title: 'Erreur de mise à jour',
        description: `Impossible de mettre à jour la tâche "${variables.data.title}"`,
        variant: 'destructive'
      });
    }
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string): Promise<void> => {
      try {
        console.info('USE_PHASE_TASKS_HEX_014: Deleting task', {
          code: 'USE_PHASE_TASKS_HEX_014',
          message: 'Début de la suppression de tâche',
          taskId,
          stack: new Error().stack
        });

        await taskService.deleteTask(taskId);

        console.info('USE_PHASE_TASKS_HEX_015: Task deleted successfully', {
          code: 'USE_PHASE_TASKS_HEX_015',
          message: 'Tâche supprimée avec succès',
          taskId,
          stack: new Error().stack
        });
      } catch (error) {
        console.error('USE_PHASE_TASKS_HEX_016: Failed to delete task', {
          code: 'USE_PHASE_TASKS_HEX_016',
          message: 'Échec de la suppression de tâche',
          taskId,
          technicalError: error,
          stack: new Error().stack
        });
        throw error;
      }
    },
    onSuccess: (_, taskId) => {
      console.info('USE_PHASE_TASKS_HEX_017: Task deletion mutation success', {
        code: 'USE_PHASE_TASKS_HEX_017',
        message: 'Mutation de suppression de tâche réussie',
        taskId,
        stack: new Error().stack
      });

      queryClient.invalidateQueries({ queryKey: ['phase-tasks-hex', phaseId] });
      toast({
        title: 'Succès',
        description: 'Tâche supprimée avec succès'
      });
    },
    onError: (error: Error, taskId) => {
      console.error('USE_PHASE_TASKS_HEX_018: Task deletion mutation error', {
        code: 'USE_PHASE_TASKS_HEX_018',
        message: 'Erreur dans la mutation de suppression de tâche',
        taskId,
        technicalError: error,
        stack: new Error().stack
      });

      toast({
        title: 'Erreur de suppression',
        description: 'Impossible de supprimer la tâche',
        variant: 'destructive'
      });
    }
  });

  return {
    tasks,
    isLoading,
    error,
    refetch,
    createTask: createTaskMutation.mutateAsync,
    updateTask: updateTaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending
  };
};
