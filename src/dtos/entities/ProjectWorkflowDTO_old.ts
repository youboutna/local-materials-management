/**
 * Project Workflow Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */

import { PhaseData} from '@/dtos/entities/PhaseDTO';
import { MaterialFormDataDTO } from '@/dtos/entities/MaterialDTO';
import { RiskFormDataDTO } from '@/dtos/entities/RiskDTO';
import { BankGuaranteeFormDataDTO } from '@/dtos/entities/BankGuaranteeDTO';
import { InsuranceFormDataDTO } from '@/dtos/entities/InsuranceDTO';
import { DocumentFormDataDTO } from '@/dtos/entities/DocumentDTO';
import { EmployeeFormDataDTO } from '@/dtos/entities/EmployeeDTO';
import { SupplierFormDataDTO } from '@/dtos/entities/SupplierDTO';
import { StakeholderFormDataDTO } from '@/dtos/entities/StakeholderDTO';
import { ProjectDTO } from '@/application/services/ProjectService';

export interface ProjectWorkflowStepDTO {
  stepNumber: number;
  title: string;
  description: string;
  isRequired: boolean;
  validationRules: string[];
  relatedEntities: ('stakeholders' | 'phases' | 'risks' | 'materials' | 'documents' | 'inspections')[];
}

export interface ProjectWorkflowDataDTO {
  projectId?: string;
  currentStep: number;
  isDraft: boolean;
  isComplete: boolean;
  projectData: Partial<ProjectDTO>;
  relatedData: {
    stakeholders?: unknown[];
    phases?: unknown[];
    risks?: unknown[];
    materials?: unknown[];
  };
  metadata: {
    lastSavedAt: string;
    totalSteps: number;
    completedSteps: number;
    progressPercentage: number;
    stepName?: string;
  };
}

export interface WorkflowSaveResultDTO {
  success: boolean;
  projectId?: string;
  stepNumber: number;
  data?: ProjectWorkflowDataDTO;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface WorkflowValidationResultDTO {
  isValid: boolean;
  errors: string[];
  fieldErrors?: Record<string, string[]>;
}

export interface WorkflowStepDTO {
  stepNumber: number;
  stepName: string;
  stepType: 'basic_info' | 'stakeholders' | 'phases' | 'materials' | 'risks' | 'bank_guarantees' | 'insurances' | 'documents' | 'review';
  isRequired: boolean;
  isCompleted: boolean;
  validationRules?: string[];
}

export interface WorkflowContextDTO {
  projectId?: string;
  currentStep: number;
  totalSteps: number;
  isDraft: boolean;
  isComplete: boolean;
  lastSavedAt?: string;
  workflowType: 'creation' | 'edit';
}

export interface WorkflowResultDTO {
  success: boolean;
  stepCompleted?: number;
  nextStep?: number;
  projectId?: string;
  error?: string;
  warnings?: string[];
}

export interface ProjectCreationWorkflowDataDTO {
  workflowContext?: WorkflowContextDTO;
  phases?: PhaseFormDataDTO[];
  materials?: MaterialFormDataDTO[];
  risks?: RiskFormDataDTO[];
  bankGuarantees?: BankGuaranteeFormDataDTO[];
  insurances?: InsuranceFormDataDTO[];
  documents?: DocumentFormDataDTO[];
  employees?: EmployeeFormDataDTO[];
  suppliers?: SupplierFormDataDTO[];
  stakeholders?: StakeholderFormDataDTO[];
}

// Add edit workflow specific interfaces
export interface EditWorkflowStepDTO {
  stepNumber: number;
  stepName: string;
  stepType: 'basic_info' | 'stakeholders' | 'phases' | 'materials' | 'risks' | 'bank_guarantees' | 'insurances' | 'documents' | 'progress' | 'completion';
  isRequired: boolean;
  isCompleted: boolean;
  validationRules?: string[];
  canEdit: boolean;
}

export interface EditWorkflowContextDTO {
  projectId: string;
  currentStep: number;
  totalSteps: number;
  isDraft: boolean;
  isComplete: boolean;
  lastSavedAt?: string;
  originalData?: ProjectDTO;
  modifiedFields: string[];
}

export interface EditWorkflowResultDTO {
  success: boolean;
  stepCompleted?: number;
  nextStep?: number;
  projectId: string;
  error?: string;
  warnings?: string[];
  changesSaved?: string[];
}

export interface ProjectEditWorkflowDataDTO extends ProjectDTO {
  workflowContext?: EditWorkflowContextDTO;
  changes?: Record<string, { oldValue: unknown; newValue: unknown }>;
}

export interface ProjectCreationWorkflowDataDTO {
  id?: string;
  title: string;
  description: string;
  status: string;
  budget: number;
  start_date: string;
  end_date: string;
  stakeholders: StakeholderFormDataDTO[];
  phases: Array<{
    id: string;
    name: string;
    description?: string;
    status: string;
    startDate: string;
    endDate: string;
    progress?: number;
    estimatedCost?: number;
  }>;
  materials: Array<{
    id: string;
    name: string;
    type: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    supplierId?: string;
    specifications?: Record<string, unknown>;
  }>;
  risks: Array<{
    id: string;
    title: string;
    description?: string;
    category: string;
    probability: number;
    impact: number;
    mitigation?: string;
  }>;
  bankGuarantees: Array<{
    id: string;
    type: string;
    amount: number;
    bankName: string;
    guaranteeNumber: string;
    issueDate: string;
    expiryDate: string;
    status: string;
  }>;
  insurances: Array<{
    id: string;
    type: string;
    provider: string;
    policyNumber: string;
    coverageAmount: number;
    premium: number;
    startDate: string;
    endDate: string;
    status: string;
  }>;
  documents: Array<{
    id: string;
    name: string;
    type: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploadedBy: string;
  }>;
}
