/**
 * Tender Document DTOs - Centralized Entity Definition
 * Data Transfer Objects for tender document operations
 */

export interface TenderDocumentDTO {
  id: string;
  project_id: string;
  document_id?: string;
  category: string;
  subcategory?: string;
  is_required: boolean;
  is_submitted: boolean;
  submission_date?: string;
  reviewer_notes?: string;
  status: TenderDocumentStatus;
  created_at: string;
  updated_at: string;
}

export type TenderDocumentStatus = 
  | 'draft'
  | 'submitted'
  | 'reviewed'
  | 'approved'
  | 'rejected';

export interface CreateTenderDocumentDTO {
  project_id: string;
  document_id?: string;
  category: string;
  subcategory?: string;
  is_required?: boolean;
  is_submitted?: boolean;
  status?: TenderDocumentStatus;
}

export interface UpdateTenderDocumentDTO {
  category?: string;
  subcategory?: string;
  is_required?: boolean;
  is_submitted?: boolean;
  submission_date?: string;
  reviewer_notes?: string;
  status?: TenderDocumentStatus;
}

export interface TenderDocumentResponseDTO extends TenderDocumentDTO {
  document_title?: string;
  document_url?: string;
  days_until_deadline?: number;
  is_overdue?: boolean;
}

export interface TenderDocumentListDTO {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  status: TenderDocumentStatus;
  is_required: boolean;
  is_submitted: boolean;
  submission_date?: string;
  document_url?: string;
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
