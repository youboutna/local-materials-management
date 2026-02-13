// DTOs for secure tender document sharing
export interface TenderSharingSecretDTO {
  id: string;
  tenderId: string;
  secretCode: string;
  sharedBy?: string;
  supplierEmail?: string;
  supplierId?: string;
  expiresAt: string;
  isActive: boolean;
  accessCount: number;
  maxAccessCount: number;
  workflowPhase?: string;
  workflowStage?: string;
  allowedDocumentIds?: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

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
  ipAddress?: string;
  userAgent?: string;
  accessedDocuments?: string[];
  actionType?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateAccessLogDTO {
  accessedAt: string;
  accessedBy: string | null | undefined;
  sharedBy: string | null | undefined;
  sharingSecretId: string;
  ipAddress?: string;
  userAgent?: string;
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
  expiresAt?: string | null;
}
