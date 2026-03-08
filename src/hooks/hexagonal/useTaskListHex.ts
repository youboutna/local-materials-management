import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { TaskService, TaskStatus, TaskPriority, CreateTaskDTO, UpdateTaskDTO } from '@/application/services/TaskService';
import { AuthService } from '@/application/services/AuthService';
import { toast } from '@/hooks/use-toast';

export interface TaskAssignment {
  id: string;
  title: string | null;
  description: string | null;
  project_id: string | null;
  phase_id: string | null;
  assigned_to: string | null;
  assigned_by: string | null;
  due_date: string | null;
  priority: string | null;
  status: string | null;
  completion_date: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface TaskFormData {
  title: string;
  description: string;
  phase_id: string;
  assigned_to: string;
  due_date: string;
  priority: string;
  status: string;
  notes: string;
}

interface ProjectPhase {
  id: string;
  phase_name: string;
  status: string;
}

const toPriority = (p: string): TaskPriority | undefined => {
  const map: Record<string, TaskPriority> = { low: TaskPriority.LOW, medium: TaskPriority.MEDIUM, high: TaskPriority.HIGH };
  return map[p];
};

const toStatus = (s: string): TaskStatus | undefined => {
  const map: Record<string, TaskStatus> = { pending: TaskStatus.PENDING, in_progress: TaskStatus.IN_PROGRESS, completed: TaskStatus.COMPLETED, cancelled: TaskStatus.CANCELLED };
  return map[s];
};

export function useTaskListHex(projectId: string) {
  const queryClient = useQueryClient();
  const taskService = new TaskService(RepositoryFactory.getTaskRepository());
  const authService = new AuthService(RepositoryFactory.getAuthRepository());

  // Fetch project phases - placeholder since ProjectService doesn't have getProjectPhases
  const phasesQuery = useQuery({
    queryKey: ['project-phases', projectId],
    queryFn: async (): Promise<ProjectPhase[]> => {
      return [];
    }
  });

  // Fetch tasks
  const tasksQuery = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: async (): Promise<TaskAssignment[]> => {
      const tasks = await taskService.getProjectTasks(projectId);
      return tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || null,
        project_id: task.projectId || null,
        phase_id: task.phaseId || null,
        assigned_to: task.assignedTo?.[0] || null,
        assigned_by: null,
        due_date: task.dueDate || null,
        priority: String(task.priority),
        status: String(task.status),
        completion_date: null,
        notes: task.description || null,
        created_at: task.createdAt,
        updated_at: task.updatedAt
      }));
    },
    enabled: !!projectId,
  });

  // Create task mutation
  const createMutation = useMutation({
    mutationFn: async (taskData: TaskFormData) => {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const createData: CreateTaskDTO = {
        title: taskData.title,
        description: taskData.description,
        projectId: projectId,
        phaseId: taskData.phase_id,
        assignedTo: taskData.assigned_to ? [taskData.assigned_to] : [],
        dueDate: taskData.due_date,
        priority: toPriority(taskData.priority),
        status: toStatus(taskData.status),
      };

      return await taskService.createTask(createData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      toast({ title: 'Tâche créée avec succès' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  // Update task mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TaskFormData> }) => {
      const updateData: UpdateTaskDTO = {
        title: data.title,
        description: data.description,
        phaseId: data.phase_id,
        assignedTo: data.assigned_to ? [data.assigned_to] : undefined,
        dueDate: data.due_date,
        priority: data.priority ? toPriority(data.priority) : undefined,
        status: data.status ? toStatus(data.status) : undefined,
      };
      return await taskService.updateTask(id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      toast({ title: 'Tâche mise à jour avec succès' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await taskService.deleteTask(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      toast({ title: 'Tâche supprimée avec succès' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  return {
    phases: phasesQuery.data || [],
    tasks: tasksQuery.data || [],
    isLoading: tasksQuery.isLoading || phasesQuery.isLoading,
    isError: tasksQuery.isError || phasesQuery.isError,
    createTask: createMutation.mutate,
    updateTask: updateMutation.mutate,
    deleteTask: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
