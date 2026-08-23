/**
 * Tender Service DTOs
 * Centralized interfaces for TenderService
 */

export interface TenderOption {
  id: string;
  title: string;
  reference: string;
  projectId: string;
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
  tenderId: string;
  secretCode: string;
  supplierEmail: string;
  supplierId: string;
  expiresAt: string;
  maxAccessCount: number;
  currentAccessCount?: number;
  workflowPhase?: string;
  workflowStage?: string;
  allowedDocumentIds?: string[];
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
}

export interface CreateSharingSecretDTO {
  tenderId: string;
  supplierEmail: string;
  supplierId?: string;
  expiresAt: string;
  maxAccessCount?: number;
  workflowPhase?: string;
  workflowStage?: string;
  allowedDocumentIds?: string[];
  metadata?: Record<string, unknown>;
}

export interface CreateAccessLogDTO {
  secretId: string;
  accessedAt: string;
  ipAddress: string;
  userAgent: string;
}

export interface ValidateSecretResponseDTO {
  valid: boolean;
  remainingAccesses?: number;
  expiresAt?: string;
  tenderId?: string;
  error?: string;
}
