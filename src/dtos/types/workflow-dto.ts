// Workflow DTOs for clean data transfer
export interface WorkflowStepDTO {
  id: string;
  tenderId: string;
  stepNumber: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
  dueDate?: string;
  submissionDate?: string;
  reviewDeadline?: string;
  approvalDeadline?: string;
  actualCompletionDate?: string;
  procurementPhase?: string;
  procurementStage?: string;
  requiredDocuments: string[];
  canUploadDocuments: boolean;
  tasksCompleted: number;
  tasksTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface StepDocumentDTO {
  id: string;
  stepId: string;
  documentId: string;
  documentType: string;
  isRequired: boolean;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: string;
  reviewerNotes?: string;
  document: DocumentInfoDTO;
  canShare: boolean;
}

export interface DocumentInfoDTO {
  id: string;
  title: string;
  description?: string;
  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
}

export interface WorkflowProgressDTO {
  tenderId: string;
  totalSteps: number;
  completedSteps: number;
  inProgressSteps: number;
  progressPercentage: number;
  currentStep?: WorkflowStepDTO;
}

export interface DocumentUploadDTO {
  title: string;
  description?: string;
  category: string;
  subcategory: string;
  isRequired: boolean;
  file: File;
  stepId: string;
}

export interface DocumentShareDTO {
  documentIds: string[];
  stepTitle: string;
  procurementPhase?: string;
  procurementStage?: string;
}