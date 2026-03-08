/**
 * Document Transformer - Hexagonal Architecture
 * Transforms between Document entities and DTOs
 * Following clean architecture principles with proper separation of concerns
 */

import { Document, DocumentStatus, DocumentType } from '@/domain/entities/Document';
import { DocumentDTO, CreateDocumentDTO, UpdateDocumentDTO } from '@/dtos/entities/DocumentDTO';
import { EntityToDTOMapper, ValidationResult } from '@/dtos/transforms/shared';

export class DocumentTransformer implements EntityToDTOMapper<Document, DocumentDTO> {
  /**
   * Transform Document entity to DocumentDTO (Domain Entity → DTO)
   */
  static toDTO(entity: Document): DocumentDTO {
    return {
      id: entity.id,
      title: entity.title,
      description: entity.description ?? null,
      documentType: entity.documentType,
      status: entity.status ?? null,
      fileName: entity.fileName ?? null,
      fileUrl: entity.fileUrl ?? null,
      fileSize: entity.fileSize ?? null,
      mimeType: entity.mimeType ?? null,
      projectId: entity.projectId ?? null,
      phaseId: entity.phaseId ?? null,
      inspectionId: entity.inspectionId ?? null,
      paymentId: entity.paymentId ?? null,
      supplierId: entity.supplierId ?? null,
      assignedTo: entity.assignedTo ?? null,
      deadlineDate: entity.deadlineDate ?? null,
      tags: entity.tags ?? null,
      isInternalOnly: entity.isInternalOnly ?? null,
      isSharedWithSuppliers: entity.isSharedWithSuppliers ?? null,
      uploadedBy: entity.uploadedBy ?? null,
      metadata: entity.metadata ?? null,
      sharedDate: null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  /**
   * Transform DocumentDTO to Document entity (DTO → Domain Entity)
   */
  static toEntity(dto: DocumentDTO): Document {
    return Document.create({
      id: dto.id,
      title: dto.title || '',
      projectId: dto.projectId || undefined,
      phaseId: dto.phaseId || undefined,
      documentType: (dto.documentType || 'other') as DocumentType,
      description: dto.description || undefined,
      tags: dto.tags
    });
  }

  /**
   * Transform CreateDocumentDTO to Document entity
   */
  static fromCreateDTOToEntity(dto: CreateDocumentDTO): Document {
    const now = new Date().toISOString();
    return new Document(
      crypto.randomUUID(),
      dto.projectId ?? null,
      dto.phaseId ?? null,
      dto.inspectionId ?? null,
      dto.paymentId ?? null,
      dto.supplierId ?? null,
      dto.title || '',
      dto.description ?? null,
      (dto.documentType || 'other') as DocumentType,
      'draft' as DocumentStatus,
      dto.fileName ?? null,
      dto.fileUrl ?? null,
      dto.fileSize ?? null,
      dto.mimeType ?? null,
      dto.tags || [],
      dto.isInternalOnly || false,
      dto.isSharedWithSuppliers || false,
      dto.deadlineDate ?? null,
      dto.assignedTo ?? null,
      dto.uploadedBy ?? null,
      now,
      now,
      dto.metadata ?? null
    );
  }

  /**
   * Transform UpdateDocumentDTO to partial Document entity
   */
  static fromUpdateDTOToEntity(dto: UpdateDocumentDTO): Partial<Document> {
    return {
      projectId: dto.projectId,
      phaseId: dto.phaseId,
      inspectionId: dto.inspectionId,
      paymentId: dto.paymentId,
      supplierId: dto.supplierId,
      title: dto.title,
      description: dto.description,
      documentType: dto.documentType as DocumentType,
      fileName: dto.fileName,
      fileUrl: dto.fileUrl,
      fileSize: dto.fileSize,
      mimeType: dto.mimeType,
      status: dto.status as DocumentStatus,
      uploadedBy: dto.uploadedBy,
      tags: dto.tags ?? undefined,
      isInternalOnly: dto.isInternalOnly,
      isSharedWithSuppliers: dto.isSharedWithSuppliers,
      deadlineDate: dto.deadlineDate,
      assignedTo: dto.assignedTo,
      metadata: dto.metadata
    } as Partial<Document>;
  }

  /**
   * Validate document data for business rules
   */
  static validateDocumentData(document: Partial<Document>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!document.title || document.title.trim() === '') {
      errors.push('Document title is required');
    }
    
    if (!document.documentType) {
      errors.push('Document type is required');
    }
    
    if (document.fileSize !== undefined && document.fileSize !== null && document.fileSize < 0) {
      errors.push('Document size cannot be negative');
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
    const url = document.fileUrl || '';
    const name = document.fileName || '';
    
    if (url.includes('.')) {
      return url.split('.').pop() || '';
    }
    
    if (name.includes('.')) {
      return name.split('.').pop() || '';
    }
    
    return '';
  }

  /**
   * Check if document is expired
   */
  static isExpired(document: Document): boolean {
    if (!document.deadlineDate) return false;
    
    const expiryDate = new Date(document.deadlineDate);
    const now = new Date();
    return expiryDate < now;
  }

  /**
   * Calculate compliance score for document
   */
  static getComplianceScore(document: Document): number {
    let score = 100;

    if (DocumentTransformer.isExpired(document)) {
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
    return new Document(
      row.id as string,
      (row.project_id ?? null) as string | null,
      (row.phase_id ?? null) as string | null,
      (row.inspection_id ?? null) as string | null,
      (row.payment_id ?? null) as string | null,
      (row.supplier_id ?? null) as string | null,
      (row.title as string) || '',
      (row.description ?? null) as string | null,
      ((row.document_type as string) || 'other') as DocumentType,
      ((row.status as string) || 'draft') as DocumentStatus,
      (row.file_name ?? null) as string | null,
      (row.file_url ?? null) as string | null,
      (row.file_size ?? null) as number | null,
      (row.mime_type ?? null) as string | null,
      (row.tags as string[]) || [],
      Boolean(row.is_internal_only),
      Boolean(row.is_shared_with_suppliers),
      (row.deadline_date ?? null) as string | null,
      (row.assigned_to ?? null) as string | null,
      (row.uploaded_by ?? null) as string | null,
      (row.created_at as string) || new Date().toISOString(),
      (row.updated_at as string) || new Date().toISOString(),
      (row.metadata ?? null) as Record<string, unknown> | null
    );
  }
}
