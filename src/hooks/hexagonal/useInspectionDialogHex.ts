/**
 * Hexagonal hook for Inspection Dialog
 * Uses InspectionService instead of direct Supabase access
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InspectionService } from '@/application/services/InspectionService';
import { ProjectService } from '@/application/services/ProjectService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

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
      return await InspectionService.createInspection({
        projectId: data.project_id,
        date: data.date,
        status: data.status as any,
        inspector: data.inspector,
        progressAtInspection: data.progress_at_inspection,
        comments: data.comments ?? undefined,
      });
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
      const service = new ProjectService(RepositoryFactory.getProjectRepository());
      await service.updateProject(projectId, { status });
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });
}
