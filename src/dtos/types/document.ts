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
  fileUrl?: string; // ✅ CAMELCASE: Instead of fileUrl
  fileName?: string; // ✅ CAMELCASE: Instead of fileName
  mimeType?: string; // ✅ CAMELCASE: Instead of mimeType
  fileSize?: number; // ✅ CAMELCASE: Instead of fileSize
  documentType: DocumentType; // ✅ CAMELCASE: Instead of documentType
  status?: DocumentStatus;
  projectId?: string; // ✅ CAMELCASE: Instead of projectId
  inspectionId?: string; // ✅ CAMELCASE: Instead of inspectionId
  phaseId?: string; // ✅ CAMELCASE: Instead of phaseId
  supplierId?: string; // ✅ CAMELCASE: Instead of supplierId
  uploadedBy?: string; // ✅ CAMELCASE: Instead of uploadedBy
  assignedTo?: string; // ✅ CAMELCASE: Instead of assignedTo
  metadata?: Record<string, any>;
  tags?: string[];
  createdAt?: string; // ✅ CAMELCASE: Instead of createdAt
  updatedAt?: string; // ✅ CAMELCASE: Instead of updatedAt
  
  // Legacy snake_case for backward compatibility
  file_url?: string; // Legacy snake_case for backward compatibility
  file_name?: string; // Legacy snake_case for backward compatibility
  mime_type?: string; // Legacy snake_case for backward compatibility
  file_size?: number; // Legacy snake_case for backward compatibility
  documentType?: DocumentType; // Legacy snake_case for backward compatibility
  projectId?: string; // Legacy snake_case for backward compatibility
  inspectionId?: string; // Legacy snake_case for backward compatibility
  phaseId?: string; // Legacy snake_case for backward compatibility
  supplierId?: string; // Legacy snake_case for backward compatibility
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