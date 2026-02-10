/**
 * Monitoring Dashboard Hook - Hexagonal Architecture
 * 
 * Hook for monitoring dashboard functionality
 * Following hexagonal architecture patterns:
 * - Uses services for business logic
 * - Uses React Query for state management
 * - Exposes clean interface to UI components
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MonitoringDashboardDTO, 
  MonitoringWidgetDTO, 
  MonitoringFiltersDTO 
} from '@/dtos/entities/MonitoringDTOs';
import { MonitoringDashboardService } from '@/application/services/MonitoringDashboardServiceWorking';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

// =================== INTERFACES ===================

export interface UseMonitoringDashboardHexResult {
  dashboard: MonitoringDashboardDTO | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  createDashboard: (config: Partial<MonitoringDashboardDTO>) => Promise<MonitoringDashboardDTO>;
  updateDashboard: (id: string, updates: Partial<MonitoringDashboardDTO>) => Promise<MonitoringDashboardDTO>;
  addWidget: (dashboardId: string, widget: Omit<MonitoringWidgetDTO, 'id' | 'lastRefresh'>) => Promise<MonitoringDashboardDTO>;
  removeWidget: (dashboardId: string, widgetId: string) => Promise<MonitoringDashboardDTO>;
}

export interface UseComprehensiveMonitoringHexResult {
  monitoring: any; // Would be ComprehensiveMonitoringDTO
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// =================== HOOK IMPLEMENTATION ===================

export function useMonitoringDashboardHex(userId: string): UseMonitoringDashboardHexResult {
  const queryClient = useQueryClient();

  // Initialize service
  const monitoringService = new MonitoringDashboardService(
    RepositoryFactory.getMonitoringRepository(),
    RepositoryFactory.getProjectRepository()
  );

  // Get dashboard query
  const {
    data: dashboard,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['monitoring-dashboard', userId],
    queryFn: () => monitoringService.getMonitoringDashboard(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create dashboard mutation
  const createDashboardMutation = useMutation({
    mutationFn: (config: Partial<MonitoringDashboardDTO>) => 
      monitoringService.createMonitoringDashboard(userId, config),
    onSuccess: (newDashboard) => {
      queryClient.setQueryData(['monitoring-dashboard', userId], newDashboard);
      queryClient.invalidateQueries({ queryKey: ['monitoring-dashboards'] });
    },
    onError: (error: any) => {
      console.error('Failed to create monitoring dashboard:', error);
    }
  });

  // Update dashboard mutation
  const updateDashboardMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<MonitoringDashboardDTO> }) => 
      monitoringService.updateMonitoringDashboard(id, updates),
    onSuccess: (updatedDashboard) => {
      queryClient.setQueryData(['monitoring-dashboard', userId], updatedDashboard);
      queryClient.invalidateQueries({ queryKey: ['monitoring-dashboards'] });
    },
    onError: (error: any) => {
      console.error('Failed to update monitoring dashboard:', error);
    }
  });

  // Add widget mutation
  const addWidgetMutation = useMutation({
    mutationFn: ({ dashboardId, widget }: { dashboardId: string; widget: Omit<MonitoringWidgetDTO, 'id' | 'lastRefresh'> }) => 
      monitoringService.addWidgetToDashboard(dashboardId, widget),
    onSuccess: (updatedDashboard) => {
      queryClient.setQueryData(['monitoring-dashboard', userId], updatedDashboard);
      queryClient.invalidateQueries({ queryKey: ['monitoring-dashboards'] });
    },
    onError: (error: any) => {
      console.error('Failed to add widget to dashboard:', error);
    }
  });

  // Remove widget mutation
  const removeWidgetMutation = useMutation({
    mutationFn: ({ dashboardId, widgetId }: { dashboardId: string; widgetId: string }) => 
      monitoringService.removeWidgetFromDashboard(dashboardId, widgetId),
    onSuccess: (updatedDashboard) => {
      queryClient.setQueryData(['monitoring-dashboard', userId], updatedDashboard);
      queryClient.invalidateQueries({ queryKey: ['monitoring-dashboards'] });
    },
    onError: (error: any) => {
      console.error('Failed to remove widget from dashboard:', error);
    }
  });

  return {
    dashboard: dashboard || null,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
    createDashboard: createDashboardMutation.mutateAsync,
    updateDashboard: updateDashboardMutation.mutateAsync,
    addWidget: addWidgetMutation.mutateAsync,
    removeWidget: removeWidgetMutation.mutateAsync
  };
}

export function useComprehensiveMonitoringHex(userId: string, filters?: MonitoringFiltersDTO): UseComprehensiveMonitoringHexResult {
  // Initialize service
  const monitoringService = new MonitoringDashboardService(
    RepositoryFactory.getMonitoringRepository(),
    RepositoryFactory.getProjectRepository()
  );

  // Get comprehensive monitoring query
  const {
    data: monitoring,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['comprehensive-monitoring', userId, filters],
    queryFn: () => monitoringService.getComprehensiveMonitoring(userId, filters),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    monitoring,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch
  };
}
