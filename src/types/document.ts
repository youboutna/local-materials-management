export type DocumentType = 
  | 'inspection'
  | 'payment'
  | 'invoice'
  | 'delivery_note'
  | 'payment_receipt'
  | 'technical'
  | 'administrative'
  | 'supplier_upload'
  | 'supplier_info'
  | 'contract'
  | 'report'
  | 'specification'
  | 'drawing'
  | 'photo'
  | 'other';

export type DocumentStatus = 
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'archived';

export interface Document {
  id: string;
  title: string;
  description?: string;
  file_url?: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
  document_type: DocumentType;
  status?: DocumentStatus;
  project_id?: string;
  inspection_id?: string;
  phase_id?: string;
  uploaded_by?: string;
  assigned_to?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface DocumentWithRelations extends Document {
  projects?: {
    title: string;
    status: string;
  };
  payments?: {
    amount: number;
    payment_date: string;
  };
  supplier_viewed_items?: {
    id: string;
    viewed_at: string;
  }[];
}

export interface DocumentUploadData {
  title: string;
  description?: string;
  document_type: DocumentType;
  project_id?: string;
  phase_id?: string;
  inspection_id?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}