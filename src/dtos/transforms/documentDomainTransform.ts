/**
 * Document Domain Transformer - Consolidated & Unified
 * Implements EntityToDTOMapper interface for Document domain entity
 * Centralizes all document transformation logic following hexagonal architecture
 */

import { Document, DocumentType, DocumentStatus } from '@/domain/entities/Document';
import { DocumentDTO, CreateDocumentDTO, UpdateDocumentDTO } from '@/dtos/entities/DocumentDTO';
import { EntityToDTOMapper, ValidationResult } from '@/dtos/transforms';

// API Request/Response DTOs for UI and Supabase integration
export class DocumentResponseDto {
  constructor(
    public id: string,
    public projectId: string | null,
    public phaseId: string | null,
    public inspectionId: string | null,
    public paymentId: string | null,
    public supplierId: string | null,
    public title: string,
    public description: string | null,
    public documentType: DocumentType,
    public status: DocumentStatus,
    public fileName: string | null,
    public fileUrl: string | null,
    public fileSize: number | null,
    public mimeType: string | null,
    public tags: string[],
    public isInternalOnly: boolean,
    public isSharedWithSuppliers: boolean,
    public deadlineDate: string | null,
    public assignedTo: string | null,
    public uploadedBy: string | null,
    public createdAt?: string,
    public updatedAt?: string
  ) {}
}

export class CreateDocumentRequestDto {
  constructor(
    public projectId: string | null,
    public phaseId: string | null,
    public inspectionId: string | null,
    public paymentId: string | null,
    public supplierId: string | null,
    public title: string,
    public description: string | null,
    public documentType: DocumentType,
    public fileName?: string,
    public fileUrl?: string,
    public fileSize?: number,
    public mimeType?: string,
    public tags?: string[],
    public isInternalOnly?: boolean,
    public isSharedWithSuppliers?: boolean,
    public deadlineDate?: string,
    public assignedTo?: string
  ) {}
}

export class UpdateDocumentRequestDto {
  constructor(
    public projectId?: string,
    public phaseId?: string,
    public inspectionId?: string,
    public paymentId?: string,
    public supplierId?: string,
    public title?: string,
    public description?: string,
    public documentType?: DocumentType,
    public status?: DocumentStatus,
    public fileName?: string,
    public fileUrl?: string,
    public fileSize?: number,
    public mimeType?: string,
    public tags?: string[],
    public isInternalOnly?: boolean,
    public isSharedWithSuppliers?: boolean,
    public deadlineDate?: string,
    public assignedTo?: string
  ) {}
}

export class DocumentDomainTransformer implements EntityToDTOMapper<Document, DocumentDTO> {
  
  /**
   * Transform Document domain entity to DocumentDTO
   */
  toDTO(entity: Document): DocumentDTO {
    return {
      id: entity.id,
      projectId: entity.projectId,
      phaseId: entity.phaseId,
      inspectionId: entity.inspectionId,
      paymentId: entity.paymentId,
      supplierId: entity.supplierId,
      title: entity.title,
      description: entity.description,
      documentType: entity.documentType,
      status: entity.status,
      fileName: entity.fileName,
      fileUrl: entity.fileUrl,
      fileSize: entity.fileSize,
      mimeType: entity.mimeType,
      tags: entity.tags,
      isInternalOnly: entity.isInternalOnly,
      isSharedWithSuppliers: entity.isSharedWithSuppliers,
      deadlineDate: entity.deadlineDate,
      assignedTo: entity.assignedTo,
      uploadedBy: entity.uploadedBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  /**
   * Transform DocumentDTO to partial Document domain entity
   */
  fromDTO(dto: Partial<DocumentDTO>): Partial<Document> {
    return {
      id: dto.id,
      projectId: dto.projectId,
      phaseId: dto.phaseId,
      inspectionId: dto.inspectionId,
      paymentId: dto.paymentId,
      supplierId: dto.supplierId,
      title: dto.title,
      description: dto.description,
      documentType: dto.documentType,
      status: dto.status,
      fileName: dto.fileName,
      fileUrl: dto.fileUrl,
      fileSize: dto.fileSize,
      mimeType: dto.mimeType,
      tags: dto.tags || [],
      isInternalOnly: dto.isInternalOnly,
      isSharedWithSuppliers: dto.isSharedWithSuppliers,
      deadlineDate: dto.deadlineDate,
      assignedTo: dto.assignedTo,
      uploadedBy: dto.uploadedBy,
      createdAt: dto.createdAt ? new Date(dto.createdAt).toISOString() : undefined,
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt).toISOString() : undefined
    };
  }

  /**
   * Transform array of DocumentDTOs to array of DocumentResponseDTOs (for UI/API)
   */
  fromDtosToAdapter(dtos: DocumentDTO[]): DocumentResponseDto[] {
    return dtos.map(dto => this.toResponseDto(dto));
  }

  /**
   * Transform single DocumentDTO to DocumentResponseDto (for UI/API)
   */
  toResponseDto(dto: DocumentDTO): DocumentResponseDto {
    return new DocumentResponseDto(
      dto.id,
      dto.projectId,
      dto.phaseId,
      dto.inspectionId,
      dto.paymentId,
      dto.supplierId,
      dto.title,
      dto.description,
      dto.documentType,
      dto.status,
      dto.fileName,
      dto.fileUrl,
      dto.fileSize,
      dto.mimeType,
      dto.tags || [],
      dto.isInternalOnly,
      dto.isSharedWithSuppliers,
      dto.deadlineDate,
      dto.assignedTo,
      dto.uploadedBy,
      dto.createdAt,
      dto.updatedAt
    );
  }

  /**
   * Transform CreateDocumentRequestDto to DocumentDTO
   */
  toRequestDto(requestDto: CreateDocumentRequestDto): DocumentDTO {
    return {
      id: crypto.randomUUID(),
      projectId: requestDto.projectId,
      phaseId: requestDto.phaseId,
      inspectionId: requestDto.inspectionId,
      paymentId: requestDto.paymentId,
      supplierId: requestDto.supplierId,
      title: requestDto.title,
      description: requestDto.description,
      documentType: requestDto.documentType,
      status: 'draft' as DocumentStatus,
      fileName: requestDto.fileName || null,
      fileUrl: requestDto.fileUrl || null,
      fileSize: requestDto.fileSize || null,
      mimeType: requestDto.mimeType || null,
      tags: requestDto.tags || [],
      isInternalOnly: requestDto.isInternalOnly !== undefined ? requestDto.isInternalOnly : false,
      isSharedWithSuppliers: requestDto.isSharedWithSuppliers !== undefined ? requestDto.isSharedWithSuppliers : false,
      deadlineDate: requestDto.deadlineDate || null,
      assignedTo: requestDto.assignedTo || null,
      uploadedBy: null, // Will be set by the system
      category: requestDto.category || null,
      subcategory: requestDto.subcategory || null,
      metadata: requestDto.metadata || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Transform UpdateDocumentRequestDto to partial DocumentDTO
   */
  toUpdateDto(requestDto: UpdateDocumentRequestDto): Partial<DocumentDTO> {
    return {
      projectId: requestDto.projectId,
      phaseId: requestDto.phaseId,
      inspectionId: requestDto.inspectionId,
      paymentId: requestDto.paymentId,
      supplierId: requestDto.supplierId,
      title: requestDto.title,
      description: requestDto.description,
      documentType: requestDto.documentType,
      status: requestDto.status,
      fileName: requestDto.fileName,
      fileUrl: requestDto.fileUrl,
      fileSize: requestDto.fileSize,
      mimeType: requestDto.mimeType,
      tags: requestDto.tags,
      isInternalOnly: requestDto.isInternalOnly,
      isSharedWithSuppliers: requestDto.isSharedWithSuppliers,
      deadlineDate: requestDto.deadlineDate,
      assignedTo: requestDto.assignedTo,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Transform Document domain entity to DocumentResponseDto (direct path)
   */
  fromDomainToResponseDto(entity: Document): DocumentResponseDto {
    const dto = this.toDTO(entity);
    return this.toResponseDto(dto);
  }

  /**
   * Validate DocumentDTO data
   */
  validate(dto: Partial<DocumentDTO>): ValidationResult {
    const errors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    // Title validation
    if (!dto.title || dto.title.trim() === '') {
      errors.push('Document title is required');
      fieldErrors.title = ['Document title is required'];
    }

    // Document type validation
    const validTypes = ['contract', 'invoice', 'report', 'plan', 'permit', 'pv', 'photo', 'certificate', 'specification', 'correspondence', 'other'];
    if (dto.documentType && !validTypes.includes(dto.documentType)) {
      errors.push('Invalid document type');
      fieldErrors.documentType = ['Invalid document type'];
    }

    // Status validation
    const validStatuses = ['draft', 'pending_review', 'approved', 'rejected', 'archived'];
    if (dto.status && !validStatuses.includes(dto.status)) {
      errors.push('Invalid document status');
      fieldErrors.status = ['Invalid document status'];
    }

    // File size validation
    if (dto.fileSize && dto.fileSize < 0) {
      errors.push('File size cannot be negative');
      fieldErrors.fileSize = ['File size cannot be negative'];
    }

    // Tags validation
    if (dto.tags && dto.tags.length > 20) {
      errors.push('Maximum 20 tags allowed');
      fieldErrors.tags = ['Maximum 20 tags allowed'];
    }

    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors
    };
  }

  // Utility methods for document operations
  static getDocumentStatus(document: DocumentDTO): 'draft' | 'pending' | 'approved' | 'rejected' | 'archived' {
    return document.status;
  }

  static isDocumentOverdue(document: DocumentDTO): boolean {
    if (!document.deadlineDate) return false;
    return new Date(document.deadlineDate) < new Date() && document.status !== 'approved';
  }

  static canBeSharedWithSuppliers(document: DocumentDTO): boolean {
    const shareableTypes = ['plan', 'specification', 'permit', 'certificate'];
    return shareableTypes.includes(document.documentType) && !document.isInternalOnly;
  }

  static getDocumentTypeIcon(documentType: DocumentType): string {
    const icons = {
      contract: 'file-contract',
      invoice: 'file-invoice',
      report: 'file-report',
      plan: 'file-plan',
      permit: 'file-permit',
      pv: 'file-pv',
      photo: 'file-photo',
      certificate: 'file-certificate',
      specification: 'file-spec',
      correspondence: 'file-text',
      other: 'file'
    };
    return icons[documentType] || 'file';
  }

  static getStatusColor(status: DocumentStatus): string {
    const colors = {
      draft: 'gray',
      pending_review: 'yellow',
      approved: 'green',
      rejected: 'red',
      archived: 'blue'
    };
    return colors[status] || 'gray';
  }

  static formatFileSize(bytes: number | null): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
