/**
 * Hexagonal hook for btp.escalation_thresholds
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getEscalationThresholdService } from '@/application/services/EscalationThresholdService';
import type { EscalationThresholdRow } from '@/domain/repositories/IEscalationThresholdRepository';

export function useEscalationThresholdsHex() {
  const service = getEscalationThresholdService();
  const queryClient = useQueryClient();

  const query = useQuery<EscalationThresholdRow[]>({
    queryKey: ['escalation-thresholds'],
    queryFn: () => service.getAll(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['escalation-thresholds'] });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<EscalationThresholdRow> }) =>
      service.update(id, updates),
    onSuccess: invalidate,
  });

  const updateManyMutation = useMutation({
    mutationFn: (items: Array<{ id: string; updates: Partial<EscalationThresholdRow> }>) =>
      service.updateMany(items),
    onSuccess: invalidate,
  });

  return {
    thresholds: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
    updateThreshold: updateMutation.mutateAsync,
    updateThresholds: updateManyMutation.mutateAsync,
    isSaving: updateMutation.isPending || updateManyMutation.isPending,
  };
}
