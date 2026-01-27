/**
 * Hexagonal hooks for Inspections CRUD operations
 * Centralizes all inspection operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InspectionFormData {
  project_id: string;
  inspector: string;
  date: string;
  status: string;
  progress_at_inspection: number;
  comments?: string;
}

export interface InspectionRow {
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

// Hook: Fetch all inspections
export function useInspectionsList() {
  return useQuery({
    queryKey: ['inspections-list'],
    queryFn: async (): Promise<InspectionRow[]> => {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return (data || []) as InspectionRow[];
    }
  });
}

// Hook: Create inspection
export function useCreateInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InspectionFormData) => {
      const { data: result, error } = await supabase
        .from('inspections')
        .insert({
          project_id: data.project_id,
          inspector: data.inspector,
          date: new Date(data.date).toISOString(),
          status: data.status,
          progress_at_inspection: data.progress_at_inspection,
          comments: data.comments
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections-list'] });
    }
  });
}

// Hook: Update inspection
export function useUpdateInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InspectionFormData }) => {
      const { error } = await supabase
        .from('inspections')
        .update({
          project_id: data.project_id,
          inspector: data.inspector,
          date: new Date(data.date).toISOString(),
          status: data.status,
          progress_at_inspection: data.progress_at_inspection,
          comments: data.comments,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections-list'] });
    }
  });
}

// Hook: Delete inspection
export function useDeleteInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inspections')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections-list'] });
    }
  });
}
