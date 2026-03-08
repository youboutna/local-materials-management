/**
 * Hexagonal hooks for Reception Management module
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReceptionService } from '@/application/services/ReceptionService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export interface ReceptionFormData {
  project_id: string;
  supplier_id: string;
  invoice_id: string;
  reception_date: string;
  received_by: string;
  notes?: string;
}

function getReceptionService() {
  return new ReceptionService(RepositoryFactory.getReceptionRepository());
}

// Hook: Fetch all receptions for a project
export function useProjectReceptions(projectId: string) {
  return useQuery({
    queryKey: ['receptions', projectId],
    queryFn: async () => {
      const service = getReceptionService();
      const result = await service.getReceptionsByProject(projectId);
      return result;
    },
    enabled: !!projectId, // Only run query if projectId is not empty
  });
}

// Hook: Create reception mutation
export function useCreateReception() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (receptionData: ReceptionFormData) => {
      const service = getReceptionService();
      return await service.createReception(receptionData);
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
      const service = getReceptionService();
      return await service.updateReception(id, data);
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
      const service = getReceptionService();
      return await service.deleteReception(id);
    },
    onSuccess: (_, variables) => {
      // Optimistically update cache by removing the deleted reception
      queryClient.setQueryData(['receptions', variables], (old: any) => {
        if (!old) return [];
        return old.filter((reception: any) => reception.id !== variables);
      });
    }
  });
}
