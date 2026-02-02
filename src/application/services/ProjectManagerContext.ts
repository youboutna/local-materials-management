import React, { createContext, useContext, ReactNode } from 'react';
import { ProjectManagerState, ProjectAlert, AlertType, AlertSeverity, ProjectStats } from './projectManagerWithActions';

interface ProjectManager {
  getAlertsByType: (type: AlertType) => ProjectAlert[];
  getAlertsBySeverity: (severity: AlertSeverity) => ProjectAlert[];
  getActionLabel: (alertType: AlertType) => string;
  getSummaryStats: () => ProjectStats;
  needsEscalation: (alert: ProjectAlert) => boolean;
  runChecks: () => void;
  acknowledgeAlert: (alertId: string, userId: string, actionTaken?: string) => void;
  resolveAlert: (alertId: string, userId: string, resolution?: string) => void;
  closeAlert: (alertId: string, userId: string) => void;
  getAlerts: () => ProjectAlert[];
  getState: () => ProjectManagerState;
  getEscalationPath: (alert: ProjectAlert) => string[];
}

export interface ProjectManagerContextType {
  manager: ProjectManager;
  state: ProjectManagerState;
  alerts: ProjectAlert[];
  runChecks: () => void;
  acknowledgeAlert: (alertId: string, userId: string, actionTaken?: string) => void;
  resolveAlert: (alertId: string, userId: string, resolution?: string) => void;
  closeAlert: (alertId: string, userId: string) => void;
  getAlertsByType: (type: AlertType) => ProjectAlert[];
  getAlertsBySeverity: (severity: AlertSeverity) => ProjectAlert[];
  needsEscalation: (alert: ProjectAlert) => boolean;
  getEscalationPath: (alert: ProjectAlert) => string[];
  getActionLabel: (alertType: AlertType) => string;
  getSummaryStats: () => ProjectStats;
}

interface ProjectManagerProviderProps {
  manager: ProjectManager;
  children: ReactNode;
}

export const ProjectManagerContext = createContext<ProjectManagerContextType | null>(null);

export const ProjectManagerProvider: React.FC<ProjectManagerProviderProps> = ({ manager, children }) => {
  const [state, setState] = React.useState<ProjectManagerState>(manager.getState());

  const runChecks = React.useCallback(() => {
    const newState = manager.runChecks();
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

  const getAlertsByType = React.useCallback((type: AlertType) => {
    return manager.getAlertsByType(type);
  }, [manager]);

  const getAlertsBySeverity = React.useCallback((severity: AlertSeverity) => {
    return manager.getAlertsBySeverity(severity);
  }, [manager]);

  const needsEscalation = React.useCallback((alert: ProjectAlert) => {
    return manager.needsEscalation(alert);
  }, [manager]);

  const getEscalationPath = React.useCallback((alert: ProjectAlert) => {
    return manager.getEscalationPath(alert);
  }, [manager]);

  const getActionLabel = React.useCallback((alertType: AlertType) => {
    return manager.getActionLabel(alertType);
  }, [manager]);

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

  return React.createElement(
    ProjectManagerContext.Provider,
    { value: contextValue },
    children
  );
};

export const useProjectManager = (): ProjectManagerContextType => {
  const context = useContext(ProjectManagerContext);
  if (!context) {
    throw new Error('useProjectManager must be used within a ProjectManagerProvider');
  }
  return context;
};
