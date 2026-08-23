/**
 * Alerts Hook - Enhanced with Hexagonal Architecture
 * Following pattern: Hook → Service → Adapter → Supabase
 */

import { getMonitoringAlertService, MonitoringAlertStats } from "@/application/services/MonitoringAlertService";
import { AlertData } from "@/dtos/entities";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Re-export AlertData type for compatibility
export type { AlertData } from "@/dtos/entities";

// Stats interface for dashboard (re-export for backward compatibility)
export type AlertMetrics = MonitoringAlertStats;

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
  stats: AlertMetrics;
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
  });

  // Update alert mutation
  const updateAlertMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AlertData> }) => alertService.updateAlert(id, data),
  });

  // Delete alert mutation
  const deleteAlertMutation = useMutation({
    mutationFn: (id: string) => alertService.deleteAlert(id),
  });

  // Acknowledge alert mutation
  const acknowledgeAlertMutation = useMutation({
    mutationFn: (id: string) => alertService.acknowledgeAlert(id),
  });

  // Resolve alert mutation
  const resolveAlertMutation = useMutation({
    mutationFn: (id: string) => alertService.resolveAlert(id),
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
    averageResolutionTime: (() => {
      const resolved = alerts.filter((alert) => alert.resolvedAt && alert.createdAt);
      if (!resolved.length) return 0;
      return resolved.reduce((sum, alert) => sum + Math.max(0, new Date(alert.resolvedAt as string).getTime() - new Date(alert.createdAt).getTime()), 0) / resolved.length / 3_600_000;
    })()
  });

  const validateAlertWithReferential = async (alert: AlertData, referentialType: string): Promise<ValidationResult> => {
    const errors = [!alert.id ? 'missing_id' : '', !alert.type ? 'missing_type' : '', !alert.severity ? 'missing_severity' : ''].filter(Boolean);
    const warnings = [!alert.projectId ? 'missing_project_context' : '', referentialType === '' ? 'missing_referential' : ''].filter(Boolean);
    return { isValid: errors.length === 0, errors, warnings };
  };

  const runMutation = async <T,>(operation: () => Promise<T>, success: string, failure: string): Promise<T | undefined> => {
    try {
      const result = await operation();
      await queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success(success);
      return result;
    } catch (mutationError) {
      console.error(failure, mutationError);
      toast.error(failure);
      return undefined;
    }
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
    createAlert: (data) => { void runMutation(() => createAlertMutation.mutateAsync(data), "L'alerte a été créée avec succès.", "Impossible de créer l'alerte."); },
    updateAlert: (input) => { void runMutation(() => updateAlertMutation.mutateAsync(input), "L'alerte a été mise à jour.", "Impossible de mettre à jour l'alerte."); },
    deleteAlert: (id) => { void runMutation(() => deleteAlertMutation.mutateAsync(id), "L'alerte a été supprimée.", "Impossible de supprimer l'alerte."); },
    acknowledgeAlert: (id) => { void runMutation(() => acknowledgeAlertMutation.mutateAsync(id), "L'alerte a été marquée comme reconnue.", "Impossible de marquer l'alerte comme reconnue."); },
    resolveAlert: (id) => { void runMutation(() => resolveAlertMutation.mutateAsync(id), "L'alerte a été résolue.", "Impossible de résoudre l'alerte."); },
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
