import { ProjectDTO } from '../entities/ProjectDTO';
import { PhaseDTO } from '../entities/PhaseDTO';
import { MaterialDTO } from '../entities/MaterialDTO';
import { DocumentDTO } from '../entities/DocumentDTO';
import { RiskDTO } from '../entities/RiskDTO';
import { StakeholderDTO } from '../entities/StakeholderDTO';

/**
 * Complete workflow DTO definitions
 * All non-atomic workflow-specific interfaces consolidated here
 */

export enum ProjectWorkflowStep {
  PROJECT_DETAILS = 1,
  STAKEHOLDERS = 2,
  PHASES = 3,
  RISKS = 4,
  MATERIALS = 5,
  DOCUMENTS = 6,
  REVIEW = 7
}

export interface WorkflowStepDTO {
  stepNumber: number;
  title: string;
  isRequired: boolean;
}

export interface WorkflowResultDTO {
  success: boolean;
  nextStep?: number;
  errors?: string[];
}

export enum WorkflowStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

export enum WorkflowMode {
  CREATE = 'create',
  EDIT = 'edit'
}

export interface ProjectWorkflowStepDTO extends WorkflowStepDTO {
  description: string;
  validationRules: string[];
  relatedEntities: string[];
}

export interface ProjectWorkflowResultDTO extends WorkflowResultDTO {
  projectId: string;
}

export interface ProjectWorkflowDTO {
  // Core project data
  project: ProjectDTO;
  
  // Workflow metadata
  mode: WorkflowMode;
  currentStep: number;
  status: 'draft' | 'in_progress' | 'completed';
  
  // Related entities
  phases?: PhaseDTO[];
  materials?: MaterialDTO[];
  risks?: RiskDTO[];
  stakeholders?: StakeholderDTO[];
  documents?: DocumentDTO[];
  
  // Form-specific fields
  receptionStatus?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  closureNotes?: string;
  
  // Edit-specific fields
  originalData?: Partial<ProjectDTO>;
  modifiedFields?: string[];
}
