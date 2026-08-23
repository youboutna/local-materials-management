/**
 * useProcurementChainHex — pilotage React de la chaîne
 * « DQE validé → planification → prévisions → appel d'offres → portails ».
 * Aucune logique métier ici : tout est délégué à ProcurementChainService.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ProcurementChainService,
  type ProcurementChainInput,
  type ProcurementChainResult,
} from '@/application/services/procurement/ProcurementChainService';

export function useProcurementChain() {
  const queryClient = useQueryClient();

  const mutation = useMutation<ProcurementChainResult, Error, ProcurementChainInput>({
    mutationFn: (input) => ProcurementChainService.runFromValidatedDqe(input),
    onSettled: (_data, _error, input) => {
      queryClient.invalidateQueries({ queryKey: ['project-phases', input.projectId] });
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      queryClient.invalidateQueries({ queryKey: ['public-tenders-open'] });
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

export const isValidatedDqe = ProcurementChainService.isValidatedDqe;
