/**
 * Document Transformer - Hexagonal Architecture
 * Transforms between Document entities and DTOs
 * Following clean architecture principles with proper separation of concerns
 * Includes functionality from DocumentDomainTransformer
 */

import { Document } from '@/domain/entities/Document';
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
      name: entity.name,
      type: entity.type,
      url: entity.url,
      size: entity.size,
      mimeType: entity.mimeType,
      projectId: entity.projectId,
      inspectionId: entity.inspectionId,
      taskId: entity.taskId,
      uploadedBy: entity.uploadedBy,
      uploadedAt: entity.uploadedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      metadata: entity.metadata,
      tags: entity.tags,
      version: entity.version,
      isPublic: entity.isPublic,
      downloadCount: entity.downloadCount,
      lastAccessedAt: entity.lastAccessedAt,
      expiresAt: entity.expiresAt
    };
  }

  /**
   * Transform DocumentDTO to Document entity (DTO → Domain Entity)
   * Converts data transfer object to domain entity
   * Following hexagonal architecture: Presentation → Application → Domain
   */
  static toEntity(dto: DocumentDTO): Document {
    return {
      id: dto.id,
      name: dto.name,
      type: dto.type,
      url: dto.url,
      size: dto.size,
      mimeType: dto.mimeType,
      projectId: dto.projectId,
      inspectionId: dto.inspectionId,
      taskId: dto.taskId,
      uploadedBy: dto.uploadedBy,
      uploadedAt: dto.uploadedAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      metadata: dto.metadata,
      tags: dto.tags,
      version: dto.version,
      isPublic: dto.isPublic,
      downloadCount: dto.downloadCount,
      lastAccessedAt: dto.lastAccessedAt,
      expiresAt: dto.expiresAt
    };
  }

  /**
   * Transform CreateDocumentDTO to Document entity
   */
  static fromCreateDTOToEntity(dto: CreateDocumentDTO): Document {
    return {
      id: dto.id || crypto.randomUUID(),
      name: dto.name,
      type: dto.type,
      url: dto.url,
      size: dto.size || 0,
      mimeType: dto.mimeType || 'application/octet-stream',
      projectId: dto.projectId,
      inspectionId: dto.inspectionId,
      taskId: dto.taskId,
      uploadedBy: dto.uploadedBy || '',
      uploadedAt: dto.uploadedAt || new Date().toISOString(),
      createdAt: dto.createdAt || new Date().toISOString(),
      updatedAt: dto.updatedAt || new Date().toISOString(),
      metadata: dto.metadata || {},
      tags: dto.tags || [],
      version: dto.version || 1,
      isPublic: dto.isPublic !== undefined ? dto.isPublic : false,
      downloadCount: dto.downloadCount || 0,
      lastAccessedAt: dto.lastAccessedAt || null,
      expiresAt: dto.expiresAt || null
    };
  }

  /**
   * Transform UpdateDocumentDTO to partial Document entity
   */
  static fromUpdateDTOToEntity(dto: UpdateDocumentDTO): Partial<Document> {
    return {
      name: dto.name,
      type: dto.type,
      url: dto.url,
      size: dto.size,
      mimeType: dto.mimeType,
      projectId: dto.projectId,
      inspectionId: dto.inspectionId,
      taskId: dto.taskId,
      uploadedBy: dto.uploadedBy,
      uploadedAt: dto.uploadedAt,
      metadata: dto.metadata,
      tags: dto.tags,
      version: dto.version,
      isPublic: dto.isPublic,
      downloadCount: dto.downloadCount,
      lastAccessedAt: dto.lastAccessedAt,
      expiresAt: dto.expiresAt,
      updatedAt: new Date().toISOString()
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
      name: dto.name,
      type: dto.type,
      url: dto.url,
      size: dto.size,
      mimeType: dto.mimeType,
      projectId: dto.projectId,
      inspectionId: dto.inspectionId,
      taskId: dto.taskId,
      uploadedBy: dto.uploadedBy,
      uploadedAt: dto.uploadedAt,
      metadata: dto.metadata,
      tags: dto.tags,
      version: dto.version,
      isPublic: dto.isPublic,
      downloadCount: dto.downloadCount,
      lastAccessedAt: dto.lastAccessedAt,
      expiresAt: dto.expiresAt
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
