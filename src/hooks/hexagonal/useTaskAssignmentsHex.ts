/**
 * Hexagonal Hook for Task Assignments
 * Uses task_assignments table for proper task management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { TaskService } from '@/application/services/TaskService';
import { AuthService } from '@/application/services/AuthService';
import { toast } from "sonner";

export interface TaskAssignment {
  id: string;
  title: string;
  description: string | null;
  assignedTo: string | null;
  assignedBy: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "cancelled";
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
  priority?: "low" | "medium" | "high" | "urgent";
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  dueDate?: string;
  projectId?: string;
  notes?: string;
}

interface UpdateTaskAssignmentInput extends Partial<CreateTaskAssignmentInput> {
  completionDate?: string;
}

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
      // Use TaskService - placeholder implementation
      const allTasks = await taskService.getTasksByFilters(filters);
      
      return allTasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        assigned_to: task.assignedTo?.[0] || null,
        assignedTo: task.assignedTo?.[0] || null,
        assignee_name: '',
        assignedBy: task.assignedBy || null,
        priority: task.priority as TaskAssignment["priority"],
        status: task.status as TaskAssignment["status"],
        due_date: task.dueDate,
        dueDate: task.dueDate,
        completionDate: task.completedAt,
        notes: task.description,
        project_id: task.projectId,
        projectId: task.projectId,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }));
    }
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateTaskAssignmentInput) => {
      try {
        const user = await authService.getCurrentUser();
        
        // Use TaskService - placeholder implementation
        return await taskService.createTask({
          title: input.title,
          description: input.description,
          assignedTo: input.assignedTo ? [input.assignedTo] : [],
          assignedBy: user?.id || "",
          priority: input.priority || "medium",
          status: input.status || "pending",
          dueDate: input.dueDate,
          projectId: input.projectId,
          notes: input.notes,
        });
        
      } catch (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-assignments-hex"] });
      toast.success("Tâche créée avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      ...input
    }: UpdateTaskAssignmentInput & { id: string }) => {
      // Use TaskService - placeholder implementation
      const updateData = {
        updatedAt: new Date().toISOString(),
        title: input.title,
        description: input.description,
        assignedTo: input.assignedTo ? [input.assignedTo] : [],
        priority: input.priority,
        status: input.status,
        dueDate: input.dueDate,
        projectId: input.projectId,
        notes: input.notes,
        completedAt: input.completionDate
      };

      return await taskService.updateTask(id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-assignments-hex"] });
      toast.success("Tâche mise à jour");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Use TaskService - placeholder implementation
      return await taskService.deleteTask(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-assignments-hex"] });
      toast.success("Tâche supprimée");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const startTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      // Use TaskService to update task status
      return await taskService.updateTask(id, {
        status: 'in_progress',
        updatedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-assignments-hex"] });
      toast.success("Tâche démarrée");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      // Use TaskService to complete task
      return await taskService.updateTask(id, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-assignments-hex"] });
      toast.success("Tâche complétée");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      // Get current task to append note
      const currentTask = await taskService.getTaskById(id);
      if (!currentTask) throw new Error('Task not found');

      const user = await authService.getCurrentUser();
      const timestamp = new Date().toLocaleString("fr-FR");
      const noteWithMeta = `[${timestamp}] ${user?.email || "Utilisateur"}: ${note}`;

      const currentNotes = currentTask.description || '';
      const updatedNotes = currentNotes
        ? `${currentNotes}\n\n${noteWithMeta}`
        : noteWithMeta;

      // Update task with new note
      return await taskService.updateTask(id, {
        description: updatedNotes,
        updatedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-assignments-hex"] });
      toast.success("Note ajoutée");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
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
      
      // Use TaskService - placeholder implementation
      const taskData = await taskService.getTaskById(id);
      if (!taskData) return null;
      
      return {
        id: taskData.id,
        title: taskData.title,
        description: taskData.description,
        assignedTo: taskData.assignedTo?.[0] || null,
        assignedBy: taskData.assignedBy || null,
        priority: taskData.priority as TaskAssignment["priority"],
        status: taskData.status as TaskAssignment["status"],
        dueDate: taskData.dueDate,
        completionDate: taskData.completedAt,
        notes: taskData.description,
        projectId: taskData.projectId,
        createdAt: taskData.createdAt,
        updatedAt: taskData.updatedAt,
      } as TaskAssignment;
    },
    enabled: !!id,
  });

  const updateTask = async (input: UpdateTaskAssignmentInput) => {
    if (!id) return;
    
    // Use TaskService - placeholder implementation
    const updateData = {
      updatedAt: new Date().toISOString(),
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: input.status,
      dueDate: input.dueDate,
      notes: input.notes,
      completedAt: input.completionDate
    };

    await taskService.updateTask(id, updateData);
    
    queryClient.invalidateQueries({ queryKey: ["task-assignment-hex", id] });
    queryClient.invalidateQueries({ queryKey: ["task-assignments-hex"] });
    
    toast.success("Tâche mise à jour");
  };

  return { task, isLoading, error, refetch, updateTask };
}
