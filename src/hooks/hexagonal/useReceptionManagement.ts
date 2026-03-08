/**
 * Hexagonal hooks for Reception Management module
 * Simplified - uses direct Supabase until reception repositories are available
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReceptionFormData {
  project_id: string;
  supplier_id: string;
  invoice_id: string;
  reception_date: string;
  received_by: string;
  notes?: string;
}

// Hook: Fetch all receptions for a project
export function useProjectReceptions(projectId: string) {
  return useQuery({
    queryKey: ['receptions', projectId],
    queryFn: async () => {
      // Placeholder until reception table/repository is available
      return [];
    },
    enabled: !!projectId,
  });
}

// Hook: Create reception mutation
export function useCreateReception() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (receptionData: ReceptionFormData) => {
      // Placeholder until reception repository is available
      console.warn('Reception creation not yet implemented via hexagonal architecture');
      return receptionData;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['receptions', variables.project_id] });
    }
  });
}

// Hook: Update reception mutation
export function useUpdateReception() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ReceptionFormData }) => {
      console.warn('Reception update not yet implemented via hexagonal architecture');
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['receptions', variables.data.project_id] });
    }
  });
}

// Hook: Delete reception mutation
export function useDeleteReception() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      console.warn('Reception deletion not yet implemented via hexagonal architecture');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptions'] });
    }
  });
}
