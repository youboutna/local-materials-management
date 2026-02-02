/**
 * Hexagonal Hook for Milestones
 * Uses MilestoneService with domain entities
 * Following hexagonal architecture principles
 */

import { useQuery } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { MilestoneService } from '@/application/services/MilestoneService';
import { ProjectMapper } from '@/infrastructure/transformers/ProjectMapper';
import { toast } from 'sonner';

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

  return useQuery({
    queryKey: ["milestone-progress", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      return await milestoneService.getMilestoneProgress(projectId);
    },
    enabled: !!projectId,
    staleTime: 30_000,
    onError: (error) => {
      toast.error('Erreur lors du chargement des jalons');
    },
  });
}
