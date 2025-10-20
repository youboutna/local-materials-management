
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
      
      const { data, error } = await supabase
        .from('task_assignments')
        .insert({
          title: newAssignment.title || '',
          description: newAssignment.description || '',
          assigned_to: newAssignment.assigned_to || null,
          assigned_by: user.id,
          completion_token: crypto.randomUUID(),
          completion_url: `${window.location.origin}/task-completion/${crypto.randomUUID()}`,
          priority: newAssignment.priority || 'medium',
          status: newAssignment.status || 'pending',
          due_date: newAssignment.due_date,
          project_id: newAssignment.project_id,
          notes: newAssignment.notes || ''
        })
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
      // Transform the data to match TaskAssignment interface
      const transformedAssignments: TaskAssignment[] = taskAssignments.map(assignment => ({
        id: assignment.id,
        title: assignment.title || '',
        description: assignment.description || '',
        status: assignment.status || 'pending',
        priority: assignment.priority || 'medium',
        due_date: assignment.due_date || '',
        assigned_to: assignment.assigned_to || '',
        assigned_by: assignment.assigned_by || '',
        project_id: assignment.project_id || '',
        completion_token: assignment.completion_token || '',
        completion_url: assignment.completion_url || '',
        notes: assignment.notes || '',
        created_at: assignment.created_at || '',
        updated_at: assignment.updated_at || ''
      }));
      setAssignments(transformedAssignments);
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
