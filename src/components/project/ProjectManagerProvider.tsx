// services/ProjectManagerProvider.tsx
import React, { useState, useCallback, ReactNode } from "react";
import {
  ProjectManager,
  ActionLabels,
  ProjectAlert as ManagerAlert,
  ProjectManagerState as ManagerState
} from "@/application/services/projectManagerWithActions";
// Import types from service layer (pure business logic)
import {
  ProjectManagerContextType,
  ProjectAlert,
  ProjectStats,
  ProjectManagerState,
  AlertType,
  AlertSeverity
} from "@/application/services/ProjectManagerContext";
// Create a simple context for React component (UI layer)
import { createContext } from "react";

const ProjectManagerContext = createContext<ProjectManagerContextType | null>(null);
import { EscalationRoles, ProjectData } from "@/types/project";

// Adapter function to convert manager alert to context alert
const adaptAlert = (alert: ManagerAlert): ProjectAlert => ({
  id: alert.id,
  type: (alert.type === 'budget' ? 'budget_alert' : 
         alert.type === 'timeline' ? 'schedule_alert' : 
         alert.type === 'quality' ? 'quality_alert' : 'risk_alert') as AlertType,
  severity: alert.severity as AlertSeverity,
  message: alert.description || alert.title,
  timestamp: alert.createdAt,
  acknowledged: alert.status === 'acknowledged' || alert.status === 'resolved'
});

// Adapter function to convert manager state to context state
const adaptState = (managerState: ManagerState): ProjectManagerState => ({
  alerts: managerState.alerts.map(adaptAlert),
  stats: {
    totalAlerts: managerState.totalAlerts,
    criticalAlerts: managerState.criticalAlerts,
    activeRisks: managerState.alerts.filter(a => a.type === 'risk' && a.status === 'open').length,
    overdueTasks: 0
  },
  lastUpdated: managerState.lastCheck
});

export const ProjectManagerProvider: React.FC<{
  project: ProjectData;
  roles: EscalationRoles;
  actionLabels: ActionLabels;
  children: ReactNode;
}> = ({ project, roles, children, actionLabels }) => {
  const [manager] = useState(() => new ProjectManager(project as any, roles, actionLabels));
  const [state, setState] = useState<ProjectManagerState | null>(null);

  const runChecks = useCallback(async () => {
    const result = manager.runAllChecks();
    setState(adaptState(result));
  }, [manager]);

  const acknowledgeAlert = useCallback(
    (alertId: string, userId: string, actionTaken?: string) => {
      manager.acknowledgeAlert(alertId, userId, actionTaken);
      runChecks();
    },
    [manager, runChecks]
  );

  const resolveAlert = useCallback(
    (alertId: string, userId: string, resolution?: string) => {
      manager.resolveAlert(alertId, userId, resolution);
      runChecks();
    },
    [manager, runChecks]
  );

  const closeAlert = useCallback(
    (alertId: string, userId: string) => {
      manager.closeAlert(alertId, userId);
      runChecks();
    },
    [manager, runChecks]
  );

  const getAlertsByType = useCallback((type: AlertType): ProjectAlert[] => {
    const typeMap: Record<AlertType, string> = {
      'budget_alert': 'budget',
      'schedule_alert': 'timeline',
      'quality_alert': 'quality',
      'risk_alert': 'risk'
    };
    return manager.getAlertsByType(typeMap[type] as any).map(adaptAlert);
  }, [manager]);

  const getAlertsBySeverity = useCallback((severity: AlertSeverity): ProjectAlert[] => {
    return manager.getAlertsBySeverity(severity as any).map(adaptAlert);
  }, [manager]);

  const needsEscalation = useCallback((alert: ProjectAlert) => {
    // Find original alert and check escalation
    const originalAlerts = manager.getAlerts();
    const originalAlert = originalAlerts.find(a => a.id === alert.id);
    return originalAlert ? manager.needsEscalation(originalAlert) : false;
  }, [manager]);

  const getEscalationPath = useCallback((alert: ProjectAlert): string[] => {
    const originalAlerts = manager.getAlerts();
    const originalAlert = originalAlerts.find(a => a.id === alert.id);
    return originalAlert ? manager.getEscalationPath(originalAlert) : [];
  }, [manager]);

  const getActionLabel = useCallback((alertType: AlertType): string => {
    const typeMap: Record<AlertType, string> = {
      'budget_alert': 'budget',
      'schedule_alert': 'timeline',
      'quality_alert': 'quality',
      'risk_alert': 'risk'
    };
    return manager.getActionLabel(typeMap[alertType] as any);
  }, [manager]);

  const getSummaryStats = useCallback((): ProjectStats => {
    const stats = manager.getSummaryStats();
    return {
      totalAlerts: stats.totalAlerts,
      criticalAlerts: stats.criticalAlerts,
      activeRisks: manager.getAlerts().filter(a => a.type === 'risk' && a.status === 'open').length,
      overdueTasks: 0
    };
  }, [manager]);

  // Create a wrapper that implements the ProjectManager interface expected by context
  const managerWrapper = {
    getAlertsByType,
    getAlertsBySeverity,
    getActionLabel,
    getSummaryStats,
    needsEscalation,
    runChecks,
    acknowledgeAlert,
    resolveAlert,
    closeAlert,
    getAlerts: () => manager.getAlerts().map(adaptAlert),
    getState: () => state || adaptState(manager.getState()),
    getEscalationPath
  };

  const defaultState: ProjectManagerState = {
    alerts: [],
    stats: { totalAlerts: 0, criticalAlerts: 0, activeRisks: 0, overdueTasks: 0 },
    lastUpdated: new Date().toISOString()
  };

  return (
    <ProjectManagerContext.Provider
      value={{
        data: state || defaultState,
        runChecks,
        acknowledgeAlert
      }}
    >
      {children}
    </ProjectManagerContext.Provider>
  );
};