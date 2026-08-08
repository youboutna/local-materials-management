/**
 * useTenderToPlanning — TanStack v5 mutation exposing the orchestrator.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  tenderToPlanningService,
  type TenderToPlanningInput,
  type TenderToPlanningResult,
} from '@/application/services/tender/TenderToPlanningService';

export function useTenderToPlanning() {
  const qc = useQueryClient();
  const mut = useMutation<TenderToPlanningResult, Error, TenderToPlanningInput>({
    mutationFn: (input) => tenderToPlanningService.convert(input),
  });

  return {
    convert: async (input: TenderToPlanningInput) => {
      const res = await mut.mutateAsync(input);
      qc.invalidateQueries({ queryKey: ['boq'] });
      qc.invalidateQueries({ queryKey: ['project'] });
      return res;
    },
    isPending: mut.isPending,
    isError: mut.isError,
    error: mut.error,
    data: mut.data,
  };
}
