/**
 * Tender Document DTOs - Centralized Entity Definition
 * Data Transfer Objects for tender document operations
 */

export interface TenderDocumentDTO {
  id: string;
  projectId: string;
  documentId?: string;
  category: string;
  subcategory?: string;
  isRequired: boolean;
  isSubmitted: boolean;
  submissionDate?: string;
  reviewerNotes?: string;
  status: TenderDocumentStatus;
  createdAt: string;
  updatedAt: string;
}

export type TenderDocumentStatus = 
  | 'draft'
  | 'submitted'
  | 'reviewed'
  | 'approved'
  | 'rejected';

export interface CreateTenderDocumentDTO {
  projectId: string;
  documentId?: string;
  category: string;
  subcategory?: string;
  isRequired?: boolean;
  isSubmitted?: boolean;
  status?: TenderDocumentStatus;
}

export interface UpdateTenderDocumentDTO {
  category?: string;
  subcategory?: string;
  isRequired?: boolean;
  isSubmitted?: boolean;
  submissionDate?: string;
  reviewerNotes?: string;
  status?: TenderDocumentStatus;
}

export interface TenderDocumentResponseDTO extends TenderDocumentDTO {
  documentTitle?: string;
  documentUrl?: string;
  daysUntilDeadline?: number;
  isOverdue?: boolean;
}

export interface TenderDocumentListDTO {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  status: TenderDocumentStatus;
  isRequired: boolean;
  isSubmitted: boolean;
  submissionDate?: string;
  documentUrl?: string;
}

export interface TenderDocumentStatsDTO {
  total: number;
  required: number;
  submitted: number;
  approved: number;
  rejected: number;
  pending: number;
  overdue: number;
}

// Add service-specific DTOs
export interface GetTenderDocumentByIdRequestDTO {
  id: string;
}

export interface GetProjectTenderDocumentsRequestDTO {
  projectId: string;
}

export interface UpdateTenderDocumentRequestDTO {
  id: string;
  data: UpdateTenderDocumentDTO;
}

export interface DeleteTenderDocumentRequestDTO {
  id: string;
}

export interface SubmitTenderDocumentRequestDTO {
  id: string;
}

export interface ApproveTenderDocumentRequestDTO {
  id: string;
  notes?: string;
}

export interface RejectTenderDocumentRequestDTO {
  id: string;
  notes: string;
}

export interface GetProjectStatisticsRequestDTO {
  projectId: string;
}
