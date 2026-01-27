/**
 * Alerts Hook - Enhanced with real Supabase data
 * Following hexagonal architecture: Hook → Adapter → Supabase
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Re-export AlertData type for compatibility
export type { AlertData } from "@/dtos/entities";
import { AlertData } from "@/dtos/entities";

// Stats interface for dashboard
export interface AlertStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  acknowledged: number;
  pending: number;
}

// Enhanced result type with all needed properties
export interface UseAlertsHexResult {
  alerts: AlertData[];
  isLoading: boolean;
  loading: boolean; // Alias for isLoading for compatibility
  error: any;
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
  getAlertSeverity: (alert: any) => 'low' | 'medium' | 'high' | 'critical';
  getAlertPriority: (alert: any) => 'low' | 'medium' | 'high' | 'urgent';
  getAlertRisk: (alert: any) => 'low' | 'medium' | 'high';
  getAlertDaysSinceCreation: (alert: any) => number;
  getAlertAnalytics: () => any;
  validateAlertWithReferential: (alert: any, referentialType: string) => Promise<any>;
  generateAlertReport: (alert: any) => any;
}

/**
 * Fetch alerts from monitoring_alerts table
 */
async function fetchAlertsFromSupabase(): Promise<AlertData[]> {
  const { data, error } = await supabase
    .from('monitoring_alerts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching alerts:', error);
    throw error;
  }

  // Map database rows to AlertData type
  return (data || []).map((row: any) => ({
    id: row.id,
    type: mapAlertType(row.alert_type),
    severity: mapPriorityToSeverity(row.priority),
    title: row.title,
    message: row.description || '',
    projectId: row.station_id || '',
    relatedEntityId: row.id,
    source: 'notification' as const,
    timestamp: row.created_at,
    triggerDate: row.created_at,
    acknowledged: row.status === 'acknowledged' || row.status === 'resolved',
    acknowledgedBy: row.resolved_by || undefined,
    acknowledgedAt: row.resolved_at || undefined,
    actionRequired: row.status === 'active' || row.status === 'pending',
    actionTaken: row.resolution_notes || undefined,
    actionTakenBy: row.resolved_by || undefined,
    actionTakenAt: row.resolved_at || undefined,
    status: row.status
  }));
}

function mapAlertType(dbType: string): AlertData['type'] {
  const typeMap: Record<string, AlertData['type']> = {
    'insurance': 'insurance_expiry',
    'delay': 'project_delay',
    'inspection': 'inspection_issue',
    'financial': 'financial_risk',
    'guarantee': 'bank_guarantee',
    'payment': 'payment_blocked',
    'compliance': 'compliance_violation',
    'delivery': 'delivery',
    'deadline': 'deadline',
    'quality': 'quality'
  };
  return typeMap[dbType] || 'project_delay';
}

function mapPriorityToSeverity(priority: string): AlertData['severity'] {
  const severityMap: Record<string, AlertData['severity']> = {
    'critical': 'critical',
    'high': 'high',
    'medium': 'medium',
    'low': 'low'
  };
  return severityMap[priority] || 'medium';
}

/**
 * Calculate stats from alerts
 */
function calculateStats(alerts: AlertData[]): AlertStats {
  return {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    high: alerts.filter(a => a.severity === 'high').length,
    medium: alerts.filter(a => a.severity === 'medium').length,
    low: alerts.filter(a => a.severity === 'low').length,
    acknowledged: alerts.filter(a => a.acknowledged).length,
    pending: alerts.filter(a => !a.acknowledged).length
  };
}

/**
 * Enhanced hook for alerts management with real Supabase data
 */
export function useAlertsHex(): UseAlertsHexResult {
  const queryClient = useQueryClient();

  // Query for alerts list from Supabase
  const {
    data: alerts = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlertsFromSupabase,
    retry: 3,
    retryDelay: 1000,
    staleTime: 30000
  });

  // Calculate stats from real data
  const stats = calculateStats(alerts);

  // Filter alerts by type
  const filterAlertsByType = (type: string): AlertData[] => {
    if (type === 'all') return alerts;
    return alerts.filter(alert => {
      if (type === 'delay') return alert.type === 'project_delay';
      if (type === 'payment') return alert.type === 'payment_blocked' || alert.type === 'financial_risk';
      if (type === 'inspection') return alert.type === 'inspection_issue' || alert.type === 'inspection_overdue';
      if (type === 'guarantee') return alert.type === 'bank_guarantee';
      return true;
    });
  };

  // Create alert mutation
  const createAlertMutation = useMutation({
    mutationFn: async (alertData: Partial<AlertData>) => {
      const { data, error } = await supabase
        .from('monitoring_alerts')
        .insert({
          title: alertData.title || 'New Alert',
          description: alertData.message,
          alert_type: alertData.type || 'general',
          priority: alertData.severity || 'medium',
          status: 'active',
          station_id: alertData.projectId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
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
    mutationFn: async ({ id, data }: { id: string; data: Partial<AlertData> }) => {
      const { error } = await supabase
        .from('monitoring_alerts')
        .update({
          title: data.title,
          description: data.message,
          priority: data.severity,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
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
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('monitoring_alerts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
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
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('monitoring_alerts')
        .update({
          status: 'acknowledged',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
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
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('monitoring_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success("L'alerte a été résolue.");
    },
    onError: (error) => {
      console.error('Error resolving alert:', error);
      toast.error("Impossible de résoudre l'alerte.");
    }
  });

  // Helper functions
  const getAlertSeverity = (alert: any): 'low' | 'medium' | 'high' | 'critical' => {
    return alert.severity || 'medium';
  };

  const getAlertPriority = (alert: any): 'low' | 'medium' | 'high' | 'urgent' => {
    const severity = getAlertSeverity(alert);
    const daysSinceCreation = getAlertDaysSinceCreation(alert);
    if (severity === 'critical' || daysSinceCreation > 7) return 'urgent';
    if (severity === 'high' || daysSinceCreation > 3) return 'high';
    if (severity === 'medium') return 'medium';
    return 'low';
  };

  const getAlertRisk = (alert: any): 'low' | 'medium' | 'high' => {
    const severity = getAlertSeverity(alert);
    if (severity === 'critical') return 'high';
    if (severity === 'high') return 'medium';
    return 'low';
  };

  const getAlertDaysSinceCreation = (alert: any): number => {
    const createdAt = alert.timestamp ? new Date(alert.timestamp) : new Date();
    const now = new Date();
    return Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getAlertAnalytics = () => stats;

  return {
    alerts,
    isLoading,
    loading: isLoading, // Alias for compatibility
    error,
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
    validateAlertWithReferential: async () => ({ isValid: true, errors: [], warnings: [] }),
    generateAlertReport: (alert: any) => ({
      alert,
      generatedAt: new Date().toISOString(),
      reportType: 'Alert Analysis Report'
    })
  };
}
