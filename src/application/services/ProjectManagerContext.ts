/**
 * Project Manager Types and Interfaces
 * Pure business logic types for project management
 * Following hexagonal architecture - no React dependencies in service layer
 */

// Types for ProjectManager
export type AlertType = 'budget_alert' | 'schedule_alert' | 'quality_alert' | 'risk_alert';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ProjectAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
  acknowledged?: boolean;
}

export interface ProjectStats {
  totalAlerts: number;
  criticalAlerts: number;
  activeRisks: number;
  overdueTasks: number;
}

export interface ProjectManagerState {
  alerts: ProjectAlert[];
  stats: ProjectStats;
  lastUpdated: string;
}

export interface ProjectManager {
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