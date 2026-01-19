/**
 * Alerts Hook - Enhanced with AlertDomainTransformer Integration
 * Uses AlertDomainTransformer with advanced calculations and analytics
 * Following hexagonal architecture principles with UI-specific enhancements
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { AlertData } from "@/types/alerts";
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

// Enhanced types for UI components
export interface UseAlertsHexResult {
  alerts: AlertData[];
  isLoading: boolean;
  error: any;
  refetch: () => void;
  createAlert: (data: Partial<AlertData>) => void;
  updateAlert: ({ id, data }: { id: string; data: Partial<AlertData> }) => void;
  deleteAlert: (id: string) => void;
  acknowledgeAlert: (id: string) => void;
  resolveAlert: (id: string) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  // Enhanced UI features
  getAlertSeverity: (alert: any) => 'low' | 'medium' | 'high' | 'critical';
  getAlertPriority: (alert: any) => 'low' | 'medium' | 'high' | 'urgent';
  getAlertRisk: (alert: any) => 'low' | 'medium' | 'high';
  getAlertDaysSinceCreation: (alert: any) => number;
  getAlertAnalytics: () => any;
  validateAlertWithReferential: (alert: any, referentialType: string) => Promise<any>;
  generateAlertReport: (alert: any) => any;
}

/**
 * Enhanced hook for alerts management with UI-specific features
 */
export function useAlertsHex(): UseAlertsHexResult {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // Initialize repository
  const alertRepository = RepositoryFactory.getAlertRepository();

  // Query for alerts list
  const {
    data: alerts = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['alerts'],
    queryFn: async (): Promise<AlertData[]> => {
      try {
        const alertData = await alertRepository.findAll();
        return alertData;
      } catch (err) {
        console.error('Error fetching alerts:', err);
        throw err;
      }
    },
    retry: 3,
    retryDelay: 1000,
    enabled: true
  });

  // Create alert mutation
  const createAlertMutation = useMutation({
    mutationFn: async (alertData: Partial<AlertData>) => {
      try {
        const createdAlert = await alertRepository.create(alertData);
        return createdAlert;
      } catch (error) {
        console.error('Error creating alert:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success(`L'alerte "${data.title}" a été créée avec succès.`);
      navigate('/alerts');
    },
    onError: (error) => {
      console.error('Error creating alert:', error);
      toast.error("Impossible de créer l'alerte. Veuillez réessayer.");
    }
  });

  // Update alert mutation
  const updateAlertMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AlertData> }) => {
      try {
        const updatedAlert = await alertRepository.update(id, data);
        return updatedAlert;
      } catch (error) {
        console.error('Error updating alert:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success(`L'alerte "${data.title}" a été mise à jour avec succès.`);
    },
    onError: (error) => {
      console.error('Error updating alert:', error);
      toast.error("Impossible de mettre à jour l'alerte. Veuillez réessayer.");
    }
  });

  // Delete alert mutation
  const deleteAlertMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await alertRepository.delete(id);
        return true;
      } catch (error) {
        console.error('Error deleting alert:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success("L'alerte a été supprimée avec succès.");
    },
    onError: (error) => {
      console.error('Error deleting alert:', error);
      toast.error("Impossible de supprimer l'alerte. Veuillez réessayer.");
    }
  });

  // Acknowledge alert mutation
  const acknowledgeAlertMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await alertRepository.update(id, {
          acknowledged: true,
          acknowledgedAt: new Date().toISOString(),
          acknowledgedBy: 'current_user' // TODO: Get actual user ID
        });
        return true;
      } catch (error) {
        console.error('Error acknowledging alert:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success("L'alerte a été marquée comme reconnue.");
    },
    onError: (error) => {
      console.error('Error acknowledging alert:', error);
      toast.error("Impossible de marquer l'alerte comme reconnue. Veuillez réessayer.");
    }
  });

  // Resolve alert mutation
  const resolveAlertMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await alertRepository.update(id, {
          actionTaken: 'resolved',
          actionTakenAt: new Date().toISOString(),
          actionTakenBy: 'current_user' // TODO: Get actual user ID
        });
        return true;
      } catch (error) {
        console.error('Error resolving alert:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success("L'alerte a été résolue.");
    },
    onError: (error) => {
      console.error('Error resolving alert:', error);
      toast.error("Impossible de résoudre l'alerte. Veuillez réessayer.");
    }
  });

  // Enhanced UI functions
  const getAlertSeverity = (alert: any): 'low' | 'medium' | 'high' | 'critical' => {
    const impact = alert.impact || 'low';
    const urgency = alert.urgency || 'low';
    const affectedSystems = alert.affectedSystems || [];
    
    if (impact === 'critical' || urgency === 'critical' || affectedSystems.length > 3) return 'critical';
    if (impact === 'high' || urgency === 'high' || affectedSystems.length > 1) return 'high';
    if (impact === 'medium' || urgency === 'medium') return 'medium';
    return 'low';
  };

  const getAlertPriority = (alert: any): 'low' | 'medium' | 'high' | 'urgent' => {
    const severity = getAlertSeverity(alert);
    const daysSinceCreation = getAlertDaysSinceCreation(alert);
    const status = alert.status || 'active';
    
    if (severity === 'critical' || daysSinceCreation > 7 || status === 'escalated') return 'urgent';
    if (severity === 'high' || daysSinceCreation > 3) return 'high';
    if (severity === 'medium') return 'medium';
    return 'low';
  };

  const getAlertRisk = (alert: any): 'low' | 'medium' | 'high' => {
    const severity = getAlertSeverity(alert);
    const priority = getAlertPriority(alert);
    const resolutionTime = alert.resolutionTime || 0;
    const recurrence = alert.recurrence || 0;
    
    if (severity === 'critical' || priority === 'urgent' || recurrence > 5) return 'high';
    if (severity === 'high' || priority === 'high' || resolutionTime > 72) return 'medium';
    return 'low';
  };

  const getAlertDaysSinceCreation = (alert: any): number => {
    const createdAt = alert.createdAt ? new Date(alert.createdAt) : new Date();
    const now = new Date();
    return Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getAlertAnalytics = () => {
    const totalAlerts = alerts.length;
    const activeAlerts = alerts.filter(a => a.status === 'active').length;
    const acknowledgedAlerts = alerts.filter(a => a.status === 'acknowledged').length;
    const resolvedAlerts = alerts.filter(a => a.status === 'resolved').length;
    const criticalAlerts = alerts.filter(a => getAlertSeverity(a) === 'critical').length;
    const highPriorityAlerts = alerts.filter(a => getAlertPriority(a) === 'urgent').length;
    const highRiskAlerts = alerts.filter(a => getAlertRisk(a) === 'high').length;
    const averageResolutionTime = alerts.length > 0
      ? alerts.reduce((sum, a) => sum + (a.resolutionTime || 0), 0) / alerts.length
      : 0;
    
    return {
      totalAlerts,
      statusBreakdown: {
        active: activeAlerts,
        acknowledged: acknowledgedAlerts,
        resolved: resolvedAlerts
      },
      severityBreakdown: {
        low: alerts.filter(a => getAlertSeverity(a) === 'low').length,
        medium: alerts.filter(a => getAlertSeverity(a) === 'medium').length,
        high: alerts.filter(a => getAlertSeverity(a) === 'high').length,
        critical: criticalAlerts
      },
      priorityBreakdown: {
        low: alerts.filter(a => getAlertPriority(a) === 'low').length,
        medium: alerts.filter(a => getAlertPriority(a) === 'medium').length,
        high: alerts.filter(a => getAlertPriority(a) === 'high').length,
        urgent: highPriorityAlerts
      },
      riskBreakdown: {
        low: alerts.filter(a => getAlertRisk(a) === 'low').length,
        medium: alerts.filter(a => getAlertRisk(a) === 'medium').length,
        high: highRiskAlerts
      },
      averageResolutionTime: Math.round(averageResolutionTime),
      resolutionRate: totalAlerts > 0 ? Math.round((resolvedAlerts / totalAlerts) * 100) : 0
    };
  };

  return {
    alerts,
    isLoading,
    error,
    refetch,
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
    validateAlertWithReferential: async (alert: any, referentialType: string) => {
      try {
        // Validation selon le type de référentiel
        switch (referentialType) {
          case 'safety':
            return validateSafetyReferential(alert);
          case 'compliance':
            return validateComplianceReferential(alert);
          case 'security':
            return validateSecurityReferential(alert);
          case 'operational':
            return validateOperationalReferential(alert);
          default:
            return { isValid: true, errors: [], warnings: ['Unknown referential type'] };
        }
      } catch (error) {
        console.error('Referential validation error:', error);
        return { isValid: false, errors: ['Validation failed'], warnings: [] };
      }
    },
    generateAlertReport: (alert: any) => {
      try {
        const analytics = getAlertAnalytics();
        const severity = getAlertSeverity(alert);
        const priority = getAlertPriority(alert);
        const risk = getAlertRisk(alert);
        const daysSinceCreation = getAlertDaysSinceCreation(alert);

        return {
          alert: {
            ...alert,
            severity,
            priority,
            risk,
            daysSinceCreation
          },
          generatedAt: new Date().toISOString(),
          reportType: 'Alert Analysis Report',
          summary: {
            totalAlerts: analytics.totalAlerts,
            activeAlerts: analytics.activeAlerts,
            criticalAlerts: analytics.criticalAlerts,
            averageResolutionTime: analytics.averageResolutionTime
          },
          recommendations: generateAlertRecommendations(alert, severity, priority, risk),
          compliance: {
            isValid: true,
            lastValidated: new Date().toISOString(),
            validatedBy: 'AlertSystem'
          }
        };
      } catch (error) {
        console.error('Report generation error:', error);
        return { 
          alert, 
          generatedAt: new Date().toISOString(),
          error: 'Report generation failed',
          status: 'error'
        };
      }
    }
  };
}
