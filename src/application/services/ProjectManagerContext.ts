/**
 * Project Manager Types and Interfaces
 * Pure business logic types for project management
 * Following hexagonal architecture - no React dependencies in service layer
 */
import { 
  Alert, 
  AlertStatistics, 
  AlertStatus, 
  AlertType, 
  AlertSeverity, 
  AlertSource,
  AlertEntity
} from '@/domain/entities/Alert';
import { 
  IAlertRepository, 
  AlertFilter 
} from '@/domain/repositories/IAlertRepository';
import { 
  AlertDTO, 
  AlertStatisticsDTO, 
  AlertStateDTO,
  CreateAlertData,
  UpdateAlertData,
  AlertFilter as AlertFilterDTO
} from '@/dtos/entities/AlertDTO';
import { AlertTransformer } from '@/dtos/transforms/AlertTransformer';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export interface ProjectManagerState {
  alerts: Alert[];
  stats: AlertStatistics;
  lastUpdated: string;
}

export interface ProjectManager {
  getAlertsByType: (type: AlertType) => Alert[];
  getAlertsBySeverity: (severity: AlertSeverity) => Alert[];
  getActionLabel: (alertType: AlertType) => string;
  getSummaryStats: () => AlertStatistics;
  needsEscalation: (alert: Alert) => boolean;
  runChecks: () => void;
  acknowledgeAlert: (alertId: string, userId: string, actionTaken?: string) => void;
  resolveAlert: (alertId: string, userId: string, resolution?: string) => void;
  closeAlert: (alertId: string, userId: string) => void;
  getAlerts: () => Alert[];
  getState: () => ProjectManagerState;
  getEscalationPath: (alert: Alert) => string[];
}

export interface ProjectManagerContextType {
  manager: ProjectManager;
  state: ProjectManagerState;
  alerts: Alert[];
  runChecks: () => void;
  acknowledgeAlert: (alertId: string, userId: string, actionTaken?: string) => void;
  resolveAlert: (alertId: string, userId: string, resolution?: string) => void;
  closeAlert: (alertId: string, userId: string) => void;
  getAlertsByType: (type: AlertType) => Alert[];
  getAlertsBySeverity: (severity: AlertSeverity) => Alert[];
  needsEscalation: (alert: Alert) => boolean;
  getEscalationPath: (alert: Alert) => string[];
  getActionLabel: (alertType: AlertType) => string;
  getSummaryStats: () => AlertStatistics;
}