/**
 * Hexagonal hook for Inspection Dialog
 * Round-trip UI → DTO camelCase → Transformer (snake_case) → Service → DB.
 *
 * Conformément à `docs/PROMPTS.md` (RÈGLE #1):
 *   UI Component → Transformer → DTO (camelCase) → Service → Adapter → DB
 */

import { InspectionService } from '@/application/services/InspectionService';
import { ProjectService } from '@/application/services/ProjectService';
import type {
    CreateInspectionDTO,
    UpdateProjectStatusDTO,
} from '@/dtos/entities/ProjectWithPaymentsDTO';
import { ProjectWithPaymentsTransformer } from '@/dtos/transforms/ProjectWithPaymentsTransformer';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export type { CreateInspectionDTO, UpdateProjectStatusDTO };

export function useCreateInspectionHex() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateInspectionDTO) => {
      // UI DTO → snake_case row (round-trip côté écriture)
      const row = ProjectWithPaymentsTransformer.toSupabaseInsert(dto);
      const service = new InspectionService();
      return await service.createInspection({
        projectId: row.project_id,
        date: row.date,
        status: row.status as any,
        inspector: row.inspector,
        progressAtInspection: row.progress_at_inspection,
        comments: row.comments ?? undefined,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inspections', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['inspections-list', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
    },
  });
}

export function useUpdateProjectStatusHex() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: UpdateProjectStatusDTO) => {
      const patch = ProjectWithPaymentsTransformer.toSupabaseStatusUpdate(dto);
      const service = new ProjectService(RepositoryFactory.getProjectRepository());
      await service.updateProject(dto.projectId, patch as any);
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
