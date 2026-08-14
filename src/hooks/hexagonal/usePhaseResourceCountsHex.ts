/**
 * usePhaseResourceCountsHex
 * Compteurs réels par phase (matériaux alloués, rôles, métrés) issus de la base.
 */
import { useQuery } from '@tanstack/react-query';
import { getBoqResourcePropagationService } from '@/application/services/boq/BoqResourcePropagationService';
import type { PhaseResourceCounts } from '@/domain/repositories/IBoqPropagationRepository';

export function usePhaseResourceCountsHex(projectId?: string) {
  const service = getBoqResourcePropagationService();

  const query = useQuery<PhaseResourceCounts[]>({
    queryKey: ['phase-resource-counts', projectId],
    queryFn: () => service.getPhaseResourceCounts(projectId as string),
    enabled: !!projectId,
  });

  const byPhase = new Map<string, PhaseResourceCounts>();
  (query.data ?? []).forEach((row) => byPhase.set(row.phaseId, row));

  return {
    counts: query.data ?? [],
    getCounts: (phaseId?: string): PhaseResourceCounts =>
      (phaseId && byPhase.get(phaseId)) || { phaseId: phaseId ?? '', materials: 0, employees: 0, takeoffs: 0 },
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
