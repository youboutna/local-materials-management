/**
 * Inspection Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */

import { BaseEntityDTO } from '../shared';
import { InspectionMeasurement, InspectionParticipant } from '@/domain/entities/Inspection';

type ConformityStatus = 'conform' | 'non_conform' | 'partial_conform' | 'not_applicable';

export interface InspectionDTO extends BaseEntityDTO {
  projectId: string;
  projectTitle?: string;
  phaseId?: string;
  phaseName?: string;
  date: string;
  inspector: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'approved' | 'rejected' | 'requires_changes' | 'pending';
  progressAtInspection: number;
  paymentType?: string;
  comments?: string;
  documents?: Record<string, unknown>;
}

export interface InspectionDetails extends InspectionDTO {
  projectDetails?: {
    title: string;
    status: string;
    progress: number;
  };
  phaseDetails?: {
    name: string;
    description: string;
  };
  documentsList?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    uploadedAt: string;
  }>;
  issues?: Array<{
    id: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'in_progress' | 'resolved';
    deadline?: string;
    assignedTo?: string;
  }>;
}

export interface CreateInspectionDTO {
  projectId: string;
  projectTitle?: string;
  phaseId?: string;
  phaseName?: string;
  date: string;
  inspector: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'approved' | 'rejected' | 'requires_changes' | 'pending';
  progressAtInspection: number;
  paymentType?: string;
  comments?: string;
  documents?: Record<string, unknown>;
}

export type UpdateInspectionDTO = Partial<CreateInspectionDTO>;

export interface InspectionDocument {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: number;
  uploadedAt: string;
  uploadedBy?: string;
  inspectionId: string;
}

export interface InspectionWithPaymentRequest extends InspectionDTO {
  paymentRequest?: {
    id: string;
    amount: number;
    status: string;
    requestedAt: string;
    processedAt?: string;
  };
}

export interface InspectionExecutionData {
  inspectionId: string;
  documents: InspectionDocument[];
  statusUpdate: {
    status: string;
    comments?: string;
    progressAtCompletion?: number;
  };
  notifications?: Array<{
    recipientId: string;
    type: string;
    message: string;
  }>;
}

// Add inspection execution specific interfaces
export interface AddMeasurementRequestDTO {
  inspectionId: string;
  measurement: Omit<InspectionMeasurement, 'id'>;
}

export interface AddParticipantRequestDTO {
  inspectionId: string;
  participant: Omit<InspectionParticipant, 'id'>;
}

export interface CompleteInspectionRequestDTO {
  inspectionId: string;
  finalData: {
    overallConformity: ConformityStatus;
    notes?: string;
    documents?: string[];
  };
}

export interface InspectionOperationResultDTO {
  success: boolean;
  error?: string;
}

export interface InspectionApprovalContext {
  inspectionId: string;
  projectId: string;
  phaseId?: string | null;
  approvalType: 'phase' | 'final' | 'quality';
  requiredSignatures: number;
  receivedSignatures: number;
  nextActions?: InspectionAction[];
}

export interface InspectionAction {
  type: 'signature' | 'document' | 'payment' | 'notification';
  required: boolean;
  completed: boolean;
  deadline?: string;
  assigneeId?: string;
}

export interface VerificationItemDTO {
  id: string;
  name: string;
  title: string;
  status: 'pending' | 'in_progress' | 'verified' | 'failed' | 'skipped';
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
}

// Add specific document interface from InspectionService
export interface InspectionDocumentDTO {
  id: string;
  type: string;
  name: string;
  url?: string;
  uploadedAt?: string;
  inspectionId: string;
  size?: number;
  uploadedBy?: string;
}

// Add execution data interface from InspectionService
export interface InspectionExecutionDataDTO {
  id: string;
  status: string;
  progressAtInspection?: number;
  comments?: string;
  documents: InspectionDocumentDTO[];
  completedAt?: string;
  completedBy?: string;
  projectId?: string;
  phaseId?: string;
  stepId?: string;
  inspector?: string;
  date?: string;
}

// Add payment validation interface from InspectionService
export interface InspectionPaymentValidationDTO {
  status: string;
  comments: string;
  payment_type: string;
  payment_status?: string;
  project_id?: string;
  inspection_id?: string;
  rejection_notes?: string;
}
