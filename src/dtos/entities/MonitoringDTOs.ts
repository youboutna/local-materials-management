/**
 * Monitoring Data Transfer Objects
 * Centralized DTOs for all monitoring and dashboard functionality
 * Following hexagonal architecture Rule #4: DTO Centralization
 */

import { BaseEntityDTO, StandardStatus } from '../shared';
import { ProjectDTO, ProjectStatus } from './ProjectDTO';
import { PaymentDTO } from './PaymentDTO';
import { InspectionDTO } from './InspectionDTO';
import { NotificationDTO } from './NotificationDTO';
import { BankGuaranteeDTO } from './BankGuaranteeDTO';
import { InsuranceCertificateDTO } from './InsuranceDTO';

// =================== MONITORING DASHBOARD ===================

export interface MonitoringDashboardDTO extends BaseEntityDTO {
  userId: string;
  lastUpdated: string;
  widgets: MonitoringWidgetDTO[];
  filters: MonitoringFiltersDTO;
  refreshInterval: number; // in seconds
}

export interface MonitoringWidgetDTO {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'alert';
  title: string;
  position: { x: number; y: number; width: number; height: number };
  config: Record<string, unknown>;
  data: unknown;
  lastRefresh: string;
}

export interface MonitoringFiltersDTO {
  dateRange: {
    start: string;
    end: string;
  };
  projects: string[];
  status: ProjectStatus[];
  departments: string[];
  severity: ('low' | 'medium' | 'high' | 'critical')[];
}

// =================== PAYMENT CONTROL ===================

export interface PaymentControlDashboardDTO extends BaseEntityDTO {
  totalPayments: number;
  blockedPayments: number;
  pendingApprovals: number;
  overduePayments: number;
  currency: string;
  period: 'week' | 'month' | 'quarter' | 'year';
  payments: PaymentControlSummaryDTO[];
}

export interface PaymentControlSummaryDTO {
  id: string;
  projectId: string;
  projectName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'blocked' | 'overdue';
  dueDate: string;
  blockedReason?: string;
  supplier: string;
  priority: 'low' | 'medium' | 'high';
}

export interface PaymentBlockingInterfaceDTO extends BaseEntityDTO {
  paymentId: string;
  blockingReason: string;
  blockedBy: string;
  blockedAt: string;
  autoRelease: boolean;
  releaseConditions: string[];
  notifications: NotificationDTO[];
}

// =================== INSPECTION MONITORING ===================

export interface InspectionMonitoringDTO extends BaseEntityDTO {
  totalInspections: number;
  scheduledInspections: number;
  completedInspections: number;
  overdueInspections: number;
  averageScore: number;
  criticalIssues: number;
  inspections: InspectionSummaryDTO[];
}

export interface InspectionSummaryDTO {
  id: string;
  projectId: string;
  projectName: string;
  inspector: string;
  scheduledDate: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
  score?: number;
  criticalIssues: number;
  location: string;
  type: 'routine' | 'special' | 'emergency';
}

export interface InspectionScheduleDTO extends BaseEntityDTO {
  projectId: string;
  inspections: ScheduledInspectionDTO[];
  conflicts: InspectionConflictDTO[];
  availability: InspectorAvailabilityDTO[];
}

export interface ScheduledInspectionDTO {
  id: string;
  title: string;
  description: string;
  inspectorId: string;
  inspectorName: string;
  scheduledDate: string;
  duration: number; // in hours
  location: string;
  type: 'routine' | 'special' | 'emergency';
  priority: 'low' | 'medium' | 'high';
  dependencies: string[]; // other inspection IDs
}

export interface InspectionConflictDTO {
  inspectionId1: string;
  inspectionId2: string;
  inspectorId: string;
  conflictType: 'double_booking' | 'travel_time' | 'skill_mismatch';
  resolution?: string;
}

export interface InspectorAvailabilityDTO {
  inspectorId: string;
  inspectorName: string;
  availableSlots: TimeSlotDTO[];
  skills: string[];
  location: string;
  maxInspectionsPerDay: number;
}

export interface TimeSlotDTO {
  start: string;
  end: string;
  available: boolean;
}

// =================== NOTIFICATIONS CENTER ===================

export interface NotificationCenterDTO extends BaseEntityDTO {
  userId: string;
  totalNotifications: number;
  unreadNotifications: number;
  notifications: NotificationSummaryDTO[];
  preferences: NotificationPreferencesDTO;
}

export interface NotificationSummaryDTO {
  id: string;
  recipient_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  read: boolean;
  created_at: string;
  updated_at?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'system' | 'project' | 'payment' | 'inspection' | 'safety';
  actionable: boolean;
  actions?: NotificationActionDTO[];
  expires_at?: string;
  action_url?: string;
  metadata?: Record<string, unknown>;
}

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

export interface NotificationActionDTO {
  id: string;
  label: string;
  type: 'button' | 'link' | 'modal';
  action: string;
  payload?: Record<string, unknown>;
}

// =================== INSURANCE MANAGEMENT ===================

export interface InsuranceMonitoringDTO extends BaseEntityDTO {
  totalPolicies: number;
  activePolicies: number;
  expiredPolicies: number;
  expiringSoon: number;
  totalCoverage: number;
  totalPremium: number;
  policies: InsuranceSummaryDTO[];
}

export interface InsuranceSummaryDTO extends InsuranceCertificateDTO {
  status: 'active' | 'expired' | 'expiring_soon' | 'cancelled';
  daysUntilExpiry: number;
  coverageUtilization: number;
  claimsCount: number;
  lastClaimDate?: string;
  renewalReminder: boolean;
}

export interface InsuranceClaimsDTO extends BaseEntityDTO {
  policyId: string;
  claimNumber: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid';
  amount: number;
  currency: string;
  submittedDate: string;
  description: string;
  documents: string[];
  assessment?: string;
  settlementDate?: string;
}

// =================== COMPREHENSIVE MONITORING ===================

export interface ComprehensiveMonitoringDTO extends BaseEntityDTO {
  userId: string;
  overview: MonitoringOverviewDTO;
  projects: ProjectMonitoringDTO[];
  alerts: MonitoringAlertDTO[];
  performance: PerformanceMetricsDTO;
}

export interface MonitoringOverviewDTO {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  atRiskProjects: number;
  delayedProjects: number;
  totalBudget: number;
  spentBudget: number;
  budgetUtilization: number;
  healthScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  teamSize: number;
  openTasks: number;
  overdueTasks: number;
}

export interface ProjectMonitoringDTO {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  budget: number;
  progress: number;
  healthScore: number;
  riskLevel: 'faible' | 'moyen' | 'eleve' | 'critique';
  milestonesProgress: number;
  budgetUtilization: number;
  teamPerformance: number;
  upcomingDeadlines: string[];
  recentActivities: ProjectActivityDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectActivityDTO {
  id: string;
  type: 'task_completed' | 'milestone_reached' | 'issue_raised' | 'document_uploaded';
  description: string;
  timestamp: string;
  userId: string;
  projectId: string;
}

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

export interface PerformanceMetricsDTO {
  productivity: number;
  quality: number;
  safety: number;
  budget: number;
  schedule: number;
  team: number;
  overall: number;
  trend: 'improving' | 'stable' | 'declining';
}

// =================== DOCUMENTS MANAGEMENT ===================

export interface DocumentsDashboardDTO extends BaseEntityDTO {
  totalDocuments: number;
  recentUploads: number;
  expiringDocuments: number;
  missingDocuments: number;
  storageUsed: number; // in MB
  storageQuota: number; // in MB
  documents: DocumentSummaryDTO[];
}

export interface DocumentSummaryDTO {
  id: string;
  name: string;
  type: string;
  category: 'contract' | 'technical' | 'legal' | 'financial' | 'safety';
  projectId: string;
  projectName: string;
  uploadedBy: string;
  uploadedAt: string;
  size: number; // in KB
  expiresAt?: string;
  status: 'active' | 'expired' | 'archived';
  accessLevel: 'public' | 'restricted' | 'confidential';
}

export interface DocumentFiltersDTO {
  category?: string;
  type?: string;
  projectId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  status?: string;
  accessLevel?: string;
  search?: string;
}
