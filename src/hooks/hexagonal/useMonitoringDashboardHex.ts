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
  MonitoringFiltersDTO,
  ComprehensiveMonitoringDTO
} from '@/dtos/entities/MonitoringDTOs';
import { MonitoringDashboardService } from '@/application/services/MonitoringDashboardServiceWorking';
import { PerformanceMonitoringService, PerformanceMonitoringRecord, EventPerformanceMetrics } from '@/application/services/PerformanceMonitoringService';
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
  // Performance monitoring methods
  createPerformanceRecord: (projectId: string, employeeId?: string, dateRange?: string) => Promise<PerformanceMonitoringRecord>;
  getPerformanceByProject: (projectId: string) => Promise<PerformanceMonitoringRecord[]>;
  getPerformanceStatistics: (projectId: string) => Promise<{
    averagePerformance: number;
    totalRecords: number;
    performanceTrend: 'improving' | 'declining' | 'stable';
    lastUpdated: string;
    kpiBreakdown: {
      taskCompletionRate: number;
      budgetEfficiency: number;
      qualityScore: number;
      timelineAdherence: number;
    };
  }>;
  triggerPerformanceAlerts: (projectId: string) => Promise<{ projectId: string; metrics: EventPerformanceMetrics }>;
  isCreating: boolean;
}

export interface UseComprehensiveMonitoringHexResult {
  monitoring: ComprehensiveMonitoringDTO | null; // Would be ComprehensiveMonitoringDTO
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// =================== HOOK IMPLEMENTATION ===================

export function useMonitoringDashboardHex(userId: string): UseMonitoringDashboardHexResult {
  const queryClient = useQueryClient();

  // Initialize services
  const monitoringService = new MonitoringDashboardService(
    RepositoryFactory.getMonitoringRepository(),
    RepositoryFactory.getProjectRepository()
  );
  const performanceService = new PerformanceMonitoringService();

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
    onError: (error: Error | unknown) => {
      console.error('Failed to create monitoring dashboard:', error instanceof Error ? error.message : String(error));
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
    onError: (error: Error | unknown) => {
      console.error('Failed to update monitoring dashboard:', error instanceof Error ? error.message : String(error));
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
    onError: (error: Error | unknown) => {
      console.error('Failed to add widget to dashboard:', error instanceof Error ? error.message : String(error));
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
    onError: (error: Error | unknown) => {
      console.error('Failed to remove widget from dashboard:', error instanceof Error ? error.message : String(error));
    }
  });

  // Performance monitoring mutations
  const createPerformanceRecordMutation = useMutation({
    mutationFn: async ({ projectId, employeeId, dateRange }: { 
      projectId: string; 
      employeeId?: string; 
      dateRange?: string 
    }) => {
      return await performanceService.createPerformanceMonitoringRecord(projectId, employeeId, dateRange);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-records'] });
    }
  });

  const getPerformanceByProjectQuery = useQuery({
    queryKey: ['performance-by-project', userId],
    queryFn: ({ queryKey }) => {
      const projectId = queryKey[1];
      return performanceService.getPerformanceMonitoringByProject(projectId);
    },
    enabled: !!userId
  });

  const getPerformanceStatisticsQuery = useQuery({
    queryKey: ['performance-statistics', userId],
    queryFn: ({ queryKey }) => {
      const projectId = queryKey[1];
      return performanceService.getEventPerformanceStatistics(projectId);
    },
    enabled: !!userId
  });

  const triggerAlertsMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const metrics = await performanceService.calculateEventPerformanceMetrics(projectId);
      await performanceService.triggerEventPerformanceAlerts(projectId, metrics);
      return { projectId, metrics };
    }
  });

  return {
    dashboard: dashboard || null,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
    createDashboard: createDashboardMutation.mutateAsync,
    updateDashboard: (id: string, updates: Partial<MonitoringDashboardDTO>) => 
      updateDashboardMutation.mutateAsync({ id, updates }),
    addWidget: (dashboardId: string, widget: Omit<MonitoringWidgetDTO, 'id' | 'lastRefresh'>) => 
      addWidgetMutation.mutateAsync({ dashboardId, widget }),
    removeWidget: (dashboardId: string, widgetId: string) => 
      removeWidgetMutation.mutateAsync({ dashboardId, widgetId }),
    // Performance monitoring methods
    createPerformanceRecord: (projectId: string, employeeId?: string, dateRange?: string) => 
      createPerformanceRecordMutation.mutateAsync({ projectId, employeeId, dateRange }),
    getPerformanceByProject: (projectId: string) => 
      performanceService.getPerformanceMonitoringByProject(projectId),
    getPerformanceStatistics: (projectId: string) => 
      performanceService.getEventPerformanceStatistics(projectId),
    triggerPerformanceAlerts: triggerAlertsMutation.mutateAsync,
    isCreating: createDashboardMutation.isPending || createPerformanceRecordMutation.isPending || triggerAlertsMutation.isPending
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
    monitoring: monitoring || null,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch
  };
}
