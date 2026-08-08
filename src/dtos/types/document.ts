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
  | 'supplier_catalog'
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
  fileUrl?: string; // ✅ CAMELCASE: Instead of file_url
  fileName?: string; // ✅ CAMELCASE: Instead of file_name
  mimeType?: string; // ✅ CAMELCASE: Instead of mime_type
  fileSize?: number; // ✅ CAMELCASE: Instead of file_size
  documentType: DocumentType; // ✅ CAMELCASE: Instead of document_type
  status?: DocumentStatus;
  projectId?: string; // ✅ CAMELCASE: Instead of project_id
  inspectionId?: string; // ✅ CAMELCASE: Instead of inspection_id
  phaseId?: string; // ✅ CAMELCASE: Instead of phase_id
  supplierId?: string; // ✅ CAMELCASE: Instead of supplier_id
  uploadedBy?: string; // ✅ CAMELCASE: Instead of uploaded_by
  assignedTo?: string; // ✅ CAMELCASE: Instead of assigned_to
  metadata?: Record<string, any>;
  tags?: string[];
  createdAt?: string; // ✅ CAMELCASE: Instead of created_at
  updatedAt?: string; // ✅ CAMELCASE: Instead of updated_at
  
  // Legacy snake_case for backward compatibility
  file_url?: string; // Legacy snake_case for backward compatibility
  file_name?: string; // Legacy snake_case for backward compatibility
  mime_type?: string; // Legacy snake_case for backward compatibility
  file_size?: number; // Legacy snake_case for backward compatibility
  document_type?: DocumentType; // Legacy snake_case for backward compatibility
  project_id?: string; // Legacy snake_case for backward compatibility
  inspection_id?: string; // Legacy snake_case for backward compatibility
  phase_id?: string; // Legacy snake_case for backward compatibility
  supplier_id?: string; // Legacy snake_case for backward compatibility
  uploaded_by?: string; // Legacy snake_case for backward compatibility
  assigned_to?: string; // Legacy snake_case for backward compatibility
  created_at?: string; // Legacy snake_case for backward compatibility
  updated_at?: string; // Legacy snake_case for backward compatibility
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
  supplier_id?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}