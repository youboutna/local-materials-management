/**
 * Hexagonal hook for Alerts Processor — runs the real server-side processor.
 */
import { useMutation } from '@tanstack/react-query';
import { getAlertsProcessorService, type AlertsProcessorRunResult } from '@/application/services/AlertsProcessorService';

export type ProcessorResult = AlertsProcessorRunResult;

export function useRunAlertsProcessorHex() {
  const mutation = useMutation({
    mutationFn: async (options: { batchSize?: number } = {}) => (await getAlertsProcessorService()).run(options),
  });
  return {
    runProcessor: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
  };
}
