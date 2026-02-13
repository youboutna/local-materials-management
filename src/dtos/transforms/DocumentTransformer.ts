/**
 * Document Transformer - Hexagonal Architecture
 * Transforms between Document entities and DTOs
 * Following clean architecture principles with proper separation of concerns
 */

import { Document ,DocumentStatus, DocumentType} from '@/domain/entities/Document';
import { DocumentDTO, CreateDocumentDTO, UpdateDocumentDTO } from '@/dtos/entities/DocumentDTO';
import { EntityToDTOMapper, ValidationResult } from '@/dtos/transforms/shared';

export class DocumentTransformer implements EntityToDTOMapper<Document, DocumentDTO> {
  /**
   * Transform Document entity to DocumentDTO (Domain Entity → DTO)
   * Converts domain entity to data transfer object for UI layer
   * Following hexagonal architecture: Domain → Application → Presentation
   */
  static toDTO(entity: Document): DocumentDTO {
    return {
      id: entity.id,
      name: entity.title || undefined,
      type: entity.documentType || undefined,
      url: entity.fileUrl || undefined,
      size: entity.fileSize || undefined,
      mimeType: entity.mimeType || undefined,
      projectId: entity.projectId || undefined,
      inspectionId: entity.inspectionId || undefined,
            uploadedBy: entity.uploadedBy || undefined,
      uploadedAt: entity.uploadedBy || undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      metadata: entity.metadata || null,
      tags: entity.tags || undefined,
      version: undefined, // Not available in entity
      isPublic: !entity.isInternalOnly || undefined,
      downloadCount: undefined, // Not available in entity
      lastAccessedAt: undefined, // Not available in entity
      expiresAt: entity.deadlineDate || undefined
    };
  }

  /**
   * Transform DocumentDTO to Document entity (DTO → Domain Entity)
   * Converts data transfer object to domain entity
   * Following hexagonal architecture: Presentation → Application → Domain
   */
  static toEntity(dto: DocumentDTO): Document {
    return new Document(
      dto.id,
      dto.projectId || null,
      dto.phaseId || null,
      dto.inspectionId || null,
      dto.paymentId || null,
      dto.supplierId || null,
      dto.title || '',
      dto.description || null,
      dto.documentType || 'other',
      dto.fileName || null,
      dto.fileUrl || null,
      dto.fileSize || null,
      dto.mimeType || null,
      dto.status || 'draft',
      dto.uploadedBy || null,
      dto.createdAt || new Date().toISOString(),
      dto.updatedAt || new Date().toISOString(),
      dto.tags || null,
      dto.isInternalOnly || false,
      dto.isSharedWithSuppliers || false,
      dto.deadlineDate || null,
      dto.assignedTo || null,
      dto.sharedDate || null,
      dto.metadata || null
    );
  }

  /**
   * Transform CreateDocumentDTO to Document entity
   */
  static fromCreateDTOToEntity(dto: CreateDocumentDTO): Document {
    const now = new Date().toISOString();
    return {
      id: dto.id || crypto.randomUUID(),
      projectId: dto.projectId || null,
      phaseId: dto.phaseId || null,
      inspectionId: dto.inspectionId || null,
      paymentId: dto.paymentId || null,
      supplierId: dto.supplierId || null,
      title: dto.title || '',
      description: dto.description || null,
      documentType: dto.documentType as DocumentType, // Proper enum assignment
      fileName: dto.fileName || null,
      fileUrl: dto.fileUrl || null,
      fileSize: dto.fileSize || null,
      mimeType: dto.mimeType || null,
      status: 'draft' as DocumentStatus, // Default status
      uploadedBy: dto.uploadedBy || null,
      createdAt: dto.createdAt || now,
      updatedAt: dto.updatedAt || now,
      tags: dto.tags || null,
      isInternalOnly: dto.isInternalOnly || false,
      isSharedWithSuppliers: dto.isSharedWithSuppliers || false,
      deadlineDate: dto.deadlineDate || null,
      assignedTo: dto.assignedTo || null,
      sharedDate: null, // Not set on creation
      metadata: dto.metadata || null
    };
  }

  /**
   * Transform UpdateDocumentDTO to partial Document entity
   */
  static fromUpdateDTOToEntity(dto: UpdateDocumentDTO): Partial<Document> {
    return {
      id: undefined, // ID not updated
      projectId: dto.projectId,
      phaseId: dto.phaseId,
      inspectionId: dto.inspectionId,
      paymentId: dto.paymentId,
      supplierId: dto.supplierId,
      title: dto.title,
      description: dto.description,
      documentType: dto.documentType as DocumentType, // Proper enum assignment
      fileName: dto.fileName,
      fileUrl: dto.fileUrl,
      fileSize: dto.fileSize,
      mimeType: dto.mimeType,
      status: dto.status as DocumentStatus, // Proper enum assignment
      uploadedBy: dto.uploadedBy,
      createdAt: undefined, // Not updated
      updatedAt: new Date().toISOString(),
      tags: dto.tags,
      isInternalOnly: dto.isInternalOnly,
      isSharedWithSuppliers: dto.isSharedWithSuppliers,
      deadlineDate: dto.deadlineDate,
      assignedTo: dto.assignedTo,
      metadata: dto.metadata
    };
  }

  /**
   * Validate document data for business rules
   */
  static validateDocumentData(document: Partial<Document>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!document.name || document.name.trim() === '') {
      errors.push('Document name is required');
    }
    
    if (!document.type || document.type.trim() === '') {
      errors.push('Document type is required');
    }
    
    if (document.size !== undefined && document.size < 0) {
      errors.push('Document size cannot be negative');
    }
    
    if (document.version !== undefined && document.version < 1) {
      errors.push('Document version must be at least 1');
    }
    
    if (document.downloadCount !== undefined && document.downloadCount < 0) {
      errors.push('Download count cannot be negative');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get file category from MIME type
   */
  static getFileCategory(document: Document): 'image' | 'document' | 'video' | 'audio' | 'archive' | 'other' {
    const mimeType = document.mimeType?.toLowerCase();
    const extension = this.getFileExtension(document);

    if (mimeType?.startsWith('image/')) return 'image';
    if (mimeType?.startsWith('video/')) return 'video';
    if (mimeType?.startsWith('audio/')) return 'audio';
    if (mimeType?.startsWith('application/zip') || 
        mimeType?.startsWith('application/x-rar-compressed') || 
        mimeType?.startsWith('application/x-7z-compressed')) return 'archive';
    
    // Check by extension
    if (extension.match(/\.(jpg|jpeg|png|gif|bmp|svg)$/i)) return 'image';
    if (extension.match(/\.(mp4|avi|mov|wmv|flv)$/i)) return 'video';
    if (extension.match(/\.(mp3|wav|flac|aac)$/i)) return 'audio';
    if (extension.match(/\.(zip|rar|7z|tar|gz)$/i)) return 'archive';
    
    return 'other';
  }

  /**
   * Get file extension from document
   */
  static getFileExtension(document: Document): string {
    const url = document.url || '';
    const name = document.name || '';
    
    // Try to get extension from URL first
    if (url.includes('.')) {
      return url.split('.').pop() || '';
    }
    
    // Try to get extension from name
    if (name.includes('.')) {
      return name.split('.').pop() || '';
    }
    
    return '';
  }

  /**
   * Check if document is expired
   */
  static isExpired(document: Document): boolean {
    if (!document.expiresAt) return false;
    
    const expiryDate = new Date(document.expiresAt);
    const now = new Date();
    return expiryDate < now;
  }

  /**
   * Calculate compliance score for document
   */
  static getComplianceScore(document: Document): number {
    let score = 100; // Start with perfect score

    // Deduct points for expired documents
    if (DocumentTransformer.isExpired(document)) {
      score -= 30;
    }

    // Deduct points for missing required fields
    if (!document.name || document.name.trim() === '') {
      score -= 20;
    }

    if (!document.type || document.type.trim() === '') {
      score -= 15;
    }

    if (!document.uploadedBy) {
      score -= 10;
    }

    // Deduct points for very old documents (older than 1 year)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (document.createdAt && new Date(document.createdAt) < oneYearAgo) {
      score -= 5;
    }

    return Math.max(0, score);
  }

  // EntityToDTOMapper interface implementation
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
      sharedDate: dto.sharedDate,
      status: dto.status,
      supplierId: dto.supplierId,
      tags: dto.tags,
      title: dto.title,
      updatedAt: dto.updatedAt,
      uploadedBy: dto.uploadedBy
    };
  }

  validate(dto: DocumentDTO): ValidationResult {
    const document = DocumentTransformer.toEntity(dto);
    const validation = DocumentTransformer.validateDocumentData(document);
    return {
      isValid: validation.isValid,
      errors: validation.errors
    };
  }

  toDTOs(entities: Document[]): DocumentDTO[] {
    return entities.map(entity => DocumentTransformer.toDTO(entity));
  }

  toEntities(dtos: DocumentDTO[]): Document[] {
    return dtos.map(dto => DocumentTransformer.toEntity(dto));
  }

  toEntitiesFromDatabaseRows(rows: Record<string, unknown>[]): Document[] {
    return rows.map(row => DocumentTransformer.toEntityFromDatabaseRow(row));
  }

  static toEntityFromDatabaseRow(row: Record<string, unknown>): Document {
    return {
      id: row.id as string,
      name: row.name as string,
      type: row.type as string,
      url: row.url as string || null,
      size: Number(row.size) || 0,
      mimeType: row.mime_type as string || 'application/octet-stream',
      projectId: row.project_id as string || null,
      inspectionId: row.inspection_id as string || null,
      taskId: row.task_id as string || null,
      uploadedBy: row.uploaded_by as string || null,
      uploadedAt: row.uploaded_at as string || null,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      metadata: row.metadata as Record<string, unknown> || {},
      tags: row.tags as string[] || [],
      version: Number(row.version) || 1,
      isPublic: Boolean(row.is_public) || false,
      downloadCount: Number(row.download_count) || 0,
      lastAccessedAt: row.last_accessed_at as string || null,
      expiresAt: row.expires_at as string || null
    };
  }
}
