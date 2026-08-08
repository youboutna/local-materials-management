/**
 * useProjectWithPaymentsHex
 * -------------------------
 * Hydration hexagonale du DTO `ProjectWithPaymentsDTO` consommé par
 * `ProjectStatusCard`, `InspectionDialog` et `WorkflowInspection`.
 *
 * Conformément à `docs/PROMPTS.md` (RÈGLE #1 - Flèche Sacrée):
 *   DB (snake_case) → Adapter → Service → Transformer → DTO (camelCase) → UI
 *
 * Aucun `supabase.from(...)` ici, aucun import legacy.
 */
import { InspectionService, getInspectionService} from '@/application/services/InspectionService';
import { PaymentService, getPaymentService} from '@/application/services/PaymentService';
import { ProjectService, getProjectService} from '@/application/services/ProjectService';
import type {
    InspectionStatus,
    InspectionSummaryDTO,
    PaymentSummaryDTO,
    ProjectWithPaymentsDTO,
} from '@/dtos/entities/ProjectWithPaymentsDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useQuery } from '@tanstack/react-query';

function inspectorName(insp: any): string | null {
  if (!insp) return null;
  if (typeof insp === 'string') return insp;
  return insp?.name ?? insp?.id ?? null;
}

export function useProjectWithPaymentsHex(projectId: string | undefined) {
  return useQuery<ProjectWithPaymentsDTO | null>({
    queryKey: ['project-with-payments', projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      if (!projectId) return null;

      const projectService = getProjectService();
      const inspectionService = getInspectionService();
      const paymentService = getPaymentService();

      const [project, inspections, payments] = await Promise.all([
        projectService.findById(projectId),
        inspectionService.getInspectionsByProject(projectId).catch(() => []),
        paymentService.getPaymentsByProject(projectId).catch(() => []),
      ]);

      if (!project) return null;

      const inspectionDtos: InspectionSummaryDTO[] = inspections
        .map(i => ({
          id: i.id,
          date: i.date,
          status: (i.status as unknown as string) as InspectionStatus,
          inspector: inspectorName((i as any).inspector),
          progressAtInspection: (i as any).progressAtInspection ?? null,
          comments: (i as any).comments ?? null,
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const paymentDtos: PaymentSummaryDTO[] = payments
        .map(p => ({
          id: p.id,
          amount: Number((p as any).amount ?? 0),
          paymentDate: (p as any).paymentDate ?? '',
          contractorName: (p as any).contractorName ?? null,
        }))
        .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

      const dto: ProjectWithPaymentsDTO = {
        id: project.id,
        title: (project as any).title ?? (project as any).name ?? '',
        description: (project as any).description ?? null,
        status: (project as any).status,
        progress: Number((project as any).progress ?? 0),
        startDate: (project as any).startDate ?? '',
        endDate: (project as any).endDate ?? null,
        budget: (project as any).budget ?? null,
        location: (project as any).location ?? null,
        createdAt: (project as any).createdAt ?? '',
        updatedAt: (project as any).updatedAt ?? '',
        inspections: inspectionDtos,
        payments: paymentDtos,
      };

      return dto;
    },
  });
}
