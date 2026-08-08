/**
 * Alert DTO - Hexagonal Architecture
 * Data Transfer Object for alerts and notifications
 */



export interface ActionProofData {
  type: 'email' | 'sms' | 'document' | 'call' | 'meeting';
  timestamp: string;
  performedBy: string;
  details: string;
  documentUrl?: string;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  inApp: boolean;
  escalationEmail: boolean;
  weeklyDigest: boolean;
  criticalOnly: boolean;
}

export interface EscalationRule {
  id: string;
  alertType: string;
  severityLevel: 'low' | 'medium' | 'high' | 'critical';
  timeThreshold: number; // minutes
  escalationLevel: number;
  targetRole: string;
  actionRequired: string[];
  autoAssign: boolean;
}

export interface AlertMetrics {
  totalAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  lowAlerts: number;
  acknowledgedAlerts: number;
  unacknowledgedAlerts: number;
  overdue: number;
  avgResolutionTime: number; // hours
  alertsByType: { [type: sthigh' | 'critical';
  type?: string;
  acknowledged?: boolean;
  projectId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface BulkAlertAction {
 AlertData['type'];
  severity: AlertData['severity'];
  title: string;
  message: string;
  projectId: string;
  relatedEntityId?: string;
  source?: AlertData['source'];
  proje
  acknowledged?: boolean;
  acknowledgedBy?: string;
  actionTaken?: string;
  actionTakenBy?: string;
  escalationLevel?: number;
  availableActions?: string[];
  actionProof?: ActionProofData[];
  deadline?: string;
}