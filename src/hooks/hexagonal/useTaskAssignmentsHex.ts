/**
 * Hexagonal Hook for Task Assignments
 * Uses task_assignments table for proper task management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from '@/integrations/supabase/client';
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
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

  const { data: tasks = [], isLoading, error, refetch } = useQuery({
    queryKey: ["task-assignments-hex", filters],
    queryFn: async () => {
      const taskRepository = RepositoryFactory.getTaskRepository();
      const allTasks = await taskRepository.findAll();
      
      // Apply filters
      let filteredTasks = allTasks;
      if (filters?.projectId) {
        filteredTasks = filteredTasks.filter(task => task.projectId === filters.projectId);
      }
      if (filters?.assignedTo) {
        filteredTasks = filteredTasks.filter(task => task.assignedTo === filters.assignedTo);
      }
      if (filters?.status) {
        filteredTasks = filteredTasks.filter(task => task.status === filters.status);
      }
      
      return filteredTasks;
        (row): TaskAssignment => ({
          id: row.id,
          title: row.title,
          description: row.description,
          assignedTo: row.assigned_to,
          assignedBy: row.assigned_by,
          priority: (row.priority || "medium") as TaskAssignment["priority"],
          status: (row.status || "pending") as TaskAssignment["status"],
          dueDate: row.due_date,
          completionDate: row.completion_date,
          notes: row.notes,
          projectId: row.project_id,
          createdAt: row.created_at || "",
          updatedAt: row.updated_at || "",
        })
    }
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateTaskAssignmentInput) => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        
        const { data, error } = await taskAssignmentRepository.create({
        title: input.title,
        description: input.description,
        assigned_to: input.assignedTo,
        assigned_by: userData.user?.id || "",
        priority: input.priority || "medium",
        status: input.status || "pending",
        due_date: input.dueDate,
        project_id: input.projectId,
        notes: input.notes,
      });
        
        if (error) throw error;
        return data;
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
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.assignedTo !== undefined) updateData.assigned_to = input.assignedTo;
      if (input.priority !== undefined) updateData.priority = input.priority;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.dueDate !== undefined) updateData.due_date = input.dueDate;
      if (input.projectId !== undefined) updateData.project_id = input.projectId;
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.completionDate !== undefined)
        updateData.completion_date = input.completionDate;

      const { data, error } = await supabase
        .from("task_assignments")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
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
      const { error } = await supabase
        .from("task_assignments")
        .delete()
        .eq("id", id);
      if (error) throw error;
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
      const { data, error } = await supabase
        .from("task_assignments")
        .update({
          status: "in_progress",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
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
      const { data, error } = await supabase
        .from("task_assignments")
        .update({
          status: "completed",
          completion_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
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
      // Get current notes
      const { data: current, error: fetchError } = await supabase
        .from("task_assignments")
        .select("notes")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      const { data: userData } = await supabase.auth.getUser();
      const timestamp = new Date().toLocaleString("fr-FR");
      const noteWithMeta = `[${timestamp}] ${userData.user?.email || "Utilisateur"}: ${note}`;

      const updatedNotes = current.notes
        ? `${current.notes}\n\n${noteWithMeta}`
        : noteWithMeta;

      const taskAssignmentRepository = RepositoryFactory.getTaskAssignmentRepository();
      const { data, error } = await taskAssignmentRepository.create({
        title: input.title,
        description: input.description,
        assigned_to: input.assignedTo,
        assigned_by: userData.user?.id || "",
        priority: input.priority || "medium",
        status: input.status || "pending",
        due_date: input.dueDate,
        project_id: input.projectId,
        notes: updatedNotes,
      });

      if (error) throw error;
      return data;
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

  const { data: task, isLoading, error, refetch } = useQuery({
    queryKey: ["task-assignment-hex", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("task_assignments")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        assignedTo: data.assigned_to,
        assignedBy: data.assigned_by,
        priority: data.priority as TaskAssignment["priority"],
        status: data.status as TaskAssignment["status"],
        dueDate: data.due_date,
        completionDate: data.completion_date,
        notes: data.notes,
        projectId: data.project_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      } as TaskAssignment;
    },
    enabled: !!id,
  });

  const updateTask = async (input: UpdateTaskAssignmentInput) => {
    if (!id) return;
    
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.dueDate !== undefined) updateData.due_date = input.dueDate;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.completionDate !== undefined)
      updateData.completion_date = input.completionDate;

    const { error } = await supabase
      .from("task_assignments")
      .update(updateData)
      .eq("id", id);

    if (error) throw error;
    
    queryClient.invalidateQueries({ queryKey: ["task-assignment-hex", id] });
    queryClient.invalidateQueries({ queryKey: ["task-assignments-hex"] });
    
    toast.success("Tâche mise à jour");
  };

  return { task, isLoading, error, refetch, updateTask };
}

// Export pour compatibilité ascendante
export const useTaskAssignments = useTaskAssignmentsHex;
export const useProjectsForTaskAssignments = useTaskAssignmentsHex;
