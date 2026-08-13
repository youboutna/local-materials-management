/**
 * Document Transformer - Hexagonal Architecture
 * Transforms between Document entities and DTOs
 * Following clean architecture principles with proper separation of concerns
 * 
 * ✅ Conversion complète : Domain ↔ DTO ↔ Repository
 * ✅ Pas de logique métier, que des transformations
 * ✅ Utilisation des types DTOs existants
 * ✅ Gestion des valeurs null/undefined
 */

import { Document, DocumentPriority, DocumentStatus, DocumentType } from '@/domain/entities/Document';
import {
  CreateDocumentDTO,
  DocumentDetailsDTO,
  DocumentDTO,
  DocumentResponseDTO,
  DocumentStatisticsDTO,
  DocumentSummaryDTO,
  DocumentUploadDTO,
  getDocumentStatusColor,
  getDocumentStatusLabel,
  getDocumentTypeIcon,
  getDocumentTypeLabel,
  RepositoryDocument,
  UpdateDocumentDTO
} from '@/dtos/entities/DocumentDTO';
import { EntityToDTOMapper, ValidationResult } from '@/dtos/transforms/shared';


/** Sérialisation ISO tolérante : accepte Date, string ISO, timestamp ou null. */
function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }
  if (typeof value === 'number') return new Date(value).toISOString();
  return new Date().toISOString();
}

function toIsoOrNull(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  return toIso(value);
}

export class DocumentTransformer implements EntityToDTOMapper<Document, DocumentDTO> {
  // ============================================================================
  // DOMAIN → DTO
  // ============================================================================

  /**
   * Transform Document entity to DocumentDTO (Domain Entity → DTO)
   */
  static toDTO(entity: Document | Record<string, any>): DocumentDTO {
    // Tolérant : accepte une entité domaine, une ligne DB (snake_case) ou un objet partiel.
    const e = (entity ?? {}) as Record<string, any>;
    const pick = <T>(camel: string, snake: string, fallback: T): T =>
      (e[camel] !== undefined && e[camel] !== null ? e[camel] : e[snake] !== undefined && e[snake] !== null ? e[snake] : fallback) as T;

    return {
      id: pick('id', 'id', ''),
      projectId: pick('projectId', 'project_id', null),
      phaseId: pick('phaseId', 'phase_id', null),
      inspectionId: pick('inspectionId', 'inspection_id', null),
      paymentId: pick('paymentId', 'payment_id', null),
      supplierId: pick('supplierId', 'supplier_id', null),
      title: pick('title', 'title', ''),
      description: pick('description', 'description', null),
      documentType: pick('documentType', 'document_type', DocumentType.OTHER),
      status: pick('status', 'status', DocumentStatus.DRAFT),
      fileName: pick('fileName', 'file_name', null),
      fileUrl: pick('fileUrl', 'file_url', null),
      fileSize: pick('fileSize', 'file_size', null),
      mimeType: pick('mimeType', 'mime_type', null),
      tags: pick('tags', 'tags', []),
      isInternalOnly: pick('isInternalOnly', 'is_internal_only', false),
      isSharedWithSuppliers: pick('isSharedWithSuppliers', 'is_shared_with_suppliers', false),
      deadlineDate: toIsoOrNull(pick('deadlineDate', 'deadline_date', null)),
      assignedTo: pick('assignedTo', 'assigned_to', null),
      uploadedBy: pick('uploadedBy', 'uploaded_by', null),
      metadata: pick('metadata', 'metadata', null),
      createdAt: toIso(pick('createdAt', 'created_at', null)),
      updatedAt: toIso(pick('updatedAt', 'updated_at', null)),
    } as DocumentDTO;
  }


  /**
   * Transform Document entity to DocumentSummaryDTO (Domain Entity → Summary)
   */
  static toSummaryDTO(entity: Document): DocumentSummaryDTO {
    return {
      id: entity.id,
      title: entity.title,
      documentType: entity.documentType,
      status: entity.status,
      createdAt: toIso(entity.createdAt),
      fileSize: entity.fileSize,
      projectId: entity.projectId,
      phaseId: entity.phaseId,
      tags: entity.tags,
      isOverdue: entity.isOverdue,
      needsReview: entity.isPending(),
      priority: entity.priority,
    };
  }

  /**
   * Transform Document entity to DocumentDetailsDTO (Domain Entity → Details)
   */
  static toDetailsDTO(entity: Document, relations?: {
    projectDetails?: { id: string; title: string; status: string };
    phaseDetails?: { id: string; name: string; description: string };
    inspectionDetails?: { id: string; date: string; status: string };
    paymentDetails?: { id: string; amount: number; status: string };
    supplierDetails?: { id: string; name: string; email: string };
    uploadedByDetails?: { id: string; name: string; email: string };
    assignedToDetails?: { id: string; name: string; email: string };
    relatedDocuments?: Document[];
    versions?: Document[];
    comments?: Array<{ id: string; content: string; author: string; createdAt: string }>;
    accessHistory?: Array<{ accessedAt: string; accessedBy: string; action: string }>;
  }): DocumentDetailsDTO {
    return {
      ...this.toDTO(entity),
      projectDetails: relations?.projectDetails,
      phaseDetails: relations?.phaseDetails,
      inspectionDetails: relations?.inspectionDetails,
      paymentDetails: relations?.paymentDetails,
      supplierDetails: relations?.supplierDetails,
      uploadedByDetails: relations?.uploadedByDetails,
      assignedToDetails: relations?.assignedToDetails,
      relatedDocuments: relations?.relatedDocuments?.map(doc => this.toDTO(doc)),
      versions: relations?.versions?.map(doc => this.toDTO(doc)),
      comments: relations?.comments,
      accessHistory: relations?.accessHistory,
    };
  }

  /**
   * Transform Document entity to DocumentResponseDTO (Domain Entity → Response)
   */
  static toResponseDTO(entity: Document): DocumentResponseDTO {
    return {
      id: entity.id,
      fileName: entity.fileName || entity.title,
      fileSize: entity.fileSize || 0,
      fileUrl: entity.fileUrl || '',
      documentType: entity.documentType,
      createdAt: toIso(entity.createdAt),
    };
  }

  // ============================================================================
  // DTO → DOMAIN
  // ============================================================================

  /**
   * Transform DocumentDTO to Document entity (DTO → Domain Entity)
   */
  static toEntity(dto: DocumentDTO): Document {
    return new Document(
      dto.id,
      dto.projectId,
      dto.phaseId,
      dto.inspectionId,
      dto.paymentId,
      dto.supplierId,
      dto.title,
      dto.description,
      (dto.documentType || DocumentType.OTHER) as DocumentType,
      (dto.status || DocumentStatus.DRAFT) as DocumentStatus,
      DocumentPriority.MEDIUM,
      dto.fileName,
      dto.fileUrl,
      dto.fileSize,
      dto.mimeType,
      dto.tags || [],
      dto.isInternalOnly || false,
      dto.isSharedWithSuppliers || false,
      dto.deadlineDate ? new Date(dto.deadlineDate) : null,
      dto.assignedTo,
      dto.uploadedBy,
      new Date(dto.createdAt),
      new Date(dto.updatedAt),
      dto.metadata
    );
  }

  /**
   * Transform CreateDocumentDTO to Document entity
   */
  static fromCreateDTOToEntity(dto: CreateDocumentDTO): Document {
    const now = new Date();
    return new Document(
      crypto.randomUUID(),
      dto.projectId || null,
      dto.phaseId || null,
      dto.inspectionId || null,
      dto.paymentId || null,
      dto.supplierId || null,
      dto.title,
      dto.description || null,
      (dto.documentType || DocumentType.OTHER) as DocumentType,
      (dto.status || DocumentStatus.DRAFT) as DocumentStatus,
      DocumentPriority.MEDIUM,
      dto.fileName || null,
      dto.fileUrl || null,
      dto.fileSize || null,
      dto.mimeType || null,
      dto.tags || [],
      dto.isInternalOnly || false,
      dto.isSharedWithSuppliers || false,
      dto.deadlineDate ? new Date(dto.deadlineDate) : null,
      dto.assignedTo || null,
      dto.uploadedBy || null,
      now,
      now,
      dto.metadata || null
    );
  }

  /**
   * Transform UpdateDocumentDTO to partial Document entity
   */
  static fromUpdateDTOToEntity(dto: UpdateDocumentDTO): Partial<Document> {
    // Les propriétés du domaine sont readonly : on construit un objet mutable
    // avant de le renvoyer sous forme de Partial<Document>.
    const entity: Record<string, unknown> = {};
    
    if (dto.title !== undefined) entity.title = dto.title;
    if (dto.description !== undefined) entity.description = dto.description;
    if (dto.documentType !== undefined) entity.documentType = dto.documentType as DocumentType;
    if (dto.status !== undefined) entity.status = dto.status as DocumentStatus;
    if (dto.projectId !== undefined) entity.projectId = dto.projectId;
    if (dto.phaseId !== undefined) entity.phaseId = dto.phaseId;
    if (dto.inspectionId !== undefined) entity.inspectionId = dto.inspectionId;
    if (dto.paymentId !== undefined) entity.paymentId = dto.paymentId;
    if (dto.supplierId !== undefined) entity.supplierId = dto.supplierId;
    if (dto.fileName !== undefined) entity.fileName = dto.fileName;
    if (dto.fileUrl !== undefined) entity.fileUrl = dto.fileUrl;
    if (dto.fileSize !== undefined) entity.fileSize = dto.fileSize;
    if (dto.mimeType !== undefined) entity.mimeType = dto.mimeType;
    if (dto.tags !== undefined) entity.tags = dto.tags;
    if (dto.isInternalOnly !== undefined) entity.isInternalOnly = dto.isInternalOnly;
    if (dto.isSharedWithSuppliers !== undefined) entity.isSharedWithSuppliers = dto.isSharedWithSuppliers;
    if (dto.deadlineDate !== undefined) entity.deadlineDate = dto.deadlineDate ? new Date(dto.deadlineDate) : null;
    if (dto.assignedTo !== undefined) entity.assignedTo = dto.assignedTo;
    if (dto.uploadedBy !== undefined) entity.uploadedBy = dto.uploadedBy;
    if (dto.metadata !== undefined) entity.metadata = dto.metadata;
    
    return entity as Partial<Document>;
  }

  /**
   * Transform UploadDTO to Document entity
   */
  static fromUploadDTOToEntity(dto: DocumentUploadDTO): Document {
    const now = new Date();
    return new Document(
      crypto.randomUUID(),
      dto.projectId || null,
      dto.phaseId || null,
      null,
      null,
      null,
      dto.title,
      dto.description || null,
      (dto.documentType || DocumentType.OTHER) as DocumentType,
      DocumentStatus.DRAFT,
      DocumentPriority.MEDIUM,
      null, // fileName
      null, // fileUrl
      null, // fileSize
      null, // mimeType
      dto.tags || [],
      dto.isInternalOnly || false,
      dto.isSharedWithSuppliers || false,
      dto.deadlineDate ? new Date(dto.deadlineDate) : null,
      dto.assignedTo || null,
      null, // uploadedBy
      now,
      now,
      dto.metadata || null
    );
  }

  // ============================================================================
  // DOMAIN → REPOSITORY (snake_case)
  // ============================================================================

  /**
   * Transform Document entity to RepositoryDocument (Domain → Repository)
   */
  static toRepository(entity: Document): RepositoryDocument {
    return {
      id: entity.id,
      project_id: entity.projectId,
      phase_id: entity.phaseId,
      inspection_id: entity.inspectionId,
      payment_id: entity.paymentId,
      supplier_id: entity.supplierId,
      title: entity.title,
      description: entity.description,
      document_type: entity.documentType,
      status: entity.status,
      file_name: entity.fileName,
      file_url: entity.fileUrl,
      file_size: entity.fileSize,
      mime_type: entity.mimeType,
      tags: entity.tags,
      is_internal_only: entity.isInternalOnly,
      is_shared_with_suppliers: entity.isSharedWithSuppliers,
      deadline_date: toIsoOrNull(entity.deadlineDate),
      assigned_to: entity.assignedTo,
      uploaded_by: entity.uploadedBy,
      metadata: entity.metadata || null,
      category: null,
      subcategory: null,
      created_at: toIso(entity.createdAt),
      updated_at: toIso(entity.updatedAt),
    };
  }

  /**
   * Transform CreateDocumentDTO to RepositoryDocument (Create DTO → Repository)
   */
  static createToRepository(dto: CreateDocumentDTO): RepositoryDocument {
    const now = new Date().toISOString();
    
    // Normalisation des valeurs avec fallback
    const documentType = dto.documentType || DocumentType.OTHER;
    const status = dto.status || DocumentStatus.DRAFT;
    
    return {
      id: crypto.randomUUID(),
      project_id: dto.projectId || null,
      phase_id: dto.phaseId || null,
      inspection_id: dto.inspectionId || null,
      payment_id: dto.paymentId || null,
      supplier_id: dto.supplierId || null,
      title: dto.title,
      description: dto.description || null,
      document_type: documentType as DocumentType,
      status: status as DocumentStatus,
      file_name: dto.fileName || null,
      file_url: dto.fileUrl || null,
      file_size: dto.fileSize || null,
      mime_type: dto.mimeType || null,
      tags: dto.tags || [],
      is_internal_only: dto.isInternalOnly || false,
      is_shared_with_suppliers: dto.isSharedWithSuppliers || false,
      deadline_date: dto.deadlineDate || null,
      assigned_to: dto.assignedTo || null,
      uploaded_by: dto.uploadedBy || null,
      metadata: dto.metadata || null,
      category: dto.category || null,
      subcategory: dto.subcategory || null,
      created_at: now,
      updated_at: now,
    };
  }

  /**
   * Transform UpdateDocumentDTO to partial RepositoryDocument (Update DTO → Repository)
   */
  static updateToRepository(dto: UpdateDocumentDTO): Partial<RepositoryDocument> {
    const updates: Partial<RepositoryDocument> = {};
    
    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.documentType !== undefined) updates.document_type = dto.documentType as DocumentType;
    if (dto.status !== undefined) updates.status = dto.status as DocumentStatus;
    if (dto.projectId !== undefined) updates.project_id = dto.projectId;
    if (dto.phaseId !== undefined) updates.phase_id = dto.phaseId;
    if (dto.inspectionId !== undefined) updates.inspection_id = dto.inspectionId;
    if (dto.paymentId !== undefined) updates.payment_id = dto.paymentId;
    if (dto.supplierId !== undefined) updates.supplier_id = dto.supplierId;
    if (dto.fileName !== undefined) updates.file_name = dto.fileName;
    if (dto.fileUrl !== undefined) updates.file_url = dto.fileUrl;
    if (dto.fileSize !== undefined) updates.file_size = dto.fileSize;
    if (dto.mimeType !== undefined) updates.mime_type = dto.mimeType;
    if (dto.tags !== undefined) updates.tags = dto.tags;
    if (dto.isInternalOnly !== undefined) updates.is_internal_only = dto.isInternalOnly;
    if (dto.isSharedWithSuppliers !== undefined) updates.is_shared_with_suppliers = dto.isSharedWithSuppliers;
    if (dto.deadlineDate !== undefined) updates.deadline_date = dto.deadlineDate;
    if (dto.assignedTo !== undefined) updates.assigned_to = dto.assignedTo;
    if (dto.uploadedBy !== undefined) updates.uploaded_by = dto.uploadedBy;
    if (dto.metadata !== undefined) updates.metadata = dto.metadata;
    if (dto.category !== undefined) updates.category = dto.category;
    if (dto.subcategory !== undefined) updates.subcategory = dto.subcategory;
    
    // Si le statut est null, on ne le met pas à jour (garder la valeur existante)
    if (dto.status === null) {
      delete updates.status;
    }
    
    // Si le documentType est null, on ne le met pas à jour
    if (dto.documentType === null) {
      delete updates.document_type;
    }
    
    updates.updated_at = new Date().toISOString();
    
    return updates;
  }

  // ============================================================================
  // REPOSITORY → DOMAIN
  // ============================================================================

  /**
   * Transform RepositoryDocument to Document entity (Repository → Domain)
   */
  static fromRepository(row: RepositoryDocument): Document {
    return new Document(
      row.id,
      row.project_id,
      row.phase_id,
      row.inspection_id,
      row.payment_id,
      row.supplier_id,
      row.title,
      row.description,
      row.document_type as DocumentType,
      row.status as DocumentStatus,
      DocumentPriority.MEDIUM,
      row.file_name,
      row.file_url,
      row.file_size,
      row.mime_type,
      row.tags || [],
      row.is_internal_only || false,
      row.is_shared_with_suppliers || false,
      row.deadline_date ? new Date(row.deadline_date) : null,
      row.assigned_to,
      row.uploaded_by,
      new Date(row.created_at),
      new Date(row.updated_at),
      row.metadata || null
    );
  }

  /**
   * Transform RepositoryDocument row from database (snake_case) to Document entity
   */
  static fromDatabaseRow(row: Record<string, unknown>): Document {
    return new Document(
      row.id as string,
      row.project_id as string | null,
      row.phase_id as string | null,
      row.inspection_id as string | null,
      row.payment_id as string | null,
      row.supplier_id as string | null,
      (row.title as string) || '',
      (row.description as string) || null,
      (row.document_type as DocumentType) || DocumentType.OTHER,
      (row.status as DocumentStatus) || DocumentStatus.DRAFT,
      DocumentPriority.MEDIUM,
      (row.file_name as string) || null,
      (row.file_url as string) || null,
      (row.file_size as number) || null,
      (row.mime_type as string) || null,
      (row.tags as string[]) || [],
      (row.is_internal_only as boolean) || false,
      (row.is_shared_with_suppliers as boolean) || false,
      row.deadline_date ? new Date(row.deadline_date as string) : null,
      (row.assigned_to as string) || null,
      (row.uploaded_by as string) || null,
      row.created_at ? new Date(row.created_at as string) : new Date(),
      row.updated_at ? new Date(row.updated_at as string) : new Date(),
      (row.metadata as Record<string, unknown>) || null
    );
  }

  // ============================================================================
  // BATCH TRANSFORMATIONS
  // ============================================================================

  /**
   * Batch: Domain Entities → DTOs
   */
  static toDTOList(entities: Array<Document | Record<string, any>> | null | undefined): DocumentDTO[] {
    return (entities ?? []).filter(Boolean).map(entity => this.toDTO(entity));
  }


  /**
   * Batch: Domain Entities → Summary DTOs
   */
  static toSummaryList(entities: Document[]): DocumentSummaryDTO[] {
    return entities.map(entity => this.toSummaryDTO(entity));
  }

  /**
   * Batch: DTOs → Domain Entities
   */
  static toEntityList(dtos: DocumentDTO[]): Document[] {
    return dtos.map(dto => this.toEntity(dto));
  }

  /**
   * Batch: Repository Rows → Domain Entities
   */
  static fromRepositoryList(rows: RepositoryDocument[]): Document[] {
    return rows.map(row => this.fromRepository(row));
  }

  /**
   * Batch: Database Rows → Domain Entities
   */
  static fromDatabaseRows(rows: Record<string, unknown>[]): Document[] {
    return rows.map(row => this.fromDatabaseRow(row));
  }

  /**
   * Batch: Domain Entities → Repository Documents
   */
  static toRepositoryList(entities: Document[]): RepositoryDocument[] {
    return entities.map(entity => this.toRepository(entity));
  }

  // ============================================================================
  // STATISTICS & ANALYTICS
  // ============================================================================

  /**
   * Transform documents to statistics DTO
   */
  static toStatisticsDTO(documents: Document[]): DocumentStatisticsDTO {
    const totalDocuments = documents.length;
    const activeDocuments = documents.filter(doc => !doc.isArchived()).length;
    const archivedDocuments = documents.filter(doc => doc.isArchived()).length;
    const expiredDocuments = documents.filter(doc => doc.isExpired).length;
    const totalSize = documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0);
    const averageFileSize = totalDocuments > 0 ? totalSize / totalDocuments : 0;

    const byType: Record<DocumentType, number> = {} as any;
    const byStatus: Record<DocumentStatus, number> = {} as any;
    const byPriority: Record<DocumentPriority, number> = {} as any;
    const byCategory: Record<string, number> = {};

    documents.forEach(doc => {
      byType[doc.documentType] = (byType[doc.documentType] || 0) + 1;
      byStatus[doc.status] = (byStatus[doc.status] || 0) + 1;
      byPriority[doc.priority] = (byPriority[doc.priority] || 0) + 1;
      
      const category = doc.metadata?.category as string || 'uncategorized';
      byCategory[category] = (byCategory[category] || 0) + 1;
    });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentUploads = documents.filter(doc => doc.createdAt > thirtyDaysAgo).length;
    const pendingApproval = documents.filter(doc => doc.isPending()).length;

    return {
      totalDocuments,
      activeDocuments,
      archivedDocuments,
      expiredDocuments,
      totalSize,
      averageFileSize,
      byType: byType as unknown as Record<DocumentType, number>,
      byStatus,
      byPriority,
      byCategory,
      recentUploads,
      pendingApproval,
      lastUpdated: now.toISOString(),
    };
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  /**
   * Validate document data for business rules
   */
  static validateDocumentData(document: Partial<Document>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!document.title || document.title.trim() === '') {
      errors.push('Document title is required');
    }
    
    if (document.title && document.title.length > 200) {
      errors.push('Document title must be less than 200 characters');
    }
    
    if (!document.documentType) {
      errors.push('Document type is required');
    }
    
    if (document.fileSize !== undefined && document.fileSize !== null && document.fileSize < 0) {
      errors.push('Document size cannot be negative');
    }
    
    if (document.fileSize !== undefined && document.fileSize !== null && document.fileSize > 100 * 1024 * 1024) {
      errors.push('Document size cannot exceed 100MB');
    }
    
    if (document.deadlineDate && document.deadlineDate < new Date()) {
      errors.push('Deadline date cannot be in the past');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate Document DTO
   */
  validate(dto: DocumentDTO): ValidationResult {
    const document = DocumentTransformer.toEntity(dto);
    const validation = DocumentTransformer.validateDocumentData(document);
    return {
      isValid: validation.isValid,
      errors: validation.errors
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get file category from document
   */
  static getFileCategory(document: Document): 'image' | 'document' | 'video' | 'audio' | 'archive' | 'other' {
    const mimeType = document.mimeType?.toLowerCase();
    const extension = document.fileExtension;

    if (mimeType?.startsWith('image/')) return 'image';
    if (mimeType?.startsWith('video/')) return 'video';
    if (mimeType?.startsWith('audio/')) return 'audio';
    if (mimeType?.startsWith('application/zip') || 
        mimeType?.startsWith('application/x-rar-compressed') || 
        mimeType?.startsWith('application/x-7z-compressed')) return 'archive';
    
    if (extension?.match(/\.(jpg|jpeg|png|gif|bmp|svg)$/i)) return 'image';
    if (extension?.match(/\.(mp4|avi|mov|wmv|flv)$/i)) return 'video';
    if (extension?.match(/\.(mp3|wav|flac|aac)$/i)) return 'audio';
    if (extension?.match(/\.(zip|rar|7z|tar|gz)$/i)) return 'archive';
    
    return 'other';
  }

  /**
   * Check if document is expired
   */
  static isExpired(document: Document): boolean {
    return document.isExpired;
  }

  /**
   * Calculate compliance score for document
   */
  static getComplianceScore(document: Document): number {
    let score = 100;

    if (document.isExpired) {
      score -= 30;
    }

    if (!document.title || document.title.trim() === '') {
      score -= 20;
    }

    if (!document.documentType) {
      score -= 15;
    }

    if (!document.uploadedBy) {
      score -= 10;
    }

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (document.createdAt < oneYearAgo) {
      score -= 5;
    }

    return Math.max(0, score);
  }

  /**
   * Get document status label
   */
  static getStatusLabel(status: DocumentStatus): string {
    return getDocumentStatusLabel(status);
  }

  /**
   * Get document status color
   */
  static getStatusColor(status: DocumentStatus): string {
    return getDocumentStatusColor(status);
  }

  /**
   * Get document type label
   */
  static getTypeLabel(type: DocumentType): string {
    return getDocumentTypeLabel(type);
  }

  /**
   * Get document type icon
   */
  static getTypeIcon(type: DocumentType): string {
    return getDocumentTypeIcon(type);
  }

  // ============================================================================
  // ENTITY TO DTO MAPPER INTERFACE
  // ============================================================================

  toDTO(entity: Document): DocumentDTO {
    return DocumentTransformer.toDTO(entity);
  }

  fromDTO(dto: DocumentDTO): Document {
    return DocumentTransformer.toEntity(dto);
  }

  fromEntityToDTO(entity: Document): DocumentDTO {
    return DocumentTransformer.toDTO(entity);
  }

  fromDtosToAdapter(dtos: DocumentDTO[]): DocumentDTO[] {
    return dtos;
  }

  toResponseDto(entity: Document): DocumentDTO {
    return DocumentTransformer.toDTO(entity);
  }

  toRequestDto(dto: DocumentDTO): DocumentDTO {
    return dto;
  }

  toUpdateDto(dto: DocumentDTO): Partial<DocumentDTO> {
    return {
      assignedTo: dto.assignedTo,
      createdAt: dto.createdAt,
      deadlineDate: dto.deadlineDate,
      description: dto.description,
      documentType: dto.documentType,
      fileName: dto.fileName,
      fileSize: dto.fileSize,
      fileUrl: dto.fileUrl,
      inspectionId: dto.inspectionId,
      isInternalOnly: dto.isInternalOnly,
      isSharedWithSuppliers: dto.isSharedWithSuppliers,
      metadata: dto.metadata,
      mimeType: dto.mimeType,
      paymentId: dto.paymentId,
      phaseId: dto.phaseId,
      projectId: dto.projectId,
      status: dto.status,
      supplierId: dto.supplierId,
      tags: dto.tags,
      title: dto.title,
      updatedAt: dto.updatedAt,
      uploadedBy: dto.uploadedBy
    };
  }

  toDTOs(entities: Document[]): DocumentDTO[] {
    return DocumentTransformer.toDTOList(entities);
  }

  toEntities(dtos: DocumentDTO[]): Document[] {
    return DocumentTransformer.toEntityList(dtos);
  }

  toEntitiesFromDatabaseRows(rows: Record<string, unknown>[]): Document[] {
    return DocumentTransformer.fromDatabaseRows(rows);
  }
}

export default DocumentTransformer;