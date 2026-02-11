/**
 * Performance Monitoring Hook - Hexagonal Architecture
 * 
 * Hook for performance monitoring functionality using PerformanceMonitoringService
 * Following hexagonal architecture patterns:
 * - Uses PerformanceMonitoringService for business logic
 * - Uses React Query for state management
 * - Exposes clean interface to UI components
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PerformanceMonitoringService, PerformanceMonitoringRecord } from '@/application/services/PerformanceMonitoringService';

// =================== INTERFACES ===================

export interface UsePerformanceMonitoringHexResult {
  // Performance records
  records: PerformanceMonitoringRecord[];
  recordsLoading: boolean;
  recordsError: string | null;
  
  // Performance statistics
  statistics: {
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
  } | null;
  statisticsLoading: boolean;
  
  // Actions
  createRecord: (projectId: string, employeeId?: string, dateRange?: string) => Promise<PerformanceMonitoringRecord>;
  getRecordsByProject: (projectId: string) => PerformanceMonitoringRecord[];
  getStatistics: (projectId: string) => Promise<any>;
  triggerAlerts: (projectId: string) => Promise<{ projectId: string; metrics: any }>;
  deleteRecord: (recordId: string) => Promise<boolean>;
  isCreating: boolean;
  
  // Refetch
  refetchRecords: () => void;
  refetchStatistics: () => void;
}

// =================== HOOK IMPLEMENTATION ===================

export function usePerformanceMonitoringHex(projectId?: string): UsePerformanceMonitoringHexResult {
  const queryClient = useQueryClient();
  const performanceService = new PerformanceMonitoringService();

  // Get all performance records
  const {
    data: records,
    isLoading: recordsLoading,
    error: recordsError,
    refetch: refetchRecords
  } = useQuery({
    queryKey: ['performance-records'],
    queryFn: () => performanceService.getAllPerformanceMonitoringRecords(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get performance statistics for specific project
  const {
    data: statistics,
    isLoading: statisticsLoading,
    refetch: refetchStatistics
  } = useQuery({
    queryKey: ['performance-statistics', projectId],
    queryFn: () => projectId ? performanceService.getEventPerformanceStatistics(projectId) : null,
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create performance record mutation
  const createRecordMutation = useMutation({
    mutationFn: async ({ 
      projectId, 
      employeeId, 
      dateRange 
    }: { 
      projectId: string; 
      employeeId?: string; 
      dateRange?: string 
    }) => {
      return await performanceService.createPerformanceMonitoringRecord(projectId, employeeId, dateRange);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-records'] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['performance-statistics', projectId] });
      }
    },
    onError: (error: any) => {
      console.error('Failed to create performance record:', error);
    }
  });

  // Delete performance record mutation
  const deleteRecordMutation = useMutation({
    mutationFn: async (recordId: string) => {
      return await performanceService.deletePerformanceMonitoringRecord(recordId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-records'] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['performance-statistics', projectId] });
      }
    },
    onError: (error: any) => {
      console.error('Failed to delete performance record:', error);
    }
  });

  // Trigger alerts mutation
  const triggerAlertsMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const metrics = await performanceService.calculateEventPerformanceMetrics(projectId);
      await performanceService.triggerEventPerformanceAlerts(projectId, metrics);
      return { projectId, metrics };
    },
    onError: (error: any) => {
      console.error('Failed to trigger performance alerts:', error);
    }
  });

  // Helper functions
  const getRecordsByProject = (projectId: string): PerformanceMonitoringRecord[] => {
    return records?.filter(record => record.projectId === projectId) || [];
  };

  const getStatistics = async (projectId: string): Promise<any> => {
    return await performanceService.getEventPerformanceStatistics(projectId);
  };

  return {
    // Performance records
    records: records || [],
    recordsLoading,
    recordsError: recordsError instanceof Error ? recordsError.message : null,
    
    // Performance statistics
    statistics: statistics || null,
    statisticsLoading,
    
    // Actions
    createRecord: (projectId: string, employeeId?: string, dateRange?: string) => 
      createRecordMutation.mutateAsync({ projectId, employeeId, dateRange }),
    getRecordsByProject,
    getStatistics,
    triggerAlerts: (projectId: string) => triggerAlertsMutation.mutateAsync(projectId),
    deleteRecord: (recordId: string) => deleteRecordMutation.mutateAsync(recordId),
    isCreating: createRecordMutation.isPending || deleteRecordMutation.isPending || triggerAlertsMutation.isPending,
    
    // Refetch
    refetchRecords,
    refetchStatistics
  };
}

// Export a simpler version for basic usage
export function usePerformanceRecordsHex() {
  const { records, recordsLoading, recordsError, refetchRecords } = usePerformanceMonitoringHex();
  
  return {
    records,
    loading: recordsLoading,
    error: recordsError,
    refetch: refetchRecords
  };
}

// Export for project-specific monitoring
export function useProjectPerformanceHex(projectId: string) {
  const { 
    statistics, 
    statisticsLoading, 
    getRecordsByProject, 
    createRecord, 
    triggerAlerts, 
    isCreating 
  } = usePerformanceMonitoringHex(projectId);
  
  const projectRecords = getRecordsByProject(projectId);
  
  return {
    records: projectRecords,
    statistics,
    loading: statisticsLoading,
    createRecord: (employeeId?: string, dateRange?: string) => createRecord(projectId, employeeId, dateRange),
    triggerAlerts: () => triggerAlerts(projectId),
    isCreating
  };
}
