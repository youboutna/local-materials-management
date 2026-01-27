/**
 * Hexagonal hook for Inspection Dialog
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface CreateInspectionData {
  project_id: string;
  date: string;
  status: string;
  inspector: string;
  progress_at_inspection: number;
  comments?: string | null;
}

export function useCreateInspectionHex() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInspectionData) => {
      const { data: result, error } = await supabase
        .from('inspections')
        .insert(data as any)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inspections', variables.project_id] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.project_id] });
    }
  });
}

export function useUpdateProjectStatusHex() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, status }: { projectId: string; status: string }) => {
      const { error } = await supabase
        .from('projects')
        .update({ status } as any)
        .eq('id', projectId as any);

      if (error) throw error;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });
}
