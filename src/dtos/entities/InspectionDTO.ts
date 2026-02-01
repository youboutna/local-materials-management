/**
 * Inspection Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */

import { BaseEntityDTO } from '../shared';

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
