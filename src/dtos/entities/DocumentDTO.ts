/**
 * Document Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */

import { BaseEntityDTO } from '../shared';

// Add type guard for DocumentType
export enum DocumentStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}
export interface DocumentDTO extends BaseEntityDTO {
  id: string;
  name: string;
  projectId: string | null;
  phaseId: string | null;
  inspectionId: string | null;
  paymentId: string | null;
  supplierId: string | null;
  documentType: DocumentType;
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

// 2. DTOs d'API (Adapter Layer)
export class DocumentResponseDto {
  constructor(
    public id: string,
    public title: string,
    public description?: string,
    public type: DocumentType,
    public status: DocumentStatus,
    public fileName?: string,
    public fileUrl?: string,
    public fileSize?: number,
    public projectId?: string,
    public assignedTo?: string,
    public deadlineDate?: string,
    public tags: string[],
    public isInternalOnly: boolean,
    public isSharedWithSuppliers: boolean,
    public uploadedBy?: string,
    public createdAt: string,
    public updatedAt: string
  ) {}
}

export class CreateDocumentRequestDto {
  constructor(
    public title: string,
    public description?: string,
    public type: DocumentType,
    public projectId?: string,
    public assignedTo?: string,
    public deadlineDate?: string,
    public tags?: string[],
    public file?: any // Express.Multer.File
  ) {}
}

export class UpdateDocumentRequestDto {
  constructor(
    public title?: string,
    public description?: string,
    public type?: DocumentType,
    public status?: DocumentStatus,
    public assignedTo?: string,
    public deadlineDate?: string,
    public tags?: string[]
  ) {}
}

// Ensure Document entity has required properties
interface RepositoryDocument {
  id: string;
  title: string;
  documentType: DocumentType;
  projectId?: string;
  phaseId?: string;
  inspectionId?: string;
  paymentId?: string;
  supplierId?: string;
  description?: string;
  fileName?: string;
  fileSize?: number;
  fileUrl: string;
  mimeType?: string;
  status: string;
  isInternalOnly: boolean;
  isSharedWithSuppliers: boolean;
  deadlineDate?: string;
  assignedTo?: string;
  metadata: Record<string, unknown>;
  category?: string;
  subcategory?: string;
  createdAt: string;
  updatedAt: string;
  uploadedBy?: string;
  tags: string[];
}

// Service DTOs for data exchange
export interface DocumentSearchDto {
  query: string;
  projectId?: string;
  tags?: string[];
  documentType?: DocumentType;
  status?: string;
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
// Convert document types to enum for better type safety
export enum DocumentType {
  CONTRACT = 'contract',
  INVOICE = 'invoice',
  REPORT = 'report',
  PLAN = 'plan',
  PERMIT = 'permit',
  PV = 'pv',
  PHOTO = 'photo',
  CERTIFICATE = 'certificate',
  SPECIFICATION = 'specification',
  CORRESPONDENCE = 'correspondence',
  OTHER = 'other'
}

// Type alias that references the enum values
export type DocumentTypeUnion = `${DocumentType}`;

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
