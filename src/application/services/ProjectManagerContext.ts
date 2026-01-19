import React, { createContext, useContext, ReactNode } from 'react';
import { ProjectManagerState, ProjectAlert } from './projectManagerWithActions';

export interface ProjectManagerContextType {
  manager: any;
  state: ProjectManagerState;
  alerts: ProjectAlert[];
  runChecks: () => void;
  acknowledgeAlert: (alertId: string, userId: string, actionTaken?: string) => void;
  resolveAlert: (alertId: string, userId: string, resolution?: string) => void;
  closeAlert: (alertId: string, userId: string) => void;
  getAlertsByType: (type: string) => ProjectAlert[];
  getAlertsBySeverity: (severity: string) => ProjectAlert[];
  needsEscalation: (alert: ProjectAlert) => boolean;
  getEscalationPath: (alert: ProjectAlert) => string[];
  getActionLabel: (alertType: string) => string;
  getSummaryStats: () => any;
}

export const ProjectManagerContext = createContext<ProjectManagerContextType | null>(null);

export const ProjectManagerProvider: React.FC<{
  manager: any;
  children: ReactNode;
}> = ({ manager, children }) => {
  const [state, setState] = React.useState<ProjectManagerState>(manager.getState());

  const runChecks = React.useCallback(() => {
    const newState = manager.runAllChecks();
    setState(newState);
  }, [manager]);

  const acknowledgeAlert = React.useCallback((alertId: string, userId: string, actionTaken?: string) => {
    manager.acknowledgeAlert(alertId, userId, actionTaken);
    const newState = manager.getState();
    setState(newState);
  }, [manager]);

  const resolveAlert = React.useCallback((alertId: string, userId: string, resolution?: string) => {
    manager.resolveAlert(alertId, userId, resolution);
    const newState = manager.getState();
    setState(newState);
  }, [manager]);

  const closeAlert = React.useCallback((alertId: string, userId: string) => {
    manager.closeAlert(alertId, userId);
    const newState = manager.getState();
    setState(newState);
  }, [manager]);

  const getAlertsByType = React.useCallback((type: string) => {
    return manager.getAlertsByType(type as any);
  }, [manager]);

  const getAlertsBySeverity = React.useCallback((severity: string) => {
    return manager.getAlertsBySeverity(severity as any);
  }, [manager]);

  const needsEscalation = React.useCallback((alert: ProjectAlert) => {
    return manager.needsEscalation(alert);
  }, []);

  const getEscalationPath = React.useCallback((alert: ProjectAlert) => {
    return manager.getEscalationPath(alert);
  }, []);

  const getActionLabel = React.useCallback((alertType: string) => {
    return manager.getActionLabel(alertType as any);
  }, []);

  const getSummaryStats = React.useCallback(() => {
    return manager.getSummaryStats();
  }, [manager]);

  const contextValue: ProjectManagerContextType = {
    manager,
    state,
    alerts: manager.getAlerts(),
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

export const useProjectManager = (): ProjectManagerContextType => {
  const context = useContext(ProjectManagerContext);
  if (!context) {
    throw new Error('useProjectManager must be used within a ProjectManagerProvider');
  }
  return context;
};
