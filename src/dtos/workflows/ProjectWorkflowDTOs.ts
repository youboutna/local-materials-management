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
import { TaskAssignmentDTO } from '../entities/TaskAssignmentDTO';
import { EmployeeDTO } from '../entities/EmployeeDTO';
import { InspectionDTO } from '../entities/InspectionDTO';
import { DocumentDTO } from '../entities/DocumentDTO';
import { InsuranceCertificateDTO } from '../entities/InsuranceDTO';
import { BankGuaranteeDTO } from '../entities/BankGuaranteeDTO';
import { ComplianceItemDTO } from '../entities/ComplianceDTO';
import { ProjectStrategyLinkDTO } from '../entities/ProjectStrategyLinkDTO';
import { ProjectBudgetLinkDTO } from '../entities/ProjectBudgetLinkDTO';
import { MilestoneDTO } from '../entities/MilestoneDTO';
import { ProjectStakeholderDTO } from '@/dtos/entities/ProjectDTO';;
import type { BoqLineDTO } from '../boq/BoqLineDTO';

export interface WorkflowMetadataDTO {
  lastSavedAt: string;
  totalSteps: number;
  completedSteps: number;
  progressPercentage: number;
  stepName?: string;
}

export interface StepRelatedDataDTO {
  phases?: PhaseDTO[];
  milest: ComplianceDataDTO;
  tasks?: TaskAssignmentDTO[]; // Utilise TaskAssignmentDTO
  inspections?: InspectionDTO[];
  strategyLinks?: ProjectStrategyLinkDTO[];
  budgterface SaveResult {
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
  fromStep: export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ProjectCreationWorkflowDTO extends ProjectDTO {
  workflowState: WorkflowState;
  validationResults: ValidationResult[];
  saveContext: SaveContextscription: string;
  category: 'projectCreation' | 'project_edit' | 'procurement' | 'inspection' | 'compliance';
  steps: Workf boolean;
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
  auport interface WorkflowAuditLogDTO {
  id: string;
  workflowId: string;
  action: 'stepCompleted' | 'step_skipped' | 'sessionId?: string;
  ipAddress?: string;
}

export interface WorkflowMetricsDTO {
  totalSteps: number;
  completedSteps: number;
  averageTimePerStep: number; // i: number;
  saveOperations: number;
  userInteractions: number;
  completionRate: number;
  abandonmentRate?: number;
}

export interface ProjectValidationDTO {
  receptionStatus: 'pending' | 'provisional' | 'definitive';
  closureNotes: string;
  finalInspection: {
    date: string;
   avedAt?: string;
}