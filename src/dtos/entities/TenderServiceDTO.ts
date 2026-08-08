/**
 * Tender Service DTOs
 * Centralized interfaces for TenderService
 */

export interface TenderOption {
  id: string;
  title: string;
  reference: string;
  project_id: string;
  status?: string;
}

export interface SearchTendersOptions {
  projectId?: string;
  limit?: number;
}

export interface GetProjectTendersRequestDto {
  projectId?: string;
  limit?: number;
}

export interface GetTenderByIdRequestDto {
  id: string;
}

export interface CreateTenderDocumentRequestDto {
  data: any; // CreateTenderDocumentDTO
}

export interface TenderSharingSecretDTO {
  id: string;
  tender_id: string;
  secret_code: string;
  supplier_email: string;
  supplier_id: string;
  expires_at: string;
  max_access_count: number;
  current_access_count?: number;
  workflow_phase?: string;
  workflow_stage?: string;
  allowed_document_ids?: string[];
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

export interface CreateSharingSecretDTO {
  tender_id: string;
  supplier_email: string;
  supplier_id?: string;
  expires_at: string;
  max_access_count?: number;
  workflow_phase?: string;
  workflow_stage?: string;
  allowed_document_ids?: string[];
  metadata?: Record<string, unknown>;
}

export interface CreateAccessLogDTO {
  secret_id: string;
  accessed_at: string;
  ip_address: string;
  user_agent: string;
}

export interface ValidateSecretResponseDTO {
  valid: boolean;
  remaining_accesses?: number;
  expires_at?: string;
  tender_id?: string;
  error?: string;
}
