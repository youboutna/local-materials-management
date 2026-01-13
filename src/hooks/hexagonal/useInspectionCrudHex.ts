// hooks/hexagonal/useInspectionCrudHex.ts - Hexagonal hook for inspection CRUD operations

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Inspection {
  id: string;
  project_id: string;
  inspector: string;
  date: string;
  status: string;
  progress_at_inspection: number;
  comments?: string;
  documents?: any;
  created_at?: string;
  updated_at?: string;
}

export interface InspectionFormData {
  project_id: string;
  inspector: string;
  date: string;
  status: string;
  progress_at_inspection: number;
  comments: string;
}

export const useInspectionCrudHex = (projectId?: string) => {
  const queryClient = useQueryClient();

  // Fetch inspections
  const {
    data: inspections = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['inspections-crud', projectId],
    queryFn: async () => {
      let query = supabase
        .from('inspections')
        .select('*')
        .order('date', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Inspection[];
    }
  });

  // Create inspection
  const createMutation = useMutation({
    mutationFn: async (formData: InspectionFormData) => {
      const { data, error } = await supabase
        .from('inspections')
        .insert({
          project_id: formData.project_id,
          inspector: formData.inspector,
          date: formData.date,
          status: formData.status,
          progress_at_inspection: formData.progress_at_inspection,
          comments: formData.comments
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections-crud'] });
      toast({
        title: 'Inspection créée',
        description: 'L\'inspection a été créée avec succès'
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

  // Update inspection
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InspectionFormData> }) => {
      const { error } = await supabase
        .from('inspections')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections-crud'] });
      toast({
        title: 'Inspection mise à jour',
        description: 'L\'inspection a été mise à jour avec succès'
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

  // Delete inspection
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inspections')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections-crud'] });
      toast({
        title: 'Inspection supprimée',
        description: 'L\'inspection a été supprimée avec succès'
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

  return {
    inspections,
    isLoading,
    error,
    refetch,
    createInspection: createMutation.mutateAsync,
    updateInspection: updateMutation.mutateAsync,
    deleteInspection: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
};
