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

// Notification types - moved from @/types/notification.ts for Rule 4 compliance
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
  task_type?: TaskType;
  related_project_id?: string;
  related_inspection_id?: string;
  related_document_id?: string;
  related_payment_id?: string;
  related_material_id?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  assignee_name?: string;
  assigner_name?: string;
  delay_percentage?: number;
  bank_liaison_email?: string;
  contract_guarantee_amount?: number;
  contractor_name?: string;
  engineering_consultant?: string;
  inspection_type?: string;
  violation_count?: number;
  escalation_level?: number;
  penalty_amount?: number;
  compliance_standard?: string;
  payment_amount?: number;
  payment_method?: string;
  document_name?: string;
  document_type?: string;
  shared_with?: string[];
  action_required?: string;
  project_phase?: string;
  completion_percentage?: number;
  approval_status?: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  title: string;
  message: string;
  type: NotificationType;
  related_id?: string;
  metadata?: NotificationMetadata;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskAssignment {
  id: string;
  project_id?: string;
  title: string;
  description?: string;
  assigned_to: string;
  assigned_by: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  completion_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Workflow-related DTOs for Rule 4 compliance
export interface WorkflowStepDTO {
  id: string;
  workflow_id: string;
  name: string;
  description?: string;
  order_index: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to?: string;
  due_date?: string;
  completion_date?: string;
  created_at: string;
  updated_at: string;
}

export interface StepDocumentDTO {
  id: string;
  step_id: string;
  title: string;
  description?: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowPhase {
  id: string;
  name: string;
  description?: string;
  order_index: number;
  stages: WorkflowStage[];
  created_at: string;
  updated_at: string;
}

export interface WorkflowStage {
  id: string;
  phase_id: string;
  name: string;
  description?: string;
  order_index: number;
  steps: WorkflowStepDTO[];
  created_at: string;
  updated_at: string;
}

export const standardWorkflow: WorkflowPhase[] = [
  {
    id: '1',
    name: 'Planification',
    description: 'Phase de planification du projet',
    order_index: 1,
    stages: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2', 
    name: 'Exécution',
    description: 'Phase d\'exécution du projet',
    order_index: 2,
    stages: [],
    created_at: new Date().toISOString(),
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
