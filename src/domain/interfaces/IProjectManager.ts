// ============================================================
// src/domain/interfaces/IProjectManager.ts
// ============================================================
/**
 * Project Manager Interface (Port)
 * Pure business logic - NO external dependencies
 * NO React dependencies
 */

import { Alert, ProjectManagerState, AlertStatistics } from '@/domain/entities/Alert';

export interface IProjectManager {
  getAlertsByType: (type: string) => Alert[];
  getAlertsBySeverity: (severity: string) => Alert[];
  getActionLabel: (alertType: string) => string;
  getSummaryStats: () => AlertStatistics;
  needsEscalation: (alert: Alert) => boolean;
  runChecks: () => void;
  runAllChecks: () => ProjectManagerState;
  acknowledgeAlert: (alertId: string, userId: string, actionTaken?: string) => void;
  resolveAlert: (alertId: string, userId: string, resolution?: string) => void;
  closeAlert: (alertId: string, userId: string) => void;
  getAlerts: () => Alert[];
  getState: () => ProjectManagerState;
  getEscalationPath: (alert: Alert) => string[];
}