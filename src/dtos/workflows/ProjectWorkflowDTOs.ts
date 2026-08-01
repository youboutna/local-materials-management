/**
 * Project Workflow DTOs
 * DTOs for project workflow operations following hexagonal architecture
 * Following clean code principles: camelCase only, no business logic
 * All entity DTOs imported from entity files - no duplication
 */
import { ProjectDTO } from '../entities/ProjectDTO';
import { PhaseDTO } from '../entities/PhaseDTO';
import { MaterialDTO } from '../entities/MaterialDTO';
import { RiskDTO } from '../entities/RiskDTO';
import { TaskDTO } from '../entities/TaskDTO';
import { EmployeeDTO } from '../entities/EmployeeDTO';
import { InspectionDTO } from '../entities/InspectionDTO';
import { DocumentDTO } from '../entities/DocumentDTO';
import { InsuranceCertificateDTO } from '../entities/InsuranceDTO';
import { BankGuaranteeDTO } from '../entities/BankGuaranteeDTO';
import { ComplianceItemDTO } from '../entities/ComplianceDTO';
import { ProjectStrategyLinkDTO } from '../entities/ProjectStrategyLinkDTO';
import { ProjectBudgetLinkDTO } from '../entities/ProjectBudgetLinkDTO';
import { MilestoneDTO } from '../entities/MilestoneDTO';
import { ProjectStakeholderDTO } from '../entities/ProjectStakeholderDTO';
import type { BoqLineDTO } from '../boq/BoqLineDTO';

export interface ProjectWorkflowData {
  projectId?: string;
  currentStep: number;
  isDraft: boolean;
  isComplete: boolean;
  projectData: ProjectDTO;
  relatedData?: StepRelatedDataDTO;
  metadata: WorkflowMetadataDTO;
}

export interface WorkflowMetadataDTO {
  lastSavedAt: string;
  totalSteps: number;
  completedSteps: number;
  progressPercentage: number;
  stepName?: string;
}

export interface StepRelatedDataDTO {
  phases?: PhaseDTO[];
  milestones?: MilestoneDTO[];
  dqeLines?: BoqLineDTO[];
  risks?: RiskDTO[];
  materials?: MaterialDTO[];
  stakeholders?: ProjectStakeholderDTO[];
  compliance?: ComplianceDataDTO;
  tasks?: TaskDTO[];
  inspections?: InspectionDTO[];
  strategyLinks?: ProjectStrategyLinkDTO[];
  budgetLinks?: ProjectBudgetLinkDTO[];
}

export interface ComplianceDataDTO {
  regulations: ComplianceItemDTO[];
  certifications: InsuranceCertificateDTO[];
  standards: BankGuaranteeDTO[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  documents: DocumentDTO[];
}

export interface SaveContextDTO {
  currentStep: number;
  totalSteps: number;
  isDraft?: boolean;
  isComplete?: boolean;
}

export interface SaveResult {
  success: boolean;
  data?: unknown;
  errors?: string[];
  warnings?: string[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isRequired: boolean;
  order: number;
  dependencies?: string[];
  validation?: {
    rules: string[];
    requiredFields: string[];
  };
}

export interface WorkflowTransition {
  fromStep: string;
  toStep: string;
  condition: string;
  action?: string;
}

export interface WorkflowState {
  currentStep: string;
  completedSteps: string[];
  availableTransitions: WorkflowTransition[];
  validation: ValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ProjectCreationWorkflowDTO extends ProjectDTO {
  workflowState: WorkflowState;
  validationResults: ValidationResult[];
  saveContext: SaveContextDTO;
  transitions: WorkflowTransition[];
}

export interface WorkflowTemplateDTO {
  id: string;
  name: string;
  description: string;
  category: 'project_creation' | 'project_edit' | 'procurement' | 'inspection' | 'compliance';
  steps: WorkflowStep[];
  defaultSettings: {
    allowSkipSteps: boolean;
    requireValidation: boolean;
    autoSave: boolean;
    maxRetries: number;
  };
  isActive: boolean;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowSessionDTO {
  sessionId: string;
  workflowId: string;
  templateId: string;
  userId?: string;
  startTime: string;
  lastActivityTime: string;
  currentState: WorkflowState;
  completedSteps: string[];
  skippedSteps: string[];
  auditLog: WorkflowAuditLogDTO[];
  metrics: WorkflowMetricsDTO;
  isActive: boolean;
  expiresAt?: string;
}

export interface WorkflowAuditLogDTO {
  id: string;
  workflowId: string;
  action: 'step_completed' | 'step_skipped' | 'data_saved' | 'workflow_completed' | 'error_occurred';
  stepNumber?: number;
  details: Record<string, unknown>;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
}

export interface WorkflowMetricsDTO {
  totalSteps: number;
  completedSteps: number;
  averageTimePerStep: number; // in minutes
  totalElapsedTime: number; // in minutes
  validationErrors: number;
  saveOperations: number;
  userInteractions: number;
  completionRate: number;
  abandonmentRate?: number;
}

export interface ProjectValidationDTO {
  reception_status: 'pending' | 'provisional' | 'definitive';
  closure_notes: string;
  finalInspection: {
    date: string;
    inspector: string;
    result: 'passed' | 'failed' | 'pending';
    score?: number;
    notes?: string;
  };
  clientAcceptance: {
    accepted: boolean;
    date?: string;
    representative?: string;
    notes?: string;
  };
  handoverDocumentation: DocumentDTO[];
}

export interface StepProgressDTO {
  stepNumber: number;
  stepName: string;
  isCompleted: boolean;
  progress: number;
  hasErrors: boolean;
  lastSavedAt?: string;
}
