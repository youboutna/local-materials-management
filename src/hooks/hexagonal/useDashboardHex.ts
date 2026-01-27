/**
 * Hexagonal hook for dashboard statistics
 * Provides comprehensive dashboard data using DashboardService
 */

import { useQuery } from '@tanstack/react-query';
import { DashboardService, DashboardStats } from '@/application/services/DashboardService';

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
  const dashboardService = new DashboardService();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      console.log('useDashboardHex: Fetching dashboard stats...');
      try {
        const stats = await dashboardService.getDashboardStats();
        console.log('useDashboardHex: Stats fetched successfully:', stats);
        return stats;
      } catch (err) {
        console.error('useDashboardHex: Error fetching stats:', err);
        throw err;
      }
    },
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