/**
 * Tender Document Transformer
 * Converts between TenderDocument entities and DTOs
 */

import { TenderDocument } from '@/domain/entities/TenderDocument';
import {
  TenderDocumentDTO,
  CreateTenderDocumentDTO,
  UpdateTenderDocumentDTO,
  TenderDocumentResponseDTO,
  TenderDocumentListDTO,
  TenderDocumentStatsDTO
} from '@/dtos/entities/TenderDocumentDTO';

export class TenderDocumentTransformer {
  // Entity to DTO
  static toDTO(entity: TenderDocument): TenderDocumentDTO {
    return {
      id: entity.id,
      projectId: entity.projectId,
      documentId: entity.documentId,
      category: entity.category,
      subcategory: entity.subcategory,
      isRequired: entity.isRequired,
      isSubmitted: entity.isSubmitted,
      submissionDate: entity.submissionDate?.toISOString(),
      reviewerNotes: entity.reviewerNotes,
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString()
    };
  }

  // DTO to Entity
  static toEntity(dto: TenderDocumentDTO): TenderDocument {
    return TenderDocument.create({
      id: dto.id,
      projectId: dto.projectId,
      documentId: dto.documentId || '',
      category: dto.category as any,
      subcategory: dto.subcategory as any,
      isRequired: dto.isRequired,
      isSubmitted: dto.isSubmitted,
      submissionDate: dto.submissionDate ? new Date(dto.submissionDate) : undefined,
      reviewerNotes: dto.reviewerNotes,
      status: dto.status,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt)
    });
  }

  // Create DTO to Entity
  static fromCreateDtoToEntity(dto: CreateTenderDocumentDTO, id: string): TenderDocument {
    return TenderDocument.create({
      id,
      projectId: dto.projectId,
      documentId: dto.documentId || '',
      category: dto.category as any,
      subcategory: dto.subcategory as any,
      isRequired: dto.isRequired ?? false,
      isSubmitted: dto.isSubmitted ?? false,
      status: dto.status ?? 'draft'
    });
  }

  // Entity to Response DTO
  static toResponseDTO(entity: TenderDocument, documentTitle?: string, documentUrl?: string): TenderDocumentResponseDTO {
    const dto = this.toDTO(entity);
    
    const createdAt = new Date(entity.createdAt);
    const deadline = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    const today = new Date();
    const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      ...dto,
      documentTitle: documentTitle,
      documentUrl: documentUrl,
      daysUntilDeadline: daysUntilDeadline,
      isOverdue: daysUntilDeadline < 0 && entity.status !== 'approved'
    };
  }

  // Entity to List DTO
  static toListDTO(entity: TenderDocument, documentTitle?: string, documentUrl?: string): TenderDocumentListDTO {
    return {
      id: entity.id,
      title: documentTitle || `Document ${entity.id}`,
      category: entity.category,
      subcategory: entity.subcategory,
      status: entity.status,
      isRequired: entity.isRequired,
      isSubmitted: entity.isSubmitted,
      submissionDate: entity.submissionDate?.toISOString(),
      documentUrl: documentUrl
    };
  }

  // Update DTO to partial entity data
  static fromUpdateDtoToEntityData(dto: UpdateTenderDocumentDTO): Partial<TenderDocument> {
    return {
      category: dto.category as any,
      subcategory: dto.subcategory as any,
      isRequired: dto.isRequired,
      isSubmitted: dto.isSubmitted,
      submissionDate: dto.submissionDate ? new Date(dto.submissionDate) : undefined,
      reviewerNotes: dto.reviewerNotes,
      status: dto.status,
      updatedAt: new Date()
    };
  }

  // Calculate statistics
  static calculateStats(documents: TenderDocument[]): TenderDocumentStatsDTO {
    const stats = documents.reduce((acc, doc) => {
      acc.total++;
      
      if (doc.isRequired) acc.required++;
      if (doc.isSubmitted) acc.submitted++;
      
      switch (doc.status) {
        case 'approved': {
          acc.approved++;
          break;
        }
        case 'rejected': {
          acc.rejected++;
          break;
        }
        case 'submitted':
        case 'reviewed': {
          acc.pending++;
          break;
        }
        case 'draft': {
          const createdAt = new Date(doc.createdAt);
          const deadline = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
          if (deadline < new Date()) {
            acc.overdue++;
          }
          break;
        }
      }
      
      return acc;
    }, {
      total: 0,
      required: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
      pending: 0,
      overdue: 0
    });

    return stats;
  }
}
