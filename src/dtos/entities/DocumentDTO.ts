/**
 * Document Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 * Following clean code principles: camelCase only, no business logic
 */

import { BaseEntityDTO } from '../shared';

/**
 * Document type enumeration
 * Classification of document types
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
  TEMPLATE = 'template'
}

/**
 * Document status enumeration
 * Current state of document lifecycle
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
 * Priority levels for documents
 */
export enum DocumentPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Main Document DTO
 * Core document data structure
 */
export interface DocumentDTO extends BaseEntityDTO {
  // Core identification
  id: string;
  name: string;
  description?: string;
  
  // Classification
  type: DocumentType;
  status: DocumentStatus;
  priority: DocumentPriority;
  category?: string;
  
  // Content
  content?: string;
  summary?: string;
  keywords?: string[];
  
  // File information
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  mimeType?: string;
  url?: string;
  
  // Versioning
  version?: number;
  isLatest?: boolean;
  parentDocumentId?: string;
  versionHistory?: Array<{
    version: number;
    createdBy: string; // Employee ID only for DTO
    createdAt: string;
    changeNotes?: string;
  }>;
  
  // Access control
  accessLevel?: 'public' | 'internal' | 'confidential' | 'restricted';
  allowedRoles?: string[];
  allowedUsers?: string[]; // User IDs only for DTO
  
  // Relationships
  projectId?: string;
  phaseId?: string;
  taskId?: string;
  inspectionId?: string;
  riskId?: string;
  relatedDocuments?: string[]; // Document IDs only for DTO
  
  // Metadata
  tags?: string[];
  notes?: string;
  
  // Form data fields (merged from DocumentFormDataDTO)
  isRequired?: boolean;
  uploadedBy?: string;
  uploadedAt?: string;
  
  // System fields
  createdAt: string;
  updatedAt: string;
}

/**
 * Document creation request interface
 * Input for creating new documents
 */
export interface CreateDocumentDTO {
  name: string;
  description?: string;
  type: DocumentType;
  status?: DocumentStatus;
  priority?: DocumentPriority;
  category?: string;
  content?: string;
  summary?: string;
  keywords?: string[];
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  url?: string;
  accessLevel?: 'public' | 'internal' | 'confidential' | 'restricted';
  allowedRoles?: string[];
  allowedUsers?: string[]; // User IDs only for DTO
  parentDocumentId?: string;
  version?: number;
  isLatest?: boolean;
  projectId?: string;
  phaseId?: string;
  taskId?: string;
  inspectionId?: string;
  riskId?: string;
  relatedDocuments?: string[]; // Document IDs only for DTO
  tags?: string[];
  notes?: string;
}

/**
 * Document update request interface
 * Input for updating existing documents
 */
export interface UpdateDocumentDTO {
  name?: string;
  description?: string;
  type?: DocumentType;
  status?: DocumentStatus;
  priority?: DocumentPriority;
  category?: string;
  content?: string;
  summary?: string;
  keywords?: string[];
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  url?: string;
  accessLevel?: 'public' | 'internal' | 'confidential' | 'restricted';
  allowedRoles?: string[];
  allowedUsers?: string[]; // User IDs only for DTO
  parentDocumentId?: string;
  version?: number;
  isLatest?: boolean;
  tags?: string[];
  notes?: string;
  
  // Metadata
  updatedBy?: string;
  changeReason?: string;
}

/**
 * Document summary interface
 * Lightweight document representation for lists
 */
export interface DocumentSummaryDTO extends BaseEntityDTO {
  id: string;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  priority: DocumentPriority;
  category?: string;
  fileSize?: number;
  url?: string;
  projectId?: string;
  phaseId?: string;
  taskId?: string;
  isRequired?: boolean;
  isOverdue?: boolean;
  tags?: string[];
  projectTitle?: string;
  phaseName?: string;
}

/**
 * Document statistics interface
 * Performance metrics for document management
 */
export interface DocumentStatisticsDTO {
  totalDocuments: number;
  activeDocuments: number;
  archivedDocuments: number;
  expiredDocuments: number;
  totalSize?: number;
  averageFileSize?: number;
  byType: Record<DocumentType, number>;
  byStatus: Record<DocumentStatus, number>;
  byPriority: Record<DocumentPriority, number>;
  byCategory: Record<string, number>;
  lastUpdated?: string;
}

/**
 * Document version interface
 * Version tracking data
 */
export interface DocumentVersionDTO {
  id: string;
  documentId: string;
  version: number;
  title: string;
  description?: string;
  changes?: string;
  createdById?: string; // Employee ID only for DTO
  createdAt: string;
  isLatest?: boolean;
  downloadCount?: number;
  notes?: string;
}

/**
 * Document access log interface
 * Access tracking for documents
 */
export interface DocumentAccessLogDTO {
  id: string;
  documentId: string;
  userId: string; // User ID only for DTO
  action: 'viewed' | 'downloaded' | 'uploaded' | 'updated' | 'deleted' | 'shared' | 'approved' | 'rejected';
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  notes?: string;
  duration?: number; // in seconds
}

/**
 * Document filter interface
 * Filter criteria for document queries
 */
export interface DocumentFilterDTO {
  projectId?: string;
  phaseId?: string;
  taskId?: string;
  type?: DocumentType;
  status?: DocumentStatus;
  priority?: DocumentPriority;
  category?: string;
  searchQuery?: string;
  tags?: string[];
  isRequired?: boolean;
  isOverdue?: boolean;
  accessLevel?: 'public' | 'internal' | 'confidential' | 'restricted';
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
  fileSizeRange?: {
    min?: number;
    max?: number;
  };
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
