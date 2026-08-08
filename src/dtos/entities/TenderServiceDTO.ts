/**
 * Tender Service DTOs
 * Centralized interfaces for TenderService
 */

export interface SearchTendersOptions {
  projectId?: string;
  limit?: number;
}

export interface GetProjectTendersRequestDto {
  protDto {
  id: string;
}

export interface CreateTenderDocumentRequestDto {
  data: a string;
  tender_id: string;
  secret_code: string;
  supplier_email: string;
  supplier_t: number;
  current_access_count?: number;
  workflow_phase: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  is_active?: booleang;
}

export interface ValidateSecretResponseDTO {
  valid: boolean;
  remaining_accesses?: number;
  expires_at?: string;
  tender_id?: string;
  error?: string;
}