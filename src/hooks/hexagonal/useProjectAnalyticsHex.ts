/**
 * Hexagonal Hook for Project Analytics
 * Uses ProjectAnalyticsService with domain entities
 * Following hexagonal architecture principles
 */

import { useQuery } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { ProjectAnalyticsService } from '@/application/services/ProjectAnalyticsService';
import { ProjectMapper } from '@/infrastructure/transformers/ProjectMapper';
import { toast } from 'sonner';

export interface UseProjectAnalyticsResult {
  analytics: any;
  isLoading: boolean;
  error: any;
  refetch: () => void;
}

export function useProjectAnalytics(projectId: string | null, projectDetail: any): UseProjectAnalyticsResult {
  const analyticsService = new ProjectAnalyticsService(
    RepositoryFactory.getProjectRepository()
  );

  return useQuery({
    queryKey: ["project-analytics", projectId],
    queryFn: async () => {
      if (!projectId || !projectDetail) return null;
      const result = await analyticsService.getComprehensiveAnalytics(projectDetail);
      return result;
    },
    enabled: !!projectId && !!projectDetail,
    staleTime: 30_000,
    onError: (error) => {
      toast.error('Erreur lors du chargement des analytics');
    },
  });
}

export function useProjectKPIs(projectId: string | null, projectDetail: any) {
  const analyticsService = new ProjectAnalyticsService(
    RepositoryFactory.getProjectRepository()
  );

  return useQuery({
    queryKey: ["project-kpis", projectId],
    queryFn: async () => {
      if (!projectId || !projectDetail) return null;
      return await analyticsService.getKPIMetrics(projectDetail);
    },
    enabled: !!projectId && !!projectDetail,
    staleTime: 30_000,
  });
}

export function useProjectCompliance(projectId: string | null, projectDetail: any) {
  const analyticsService = new ProjectAnalyticsService(
    RepositoryFactory.getProjectRepository()
  );

  return useQuery({
    queryKey: ["project-compliance", projectId],
    queryFn: async () => {
      if (!projectId || !projectDetail) return null;
      return await analyticsService.getComplianceData(projectDetail);
    },
    enabled: !!projectId && !!projectDetail,
    staleTime: 30_000,
  });
}
