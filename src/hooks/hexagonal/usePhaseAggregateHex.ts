/**
 * usePhaseAggregateHex — accès React au PhaseAggregateDTO (source unique des
 * onglets d'une phase : ressources, équipe, finances, intervenants).
 *
 * UI → Hook → Service → Repository → Adapter (aucun accès Supabase ici).
 */
import { useQuery } from '@tanstack/react-query';
import { getPhaseSourceAggregateService } from '@/application/services/phase/PhaseSourceAggregateService';
import { emptyPhaseAggregate, type PhaseAggregateDTO } from '@/dtos/entities/PhaseAggregateDTO';

export interface UsePhaseAggregateOptions {
  projectId?: string;
  phaseId?: string;
  declaredBudget?: number | null;
  currency?: string;
}

export function usePhaseAggregateHex({
  projectId,
  phaseId,
  declaredBudget,
  currency = 'MRU',
}: UsePhaseAggregateOptions) {
  const enabled = !!projectId && !!phaseId;

  const { data, isLoading, isError, error, refetch } = useQuery<PhaseAggregateDTO>({
    queryKey: ['phase-aggregate', projectId, phaseId, declaredBudget ?? 0, currency],
    queryFn: () =>
      getPhaseSourceAggregateService().getAggregate({
        projectId: projectId!,
        phaseId: phaseId!,
        declaredBudget: declaredBudget ?? 0,
        currency,
      }),
    enabled,
    staleTime: 30_000,
  });

  return {
    aggregate: data ?? emptyPhaseAggregate(projectId ?? '', phaseId ?? '', currency),
    isLoading: enabled && isLoading,
    isError,
    error,
    refetch,
  };
}
