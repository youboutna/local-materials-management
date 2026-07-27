// hooks/hexagonal/usePhaseTasksHex.ts - Hexagonal hook for phase tasks management

import {
    CreateTaskDTO as ServiceCreateTaskDTO,
    TaskDTO as ServiceTaskDTO,
    TaskPriority as ServiceTaskPriority,
    TaskStatus as ServiceTaskStatus,
    UpdateTaskDTO as ServiceUpdateTaskDTO,
    TaskService
} from '@/application/services/TaskService';
import { toast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthUserHex } from './useAuthUserHex';

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

const toPhaseTask = (task: ServiceTaskDTO): PhaseTask => ({
  id: task.id,
  phase_id: task.phaseId || null,
  assigned_to: task.assignedTo?.[0] || null,
  title: task.title,
  description: task.description,
  priority: task.priority,
  status: task.status,
  due_date: task.dueDate,
  start_date: null,
  end_date: null,
  progress: null,
  created_at: task.createdAt,
  notes: null,
  assignee_name: null,
  assignee_email: null,
  assignee_type: null,
});

export const usePhaseTasksHex = (phaseId: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuthUserHex();
  const taskService = new TaskService(RepositoryFactory.getTaskRepository());

  const {
    data: tasks = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['phase-tasks-hex', phaseId],
    queryFn: async (): Promise<PhaseTask[]> => {
      const tasksData = await taskService.getTasksByPhase(phaseId);
      return tasksData.map(toPhaseTask);
    },
    enabled: !!phaseId
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: TaskFormData): Promise<PhaseTask> => {
      const createTaskDto: ServiceCreateTaskDTO = {
        title: taskData.title,
        description: taskData.description || '',
        priority: (taskData.priority as ServiceTaskPriority) || ServiceTaskPriority.MEDIUM,
        status: (taskData.status as ServiceTaskStatus) || ServiceTaskStatus.PENDING,
        phaseId: phaseId,
        assignedTo: taskData.assigned_to ? [taskData.assigned_to] : [],
        dueDate: taskData.due_date
      };

      const createdTask = await taskService.createTask(createTaskDto);
      return toPhaseTask(createdTask);
    },
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: ['phase-tasks-hex', phaseId] });
      toast({ title: 'Succès', description: `Tâche "${newTask.title}" créée avec succès` });
    },
    onError: (error: Error, variables) => {
      toast({ title: 'Erreur de création', description: `Impossible de créer la tâche "${variables.title}"`, variant: 'destructive' });
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TaskFormData }): Promise<PhaseTask> => {
      const updateTaskDto: ServiceUpdateTaskDTO = {
        title: data.title,
        description: data.description,
        priority: data.priority as ServiceTaskPriority,
        status: data.status as ServiceTaskStatus,
        phaseId: phaseId,
        assignedTo: data.assigned_to ? [data.assigned_to] : [],
        dueDate: data.due_date
      };

      const updatedTask = await taskService.updateTask(id, updateTaskDto);
      return toPhaseTask(updatedTask);
    },
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ['phase-tasks-hex', phaseId] });
      toast({ title: 'Succès', description: `Tâche "${updatedTask.title}" mise à jour avec succès` });
    },
    onError: (error: Error, variables) => {
      toast({ title: 'Erreur de mise à jour', description: `Impossible de mettre à jour la tâche "${variables.data.title}"`, variant: 'destructive' });
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string): Promise<void> => {
      await taskService.deleteTask(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-tasks-hex', phaseId] });
      toast({ title: 'Succès', description: 'Tâche supprimée avec succès' });
    },
    onError: () => {
      toast({ title: 'Erreur de suppression', description: 'Impossible de supprimer la tâche', variant: 'destructive' });
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
