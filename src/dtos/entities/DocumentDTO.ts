/**
 * Document Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 * Following clean code principles: camelCase only, no business logic
 * 
 * ✅ Les DTOs sont dans la couche de transfert
 * ✅ Pas de dépendance vers le domaine
 * ✅ Utilisés par le Transformer pour la conversion Domain ↔ DTO
 * ✅ RepositoryDocument pour la couche infrastructure (snake_case)
 * ✅ Types corrects pour status et documentType (string, pas null)
 */

import { BaseEntityDTO } from '../shared';

// ============================================================================
// ENUMS (transfert uniquement)
// ============================================================================

/**
 * Document type enumeration
 * Correspond aux valeurs stockées en base
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
  INSURANCE = 'insurance',
  BANK_GUARANTEE = 'bank_guarantee',
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

// ============================================================================
// TYPE ALIASES
// ============================================================================

export type DocumentTypeUnion = `${DocumentType}`;
export type DocumentStatusUnion = `${DocumentStatus}`;
export type DocumentPriorityUnion = `${DocumentPriority}`;

// ============================================================================
// MAIN DTO (camelCase pour l'API)
// ============================================================================

/**
 * Main Document DTO - matches DB row in camelCase
 */
export interface DocumentDTO extends BaseEntityDTO {
  id: string;
  projectId: string | null;
  phaseId: string | null;
  inspectionId: string | null;
  paymentId: string | null;
  supplierId: string | null;
  title: string;
  description: string | null;
  documentType: DocumentTypeUnion;  // ✅ Type string, pas null
  status: DocumentStatusUnion;      // ✅ Type string, pas null
  priority?: DocumentPriorityUnion; // ✅ Optionnel
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
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// REPOSITORY DOCUMENT (snake_case pour la DB)
// ============================================================================

/**
 * Repository document interface for internal use
 * ⚠️ Ceci est une interface interne pour le transformer, pas un DTO exposé
 * ✅ Correspond à la structure de la base de données (snake_case)
 * ✅ Utilisé par le DocumentTransformer pour la conversion
 */
export interface RepositoryDocument {
  id: string;
  projectId: string | null;
  phaseId: string | null;
  inspectionId: string | null;
  paymentId: string | null;
  supplierId: string | null;
  title: string;
  description: string | null;
  documentType: DocumentTypeUnion;    // ✅ Type string, pas null
  status: DocumentStatusUnion;         // ✅ Type string, pas null
  priority?: DocumentPriorityUnion;    // ✅ Optionnel
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
  metadata: Record<string, unknown> | null;
  category: string | null;
  subcategory: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// CREATE DTO
// ============================================================================

/**
 * Create document request
 */
export interface CreateDocumentDTO {
  title: string;
  description?: string | null;
  documentType: DocumentTypeUnion;     // ✅ Requis, pas null
  status?: DocumentStatusUnion;        // ✅ Optionnel, défaut DRAFT
  priority?: DocumentPriorityUnion;    // ✅ Optionnel
  projectId?: string | null;
  phaseId?: string | null;
  inspectionId?: string | null;
  paymentId?: string | null;
  supplierId?: string | null;
  fileName?: string | null;
  fileUrl?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  tags?: string[];
  isInternalOnly?: boolean;
  isSharedWithSuppliers?: boolean;
  deadlineDate?: string | null;
  assignedTo?: string | null;
  uploadedBy?: string | null;
  metadata?: Record<string, unknown> | null;
  category?: string | null;
  subcategory?: string | null;
}

// ============================================================================
// UPDATE DTO
// ============================================================================

/**
 * Update document request
 * ✅ Tous les champs sont optionnels
 * ✅ Pour mettre à jour status ou documentType, fournir la nouvelle valeur
 */
export interface UpdateDocumentDTO {
  title?: string;
  description?: string | null;
  documentType?: DocumentTypeUnion;     // ✅ Optionnel
  status?: DocumentStatusUnion;         // ✅ Optionnel
  priority?: DocumentPriorityUnion;     // ✅ Optionnel
  projectId?: string | null;
  phaseId?: string | null;
  inspectionId?: string | null;
  paymentId?: string | null;
  supplierId?: string | null;
  fileName?: string | null;
  fileUrl?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  tags?: string[];
  isInternalOnly?: boolean;
  isSharedWithSuppliers?: boolean;
  deadlineDate?: string | null;
  assignedTo?: string | null;
  uploadedBy?: string | null;
  metadata?: Record<string, unknown> | null;
  category?: string | null;
  subcategory?: string | null;
}

// ============================================================================
// SUMMARY DTO
// ============================================================================

/**
 * Document summary for lists
 */
export interface DocumentSummaryDTO {
  id: string;
  title: string;
  documentType: DocumentTypeUnion;
  status: DocumentStatusUnion;
  priority?: DocumentPriorityUnion;
  createdAt: string;
  fileSize?: number | null;
  projectId?: string | null;
  phaseId?: string | null;
  phaseName?: string | null;
  projectTitle?: string | null;
  tags?: string[];
  isOverdue?: boolean;
  needsReview?: boolean;
  category?: string | null;
}

// ============================================================================
// DETAILS DTO
// ============================================================================

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
  paymentDetails?: {
    id: string;
    amount: number;
    status: string;
  };
  supplierDetails?: {
    id: string;
    name: string;
    email: string;
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
  comments?: Array<{
    id: string;
    content: string;
    author: string;
    createdAt: string;
  }>;
  accessHistory?: Array<{
    accessedAt: string;
    accessedBy: string;
    action: string;
  }>;
}

// ============================================================================
// STATISTICS DTO
// ============================================================================

/**
 * Document statistics
 */
export interface DocumentStatisticsDTO {
  totalDocuments: number;
  activeDocuments: number;
  archivedDocuments: number;
  expiredDocuments: number;
  totalSize: number;
  averageFileSize: number;
  byType: Record<DocumentTypeUnion, number>;
  byStatus: Record<DocumentStatusUnion, number>;
  byPriority: Record<DocumentPriorityUnion, number>;
  byCategory: Record<string, number>;
  recentUploads: number;
  pendingApproval: number;
  lastUpdated: string;
}

// ============================================================================
// FILTER DTO
// ============================================================================

/**
 * Document filter criteria
 */
export interface DocumentFilterDTO {
  projectId?: string;
  phaseId?: string;
  inspectionId?: string;
  paymentId?: string;
  supplierId?: string;
  documentType?: DocumentTypeUnion;
  status?: DocumentStatusUnion;
  priority?: DocumentPriorityUnion;
  category?: string;
  subcategory?: string;
  searchQuery?: string;
  tags?: string[];
  assignedTo?: string;
  uploadedBy?: string;
  isInternalOnly?: boolean;
  isSharedWithSuppliers?: boolean;
  isOverdue?: boolean;
  needsReview?: boolean;
  dateRange?: {
    start?: string;
    end?: string;
  };
  fileSizeRange?: {
    min?: number;
    max?: number;
  };
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'fileSize' | 'deadlineDate';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// ============================================================================
// VERSION DTO
// ============================================================================

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
  fileUrl?: string;
  fileSize?: number;
}

// ============================================================================
// ACCESS LOG DTO
// ============================================================================

/**
 * Document access log
 */
export interface DocumentAccessLogDTO {
  id: string;
  documentId: string;
  userId: string;
  action: 'viewed' | 'downloaded' | 'uploaded' | 'updated' | 'deleted' | 'shared' | 'approved' | 'rejected' | 'archived';
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  notes?: string;
  duration?: number;
}

// ============================================================================
// UPLOAD DTO
// ============================================================================

/**
 * Document upload request
 */
export interface DocumentUploadDTO {
  title: string;
  description?: string;
  documentType: DocumentTypeUnion;
  priority?: DocumentPriorityUnion;
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

// ============================================================================
// SHARE DTO
// ============================================================================

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

// ============================================================================
// SEARCH DTO
// ============================================================================

/**
 * Document search criteria
 */
export interface DocumentSearchDTO {
  query: string;
  projectId?: string;
  phaseId?: string;
  tags?: string[];
  documentType?: DocumentTypeUnion;
  status?: DocumentStatusUnion;
  limit?: number;
  offset?: number;
}

// ============================================================================
// RESPONSE DTO
// ============================================================================

/**
 * Simple document response for file operations
 */
export interface DocumentResponseDTO {
  id: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  documentType: DocumentTypeUnion;
  createdAt: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Vérifie si une valeur est un DocumentType valide
 */
export function isValidDocumentType(value: string): value is DocumentTypeUnion {
  return Object.values(DocumentType).includes(value as DocumentType);
}

/**
 * Vérifie si une valeur est un DocumentStatus valide
 */
export function isValidDocumentStatus(value: string): value is DocumentStatusUnion {
  return Object.values(DocumentStatus).includes(value as DocumentStatus);
}

/**
 * Vérifie si une valeur est un DocumentPriority valide
 */
export function isValidDocumentPriority(value: string): value is DocumentPriorityUnion {
  return Object.values(DocumentPriority).includes(value as DocumentPriority);
}

/**
 * Normalise un type de document
 */
export function normalizeDocumentType(value: string): DocumentTypeUnion {
  const normalized = value?.toLowerCase().trim() || 'other';
  if (isValidDocumentType(normalized)) {
    return normalized as DocumentTypeUnion;
  }
  return DocumentType.OTHER;
}

/**
 * Normalise un statut de document
 */
export function normalizeDocumentStatus(value: string): DocumentStatusUnion {
  const normalized = value?.toLowerCase().trim() || 'draft';
  if (isValidDocumentStatus(normalized)) {
    return normalized as DocumentStatusUnion;
  }
  return DocumentStatus.DRAFT;
}

/**
 * Normalise une priorité de document
 */
export function normalizeDocumentPriority(value: string): DocumentPriorityUnion {
  const normalized = value?.toLowerCase().trim() || 'medium';
  if (isValidDocumentPriority(normalized)) {
    return normalized as DocumentPriorityUnion;
  }
  return DocumentPriority.MEDIUM;
}

/**
 * Obtient le libellé d'un type de document
 */
export function getDocumentTypeLabel(type: DocumentTypeUnion): string {
  const labels: Record<DocumentTypeUnion, string> = {
    [DocumentType.CONTRACT]: 'Contrat',
    [DocumentType.PLAN]: 'Plan',
    [DocumentType.SPECIFICATION]: 'Spécification',
    [DocumentType.REPORT]: 'Rapport',
    [DocumentType.CERTIFICATE]: 'Certificat',
    [DocumentType.PERMIT]: 'Permis',
    [DocumentType.INVOICE]: 'Facture',
    [DocumentType.RECEIPT]: 'Reçu',
    [DocumentType.MANUAL]: 'Manuel',
    [DocumentType.POLICY]: 'Politique',
    [DocumentType.PROCEDURE]: 'Procédure',
    [DocumentType.DRAWING]: 'Dessin',
    [DocumentType.PHOTO]: 'Photo',
    [DocumentType.VIDEO]: 'Vidéo',
    [DocumentType.BLUEPRINT]: 'Plan d\'exécution',
    [DocumentType.SCHEMA]: 'Schéma',
    [DocumentType.CHECKLIST]: 'Checklist',
    [DocumentType.FORM]: 'Formulaire',
    [DocumentType.TEMPLATE]: 'Modèle',
    [DocumentType.PV]: 'Procès-verbal',
    [DocumentType.SERVICE_REPORT]: 'Rapport de service',
    [DocumentType.TENDER_DOCUMENT]: 'Document d\'appel d\'offres',
    [DocumentType.SUPPORTING_DOCUMENT]: 'Document justificatif',
    [DocumentType.CORRESPONDENCE]: 'Correspondance',
    [DocumentType.INSURANCE]: 'Assurance',
    [DocumentType.BANK_GUARANTEE]: 'Garantie bancaire',
    [DocumentType.OTHER]: 'Autre',
  };
  return labels[type] || type;
}

/**
 * Obtient le libellé d'un statut de document
 */
export function getDocumentStatusLabel(status: DocumentStatusUnion): string {
  const labels: Record<DocumentStatusUnion, string> = {
    [DocumentStatus.DRAFT]: 'Brouillon',
    [DocumentStatus.PENDING_APPROVAL]: 'En attente de validation',
    [DocumentStatus.APPROVED]: 'Approuvé',
    [DocumentStatus.REJECTED]: 'Rejeté',
    [DocumentStatus.ARCHIVED]: 'Archivé',
    [DocumentStatus.EXPIRED]: 'Expiré',
    [DocumentStatus.DEPRECATED]: 'Déprécié',
  };
  return labels[status] || status;
}

/**
 * Obtient la couleur d'un statut de document
 */
export function getDocumentStatusColor(status: DocumentStatusUnion): string {
  const colors: Record<DocumentStatusUnion, string> = {
    [DocumentStatus.DRAFT]: 'bg-gray-100 text-gray-800 border-gray-200',
    [DocumentStatus.PENDING_APPROVAL]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    [DocumentStatus.APPROVED]: 'bg-green-100 text-green-800 border-green-200',
    [DocumentStatus.REJECTED]: 'bg-red-100 text-red-800 border-red-200',
    [DocumentStatus.ARCHIVED]: 'bg-gray-200 text-gray-600 border-gray-300',
    [DocumentStatus.EXPIRED]: 'bg-orange-100 text-orange-800 border-orange-200',
    [DocumentStatus.DEPRECATED]: 'bg-gray-300 text-gray-500 border-gray-400',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

/**
 * Obtient l'icône d'un type de document
 */
export function getDocumentTypeIcon(type: DocumentTypeUnion): string {
  const icons: Record<DocumentTypeUnion, string> = {
    [DocumentType.CONTRACT]: 'FileText',
    [DocumentType.PLAN]: 'Clipboard',
    [DocumentType.SPECIFICATION]: 'FileText',
    [DocumentType.REPORT]: 'FileText',
    [DocumentType.CERTIFICATE]: 'Award',
    [DocumentType.PERMIT]: 'FileCheck',
    [DocumentType.INVOICE]: 'FileText',
    [DocumentType.RECEIPT]: 'Receipt',
    [DocumentType.MANUAL]: 'BookOpen',
    [DocumentType.POLICY]: 'FileText',
    [DocumentType.PROCEDURE]: 'List',
    [DocumentType.DRAWING]: 'PenTool',
    [DocumentType.PHOTO]: 'Image',
    [DocumentType.VIDEO]: 'Video',
    [DocumentType.BLUEPRINT]: 'Ruler',
    [DocumentType.SCHEMA]: 'GitBranch',
    [DocumentType.CHECKLIST]: 'CheckSquare',
    [DocumentType.FORM]: 'File',
    [DocumentType.TEMPLATE]: 'File',
    [DocumentType.PV]: 'FileText',
    [DocumentType.SERVICE_REPORT]: 'FileText',
    [DocumentType.TENDER_DOCUMENT]: 'FileText',
    [DocumentType.SUPPORTING_DOCUMENT]: 'File',
    [DocumentType.CORRESPONDENCE]: 'Mail',
    [DocumentType.INSURANCE]: 'Shield',
    [DocumentType.BANK_GUARANTEE]: 'Shield',
    [DocumentType.OTHER]: 'File',
  };
  return icons[type] || 'File';
}
// Moved from src/pages/Users.tsx
export type UserProfile = {
  id: string;
  fullName: string | null;
  phone: string | null;
  nationalId: string | null;
  avatarUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  roles?: string[];
  primaryRole?: RoleType;
  isActive?: boolean;
  email?: string;
}

// Moved from src/components/documents/DocumentDetails.tsx
export interface Document {
  id: string;
  title: string;
  description: string;
  documentType: string; // ✅ CAMELCASE: Instead of documentType
  status: string;
  fileUrl: string; // ✅ CAMELCASE: Instead of fileUrl
  fileName: string; // ✅ CAMELCASE: Instead of fileName
  fileSize: number; // ✅ CAMELCASE: Instead of fileSize
  createdAt: string; // ✅ CAMELCASE: Instead of createdAt
  uploadedBy: string; // ✅ CAMELCASE: Instead of uploadedBy
  projectId: string; // ✅ CAMELCASE: Instead of projectId
  mimeType?: string; // ✅ CAMELCASE: Instead of mimeType
  
  // Legacy snakeCase for backward compatibility
  documentType?: string; // Legacy snakeCase for backward compatibility
  fileUrl?: string; // Legacy snakeCase for backward compatibility
  fileName?: string; // Legacy snakeCase for backward compatibility
  fileSize?: number; // Legacy snakeCase for backward compatibility
  createdAt?: string; // Legacy snakeCase for backward compatibility
  uploadedBy?: string; // Legacy snakeCase for backward compatibility
  projectId?: string; // Legacy snakeCase for backward compatibility
  mimeType?: string; // Legacy snakeCase for backward compatibility
}

// Moved from src/components/documents/DocumentViewer.tsx
export interface Document {
  id: string;
  title: string;
  description: string;
  documentType: string;
  status: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
  uploadedBy: string;
  projectId: string;
  mimeType?: string;
}

// Moved from src/components/documents/DocumentsListPaginated.tsx
export interface Document {
  id: string;
  title: string;
  description?: string;
  documentType: string;
  status: string;
  fileName?: string;
  uploadedBy?: string;
  createdAt: string;
  fileSize?: number;
}

// Moved from src/components/documents/TenderDocumentSelector.tsx
export interface Document {
  id: string;
  title: string;
  documentType: string;
  fileName?: string;
  createdAt: string;
  uploadedBy?: string;
  fileSize?: number;
}

// Moved from src/components/documents/TenderDocumentUploadForm.tsx
export interface Document {
  id: string;
  title: string;
  description: string;
  documentType: DocumentType;
  status: DocumentStatus;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
  uploadedBy: string;
  projectId: string;
  mimeType?: string;
}

// Moved from src/components/documents/adapters/documentsTableAdapter.tsx
export interface DocumentsTableAdapterOptions {
  scopeLabel: string;
  queryKey: unknown[];
  filters: DocumentsTableFilter[];
  /** Bucket name used when uploading through this adapter (defaults to 'documents'). */
  bucket?: string;
  /** File path prefix inside the bucket. */
  pathPrefix?: string;
  /** Categories offered in the upload dialog. */
  uploadCategoryOptions?: DocumentFacetOption[];
  /** Facets shown in the sidebar. */
  facets?: DocumentFacetDef[];
  categoryLabels?: Record<string, string>;
  /** Extra columns merged into every INSERT (e.g. projectId: xxx). */
  insertDefaults?: Record<string, unknown>;
  /** Optional secondary facet extractor to enrich each item (e.g. lot, phase name). */
  itemFacetBuilder?: (row: any) => Record<string, string | null>;
  /** Preview strategy — 'proxy' hides the underlying storage URL. */
  previewMode?: 'direct' | 'proxy';
}

// Moved from src/components/project/ProjectDocuments.tsx
export interface ProjectDocument {
  id: string;
  description?: string;
  fileName?: string;
  fileUrl?: string;
  mimeType?: string;
  fileSize?: number;
  documentType: string;
  status: string;
  createdAt: string;
  tags?: string[];
}

// Moved from src/components/suppliers/EnhancedSupplierTenderPortal.tsx
export interface SharedDocument {
  id: string;
  title: string;
  fileUrl: string;
  fileName: string;
  description?: string;
  createdAt: string;
  metadata?: {
    tenderId?: string;
    phase?: number;
    sharedBy?: string;
  };
}

// Moved from src/components/users/UserManagementDialog.tsx
export interface UserProfile {
  id: string;
  fullName: string | null;
  phone: string | null;
  nationalId: string | null;
  avatarUrl: string | null;
  roles?: string[];
  isActive?: boolean;
  email?: string;
}

// Moved from src/config/constants.ts
export interface DevUserProfile {
  id: string;
  email: string;
  password?: string;
  userMetadata: {
    fullName: string;
    role: string;
    phone: string;
    nationalId: string;
  };
  /** Fine-grained permissions (Mode B / audit UI). */
  permissions?: string[];
  /** Team memberships. */
  teams?: string[];
  /** User preferences (language, theme, defaults). */
  preferences?: Record<string, unknown>;
}

// Moved from src/contexts/KeycloakAuthContext.tsx
export interface Profile {
  id: string;
  fullName: string;
  phone: string;
  nationalId: string;
  role: string;
  avatarUrl: string | null;
}

// Moved from src/hooks/hexagonal/useBusinessDocumentsHex.ts
export interface BusinessDocumentFormData {
  title: string;
  description?: string;
  amount?: number;
  supplier?: string;
  invoiceDate?: string;
  dueDate?: string;
  reference?: string;
  file?: File;
}

// Moved from src/hooks/usePhaseWorkflow.ts
export interface PhaseDocument {
  id: string;
  type: string;
  url: string;
  uploadedAt: string;
}

// Moved from src/hooks/useProjectCheckpoints.ts
export interface ProjectDocument {
  id: string;
  phaseId: string | null;
  [key: string]: any;
}
// Moved from src/dtos/entities/CheckpointVerificationDTO.ts (reconciled)
export interface VerifyDocumentsRequestDto {
  requiredDocumentIds: string[];
  projectId: string;
}

// Moved from src/dtos/entities/ComplianceDTO.ts (reconciled)
export interface CreateComplianceDocumentRequestDTO {
  complianceItemId: string;
  documentId: string;
  category: string;
  subcategory?: string;
  isRequired?: boolean;
  uploadedBy?: string;
  fileUrl?: string;
}

// Moved from src/dtos/entities/InspectionDTO.ts (reconciled)
export type AddDocumentRequestDto = {
  inspectionId: string;
  document: CreateDocumentDTO;
}

// Moved from src/dtos/entities/MonitoringDTOs.ts (reconciled)
export interface DocumentSummaryDTO {
  id: string;
  name: string;
  type: string;
  category: 'contract' | 'technical' | 'legal' | 'financial' | 'safety';
  projectId: string;
  projectName: string;
  uploadedBy: string;
  uploadedAt: string;
  size: number; // in KB
  expiresAt?: string;
  status: 'active' | 'expired' | 'archived';
  accessLevel: 'public' | 'restricted' | 'confidential';
}

// Moved from src/dtos/entities/MonitoringDTOs.ts (reconciled)
export interface DocumentFiltersDTO {
  category?: string;
  type?: string;
  projectId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  status?: string;
  accessLevel?: string;
  search?: string;
}

// Moved from src/dtos/entities/ProjectAggregateDTO.ts (reconciled)
export interface ImportFile {
  name: string;
  size: number;
  type: string;
  data: ArrayBuffer | string;
}

// Moved from src/dtos/entities/ProjectReportDTO.ts (reconciled)
export interface StepDocumentDTO {
  id: string;
  stepId: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

// Moved from src/dtos/entities/ReportDTO.ts (reconciled)
export interface DocumentSummaryDTO {
  projectId: string;
  generatedAt: string;
  
  totalDocuments: number;
  documentsByType: Record<string, number>;
  documentsByStatus: Record<string, number>;
  
  recentDocuments: DocumentSummaryItemDTO[];
  expiredDocuments: DocumentSummaryItemDTO[];
  pendingApproval: DocumentSummaryItemDTO[];
  
  totalSize: number;
  averageSize: number;
  largestDocument: DocumentSummaryItemDTO;
  
  complianceScore: number;
  missingDocuments: string[];
  recommendations: string[];
}

// Moved from src/dtos/entities/ReportDTO.ts (reconciled)
export interface DocumentSummaryItemDTO {
  id: string;
  title: string;
  type: string;
  status: string;
  size: number;
  createdAt: string;
  lastModified: string;
  owner?: string;
  url?: string;
}

// Moved from src/dtos/entities/StorageDTO.ts (reconciled)
export interface UploadFileRequestDto {
  bucket: string;
  path: string;
  file: File;
}

// Moved from src/dtos/entities/StorageDTO.ts (reconciled)
export interface DeleteFileRequestDto {
  bucket: string;
  path: string;
}

// Moved from src/dtos/entities/StorageDTO.ts (reconciled)
export interface ListFilesRequestDto {
  bucket: string;
  prefix?: string;
}

// Moved from src/dtos/entities/StorageDTO.ts (reconciled)
export interface DownloadFileRequestDto {
  bucket: string;
  path: string;
}

// Moved from src/dtos/entities/StorageDTO.ts (reconciled)
export interface FileExistsRequestDto {
  bucket: string;
  path: string;
}

// Moved from src/dtos/entities/StorageDTO.ts (reconciled)
export interface UploadMultipleFilesRequestDto {
  bucket: string;
  files: Array<{ path: string; file: File }>;
}

// Moved from src/dtos/entities/StorageDTO.ts (reconciled)
export interface DeleteMultipleFilesRequestDto {
  bucket: string;
  paths: string[];
}

// Moved from src/dtos/entities/TenderSubmissionDTO.ts (reconciled)
export interface UploadedDocument {
  file: File;
  category: 'administrative' | 'technical' | 'financial';
  subcategory: string;
}
