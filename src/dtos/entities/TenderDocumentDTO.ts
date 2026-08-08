/**
 * Tender Document DTOs - Centralized Entity Definition
 * Data Transfer Objects for tender document operations
 */

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
  isRequired?: bool: string;
  documentUrl?: string;
  days_until_deadline?: number;
  is_overdue?: boolean;
}

export interface TenderDocumentListDTO {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  statu: number;
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

export interface DeleteTenderDocumentReqg;
  notes: string;
}

export interface GetProjectStatisticsRequestDTO {
  projectId: string;
}