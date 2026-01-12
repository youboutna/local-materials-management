/**
 * Document Data Transfer Objects
 */

export interface DocumentDTO {
  id: string;
  title: string;
  description?: string;
  documentType: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  projectId?: string;
  phaseId?: string;
  supplierId?: string;
  inspectionId?: string;
  paymentId?: string;
  uploadedBy?: string;
  assignedTo?: string;
  status?: string;
  tags?: string[];
  isSharedWithSuppliers: boolean;
  isInternalOnly: boolean;
  deadlineDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentDTO {
  title: string;
  description?: string;
  documentType: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  projectId?: string;
  phaseId?: string;
  supplierId?: string;
  tags?: string[];
}

export interface UpdateDocumentDTO {
  title?: string;
  description?: string;
  documentType?: string;
  status?: string;
  tags?: string[];
  isSharedWithSuppliers?: boolean;
  isInternalOnly?: boolean;
  deadlineDate?: string;
  assignedTo?: string;
}
