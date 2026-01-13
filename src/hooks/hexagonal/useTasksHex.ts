import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  assignedTo: string | null;
  assigneeName: string | null;
  projectId: string | null;
  projectTitle: string | null;
  phaseId: string | null;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CreateTaskInput {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  projectId?: string;
  phaseId?: string;
  dueDate?: string;
}

interface UpdateTaskInput extends Partial<CreateTaskInput> {
  completedAt?: string;
}

export function useTasksHex(filters?: { projectId?: string; assignedTo?: string; status?: string }) {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ["tasks-hex", filters],
    queryFn: async () => {
      // Using documents table with document_type = 'task_assignment' for tasks
      let query = supabase
        .from("documents")
        .select(`
          id,
          title,
          description,
          status,
          assigned_to,
          project_id,
          phase_id,
          deadline_date,
          created_at,
          updated_at,
          project:projects(title)
        `)
        .eq("document_type", "task_assignment");

      if (filters?.projectId) {
        query = query.eq("project_id", filters.projectId);
      }
      if (filters?.assignedTo) {
        query = query.eq("assigned_to", filters.assignedTo);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status as "approved" | "archived" | "draft" | "pending_review" | "rejected");
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status || "pending_review",
        priority: null,
        assignedTo: row.assigned_to,
        assigneeName: null,
        projectId: row.project_id,
        projectTitle: row.project?.title || null,
        phaseId: row.phase_id,
        dueDate: row.deadline_date,
        completedAt: null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const { data, error } = await supabase
        .from("documents")
        .insert({
          title: input.title,
          description: input.description,
          status: (input.status || "pending_review") as "pending_review",
          document_type: "task_assignment" as const,
          assigned_to: input.assignedTo,
          project_id: input.projectId,
          phase_id: input.phaseId,
          deadline_date: input.dueDate,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks-hex"] });
      toast.success("Tâche créée avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: UpdateTaskInput & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.assignedTo !== undefined) updateData.assigned_to = input.assignedTo;
      if (input.projectId !== undefined) updateData.project_id = input.projectId;
      if (input.phaseId !== undefined) updateData.phase_id = input.phaseId;
      if (input.dueDate !== undefined) updateData.deadline_date = input.dueDate;

      const { data, error } = await supabase
        .from("documents")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks-hex"] });
      toast.success("Tâche mise à jour");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks-hex"] });
      toast.success("Tâche supprimée");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("documents")
        .update({ status: "approved" as const })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks-hex"] });
      toast.success("Tâche complétée");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return {
    tasks,
    isLoading,
    error,
    createTask: createMutation.mutateAsync,
    updateTask: updateMutation.mutateAsync,
    deleteTask: deleteMutation.mutateAsync,
    completeTask: completeTaskMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useTaskHex(id: string | undefined) {
  const { data: task, isLoading, error } = useQuery({
    queryKey: ["task-hex", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("documents")
        .select(`
          *,
          project:projects(title)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        status: data.status || "pending_review",
        priority: null,
        assignedTo: data.assigned_to,
        assigneeName: null,
        projectId: data.project_id,
        projectTitle: data.project?.title || null,
        phaseId: data.phase_id,
        dueDate: data.deadline_date,
        completedAt: null,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    },
    enabled: !!id,
  });

  return { task, isLoading, error };
}

// ============= Task Assignments hooks for TaskAssignments component =============

import type { Database } from '@/integrations/supabase/types';
type TaskAssignment = Database['public']['Tables']['task_assignments']['Row'];

export interface TaskAssignmentFilters {
  searchTerm?: string;
  status?: string;
  priority?: string;
  assignee?: string;
}

export interface TaskAssignmentFormData {
  title: string;
  description: string;
  project_id: string;
  assigned_to: string;
  assignee_type: 'supplier' | 'employee' | 'user' | '';
  assignee_name: string;
  assignee_email: string;
  due_date: string;
  priority: string;
  status: string;
  notes: string;
}

// Hook: Fetch task assignments with filters
export function useTaskAssignments(filters: TaskAssignmentFilters = {}) {
  return useQuery({
    queryKey: ['task_assignments', filters.searchTerm, filters.status, filters.priority, filters.assignee],
    queryFn: async (): Promise<TaskAssignment[]> => {
      let query = supabase
        .from('task_assignments')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.searchTerm) {
        query = query.or(
          `title.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%,assignee_name.ilike.%${filters.searchTerm}%`
        );
      }
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }
      if (filters.assignee && filters.assignee !== 'all') {
        query = query.eq('assigned_to', filters.assignee);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown as TaskAssignment[]) || [];
    }
  });
}

// Hook: Fetch projects for task assignment
export function useProjectsForTaskAssignments() {
  return useQuery({
    queryKey: ['projects_for_tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title')
        .order('title');
      if (error) throw error;
      return data || [];
    }
  });
}

// Hook: Fetch assignee details
export function useAssigneeDetails(assigneeId: string | null) {
  return useQuery({
    queryKey: ['assignee-details', assigneeId],
    queryFn: async () => {
      if (!assigneeId) return null;

      // Try employees first
      const { data: employeeData } = await supabase
        .from('employees')
        .select('full_name, email')
        .eq('id', assigneeId)
        .maybeSingle();

      if (employeeData) {
        return {
          type: 'employee' as const,
          name: employeeData.full_name,
          email: employeeData.email || ''
        };
      }

      // Try suppliers
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('name, email, contact_person')
        .eq('id', assigneeId)
        .maybeSingle();

      if (supplierData) {
        return {
          type: 'supplier' as const,
          name: supplierData.contact_person || supplierData.name,
          email: supplierData.email || ''
        };
      }

      // Try profiles
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', assigneeId)
        .maybeSingle();

      if (profileData) {
        return {
          type: 'user' as const,
          name: profileData.full_name || 'Utilisateur',
          email: ''
        };
      }

      return null;
    },
    enabled: !!assigneeId
  });
}

// Hook: Create task assignment mutation
export function useCreateTaskAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskData, userId }: { taskData: TaskAssignmentFormData; userId?: string }) => {
      const insertData: any = {
        title: taskData.title,
        description: taskData.description,
        project_id: taskData.project_id || null,
        assignee_type: taskData.assignee_type || null,
        assignee_name: taskData.assignee_name || null,
        assignee_email: taskData.assignee_email || null,
        assigned_to: taskData.assigned_to || null,
        assigned_by: userId || null,
        due_date: taskData.due_date || null,
        priority: taskData.priority,
        status: taskData.status,
        notes: taskData.notes || null
      };

      const { data, error } = await supabase
        .from('task_assignments')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_assignments'] });
    }
  });
}

// Hook: Update task assignment mutation
export function useUpdateTaskAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TaskAssignmentFormData }) => {
      const updateData: any = {
        title: data.title,
        description: data.description,
        project_id: data.project_id || null,
        assignee_type: data.assignee_type || null,
        assignee_name: data.assignee_name || null,
        assignee_email: data.assignee_email || null,
        assigned_to: data.assigned_to || null,
        due_date: data.due_date || null,
        priority: data.priority,
        status: data.status,
        notes: data.notes || null
      };

      const { error } = await supabase
        .from('task_assignments')
        .update(updateData)
        .eq('id', id as any);

      if (error) throw error;
      return { id, status: data.status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_assignments'] });
    }
  });
}

// Hook: Delete task assignment mutation
export function useDeleteTaskAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('task_assignments')
        .delete()
        .eq('id', id as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_assignments'] });
    }
  });
}
