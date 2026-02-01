/**
 * Hexagonal Hook for Project Analytics
 * Uses ProjectAnalyticsService with domain entities
 * Following hexagonal architecture principles
 */

import { useQuery } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { ProjectAnalyticsService } from '@/application/services/ProjectAnalyticsService';
import { ProjectDetailDTO } from '@/dtos/entities/ProjectDTO';
import { toast } from 'sonner';

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

export function useProjectAnalytics(projectId: string | null, projectDetail: ProjectDetailDTO | null): UseProjectAnalyticsResult {
  const analyticsService = new ProjectAnalyticsService(
    RepositoryFactory.getProjectRepository()
  );

  return useQuery({
    queryKey: ["project-analytics", projectId],
    queryFn: async () => {
      if (!projectId || !projectDetail) return null;
      const result = await analyticsService.getProjectAnalytics(projectId);
      return {
        totalTasks: result.total_tasks || 0,
        completedTasks: result.completed_tasks || 0,
        budgetUtilization: result.cost_efficiency || 0,
        schedulePerformance: result.schedule_performance || 0,
        qualityMetrics: {
          averageScore: result.quality_score || 0,
          inspectionPassRate: 85 // Mock data
        }
      };
    },
    enabled: !!projectId && !!projectDetail,
    staleTime: 30_000,
    onError: (error: Error) => {
      toast.error('Erreur lors du chargement des analytics');
    },
  });
}

export function useProjectKPIs(projectId: string | null, projectDetail: ProjectDetailDTO | null) {
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

export function useProjectCompliance(projectId: string | null, projectDetail: ProjectDetailDTO | null) {
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
