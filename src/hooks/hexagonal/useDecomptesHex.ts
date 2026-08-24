/**
 * useDecomptesHex — accès UI aux décomptes (factures acceptées) et au dépensé réel.
 * Aucun accès Supabase : passe par DecompteService.
 */
import { useQuery } from '@tanstack/react-query';
import { getDecompteService, type DecompteScopeOptions } from '@/application/services/DecompteService';

export function useProjectDecomptesHex(
  projectId?: string | null,
  options: DecompteScopeOptions = {},
) {
  const { initialBudget, engaged, currency } = options;
  const query = useQuery({
    queryKey: ['decomptes', 'project', projectId, initialBudget, engaged, currency],
    queryFn: () =>
      getDecompteService().getProjectFinancials(projectId as string, {
        initialBudget,
        engaged,
        currency,
      }),
    enabled: !!projectId,
    staleTime: 60_000,
  });

  return {
    decomptes: query.data?.decomptes ?? [],
    payments: query.data?.payments ?? [],
    summary: query.data?.summary ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function usePhaseDecomptesHex(
  phaseId?: string | null,
  options: DecompteScopeOptions = {},
) {
  const { initialBudget, engaged, currency } = options;
  const query = useQuery({
    queryKey: ['decomptes', 'phase', phaseId, initialBudget, engaged, currency],
    queryFn: () =>
      getDecompteService().getPhaseFinancials(phaseId as string, {
        initialBudget,
        engaged,
        currency,
      }),
    enabled: !!phaseId,
    staleTime: 60_000,
  });

  return {
    decomptes: query.data?.decomptes ?? [],
    payments: query.data?.payments ?? [],
    summary: query.data?.summary ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
