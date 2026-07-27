/**
 * Hexagonal Hook for Milestones (Fixed)
 * Uses MilestoneService with domain entities
 */

import { MilestoneService } from '@/application/services/MilestoneService';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useQuery } from '@tanstack/react-query';

interface MilestoneProgress {
  percentage: number;
  status: 'on_track' | 'delayed' | 'ahead';
  lastUpdated: string;
}

export interface UseMilestoneResult {
  milestoneProgress: MilestoneProgress | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMilestones(projectId: string | null): UseMilestoneResult {
  const milestoneService = new MilestoneService(
    RepositoryFactory.getMilestoneRepository()
  );

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["milestone-progress", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      return await milestoneService.getMilestoneProgress(projectId);
    },
    enabled: !!projectId,
    staleTime: 30_000,
  });

  return {
    milestoneProgress: data as MilestoneProgress | null,
    isLoading,
    error: error?.message || null,
    refetch,
  };
}
