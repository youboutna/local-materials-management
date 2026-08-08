/**
 * Hook pour récupérer le contexte des actions de checkpoint
 */

import { useQuery } from '@tanstack/react-query';
import { 
  getCheckpointActionContextService,
  PaymentActionContext,
  InspectionActionContext,
  ProjectActionContext,
  PhaseSummary
} from '@/application/services/CheckpointActionContextService';
import { MilestoneSummaryDTO } from '@/dtos/entities/MilestoneDTO';

/**
 * Hook pour récupérer le contexte complet du projet
 */
export function useProjectActionContextHex(projectId: string | undefined) {
  const service = getCheckpointActionContextService();

  return useQuery<ProjectActionContext | null>({
    queryKey: ['project-action-context', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      return service.getProjectContext(projectId);
    },
    enabled: !!projectId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook pour récupérer le contexte de paiement
 */
export function usePaymentActionContextHex(
  projectId: string | undefined,
  milestoneId?: string,
  phaseId?: string
) {
  const service = getCheckpointActionContextService();

  return useQuery<PaymentActionContext | null>({
    queryKey: ['payment-action-context', projectId, milestoneId, phaseId],
    queryFn: async () => {
      if (!projectId) return null;
      return service.getPaymentContext(projectId, milestoneId, phaseId);
    },
    enabled: !!projectId,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook pour récupérer le contexte d'inspection
 */
export function useInspectionActionContextHex(
  projectId: string | undefined,
  milestoneId?: string,
  phaseId?: string
) {
  const service = getCheckpointActionContextService();

  return useQuery<InspectionActionContext | null>({
    queryKey: ['inspection-action-context', projectId, milestoneId, phaseId],
    queryFn: async () => {
      if (!projectId) return null;
      return service.getInspectionContext(projectId, milestoneId, phaseId);
    },
    enabled: !!projectId,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook pour récupérer les phases avec étapes
 */
export function usePhasesWithStepsHex(projectId: string | undefined) {
  const service = getCheckpointActionContextService();

  return useQuery<PhaseSummary[]>({
    queryKey: ['phases-with-steps', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      return service.getPhasesWithSteps(projectId);
    },
    enabled: !!projectId,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook pour récupérer les milestones actionnables
 */
export function useActionableMilestonesHex(
  projectId: string | undefined,
  phaseId?: string
) {
  const service = getCheckpointActionContextService();

  return useQuery<MilestoneSummaryDTO[]>({
    queryKey: ['actionable-milestones', projectId, phaseId],
    queryFn: async () => {
      if (!projectId) return [];
      return service.getActionableMilestones(projectId, phaseId);
    },
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });
}
