/**
 * usePhaseResourceLinkHex — ressources d'une phase issues de la chaîne DQE / Devis.
 * TanStack v5, sans callbacks onError/onSuccess (doctrine projet).
 */
import { useQuery } from '@tanstack/react-query';
import { getPhaseResourceLinkService } from '@/application/services/boq/PhaseResourceLinkService';
import type { PhasePlannedResourcesDTO } from '@/dtos/entities/PhasePlannedResourcesDTO';

export function usePhaseResourceLinkHex(projectId?: string, phaseId?: string) {
  const query = useQuery<PhasePlannedResourcesDTO | null>({
    queryKey: ['phase-resource-link', projectId ?? null, phaseId ?? null],
    enabled: Boolean(projectId && phaseId),
    queryFn: () => getPhaseResourceLinkService().getPhaseResources(projectId!, phaseId!),
  });

  return {
    resources: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
