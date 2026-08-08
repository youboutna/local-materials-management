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

export interface EnhancedPhaseDTO extends BaseEntityDTO {: string;
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
  escalationLeetionDate?: string;
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

export const standardWorkflow: WorkflowPt: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Contrôle',
    description: 'Phase de contrôle et validation',
    order_index: 3,
    stages: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Import/Export related types
export interface ImportOptions {
  skipDuplicates?: boolean;
  validateData?: boolean;
  updateExistingessage?: string;
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
  spentAmoun