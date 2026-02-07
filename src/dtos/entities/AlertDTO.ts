/**
 * Alert DTO - Hexagonal Architecture
 * Data Transfer Object for alerts and notifications
 */

export interface AlertData {
  id: string;
  type: 'insurance_expiry' | 'project_delay' | 'inspection_issue' | 'financial_risk' | 'bank_guarantee' | 'inspection_overdue' | 'payment_blocked' | 'compliance_violation' | 'delivery' | 'deadline' | 'quality';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  projectId: string;
  relatedEntityId?: string;
  source?: 'insurance' | 'bank_guarantee' | 'inspection' | 'payment' | 'notification';
  projectTitle?: string;
  delayDays?: number;
  timestamp: string;
  triggerDate: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  actionRequired: boolean;
  actionTaken?: string;
  actionTakenBy?: string;
  actionTakenAt?: string;
  escalationLevel?: number;
  availableActions?: string[];
  actionProof?: ActionProofData[];
  deadline?: string;
  recurrence?: number;
  // Status from monitoring_alerts table
  status?: string;
}

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
  alertsByType: { [type: string]: number };
  alertsTrend: Array<{
    date: string;
    count: number;
    severity: string;
  }>;
}

export interface AlertFilter {
  severity?: 'low' | 'medium' | 'high' | 'critical';
  type?: string;
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
  type: AlertData['type'];
  severity: AlertData['severity'];
  title: string;
  message: string;
  projectId: string;
  relatedEntityId?: string;
  source?: AlertData['source'];
  projectTitle?: string;
  delayDays?: number;
  actionRequired?: boolean;
  availableActions?: string[];
  deadline?: string;
  recurrence?: number;
}

export interface UpdateAlertData {
  severity?: AlertData['severity'];
  title?: string;
  message?: string;
  acknowledged?: boolean;
  acknowledgedBy?: string;
  actionTaken?: string;
  actionTakenBy?: string;
  escalationLevel?: number;
  availableActions?: string[];
  actionProof?: ActionProofData[];
  deadline?: string;
}
