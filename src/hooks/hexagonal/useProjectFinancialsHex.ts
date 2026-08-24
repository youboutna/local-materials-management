/**
 * useProjectFinancialsHex — accès UI à la doctrine financière unique
 * (Budget → Engagé → Dépensé → Payé → Restant).
 */
import { useQuery } from '@tanstack/react-query';
import { getProjectFinancialsService } from '@/application/services/ProjectFinancialsService';
import type { FinancialScope, ProjectFinancialDTO } from '@/dtos/entities/ProjectFinancialDTO';

interface Options {
  scope: FinancialScope;
  entityId?: string | null;
  declaredBudget?: number | null;
  currency?: string;
  enabled?: boolean;
}

export function useProjectFinancialsHex({
  scope,
  entityId,
  declaredBudget,
  currency = 'MRU',
  enabled = true,
}: Options) {
  const query = useQuery<ProjectFinancialDTO>({
    queryKey: ['project-financials', scope, entityId, declaredBudget, currency],
    queryFn: () =>
      getProjectFinancialsService().getSummary({
        scope,
        entityId: entityId as string,
        declaredBudget: declaredBudget ?? 0,
        currency,
      }),
    enabled: enabled && !!entityId,
    staleTime: 60_000,
  });

  return {
    financials: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
