/**
 * Hexagonal hook for dashboard statistics
 * Provides comprehensive dashboard data using DashboardService
 */

import { useQuery } from '@tanstack/react-query';
import { DashboardService } from '@/application/services/DashboardService';
import { DashboardStats } from '@/dtos/entities/DashboardDTO';

const dashboardService = new DashboardService();

export interface UseDashboardHexResult {
  stats: DashboardStats | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook for fetching and managing dashboard statistics
 * Uses hexagonal architecture with DashboardService
 */
export const useDashboardHex = (): UseDashboardHexResult => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: (): Promise<DashboardStats> => dashboardService.getDashboardStats(),
    staleTime: 60_000, // 1 minute
    retry: 2,
    refetchOnWindowFocus: false,
  });

  return {
    stats: data || null,
    loading: isLoading,
    error: error as Error | null,
    refetch,
  };
};