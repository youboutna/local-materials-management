/**
 * Hexagonal Hook for Project Analytics
 */

import { ProjectAnalyticsService } from '@/application/services/ProjectAnalyticsService';
import { ProjectDetailDTO } from '@/dtos/entities/ProjectDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useQuery } from '@tanstack/react-query';

export interface ProjectAnalyticsError extends Error {
  code?: string;
  projectId?: string;
}

interface ProjectAnalyticsData {
  totalTasks: number;
  completedTasks: number;
  budgetUtilization: number;
  schedulePerformance: number;
  qualityMetrics: {
    averageScore: number;
    inspectionPassRate: number;
  };
}

export interface UseProjectAnalyticsResult {
  analytics: ProjectAnalyticsData | null;
  isLoading: boolean;
  error: ProjectAnalyticsError | null;
  refetch: () => void;
}

export function useProjectAnalyticsHex(projectId: string | null, projectDetail: ProjectDetailDTO | null): UseProjectAnalyticsResult {
  const analyticsService = new ProjectAnalyticsService(
    RepositoryFactory.getProjectRepository()
  );

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["project-analytics", projectId],
    queryFn: async (): Promise<ProjectAnalyticsData | null> => {
      if (!projectId || !projectDetail) return null;
      const result = await analyticsService.getProjectAnalytics(projectId);
      return {
        totalTasks: result.teamSize || 0,
        completedTasks: 0,
        budgetUtilization: result.costEfficiency || 0,
        schedulePerformance: result.schedulePerformance || 0,
        qualityMetrics: {
          averageScore: result.stakeholderSatisfaction || 0,
          inspectionPassRate: 85
        }
      };
    },
    enabled: !!projectId && !!projectDetail,
    staleTime: 30_000,
  });

  return {
    analytics: data ?? null,
    isLoading,
    error: error as ProjectAnalyticsError | null,
    refetch,
  };
}

export function useProjectKPIsHex(projectId: string | null, projectDetail: ProjectDetailDTO | null) {
  const analyticsService = new ProjectAnalyticsService(
    RepositoryFactory.getProjectRepository()
  );

  return useQuery({
    queryKey: ["project-kpis", projectId],
    queryFn: async () => {
      if (!projectId || !projectDetail) return null;
      return await analyticsService.getProjectMetrics(projectId);
    },
    enabled: !!projectId && !!projectDetail,
    staleTime: 30_000,
  });
}

export function useProjectComplianceHex(projectId: string | null, projectDetail: ProjectDetailDTO | null) {
  const analyticsService = new ProjectAnalyticsService(
    RepositoryFactory.getProjectRepository()
  );

  return useQuery({
    queryKey: ["project-compliance", projectId],
    queryFn: async () => {
      if (!projectId || !projectDetail) return null;
      return await analyticsService.getProjectCostAnalysis(projectId);
    },
    enabled: !!projectId && !!projectDetail,
    staleTime: 30_000,
  });
}
