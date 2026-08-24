/**
 * useProcurementChainHex — pilotage React de la chaîne
 * « DQE validé → planification → prévisions → appel d'offres → portails ».
 * Aucune logique métier ici : tout est délégué à ProcurementChainService.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ProcurementChainService,
  type ProcurementChainInput,
  type ProcurementChainResult,
  type ProcurementConsistencyReport,
} from '@/application/services/procurement/ProcurementChainService';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';

export function useProcurementChain() {
  const queryClient = useQueryClient();

  const mutation = useMutation<ProcurementChainResult, Error, ProcurementChainInput>({
    mutationFn: (input) => ProcurementChainService.runFromValidatedDqe(input),
    onSettled: (_data, _error, input) => {
      queryClient.invalidateQueries({ queryKey: ['project-phases', input.projectId] });
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      queryClient.invalidateQueries({ queryKey: ['public-tenders-open'] });
      queryClient.invalidateQueries({ queryKey: ['public-tenders'] });
      queryClient.invalidateQueries({ queryKey: ['project', input.projectId] });
    },
  });

  return {
    runChain: mutation.mutateAsync,
    result: mutation.data ?? null,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Contrôle de cohérence DQE ↔ planification ↔ appel d'offres, évalué en continu
 * pour signaler une désynchronisation après modification du DQE.
 */
export function useProcurementConsistency(
  projectId?: string,
  lines: BoqLineDTO[] = [],
  documentId?: string | null,
) {
  const query = useQuery<ProcurementConsistencyReport | null>({
    queryKey: ['procurement-consistency', projectId ?? null, documentId ?? null, lines.length],
    queryFn: () =>
      projectId ? ProcurementChainService.checkConsistency(projectId, lines, documentId) : Promise.resolve(null),
    enabled: !!projectId && lines.length > 0,
    staleTime: 60_000,
  });

  return {
    report: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error as Error | null,
  };
}

export const isValidatedDqe = ProcurementChainService.isValidatedDqe;
