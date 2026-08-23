// ============================================================
// src/contexts/ProjectManagerContext.ts
// ============================================================
/**
 * Project Manager Context
 * Updated to support AlertService with backward compatibility
 */

import { createContext } from 'react';
import { Alert, AlertStatistics, ProjectManagerState } from '@/domain/entities/Alert';
import { AlertService } from '@/application/services/AlertService';
import { T } from '@/components/i18n/T';

export const defaultState: ProjectManagerState = {
  alerts: [],
  stats: {
    totalAlerts: 0,
    criticalAlerts: 0,
    highAlerts: 0,
    mediumAlerts: 0,
    lowAlerts: 0,
    openAlerts: 0,
    acknowledgedAlerts: 0,
    resolvedAlerts: 0,
    pendingActions: 0,
    activeRisks: 0,
    overdueTasks: 0
  },
  lastUpdated: new Date().toISOString(),
  progress: 0
};

export const defaultStats: AlertStatistics = {
  totalAlerts: 0,
  criticalAlerts: 0,
  highAlerts: 0,
  mediumAlerts: 0,
  lowAlerts: 0,
  openAlerts: 0,
  acknowledgedAlerts: 0,
  resolvedAlerts: 0,
  pendingActions: 0,
  activeRisks: 0,
  overdueTasks: 0
};

export interface ProjectManagerContextType {
  manager: AlertService | null; // Updated to accept AlertService or null
  state: ProjectManagerState;
  alerts: Alert[];
  data: ProjectManagerState;
  loading?: boolean;
  runChecks: () => <T k="auto.projectmanagercontext.promise" fallback="Promise" /><void> | void; // Support both sync and async
  acknowledgeAlert: (alertId: string, userId: string, actionTaken?: string) => <T k="auto.projectmanagercontext.promise" fallback="Promise" /><boolean> | void;
  resolveAlert: (alertId: string, userId: string, resolution?: string) => <T k="auto.projectmanagercontext.promise" fallback="Promise" /><boolean> | void;
  closeAlert: (alertId: string, userId: string) => <T k="auto.projectmanagercontext.promise" fallback="Promise" /><boolean> | void;
  getAlertsByType: (type: string) => Alert[];
  getAlertsBySeverity: (severity: string) => Alert[];
  needsEscalation: (alert: Alert) => boolean;
  getEscalationPath: (alert: Alert) => string[];
  getActionLabel: (alertType: string) => string;
  getSummaryStats: () => AlertStatistics;
}

export const ProjectManagerContext = createContext<ProjectManagerContextType | null>(null);