/**
 * Project Report DTOs
 * Data Transfer Objects for project reporting functionality
 * Following hexagonal architecture principles
 */

import { BaseEntityDTO } from '../shared';

// Report Data Types
export interface ProjectReportDTO extends BaseEntityDTO {
  projectId: string;
  reportType: 'phase' | 'inspection' | 'financial' | 'risk' | 'milestone' | 'summary';
  generatedAt: string;
  generatedBy: string;
  data: ReportData;
}

export interface ReportData {
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
  charts?: {
    type: string;
    data: unknown;
  config?: Record<string, unknown>;
  }[];
  tables?: {
    headers: string[];
    rows: unknown[][];
    config?: Record<string, unknown>;
  }[];
}

export interface CostCalculation {
  directCosts: number;
  indirectCosts: number;
  totalCost: number;
  currency: string;
  breakdown: {
    labor: number;
    materials: number;
    equipment: number;
    overhead: number;
    profit: number;
  };
}

export interface EnhancedPhaseDTO extends BaseEntityDTO {
  id: string;
  name: string;
  status: string;
  progress: number;
  startDate: string;
  endDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  budget: number;
  actualCost: number;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    progress: number;
    assignee?: string;
  }>;
  milestones: Array<{
    id: string;
    title: string;
    date: string;
    status: string;
    progress?: number;
  }>;
}

export interface ProjectAnalyticsDTO extends BaseEntityDTO {
  projectId: string;
  totalBudget: number;
  spentBudget: number;
  remainingBudget: number;
  budgetUtilization: number;
  schedulePerformance: {
    onTimeCompletion: number;
    delayedTasks: number;
    averageDelay: number;
  };
  costPerformance: {
    costVariance: number;
    costEfficiency: number;
  estimatedVsActual: number;
  };
  qualityMetrics: {
    inspectionPassRate: number;
    defectRate: number;
    reworkRate: number;
    qualityScore: number;
  };
  riskMetrics: {
    totalRisks: number;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
    averageRiskScore: number;
    mitigatedRisks: number;
  };
}

export interface FinancialMetricsDTO extends BaseEntityDTO {
  projectId: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  cashFlow: Array<{
    period: string;
    inflow: number;
    outflow: number;
  }>;
  budgetVariance: number;
  costsBreakdown: {
    labor: number;
    materials: number;
    equipment: number;
    subcontractors: number;
    overhead: number;
  };
}

export interface RiskAssessmentDTO extends BaseEntityDTO {
  id: string;
  projectId: string;
  riskTitle: string;
  riskDescription: string;
  riskCategory: 'technical' | 'financial' | 'operational' | 'strategic' | 'compliance' | 'safety' | 'environmental';
  probability: number;
  impact: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  mitigationStrategy: string;
  mitigationCost?: number;
  assignedTo?: string;
  dueDate: string;
  status: 'open' | 'in_progress' | 'mitigated' | 'closed' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface RiskItemDTO extends BaseEntityDTO {
  id: string;
  riskAssessmentId: string;
  description: string;
  probability: number;
  impact: number;
  costToMitigate: number;
  mitigationAction: string;
  responsible: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

// Notification types - moved from @/dtos/types/notification.ts for Rule 4 compliance
export type NotificationType = 
  | 'task_assignment' 
  | 'task_completed'
  | 'task_overdue'
  | 'project_update' 
  | 'project_created'
  | 'project_completed'
  | 'project_milestone'
  | 'inspection_required' 
  | 'payment_due' 
  | 'payment_completed'
  | 'payment_failed'
  | 'payment_pending'
  | 'document_review' 
  | 'document_shared'
  | 'document_approved'
  | 'document_rejected'
  | 'document_uploaded'
  | 'system'
  | 'delay_warning'
  | 'bank_guarantee_trigger'
  | 'inspection_overdue'
  | 'contractor_penalty'
  | 'compliance_alert'
  | 'escalation_required'
  | 'insurance_expiry'
  | 'insurance_update'
  | 'payment_blocked'
  | 'payment_warning';

export type TaskType = 
  | 'project' 
  | 'inspection' 
  | 'document' 
  | 'payment' 
  | 'material' 
  | 'insurance'
  | 'general';

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

export interface Notification {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedId?: string;
  metadata?: NotificationMetadata;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskAssignment {
  id: string;
  projectId?: string;
  title: string;
  description?: string;
  assignedTo: string;
  assignedBy: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: string;
  completionDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Workflow-related DTOs for Rule 4 compliance
export interface WorkflowStepDTO {
  id: string;
  workflowId: string;
  name: string;
  description?: string;
  orderIndex: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  dueDate?: string;
  completionDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StepDocumentDTO {
  id: string;
  stepId: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowPhase {
  id: string;
  name: string;
  description?: string;
  orderIndex: number;
  stages: WorkflowStage[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStage {
  id: string;
  phaseId: string;
  name: string;
  description?: string;
  orderIndex: number;
  steps: WorkflowStepDTO[];
  createdAt: string;
  updatedAt: string;
}

export const standardWorkflow: WorkflowPhase[] = [
  {
    id: '1',
    name: 'Planification',
    description: 'Phase de planification du projet',
    orderIndex: 1,
    stages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2', 
    name: 'Exécution',
    description: 'Phase d\'exécution du projet',
    orderIndex: 2,
    stages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Contrôle',
    description: 'Phase de contrôle et validation',
    orderIndex: 3,
    stages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Import/Export related types
export interface ImportOptions {
  skipDuplicates?: boolean;
  validateData?: boolean;
  updateExisting?: boolean;
  dryRun?: boolean;
  format?: 'json' | 'csv' | 'xlsx';
  maxFileSize?: number;
  allowedFormats?: string[];
  allowedMimeTypes?: string[];
  validationRules?: Array<{
    field: string;
    required: boolean;
    type: string;
  }>;
}

export interface ImportResult {
  success: boolean;
  message?: string;
  importedCount?: number;
  imported?: number;
  skipped?: number;
  failed?: number;
  errors?: string[];
  warnings?: string[];
  importedProjects?: any[];
}

// Financial metrics DTO for reporting
export interface FinancialMetricsDTO {
  totalBudget: number;
  totalSpent: number;
  spentAmount?: number;
  remainingBudget: number;
  estimatedCost: number;
  actualCost: number;
  actualPhaseCost: number;
  costVariance: number;
  costEfficiency: number;
  costPerformance: number;
  budgetUtilization?: number;
}
