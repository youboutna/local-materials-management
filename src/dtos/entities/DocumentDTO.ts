/**
 * Document Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 * Following clean code principles: camelCase only, no business logic
 */

import { BaseEntityDTO } from '../shared';

/**
 * Document type enumeration
 */
export enum DocumentType {
  CONTRACT = 'contract',
  PLAN = 'plan',
  SPECIFICATION = 'specification',
  REPORT = 'report',
  CERTIFICATE = 'certificate',
  PERMIT = 'permit',
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  MANUAL = 'manual',
  POLICY = 'policy',
  PROCEDURE = 'procedure',
  DRAWING = 'drawing',
  PHOTO = 'photo',
  VIDEO = 'video',
  BLUEPRINT = 'blueprint',
  SCHEMA = 'schema',
  CHECKLIST = 'checklist',
  FORM = 'form',
  TEMPLATE = 'template',
  PV = 'pv',
  SERVICE_REPORT = 'service_report',
  TENDER_DOCUMENT = 'tender_document',
  SUPPORTING_DOCUMENT = 'supporting_document',
  CORRESPONDENCE = 'correspondence',
  OTHER = 'other'
}

/**
 * Document status enumeration
 */
export enum DocumentStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ARCHIVED = 'archived',
  EXPIRED = 'expired',
  DEPRECATED = 'deprecated'
}

/**
 * Document priority enumeration
 */
export enum DocumentPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Type alias for string union usage
export type DocumentTypeUnion = `${DocumentType}`;

/**
 * Main Document DTO - matches DB row in camelCase
 */
export interface DocumentDTO extends BaseEntityDTO {
  id: string;
  assignedTo: string | null;
  createdAt: string;
  deadlineDate: string | null;
  description: string | null;
  documentType: string;
  fileName: string | null;
  fileSize: number | null;
  fileUrl: string | null;
  inspectionId: string | null;
  isInternalOnly: boolean | null;
  isSharedWithSuppliers: boolean | null;
  metadata: Record<string, unknown> | null;
  mimeType: string | null;
  paymentId: string | null;
  phaseId: string | null;
  projectId: string | null;
  sharedDate: string | null;
  status: string | null;
  supplierId: string | null;
  tags: string[] | null;
  title: string;
  updatedAt: string;
  uploadedBy: string | null;
}

/**
 * Create document request
 */
export interface CreateDocumentDTO {
  assignedTo?: string | null;
  deadlineDate?: string | null;
  description?: string | null;
  documentType: string;
  fileName?: string | null;
  fileSize?: number | null;
  fileUrl?: string | null;
  inspectionId?: string | null;
  isInternalOnly?: boolean;
  isSharedWithSuppliers?: boolean;
  metadata?: Record<string, unknown> | null;
  mimeType?: string | null;
  paymentId?: string | null;
  phaseId?: string | null;
  projectId?: string | null;
  sharedDate?: string | null;
  status?: string | null;
  supplierId?: string | null;
  tags?: string[] | null;
  title: string;
  uploadedBy?: string | null;
  category?: string | null;
  subcategory?: string | null;
}

/**
 * Update document request
 */
export type UpdateDocumentDTO = Partial<CreateDocumentDTO>;

/**
 * Document summary for lists
 */
export interface DocumentSummaryDTO {
  id: string;
  title: string;
  documentType: DocumentType;
  status: DocumentStatus;
  createdAt: string;
  fileSize?: number | null;
  isOverdue?: boolean;
  needsReview?: boolean;
  projectTitle?: string;
  name?: string;
  type?: DocumentType;
  priority?: DocumentPriority;
  category?: string;
  url?: string;
  projectId?: string;
  phaseId?: string;
  taskId?: string;
  isRequired?: boolean;
  tags?: string[];
  phaseName?: string;
}

/**
 * Document statistics
 */
export interface DocumentStatisticsDTO {
  totalDocuments: number;
  activeDocuments: number;
  archivedDocuments: number;
  expiredDocuments: number;
  totalSize?: number;
  averageFileSize?: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
  lastUpdated?: string;
}

/**
 * Document version tracking
 */
export interface DocumentVersionDTO {
  id: string;
  documentId: string;
  version: number;
  title: string;
  description?: string;
  changes?: string;
  createdById?: string;
  createdAt: string;
  isLatest?: boolean;
  downloadCount?: number;
  notes?: string;
}

/**
 * Document access log
 */
export interface DocumentAccessLogDTO {
  id: string;
  documentId: string;
  userId: string;
  action: 'viewed' | 'downloaded' | 'uploaded' | 'updated' | 'deleted' | 'shared' | 'approved' | 'rejected';
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  notes?: string;
  duration?: number;
}

/**
 * Document filter criteria
 */
export interface DocumentFilterDTO {
  projectId?: string;
  phaseId?: string;
  taskId?: string;
  inspectionId?: string;
  type?: DocumentType;
  documentType?: DocumentType;
  status?: DocumentStatus;
  priority?: DocumentPriority;
  category?: string;
  subcategory?: string;
  searchQuery?: string;
  tags?: string[];
  isRequired?: boolean;
  isOverdue?: boolean;
  needsReview?: boolean;
  uploadedBy?: string;
  assignedTo?: string;
  accessLevel?: 'public' | 'internal' | 'confidential' | 'restricted';
  dateRange?: {
    start?: string;
    end?: string;
    startDate?: string;
    endDate?: string;
  };
  fileSizeRange?: {
    min?: number;
    max?: number;
  };
}

/**
 * Document details with relations
 */
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

/**
 * Repository document interface for internal use
 */
export interface RepositoryDocument {
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

/**
 * Document search criteria
 */
export interface DocumentSearchDto {
  query: string;
  projectId?: string;
  tags?: string[];
  documentType?: DocumentType;
  status?: string;
}

/**
 * Document upload request
 */
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

/**
 * Document share request
 */
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

/**
 * Simple document response
 */
export interface DocumentResponseDTO {
  id: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  documentType: string;
  createdAt: string;
}
