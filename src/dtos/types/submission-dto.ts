// DTOs for secure tender submission management
// Separation of concerns - Data Transfer Objects

export interface SubmissionSecretDTO {
  id: string;
  tender_id: string;
  supplier_name: string;
  supplier_email: string;
  secret_code?: string;
  secret_expires_at?: string;
  secret_created_at?: string;
  secret_access_count: number;
  max_secret_access: number;
  is_secret_active: boolean;
  evaluation_phase?: string;
  evaluation_stage?: string;
  submission_date: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  administrative_score?: number;
  technical_score?: number;
  financial_score?: number;
  total_score?: number;
}

export interface CreateSubmissionSecretDTO {
  submission_id: string;
  expires_at?: string;
  max_access?: number;
  evaluation_phase?: string;
  evaluation_stage?: string;
}

export interface SubmissionAccessLogDTO {
  id: string;
  submission_id: string;
  accessed_at: string;
  accessed_by?: string;
  ip_address?: string;
  user_agent?: string;
  action_type: 'view' | 'evaluate' | 'comment' | 'approve' | 'reject';
  accessed_sections?: string[];
  metadata?: Record<string, any>;
}

export interface CreateSubmissionAccessLogDTO {
  submission_id: string;
  action_type: 'view' | 'evaluate' | 'comment' | 'approve' | 'reject';
  accessed_sections?: string[];
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
}

export interface ValidateSubmissionSecretResponseDTO {
  is_valid: boolean;
  submission_id?: string;
  tender_id?: string;
  supplier_name?: string;
  message: string;
}

export interface SubmissionEvaluationDTO {
  submission_id: string;
  evaluator_id: string;
  evaluation_type: 'administrative' | 'technical' | 'financial';
  score?: number;
  notes?: string;
  criteria_scores?: Record<string, number>;
  recommendations?: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface SubmissionDocumentDTO {
  id: string;
  submission_id: string;
  document_id: string;
  category: 'administrative' | 'technical' | 'financial';
  subcategory?: string;
  uploaded_at: string;
  verified: boolean;
}
