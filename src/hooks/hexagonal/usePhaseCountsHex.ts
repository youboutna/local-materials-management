/**
 * usePhaseCountsHex
 * Batch resource counts (documents/tasks/inspections/payments) per phase,
 * used by phase list/overview UIs to avoid direct Supabase queries.
 */
import { getPhaseService } from '@/application/services/PhaseService';
import { useQuery } from '@tanstack/react-query';

export interface PhaseCounts {
  documents: number;
  tasks: number;
  inspections: number;
  payments: number;
}

const EMPTY_COUNTS: PhaseCounts = { documents: 0, tasks: 0, inspections: 0, payments: 0 };

export function usePhaseCountsHex(projectId?: string) {
  const phaseService = getPhaseService();

  const query = useQuery({
    queryKey: ['phase-counts', projectId],
    queryFn: () => phaseService.getPhaseCountsByProjectId(projectId as string),
    enabled: !!projectId && projectId !== 'new-project',
  });

  return {
    countsByPhase: query.data ?? {},
    getCounts: (phaseId?: string): PhaseCounts => (phaseId && query.data?.[phaseId]) || EMPTY_COUNTS,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export default usePhaseCountsHex;
