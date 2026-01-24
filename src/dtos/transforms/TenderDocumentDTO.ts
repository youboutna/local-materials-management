/**
 * Tender Document DTOs
 * Data transfer objects for tender document operations
 */

export type TenderDocumentCategory = "administrative" | "technical" | "financial";
export type TenderDocumentSubcategory =
  | "lettre_soumission"
  | "pouvoir_signature"
  | "acte_groupement"
  | "attestation_impot"
  | "attestation_cnss"
  | "attestation_non_faillite"
  | "renseignement_soumissionnaire"
  | "garantie_soumission";

export type TenderDocumentStatus = "draft" | "submitted" | "reviewed" | "approved" | "rejected";

// Base DTO
export interface TenderDocumentDTO {
  id: string;
  project_id: string;
  document_id: string;
  category: TenderDocumentCategory;
  subcategory: TenderDocumentSubcategory;
  is_required: boolean;
  is_submitted: boolean;
  submission_date?: string;
  reviewer_notes?: string;
  status: TenderDocumentStatus;
  created_at: string;
  updated_at: string;
}

// Create DTO
export interface CreateTenderDocumentDTO {
  project_id: string;
  document_id: string;
  category: TenderDocumentCategory;
  subcategory: TenderDocumentSubcategory;
  is_required?: boolean;
  is_submitted?: boolean;
  status?: TenderDocumentStatus;
}

// Update DTO
export interface UpdateTenderDocumentDTO {
  category?: TenderDocumentCategory;
  subcategory?: TenderDocumentSubcategory;
  is_required?: boolean;
  is_submitted?: boolean;
  submission_date?: string;
  reviewer_notes?: string;
  status?: TenderDocumentStatus;
}

// Response DTO with additional computed fields
export interface TenderDocumentResponseDTO extends TenderDocumentDTO {
  document_title?: string;
  document_url?: string;
  days_until_deadline?: number;
  is_overdue?: boolean;
}

// List DTO for project overview
export interface TenderDocumentListDTO {
  id: string;
  title: string;
  category: TenderDocumentCategory;
  subcategory: TenderDocumentSubcategory;
  status: TenderDocumentStatus;
  is_required: boolean;
  is_submitted: boolean;
  submission_date?: string;
  document_url?: string;
}

// Statistics DTO
export interface TenderDocumentStatsDTO {
  total: number;
  required: number;
  submitted: number;
  approved: number;
  rejected: number;
  pending: number;
  overdue: number;
}

// Shared Document DTO - Réutilisable across modules
export interface SharedDocument {
  id: string;
  title: string;
  file_url: string;
  file_name: string;
  description?: string;
  created_at: string;
  metadata?: {
    tender_id?: string;
    phase?: number;
    shared_by?: string;
  };
}

// Public Tender DTO - Réutilisable across modules
export interface PublicTender {
  id: string;
  title: string;
  description: string;
  project_id?: string;
  launch_date?: string;
  attribution_date?: string;
  deadline_date?: string;
  selection_mode?: string;
  market_type?: string;
  financing_source?: string;
  project_reference?: string;
  status: 'draft' | 'published' | 'closed' | 'awarded';
  current_phase?: number;
}
