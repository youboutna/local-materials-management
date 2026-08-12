// ============================================================
// src/domain/repositories/IProjectManagerRepository.ts
// ============================================================
/**
 * Project Manager Repository Interface (Port)
 * Pure business logic - NO external dependencies
 */

import { AlertSeverity, AlertType } from '@/domain/entities/Alert';

export interface IProjectManagerRepository {
  getAlerts(): Promise<Alert[]>;
  getAlertsByType(type: AlertType): Promise<Alert[]>;
  getAlertsBySeverity(severity: AlertSeverity): Promise<Alert[]>;
  acknowledgeAlert(alertId: string, userId: string): Promise<void>;
  resolveAlert(alertId: string, userId: string, resolution?: string): Promise<void>;
  closeAlert(alertId: string, userId: string): Promise<void>;
  getProject(): Promise<Project>;
  updateProject(project: Project): Promise<void>;
}