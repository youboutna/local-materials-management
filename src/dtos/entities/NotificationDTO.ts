/**
 * Notification DTOs
 * Data Transfer Objects for notification operations
 */

export interface NotificationDTO {
  id: string;
  recipientId: string;
  title: string;
  
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  read: boolean;
  createdAt: string;
  updatedAt?: string;
  priority?: 'low' | 'medium' | 'high';
  expiresAt?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface CreateNotificationRequestDTO {
  recipientId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  priority?: 'low' | 'medium' | 'high';
  expiresAt?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  // Legacy fields for backward compatibility
  relatedId?: string;
  read?: boolean;
}

export interface UpdateNotificationRequestDTO {
  title?: string;
  message?: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'system';
  read?: boolean;
  priority?: 'low' | 'medium' | 'high';
  expiresAt?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface NotificationListDTO {
  notifications: NotificationDTO[];
  total: number;
  unreadCount: number;
  page?: number;
  limit?: number;
}

export interface NotificationStatsDTO {
  totalNotifications: number;
  unreadNotifications: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  recentNotifications: NotificationDTO[];
}
// Moved from src/pages/EnhancedDashboard.tsx
export interface Alert {
  id: string;
  message: string;
  type: 'insuranceExpiry' | 'bankGuarantee' | 'inspectionOverdue' | 'paymentBlocked' | 'complianceViolation' | 'delivery' | 'deadline' | 'quality';
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: 'insurance' | 'bankGuarantee' | 'inspection' | 'payment' | 'notification';
  data?: any;
}

// Moved from src/pages/NotificationsCenter.tsx
export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
  recipientId: string;
  relatedId: string | null;
  metadata: any;
}

// Moved from src/pages/PaymentControl.tsx
export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  metadata: Record<string, unknown>;
}

// Moved from src/components/admin/EscalationThresholdsSettings.tsx
export interface EscalationThreshold {
  id: string;
  thresholdType: string;
  thresholdName: string;
  thresholdValue: number;
  thresholdUnit: string;
  severityLevel: string;
  escalationLevel: number;
  description: string | null;
  isActive: boolean;
}

// Moved from src/components/notifications/NotificationCrud.tsx
export interface Notification {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  relatedId?: string | null;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
}

// Moved from src/components/notifications/NotificationCrud.tsx
export interface NotificationFormData {
  recipientId: string;
  title: string;
  message: string;
  type: string;
  relatedId: string;
}

// Moved from src/hooks/useNotifications.ts
export interface Notification {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: string;
  relatedId?: string;
  read: boolean;
  createdAt: string;
  metadata: Record<string, unknown>;
}

// Moved from src/application/services/SupplierNotificationService.ts
export interface SupplierNotificationData {
  type: 'passwordReset' | 'taskAssignment' | 'paymentRequest' | 'inspectionRequired';
  email: string;
  supplierName?: string;
  supplierId?: string;
  taskId?: string;
  taskTitle?: string;
  paymentId?: string;
  paymentAmount?: number;
  inspectionId?: string;
  inspectionDate?: string;
}

// Moved from src/application/services/SupplierNotificationService.ts
export interface CreateSupplierNotificationRequestDTO {
  data: SupplierNotificationData;
  completionUrl?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  scheduledAt?: string;
}

// Moved from src/application/services/SupplierNotificationService.ts
export interface SupplierNotificationResult {
  success: boolean;
  notificationId?: string;
  sentAt?: string;
  error?: string;
}

// Moved from src/utils/types.ts
export interface CalculationResult {

  originalLabel?: string;
  elementType?: string;
  elementLabel?: string;
  timestamp?: string;
  dimensions?: Dimensions;
  openings?: Opening[];
  results?: Record<string, number | string>;
  metadata?: {
    sourceUnit?: string;
    workType?: string;
    parsedAt?: string;
    type?: string;
    unitWeights?: number;
    unit?: string;
    description?: string;
    coverageRate?: number;
    currency?: string | null;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
    taxRate?: number | null;
    taxAmount?: number | null;
    isFixedPrice?: boolean;
    section?: string;
    originalUnit?: string;
    // Champs additionnels utilisés par le calculateur / parseurs BOQ
    imported?: boolean;
    source?: string;
    file?: string;
    resourceType?: string;
    recommendation?: boolean;
    phaseId?: string | null;
    milestoneId?: string | null;
    taskId?: string | null;
  };
}

// Moved from src/application/services/GeocodingService.ts
export interface OpenStreetMapResponse {
  placeId?: string;
  licence?: string;
  osmType?: string;
  osmId?: string;
  boundingbox?: string[];
  lat: string;
  lon: string;
  displayName: string;
  class?: string;
  type?: string;
  importance?: number;
  address?: Record<string, string | undefined>;
}

// Moved from src/application/services/GeocodingService.ts
export interface GoogleGeocodingResponse {
  status: string;
  results?: Array<{
    addressComponents?: Array<{
      longName: string;
      shortName: string;
      types: string[];
    }>;
    formattedAddress: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
      locationType: string;
    };
    placeId?: string;
    types?: string[];
  }>;
}

// Moved from src/application/services/GeocodingService.ts
export interface MapboxGeocodingResponse {
  features?: Array<{
    id?: string;
    type: string;
    placeType?: string[];
    relevance?: number;
    properties?: Record<string, unknown>;
    text?: string;
    placeName?: string;
    bbox?: number[];
    center: [number, number];
    geometry?: {
      type: string;
      coordinates: number[];
    };
    context?: Array<{
      id: string;
      text: string;
      shortCode?: string;
    }>;
  }>;
}

// Moved from src/application/services/PerformanceMonitoringService.ts
export interface EventPerformanceAlert {
  type: 'lowPerformance' | 'budgetOverrun' | 'timelineDelay' | 'qualityIssue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  projectId: string;
  message: string;
  threshold: number;
  currentValue: number;
  recommendation: string;
}

// Moved from src/application/services/TenderSubmissionNotificationService.ts
export interface TenderSubmissionNotificationData {
  supplierEmail: string;
  supplierName: string;
  tenderTitle: string;
  submissionId: string;
  secretCode: string;
  adminEmails?: string[];
}
// Moved from src/dtos/entities/AlertDTO.ts (reconciled)
export interface AlertData {
  id: string;
  type: 'insuranceExpiry' | 'projectDelay' | 'inspectionIssue' | 'financialRisk' | 'bankGuarantee' | 'inspectionOverdue' | 'paymentBlocked' | 'complianceViolation' | 'delivery' | 'deadline' | 'quality';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  projectId: string;
  relatedEntityId?: string;
  source?: 'insurance' | 'bankGuarantee' | 'inspection' | 'payment' | 'notification';
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
  // Status from monitoringAlerts table
  status?: string;
}

// Moved from src/dtos/entities/AlertDTO.ts (reconciled)
export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  inApp: boolean;
  escalationEmail: boolean;
  weeklyDigest: boolean;
  criticalOnly: boolean;
}

// Moved from src/dtos/entities/AlertDTO.ts (reconciled)
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

// Moved from src/dtos/entities/AlertDTO.ts (reconciled)
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

// Moved from src/dtos/entities/AlertDTO.ts (reconciled)
export interface BulkAlertAction {
  alertIds: string[];
  action: 'acknowledge' | 'escalate' | 'resolve' | 'assign';
  assignTo?: string;
  notes?: string;
}

// Moved from src/dtos/entities/AlertDTO.ts (reconciled)
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

// Moved from src/dtos/entities/AlertDTO.ts (reconciled)
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

// Moved from src/dtos/entities/ComplianceDTO.ts (reconciled)
export interface ComplianceAlertDTO {
  id: string;
  complianceItemId: string;
  type: 'overdue' | 'criticalPriority' | 'riskLevel' | 'mitigationRequired';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  projectId?: string;
  responsible?: string;
  createdAt: string;
}

// Moved from src/dtos/entities/InsuranceDTO.ts (reconciled)
export interface InsuranceAlertDTO {
  id: string;
  certificateId: string;
  type: 'expiring' | 'expired' | 'missing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  daysUntilExpiry?: number;
  projectId?: string;
  contractorId?: string;
  createdAt: string;
  // UI convenience fields
  alertLevel?: string;
  insuranceType?: string;
  contractorName?: string;
  policyNumber?: string;
  expiryDate?: string;
  daysRemaining?: number;
}

// Moved from src/dtos/entities/MonitoringDTOs.ts (reconciled)
export interface NotificationSummaryDTO {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  read: boolean;
  createdAt: string;
  updatedAt?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'system' | 'project' | 'payment' | 'inspection' | 'safety';
  actionable: boolean;
  actions?: NotificationActionDTO[];
  expiresAt?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

// Moved from src/dtos/entities/MonitoringDTOs.ts (reconciled)
export interface NotificationPreferencesDTO {
  email: boolean;
  push: boolean;
  sms: boolean;
  categories: {
    system: boolean;
    project: boolean;
    payment: boolean;
    inspection: boolean;
    safety: boolean;
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  quietHours: {
    start: string;
    end: string;
  };
}

// Moved from src/dtos/entities/MonitoringDTOs.ts (reconciled)
export interface NotificationActionDTO {
  id: string;
  label: string;
  type: 'button' | 'link' | 'modal';
  action: string;
  payload?: Record<string, unknown>;
}

// Moved from src/dtos/entities/MonitoringDTOs.ts (reconciled)
export interface MonitoringAlertDTO {
  id: string;
  type: 'budget' | 'schedule' | 'quality' | 'safety' | 'resource';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  projectId: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolution?: string;
}

// Moved from src/dtos/entities/PaymentInitiationDTO.ts (reconciled)
export interface PaymentInitiationNotificationDTO {
  id: string;
  projectId: string;
  phaseId?: string;
  inspectionId?: string;
  initiatedBy: string;
  initiatorRole: InitiatorRole;
  supplierId: string;
  estimatedAmount: number;
  justification: string;
  attachedDocuments: string[];
  approvalChain: ApprovalChainStep[];
  currentApprovalLevel: number;
  status: 'pendingApproval' | 'ready_for_supplier' | 'rejected' | 'completed';
  supplierDeadline?: string;
  projectTitle: string;
  supplierInfo?: SupplierInfoDTO;
  approvals?: ApprovalRecord[];
  supplierCompletion?: SupplierCompletionData;
  createdAt: string;
  updatedAt: string;
}

// Moved from src/dtos/entities/PerformanceMetricsDTO.ts (reconciled)
export interface PerformanceAlertDTO {
  type: 'warning' | 'critical';
  message: string;
  metric: string;
  value: number;
  threshold: number;
}

// Moved from src/dtos/entities/ProjectReportDTO.ts (reconciled)
export interface NotificationMetadata {
  taskType?: TaskType;
  relatedProjectId?: string;
  relatedInspectionId?: string;
  relatedDocumentId?: string;
  relatedPaymentId?: string;
  relatedMaterialId?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  assigneeName?: string;
  assignerName?: string;
  delayPercentage?: number;
  bankLiaisonEmail?: string;
  contractGuaranteeAmount?: number;
  contractorName?: string;
  engineeringConsultant?: string;
  inspectionType?: string;
  violationCount?: number;
  escalationLevel?: number;
  penaltyAmount?: number;
  complianceStandard?: string;
  paymentAmount?: number;
  paymentMethod?: string;
  documentName?: string;
  documentType?: string;
  sharedWith?: string[];
  actionRequired?: string;
  projectPhase?: string;
  completionPercentage?: number;
  approvalStatus?: string;
}

// Moved from src/dtos/entities/TenderNotificationDTO.ts (reconciled)
export interface CreateTenderNotificationRequestDTO {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  message: string;
  notificationType: TenderNotificationDTO['notificationType'];
  tenderId?: string;
  submissionId?: string;
  supplierId?: string;
  metadata?: Record<string, unknown>;
}

// Moved from src/dtos/entities/TenderNotificationDTO.ts (reconciled)
export interface UpdateTenderNotificationRequestDTO {
  id: string;
  readAt?: string;
  metadata?: Record<string, unknown>;
}

// Moved from src/dtos/entities/TenderNotificationDTO.ts (reconciled)
export interface TenderNotificationQueryDTO {
  recipientEmail?: string;
  notificationType?: TenderNotificationDTO['notificationType'];
  tenderId?: string;
  submissionId?: string;
  supplierId?: string;
  startDate?: string;
  endDate?: string;
  read?: boolean;
}

// Moved from src/dtos/entities/TenderNotificationDTO.ts (reconciled)
export interface NotificationStatsDTO {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalPending: number;
  lastSentAt?: string;
  lastFailureAt?: string;
}
