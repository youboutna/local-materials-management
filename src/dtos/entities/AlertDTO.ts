// ============================================================
// src/dtos/entities/AlertDTO.ts
// ============================================================
/**
 * Alert DTO - Hexagonal Architecture
 * Data Transfer Object for alerts
 */

import {
  Alert,
  AlertType,
  AlertSeverity,
  AlertStatus,
  AlertSource,
  AlertStatistics,
  ActionProof,
  ActionProofType
} from '@/domain/entities/Alert';

// ===== DTO spécifiques à l'UI =====
export interface AlertDTO extends Alert {
  displayName?: string;
  formattedDate?: string;
  formattedTriggerDate?: string;
  formattedDeadline?: string;
  icon?: string;
  color?: string;
  severityLabel?: string;
  statusLabel?: string;
  isOverdue?: boolean;
  daysUntilDeadline?: number;
}

export interface AlertStatisticsDTO extends AlertStatistics {
  formattedAvgResolutionTime?: string;
  criticalPercentage?: number;
  resolutionRate?: number;
  formattedTotal?: string;
}

export interface AlertStateDTO {
  alerts: AlertDTO[];
  stats: AlertStatisticsDTO;
  lastUpdated: string;
  progress?: number;
}

// ===== Filtres et actions =====
export interface AlertFilter {
  severity?: AlertSeverity;
  type?: AlertType;
  status?: AlertStatus;
  source?: AlertSource;
  acknowledged?: boolean;
  projectId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface BulkAlertAction {
  alertIds: string[];
  action: 'acknowledge' | 'escalate' | 'resolve' | 'assign';
  assignTo?: string;
  notes?: string;
}

export interface CreateAlertData {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  projectId: string;
  projectTitle?: string;
  relatedEntityId?: string;
  source?: AlertSource;
  delayDays?: number;
  actionRequired?: boolean;
  availableActions?: string[];
  deadline?: string;
  recurrence?: number;
}

export interface UpdateAlertData {
  severity?: AlertSeverity;
  title?: string;
  message?: string;
  acknowledged?: boolean;
  acknowledgedBy?: string;
  actionTaken?: string;
  actionTakenBy?: string;
  escalationLevel?: number;
  availableActions?: string[];
  actionProof?: ActionProof[];
  deadline?: string;
}

// ===== Notification Preferences =====
export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  inApp: boolean;
  escalationEmail: boolean;
  weeklyDigest: boolean;
  criticalOnly: boolean;
}