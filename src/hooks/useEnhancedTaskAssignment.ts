
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface TaskAssignment {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
  assigned_to: string;
  assigned_by: string;
  project_id: string;
  completion_token: string;
  completion_url: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export const useEnhancedTaskAssignment = () => {
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const queryClient = useQueryClient();

  // Fetch task assignments
  const { data: taskAssignments, isLoading, error } = useQuery({
    queryKey: ['task-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_assignments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Create task assignment
  const createAssignment = useMutation({
    mutationFn: async (newAssignment: Partial<TaskAssignment>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const userId = user.id;
      
      const { data, error } = await supabase
        .from('task_assignments')
        .insert([{
          ...newAssignment,
          assigned_by: userId,
          completion_token: crypto.randomUUID(),
          completion_url: `${window.location.origin}/task-completion/${crypto.randomUUID()}`
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-assignments'] });
      toast({
        title: "Tâche assignée",
        description: "La tâche a été assignée avec succès.",
      });
    },
    onError: (error) => {
      console.error('Error creating assignment:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'assignation.",
        variant: "destructive",
      });
    }
  });

  // Update task assignment
  const updateAssignment = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TaskAssignment> }) => {
      const { data, error } = await supabase
        .from('task_assignments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-assignments'] });
      toast({
        title: "Tâche mise à jour",
        description: "La tâche a été mise à jour avec succès.",
      });
    },
    onError: (error) => {
      console.error('Error updating assignment:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la tâche.",
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    if (taskAssignments) {
      setAssignments(taskAssignments);
    }
  }, [taskAssignments]);

  return {
    assignments: taskAssignments || [],
    isLoading,
    error,
    createAssignment,
    updateAssignment
  };
};
