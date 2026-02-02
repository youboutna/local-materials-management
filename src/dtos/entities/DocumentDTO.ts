/**
 * Document Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */

import { BaseEntityDTO } from '../shared';

export interface DocumentDTO extends BaseEntityDTO {
  id: string;
  projectId: string | null;
  phaseId: string | null;
  inspectionId: string | null;
  paymentId: string | null;
  supplierId: string | null;
  documentType: string;
  title: string | null;
  description: string | null;
  fileName: string | null;
  fileSize: number | null;
  fileUrl: string | null;
  mimeType: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  uploadedBy: string | null;
  tags: string[];
  isInternalOnly: boolean;
  isSharedWithSuppliers: boolean;
  deadlineDate: string | null;
  assignedTo: string | null;
  category: string | null;
  subcategory: string | null;
  metadata: Record<string, unknown> | null;
}

export interface DocumentDetailsDTO extends DocumentDTO {
  projectDetails?: {
    id: string;
    title: string;
    status: string;
  };
  phaseDetails?: {
    id: string;
    name: string;
    description: string;
  };
  inspectionDetails?: {
    id: string;
    date: string;
    status: string;
  };
  uploadedByDetails?: {
    id: string;
    name: string;
    email: string;
  };
  assignedToDetails?: {
    id: string;
    name: string;
    email: string;
  };
  relatedDocuments?: DocumentDTO[];
  versions?: DocumentDTO[];
  accessHistory?: Array<{
    accessedAt: string;
    accessedBy: string;
    action: string;
  }>;
  comments?: Array<{
    id: string;
    content: string;
    author: string;
    createdAt: string;
  }>;
}

export interface DocumentSummaryDTO {
  id: string;
  title: string;
  documentType: DocumentType;
  status: DocumentStatus;
  createdAt: string;
  fileSize: number | null;
  isOverdue: boolean;
  needsReview: boolean;
  projectTitle?: string;
}

export interface CreateDocumentDTO {
  projectId: string | null;
  phaseId: string | null;
  inspectionId: string | null;
  paymentId: string | null;
  supplierId: string | null;
  title: string;
  description: string | null;
  documentType: DocumentType;
  status: DocumentStatus;
  fileName: string | null;
  fileUrl: string | null;
  fileSize: number | null;
  mimeType: string | null;
  tags: string[];
  isInternalOnly: boolean;
  isSharedWithSuppliers: boolean;
  deadlineDate: string | null;
  assignedTo: string | null;
  uploadedBy: string | null;
  category: string | null;
  subcategory: string | null;
  metadata: Record<string, unknown> | null;
}

export type UpdateDocumentDTO = Partial<CreateDocumentDTO>;

export interface DocumentFilterDTO {
  projectId?: string;
  phaseId?: string;
  inspectionId?: string;
  documentType?: DocumentType;
  status?: DocumentStatus;
  uploadedBy?: string;
  assignedTo?: string;
  tags?: string[];
  category?: string;
  subcategory?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  searchQuery?: string;
  isOverdue?: boolean;
  needsReview?: boolean;
}

export type DocumentType = 
  | 'contract'
  | 'invoice'
  | 'report'
  | 'plan'
  | 'permit'
  | 'pv'
  | 'photo'
  | 'certificate'
  | 'specification'
  | 'correspondence'
  | 'other';

export type DocumentStatus = 
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'archived';

export interface DocumentUploadDTO {
  title: string;
  description?: string;
  documentType: DocumentType;
  projectId?: string;
  phaseId?: string;
  inspectionId?: string;
  tags?: string[];
  isInternalOnly?: boolean;
  isSharedWithSuppliers?: boolean;
  deadlineDate?: string;
  assignedTo?: string;
  category?: string;
  subcategory?: string;
  metadata?: Record<string, unknown>;
}

export interface DocumentShareDTO {
  documentId: string;
  shareWith: string[];
  permissions: {
    canView: boolean;
    canDownload: boolean;
    canShare: boolean;
  };
  expiresAt?: string;
  message?: string;
}

export interface DocumentResponseDTO {
  id: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  documentType: string;
  createdAt: string;
}
