/**
 * Alerts Hook - Enhanced with Hexagonal Architecture
 * Following pattern: Hook → Service → Adapter → Supabase
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MonitoringAlertService, getMonitoringAlertService, MonitoringAlertStats } from "@/application/services/MonitoringAlertService";

// Re-export AlertData type for compatibility
export type { AlertData } from "@/dtos/entities";
import { AlertData } from "@/dtos/entities";

// Stats interface for dashboard (re-export for backward compatibility)
export type AlertStats = MonitoringAlertStats;

// Enhanced result type with all needed properties
export interface AlertError extends Error {
  code?: string;
  details?: Record<string, unknown>;
}

export interface AlertAnalytics {
  totalAlerts: number;
  criticalAlerts: number;
  trends: Array<{
    date: string;
    count: number;
  }>;
  averageResolutionTime: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AlertReport {
  alert: AlertData;
  generatedAt: string;
  reportType: string;
  analytics: AlertAnalytics;
}

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertPriority = 'low' | 'medium' | 'high' | 'urgent';
export type AlertRisk = 'low' | 'medium' | 'high';

export interface UseAlertsHexResult {
  alerts: AlertData[];
  isLoading: boolean;
  loading: boolean; // Alias for isLoading for compatibility
  error: AlertError | null;
  stats: AlertStats;
  refetch: () => void;
  createAlert: (data: Partial<AlertData>) => void;
  updateAlert: ({ id, data }: { id: string; data: Partial<AlertData> }) => void;
  deleteAlert: (id: string) => void;
  acknowledgeAlert: (id: string) => void;
  resolveAlert: (id: string) => void;
  filterAlertsByType: (type: string) => AlertData[];
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  getAlertSeverity: (alert: AlertData) => AlertSeverity;
  getAlertPriority: (alert: AlertData) => AlertPriority;
  getAlertRisk: (alert: AlertData) => AlertRisk;
  getAlertDaysSinceCreation: (alert: AlertData) => number;
  getAlertAnalytics: () => AlertAnalytics;
  validateAlertWithReferential: (alert: AlertData, referentialType: string) => Promise<ValidationResult>;
  generateAlertReport: (alert: AlertData) => AlertReport;
}

/**
 * Enhanced hook for alerts management with Hexagonal Architecture
 * Uses MonitoringAlertService for data access
 */
export function useAlertsHex(): UseAlertsHexResult {
  const queryClient = useQueryClient();
  const alertService = getMonitoringAlertService();

  // Query for alerts list using service
  const {
    data: alerts = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertService.getAllAlerts(),
    retry: 3,
    retryDelay: 1000,
    staleTime: 30000
  });

  // Calculate stats from real data using service
  const stats = alertService.calculateStats(alerts);

  // Filter alerts by type using service
  const filterAlertsByType = (type: string): AlertData[] => {
    return alertService.filterByType(alerts, type);
  };

  // Create alert mutation
  const createAlertMutation = useMutation({
    mutationFn: (alertData: Partial<AlertData>) => alertService.createAlert(alertData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success("L'alerte a été créée avec succès.");
    },
    onError: (error) => {
      console.error('Error creating alert:', error);
      toast.error("Impossible de créer l'alerte.");
    }
  });

  // Update alert mutation
  const updateAlertMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AlertData> }) => 
      alertService.updateAlert(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success("L'alerte a été mise à jour.");
    },
    onError: (error) => {
      console.error('Error updating alert:', error);
      toast.error("Impossible de mettre à jour l'alerte.");
    }
  });

  // Delete alert mutation
  const deleteAlertMutation = useMutation({
    mutationFn: (id: string) => alertService.deleteAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success("L'alerte a été supprimée.");
    },
    onError: (error) => {
      console.error('Error deleting alert:', error);
      toast.error("Impossible de supprimer l'alerte.");
    }
  });

  // Acknowledge alert mutation
  const acknowledgeAlertMutation = useMutation({
    mutationFn: (id: string) => alertService.acknowledgeAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success("L'alerte a été marquée comme reconnue.");
    },
    onError: (error) => {
      console.error('Error acknowledging alert:', error);
      toast.error("Impossible de marquer l'alerte comme reconnue.");
    }
  });

  // Resolve alert mutation
  const resolveAlertMutation = useMutation({
    mutationFn: (id: string) => alertService.resolveAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success("L'alerte a été résolue.");
    },
    onError: (error: Error) => {
      console.error('Error resolving alert:', error);
      toast.error("Impossible de résoudre l'alerte.");
    }
  });

  // Helper functions
  const getAlertSeverity = (alert: AlertData): AlertSeverity => {
    return alert.severity || 'medium';
  };

  const getAlertPriority = (alert: AlertData): AlertPriority => {
    const severity = getAlertSeverity(alert);
    const daysSinceCreation = getAlertDaysSinceCreation(alert);
    if (severity === 'critical' || daysSinceCreation > 7) return 'urgent';
    if (severity === 'high' || daysSinceCreation > 3) return 'high';
    return 'low';
  };

  const getAlertRisk = (alert: AlertData): AlertRisk => {
    const severity = getAlertSeverity(alert);
    if (severity === 'critical') return 'high';
    if (severity === 'high') return 'medium';
    return 'low';
  };

  const getAlertDaysSinceCreation = (alert: AlertData): number => {
    const createdAt = alert.timestamp ? new Date(alert.timestamp) : new Date();
    const now = new Date();
    return Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getAlertAnalytics = (): AlertAnalytics => ({
    totalAlerts: stats.total,
    criticalAlerts: stats.critical,
    trends: [],
    averageResolutionTime: 24 // Mock data - to be implemented with real analytics
  });

  const validateAlertWithReferential = async (alert: AlertData, referentialType: string): Promise<ValidationResult> => {
    // Validation logic can be extended based on referential type
    return { isValid: true, errors: [], warnings: [] };
  };

  const generateAlertReport = (alert: AlertData): AlertReport => {
    const analytics = getAlertAnalytics();
    return {
      alert,
      generatedAt: new Date().toISOString(),
      reportType: 'Alert Analysis Report',
      analytics
    };
  };

  return {
    alerts,
    isLoading,
    loading: isLoading, // Alias for compatibility
    error: error as AlertError | null,
    stats,
    refetch,
    filterAlertsByType,
    createAlert: createAlertMutation.mutate,
    updateAlert: updateAlertMutation.mutate,
    deleteAlert: deleteAlertMutation.mutate,
    acknowledgeAlert: acknowledgeAlertMutation.mutate,
    resolveAlert: resolveAlertMutation.mutate,
    isCreating: createAlertMutation.isPending,
    isUpdating: updateAlertMutation.isPending,
    isDeleting: deleteAlertMutation.isPending,
    getAlertSeverity,
    getAlertPriority,
    getAlertRisk,
    getAlertDaysSinceCreation,
    getAlertAnalytics,
    validateAlertWithReferential,
    generateAlertReport
  };
}
