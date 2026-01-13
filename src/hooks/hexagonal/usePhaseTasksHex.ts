// hooks/hexagonal/usePhaseTasksHex.ts - Hexagonal hook for phase tasks management

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
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
}

export interface TaskFormData {
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  due_date?: string;
  start_date?: string;
  assigned_to?: string;
}

export const usePhaseTasksHex = (phaseId: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuthUserHex();

  // Fetch phase tasks
  const {
    data: tasks = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['phase-tasks-hex', phaseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_assignments')
        .select('*')
        .eq('phase_id', phaseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PhaseTask[];
    },
    enabled: !!phaseId
  });

  const createMutation = useMutation({
    mutationFn: async (taskData: TaskFormData) => {
      const { data, error } = await supabase
        .from('task_assignments')
        .insert({
          phase_id: phaseId,
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority || 'medium',
          status: taskData.status || 'pending',
          due_date: taskData.due_date,
          start_date: taskData.start_date,
          assigned_to: taskData.assigned_to || user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-tasks-hex', phaseId] });
      toast({
        title: 'Tâche créée',
        description: 'La tâche a été créée avec succès'
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: `Erreur lors de la création: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Update task
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TaskFormData> }) => {
      const { error } = await supabase
        .from('task_assignments')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-tasks-hex', phaseId] });
      toast({
        title: 'Tâche mise à jour',
        description: 'La tâche a été mise à jour avec succès'
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: `Erreur lors de la mise à jour: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Delete task
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('task_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-tasks-hex', phaseId] });
      toast({
        title: 'Tâche supprimée',
        description: 'La tâche a été supprimée avec succès'
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: `Erreur lors de la suppression: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length
  };

  return {
    tasks,
    isLoading,
    error,
    refetch,
    stats,
    createTask: createMutation.mutateAsync,
    updateTask: updateMutation.mutateAsync,
    deleteTask: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
};
