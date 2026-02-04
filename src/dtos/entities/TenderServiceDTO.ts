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
  data: CreateTenderDocumentDTO;
}

export interface TenderSharingSecretDTO {
  id: string;
  tender_id: string;
  secret_code: string;
  supplier_email: string;
  supplier_id: string;
  expires_at: string;
  max_access_count: number;
}

export interface CreateSharingSecretDTO {
  tender_id: string;
  supplier_email: string;
  expires_at: string;
  max_access_count: number;
}

export interface CreateAccessLogDTO {
  secret_id: string;
  accessed_at: string;
  ip_address: string;
  user_agent: string;
}

export interface ValidateSecretResponseDTO {
  valid: boolean;
  remaining_accesses: number;
  expires_at: string;
  tender_id: string;
}
