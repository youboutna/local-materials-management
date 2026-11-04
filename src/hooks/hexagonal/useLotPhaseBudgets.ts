/**
 * useLotPhaseBudgets — expose les montants DQE par phase pour le calcul
 * automatique du montant estimé des lots d'appel d'offres.
 */
import { LotPhaseBudgetService, type ProjectLotBudgetsDTO } from '@/application/services/tender/LotPhaseBudgetService';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useQuery } from '@tanstack/react-query';

const service = new LotPhaseBudgetService(RepositoryFactory.getBoqRepository());

export function useLotPhaseBudgets(projectId?: string | null) {
  const query = useQuery<ProjectLotBudgetsDTO>({
    queryKey: ['lot-phase-budgets', projectId ?? 'none'],
    queryFn: () => service.getProjectBudgets(projectId),
    enabled: !!projectId,
    staleTime: 30_000,
  });

  return {
    budgets: query.data ?? null,
    hasDqe: query.data?.hasDqe ?? false,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export default useLotPhaseBudgets;
