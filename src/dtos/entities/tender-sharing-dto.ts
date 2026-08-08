// DTOs for secure tender document sharing

export interface CreateSharingSecretDTO {
  sharedBy: string | null | undefined;
  tenderId: string;
  supplierEmail?: string;
  supplierId?: string;
  expiresAt: string;
  maxAccessCount?: number;
  workflowPhase?: string;
  workflowStage?: string;
  allowedDocumentIds?: string[];
  metadata?: Record<string, unknown>;
}

export interface AccessLogDTO {
  id: string;
  sharingSecretId: string;
  accessedAt: string;
  ipAddress?:   userAgent?: string;
  accessedDocuments?: string[];
  actionType: 'view' | 'download' | 'upload';
  metadata?: Record<string, unknown>;
}

export interface ValidateSecretResponseDTO {
  isValid: boolean;
  tenderId?: string;
  allowedDocuments?: string[];
  message: string;
  accessCount?: number;
  maxAccess?: number;