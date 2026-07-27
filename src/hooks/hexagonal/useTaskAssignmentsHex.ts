/**
 * Hexagonal Hook for Task Assignments
 * Uses TaskService for task management
 */

import { AuthService } from '@/application/services/AuthService';
import { CreateTaskDTO, TaskPriority, TaskService, TaskStatus, UpdateTaskDTO } from '@/application/services/TaskService';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface TaskAssignment {
  id: string;
  title: string;
  description: string | null;
  assignedTo: string | null;
  assignedBy: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  completionDate: string | null;
  notes: string | null;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CreateTaskAssignmentInput {
  title: string;
  description?: string;
  assignedTo: string;
  priority?: string;
  status?: string;
  dueDate?: string;
  projectId?: string;
  notes?: string;
}

interface UpdateTaskAssignmentInput extends Partial<CreateTaskAssignmentInput> {
  completionDate?: string;
}

const mapPriority = (p?: string): TaskPriority | undefined => {
  if (!p) return undefined;
  const map: Record<string, TaskPriority> = { low: TaskPriority.LOW, medium: TaskPriority.MEDIUM, high: TaskPriority.HIGH, urgent: TaskPriority.HIGH };
  return map[p] || TaskPriority.MEDIUM;
};

const mapStatus = (s?: string): TaskStatus | undefined => {
  if (!s) return undefined;
  const map: Record<string, TaskStatus> = { pending: TaskStatus.PENDING, in_progress: TaskStatus.IN_PROGRESS, completed: TaskStatus.COMPLETED, cancelled: TaskStatus.CANCELLED };
  return map[s] || TaskStatus.PENDING;
};

export function useTaskAssignmentsHex(filters?: {
  projectId?: string;
  assignedTo?: string;
  status?: string;
}) {
  const queryClient = useQueryClient();
  const taskService = new TaskService(RepositoryFactory.getTaskRepository());
  const authService = new AuthService(RepositoryFactory.getAuthRepository());

  const { data: tasks = [], isLoading, error, refetch } = useQuery({
    queryKey: ["task-assignments-hex", filters],
    queryFn: async () => {
      let allTasks;
      if (filters?.projectId) {
        allTasks = await taskService.getProjectTasks(filters.projectId);
      } else if (filters?.assignedTo) {
        allTasks = await taskService.getTasksByAssignee(filters.assignedTo);
      } else {
        allTasks = await taskService.getAllTasks();
      }
      
      return allTasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || null,
        assigned_to: task.assignedTo?.[0] || null,
        assignedTo: task.assignedTo?.[0] || null,
        assignee_name: '',
        assignedBy: null,
        priority: String(task.priority),
        status: String(task.status),
        due_date: task.dueDate || null,
        dueDate: task.dueDate || null,
        completionDate: null,
        notes: task.description || null,
        project_id: task.projectId || null,
        projectId: task.projectId || null,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }));
    }
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateTaskAssignmentInput) => {
      const user = await authService.getCurrentUser();
      
      const createData: CreateTaskDTO = {
        title: input.title,
        description: input.description,
        assignedTo: input.assignedTo ? [input.assignedTo] : [],
        priority: mapPriority(input.priority),
        status: mapStatus(input.status),
        dueDate: input.dueDate,
        projectId: input.projectId,
      };

      return await taskService.createTask(createData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-assignments-hex"] });
      toast.success("Tâche créée avec succès");
    },
    onError: (error: Error) => { toast.error(`Erreur: ${error.message}`); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: UpdateTaskAssignmentInput & { id: string }) => {
      const updateData: UpdateTaskDTO = {
        title: input.title,
        description: input.description,
        assignedTo: input.assignedTo ? [input.assignedTo] : undefined,
        priority: mapPriority(input.priority),
        status: mapStatus(input.status),
        dueDate: input.dueDate,
        projectId: input.projectId,
      };

      return await taskService.updateTask(id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-assignments-hex"] });
      toast.success("Tâche mise à jour");
    },
    onError: (error: Error) => { toast.error(`Erreur: ${error.message}`); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await taskService.deleteTask(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-assignments-hex"] });
      toast.success("Tâche supprimée");
    },
    onError: (error: Error) => { toast.error(`Erreur: ${error.message}`); },
  });

  const startTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      return await taskService.updateTask(id, { status: TaskStatus.IN_PROGRESS });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-assignments-hex"] });
      toast.success("Tâche démarrée");
    },
    onError: (error: Error) => { toast.error(`Erreur: ${error.message}`); },
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      return await taskService.updateTask(id, { status: TaskStatus.COMPLETED });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-assignments-hex"] });
      toast.success("Tâche complétée");
    },
    onError: (error: Error) => { toast.error(`Erreur: ${error.message}`); },
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      const currentTask = await taskService.getTaskById(id);
      if (!currentTask) throw new Error('Task not found');

      const user = await authService.getCurrentUser();
      const timestamp = new Date().toLocaleString("fr-FR");
      const noteWithMeta = `[${timestamp}] ${user?.email || "Utilisateur"}: ${note}`;
      const currentNotes = currentTask.description || '';
      const updatedNotes = currentNotes ? `${currentNotes}\n\n${noteWithMeta}` : noteWithMeta;

      return await taskService.updateTask(id, { description: updatedNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-assignments-hex"] });
      toast.success("Note ajoutée");
    },
    onError: (error: Error) => { toast.error(`Erreur: ${error.message}`); },
  });

  return {
    tasks,
    isLoading,
    error,
    refetch,
    createTask: createMutation.mutateAsync,
    updateTask: updateMutation.mutateAsync,
    deleteTask: deleteMutation.mutateAsync,
    startTask: startTaskMutation.mutateAsync,
    completeTask: completeTaskMutation.mutateAsync,
    addNote: addNoteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useTaskAssignmentHex(id: string | undefined) {
  const queryClient = useQueryClient();
  const taskService = new TaskService(RepositoryFactory.getTaskRepository());

  const { data: task, isLoading, error, refetch } = useQuery({
    queryKey: ["task-assignment-hex", id],
    queryFn: async () => {
      if (!id) return null;
      const taskData = await taskService.getTaskById(id);
      if (!taskData) return null;
      
      return {
        id: taskData.id,
        title: taskData.title,
        description: taskData.description || null,
        assignedTo: taskData.assignedTo?.[0] || null,
        assignedBy: null,
        priority: String(taskData.priority),
        status: String(taskData.status),
        dueDate: taskData.dueDate || null,
        completionDate: null,
        notes: taskData.description || null,
        projectId: taskData.projectId || null,
        createdAt: taskData.createdAt,
        updatedAt: taskData.updatedAt,
      } as TaskAssignment;
    },
    enabled: !!id,
  });

  const updateTask = async (input: UpdateTaskAssignmentInput) => {
    if (!id) return;
    
    const updateData: UpdateTaskDTO = {
      title: input.title,
      description: input.description,
      priority: mapPriority(input.priority),
      status: mapStatus(input.status),
      dueDate: input.dueDate,
    };

    await taskService.updateTask(id, updateData);
    
    queryClient.invalidateQueries({ queryKey: ["task-assignment-hex", id] });
    queryClient.invalidateQueries({ queryKey: ["task-assignments-hex"] });
    
    toast.success("Tâche mise à jour");
  };

  return { task, isLoading, error, refetch, updateTask };
}
