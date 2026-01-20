import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { TaskService } from '@/application/services/TaskService';
import { ProjectService } from '@/application/services/ProjectService';
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

export function useTaskListHex(projectId: string) {
  const queryClient = useQueryClient();
  const taskService = new TaskService(RepositoryFactory.getTaskRepository());
  const projectService = new ProjectService(RepositoryFactory.getProjectRepository());
  const authService = new AuthService(RepositoryFactory.getAuthRepository());

  // Fetch project phases
  const phasesQuery = useQuery({
    queryKey: ['project-phases', projectId],
    queryFn: async (): Promise<ProjectPhase[]> => {
      // This would use ProjectService - placeholder implementation
      const phases = await projectService.getProjectPhases(projectId);
      return phases.map(phase => ({
        id: phase.id,
        phase_name: phase.name || 'Unnamed Phase',
        status: phase.status
      }));
    }
  });

  // Fetch tasks
  const tasksQuery = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: async (): Promise<TaskAssignment[]> => {
      // This would use TaskService - placeholder implementation
      const tasks = await taskService.getTasksByProject(projectId);
      return tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        project_id: task.projectId,
        phase_id: task.phaseId,
        assigned_to: task.assignedTo?.[0] || null,
        assigned_by: task.assignedBy || null,
        due_date: task.dueDate,
        priority: task.priority,
        status: task.status,
        completion_date: task.completedAt,
        notes: task.description,
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

      // This would use TaskService - placeholder implementation
      return await taskService.createTask({
        title: taskData.title,
        description: taskData.description,
        projectId: projectId,
        phaseId: taskData.phase_id,
        assignedTo: taskData.assigned_to ? [taskData.assigned_to] : [],
        dueDate: taskData.due_date,
        priority: taskData.priority,
        status: taskData.status,
        notes: taskData.notes,
        assignedBy: user.id
      });
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
      const { error } = await supabase
        .from('task_assignments')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
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
      const { error } = await supabase
        .from('task_assignments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
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
    // Queries
    phases: phasesQuery.data || [],
    tasks: tasksQuery.data || [],
    isLoading: tasksQuery.isLoading || phasesQuery.isLoading,
    isError: tasksQuery.isError || phasesQuery.isError,
    
    // Mutations
    createTask: createMutation.mutate,
    updateTask: updateMutation.mutate,
    deleteTask: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
