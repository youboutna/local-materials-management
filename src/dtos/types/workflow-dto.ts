// Workflow DTOs for clean data transfer
export interface WorkflowStepDTO {
  id: string;
  tender_id: string;
  step_number: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
  due_date?: string;
  submission_date?: string;
  review_deadline?: string;
  approval_deadline?: string;
  actual_completion_date?: string;
  procurement_phase?: string;
  procurement_stage?: string;
  required_documents: string[];
  can_upload_documents: boolean;
  tasks_completed: number;
  tasks_total: number;
  created_at: string;
  updated_at: string;
}

export interface StepDocumentDTO {
  id: string;
  step_id: string;
  document_id: string;
  document_type: string;
  is_required: boolean;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  submitted_at?: string;
  reviewer_notes?: string;
  document: DocumentInfoDTO;
  can_share: boolean;
}

export interface DocumentInfoDTO {
  id: string;
  title: string;
  description?: string;
  file_url?: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

export interface WorkflowProgressDTO {
  tender_id: string;
  total_steps: number;
  completed_steps: number;
  in_progress_steps: number;
  progress_percentage: number;
  current_step?: WorkflowStepDTO;
}

export interface DocumentUploadDTO {
  title: string;
  description?: string;
  category: string;
  subcategory: string;
  is_required: boolean;
  file: File;
  step_id: string;
}

export interface DocumentShareDTO {
  document_ids: string[];
  step_title: string;
  procurement_phase?: string;
  procurement_stage?: string;
}