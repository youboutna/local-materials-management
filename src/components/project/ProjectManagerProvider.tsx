// ============================================================
// src/components/project/ProjectManagerProvider.tsx
// ============================================================
/**
 * Project Manager Provider
 * UI Layer - Fournit le contexte ProjectManager aux composants enfants
 * Utilise AlertService pour la gestion des alertes
 */

import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ProjectManagerContext,
  ProjectManagerContextType,
  defaultState,
  defaultStats
} from '@/contexts/ProjectManagerContext';
import {
  Alert,
  AlertStatistics,
  ProjectManagerState,
  AlertStatus,
  AlertSeverity,
  AlertType
} from '@/domain/entities/Alert';
import type { EscalationRoles } from '@/dtos/entities/ProjectAggregateDTO';
import { AlertService, createAlertService, ProjectAlertContext } from '@/application/services/AlertService';
import { AlertDTO } from '@/dtos/entities/AlertDTO';

// ===== Props =====
interface ProjectManagerProviderProps {
  project: any;
  roles: EscalationRoles;
  actionLabels: any;
  children: ReactNode;
}

// ===== Provider =====
export const ProjectManagerProvider: React.FC<ProjectManagerProviderProps> = ({
  project,
  roles,
  actionLabels,
  children
}) => {
  // Create AlertService with project context
  const alertContext: ProjectAlertContext = useMemo(() => ({
    projectId: project?.id || '',
    projectTitle: project?.title || '',
    userId: project?.userId,
    roles
  }), [project, roles]);

  const alertService = useMemo(() => {
    return createAlertService(alertContext);
  }, [alertContext]);

  const [state, setState] = useState<ProjectManagerState>(defaultState);
  const [loading, setLoading] = useState(false);

  // Load initial alerts
  const loadAlerts = useCallback(async () => {
    if (!project?.id) {
      setState(defaultState);
      return;
    }
    
    setLoading(true);
    try {
      const alerts = await alertService.getAlertsByProjectId(project.id);
      const stats = await alertService.getSummaryStats(project.id);
      
      const openAlerts = alerts.filter(a => a.status === 'open' || a.status === 'acknowledged');
      const acknowledgedAlerts = alerts.filter(a => a.status === 'acknowledged');
      const resolvedAlerts = alerts.filter(a => a.status === 'resolved' || a.status === 'closed');
      
      setState({
        alerts: alerts as any,
        stats: {
          totalAlerts: stats.totalAlerts || alerts.length,
          criticalAlerts: stats.criticalAlerts || alerts.filter(a => a.severity === 'critical').length,
          highAlerts: alerts.filter(a => a.severity === 'high').length,
          mediumAlerts: alerts.filter(a => a.severity === 'medium').length,
          lowAlerts: alerts.filter(a => a.severity === 'low').length,
          openAlerts: openAlerts.length,
          acknowledgedAlerts: acknowledgedAlerts.length,
          resolvedAlerts: resolvedAlerts.length,
          pendingActions: openAlerts.length,
          activeRisks: alerts.filter(a => a.type === 'risk' && a.status === 'open').length,
          overdueTasks: alerts.filter(a => a.deadline && new Date(a.deadline) < new Date() && a.status !== 'resolved' && a.status !== 'closed').length
        },
        lastUpdated: new Date().toISOString(),
        progress: alerts.length > 0 ? (resolvedAlerts.length / alerts.length) * 100 : 0
      });
    } catch (error) {
      console.error('[ProjectManagerProvider] Erreur lors du chargement des alertes:', error);
      setState(defaultState);
    } finally {
      setLoading(false);
    }
  }, [alertService, project?.id]);

  // Load alerts on mount and when project changes
  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // ===== Méthodes Async (pour compatibilité avec le hook) =====
  const runChecks = useCallback(async () => {
    await loadAlerts();
  }, [loadAlerts]);

  const acknowledgeAlert = useCallback(async (alertId: string, userId: string, actionTaken?: string): Promise<boolean> => {
    try {
      const result = await alertService.acknowledgeAlert(alertId, userId);
      if (result.success) {
        await loadAlerts();
        return true;
      }
      console.error('Failed to acknowledge alert:', result.error);
      return false;
    } catch (error) {
      console.error('[ProjectManagerProvider] Erreur lors de l\'accusé de réception:', error);
      return false;
    }
  }, [alertService, loadAlerts]);

  const resolveAlert = useCallback(async (alertId: string, userId: string, resolution?: string): Promise<boolean> => {
    try {
      const result = await alertService.resolveAlert(alertId, userId);
      if (result.success) {
        await loadAlerts();
        return true;
      }
      console.error('Failed to resolve alert:', result.error);
      return false;
    } catch (error) {
      console.error('[ProjectManagerProvider] Erreur lors de la résolution:', error);
      return false;
    }
  }, [alertService, loadAlerts]);

  const closeAlert = useCallback(async (alertId: string, userId: string): Promise<boolean> => {
    try {
      const result = await alertService.updateAlert(alertId, { 
        status: 'closed' as AlertStatus,
        updatedAt: new Date().toISOString()
      });
      if (result.success) {
        await loadAlerts();
        return true;
      }
      console.error('Failed to close alert:', result.error);
      return false;
    } catch (error) {
      console.error('[ProjectManagerProvider] Erreur lors de la fermeture:', error);
      return false;
    }
  }, [alertService, loadAlerts]);

  // ===== Méthodes Sync (pour compatibilité avec le hook) =====
  const getAlertsByType = useCallback((type: string): Alert[] => {
    try {
      return (state.alerts || []).filter(a => a.type === type) as Alert[];
    } catch (error) {
      console.error('[ProjectManagerProvider] Erreur getAlertsByType:', error);
      return [];
    }
  }, [state.alerts]);

  const getAlertsBySeverity = useCallback((severity: string): Alert[] => {
    try {
      return (state.alerts || []).filter(a => a.severity === severity) as Alert[];
    } catch (error) {
      console.error('[ProjectManagerProvider] Erreur getAlertsBySeverity:', error);
      return [];
    }
  }, [state.alerts]);

  const needsEscalation = useCallback((alert: Alert): boolean => {
    try {
      return alertService.needsEscalation(alert as AlertDTO);
    } catch (error) {
      console.error('[ProjectManagerProvider] Erreur needsEscalation:', error);
      return false;
    }
  }, [alertService]);

  const getEscalationPath = useCallback((alert: Alert): string[] => {
    try {
      return alertService.getEscalationPath(alert as AlertDTO);
    } catch (error) {
      console.error('[ProjectManagerProvider] Erreur getEscalationPath:', error);
      return [];
    }
  }, [alertService]);

  const getActionLabel = useCallback((alertType: string): string => {
    try {
      return alertService.getActionLabel(alertType);
    } catch (error) {
      console.error('[ProjectManagerProvider] Erreur getActionLabel:', error);
      return 'Action';
    }
  }, [alertService]);

  const getSummaryStats = useCallback((): AlertStatistics => {
    try {
      return state.stats || defaultStats;
    } catch (error) {
      console.error('[ProjectManagerProvider] Erreur getSummaryStats:', error);
      return defaultStats;
    }
  }, [state.stats]);

  // ===== Valeur du contexte =====
  const contextValue: ProjectManagerContextType = {
    manager: alertService,
    state,
    alerts: state.alerts || [],
    data: state,
    loading,
    runChecks,
    acknowledgeAlert,
    resolveAlert,
    closeAlert,
    getAlertsByType,
    getAlertsBySeverity,
    needsEscalation,
    getEscalationPath,
    getActionLabel,
    getSummaryStats
  };

  return (
    <ProjectManagerContext.Provider value={contextValue}>
      {children}
    </ProjectManagerContext.Provider>
  );
};

// ===== Exports =====
export { ProjectManagerContext };
export default ProjectManagerProvider;