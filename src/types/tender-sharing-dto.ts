// DTOs for secure tender document sharing
export interface TenderSharingSecretDTO {
  id: string;
  tender_id: string;
  secret_code: string;
  shared_by?: string;
  supplier_email?: string;
  supplier_id?: string;
  expires_at: string;
  is_active: boolean;
  access_count: number;
  max_access_count: number;
  workflow_phase?: string;
  workflow_stage?: string;
  allowed_document_ids?: string[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateSharingSecretDTO {
  tender_id: string;
  supplier_email?: string;
  supplier_id?: string;
  expires_at: string;
  max_access_count?: number;
  workflow_phase?: string;
  workflow_stage?: string;
  allowed_document_ids?: string[];
  metadata?: Record<string, any>;
}

export interface AccessLogDTO {
  id: string;
  sharing_secret_id: string;
  accessed_at: string;
  ip_address?: string;
  user_agent?: string;
  accessed_documents?: string[];
  action_type?: string;
  metadata?: Record<string, any>;
}

export interface CreateAccessLogDTO {
  sharing_secret_id: string;
  ip_address?: string;
  user_agent?: string;
  accessed_documents?: string[];
  action_type: 'view' | 'download' | 'upload';
  metadata?: Record<string, any>;
}

export interface ValidateSecretResponseDTO {
  is_valid: boolean;
  tender_id?: string;
  allowed_documents?: string[];
  message: string;
}
