/**
 * Document Mapper
 * Maps between Document domain entity and DTOs
 * Simplified for migration compatibility
 */

import { Document } from '@/domain/entities/Document';
import { DocumentType as DTODocumentType, DocumentStatus as DTODocumentStatus } from '@/dtos/entities/DocumentDTO';
import { DocumentDTO, CreateDocumentDTO, UpdateDocumentDTO, DocumentResponseDTO } from '@/dtos/entities/DocumentDTO';

export class DocumentMapper {
  /**
   * Transform domain entity to DTO
   */
  static toDTO(document: Document): DocumentDTO {
    return {
      id: document.id,
      title: document.title,
      description: document.description || null,
      documentType: document.documentType,
      status: document.status || null,
      fileName: document.fileName || null,
      fileUrl: document.fileUrl || null,
      fileSize: document.fileSize || null,
      mimeType: document.mimeType || null,
      projectId: document.projectId || null,
      phaseId: document.phaseId || null,
      inspectionId: document.inspectionId || null,
      paymentId: document.paymentId || null,
      supplierId: document.supplierId || null,
      assignedTo: document.assignedTo || null,
      deadlineDate: document.deadlineDate || null,
      tags: document.tags || null,
      isInternalOnly: document.isInternalOnly || null,
      isSharedWithSuppliers: document.isSharedWithSuppliers || null,
      uploadedBy: document.uploadedBy || null,
      metadata: (document as any).metadata || null,
      sharedDate: (document as any).sharedDate || null,
      createdAt: document.createdAt || '',
      updatedAt: document.updatedAt || '',
    };
  }

  /**
   * Transform domain entity to response DTO
   */
  static toResponseDto(document: Document): DocumentResponseDTO {
    return {
      id: document.id,
      fileName: document.fileName || '',
      fileSize: document.fileSize || 0,
      fileUrl: document.fileUrl || '',
      documentType: document.documentType,
      createdAt: document.createdAt || '',
    };
  }

  /**
   * Transform CreateDocumentDTO to domain entity
   */
  static toDomainFromCreateDto(requestDto: CreateDocumentDTO, uploadedBy: string): Document {
    const now = new Date().toISOString();
    return new Document(
      crypto.randomUUID(),
      requestDto.projectId || null,
      requestDto.phaseId || null,
      requestDto.inspectionId || null,
      requestDto.paymentId || null,
      requestDto.supplierId || null,
      requestDto.title,
      requestDto.description || null,
      (requestDto.documentType || 'other') as unknown as DTODocumentType,
      ((requestDto.status || 'draft') as unknown as DTODocumentStatus),
      requestDto.fileName || null,
      requestDto.fileUrl || null,
      requestDto.fileSize || null,
      requestDto.mimeType || null,
      requestDto.tags || [],
      requestDto.isInternalOnly || false,
      requestDto.isSharedWithSuppliers || false,
      requestDto.deadlineDate || null,
      requestDto.assignedTo || null,
      uploadedBy,
      now,
      now
    );
  }

  /**
   * Transform UpdateDocumentDTO to partial data
   */
  static toUpdateData(requestDto: UpdateDocumentDTO): Partial<any> {
    return {
      title: requestDto.title,
      description: requestDto.description,
      documentType: requestDto.documentType,
      status: requestDto.status,
      assignedTo: requestDto.assignedTo,
      deadlineDate: requestDto.deadlineDate,
      tags: requestDto.tags,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Transform array of domain entities to response DTOs
   */
  static toResponseDtoArray(documents: Document[]): DocumentResponseDTO[] {
    return documents.map(doc => DocumentMapper.toResponseDto(doc));
  }
}
