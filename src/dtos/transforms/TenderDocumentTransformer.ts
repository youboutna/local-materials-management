/**
 * Tender Document Transformer
 * Converts between TenderDocument entities and DTOs
 */

import { TenderDocument } from '@/domain/entities/TenderDocument';
import { TenderDocumentDTO } from '@/dtos/entities/TenderDTO';;

export class TenderDocumentTransformer {
  // Entity to DTO
  static toDTO(entity: TenderDocument): TenderDocumentDTO {
    return {
      id: entity.id,
      project_id: entity.projectId,
      document_id: entity.documentId,
      category: entity.category,
      subcategory: entity.subcategory,
      is_required: entity.isRequired,
      is_submitted: entity.isSubmitted,
      submission_date: entity.submissionDate?.toISOString(),
      reviewer_notes: entity.reviewerNotes,
      status: entity.status,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString()
    };
  }

  // DTO to Entity
  static toEntity(dto: TenderDocumentDTO): TenderDocument {
    return TenderDocument.create({
      id: dto.id,
      projectId: dto.project_id,
      documentId: dto.document_id || '',
      category: dto.category as any,
      subcategory: dto.subcategory as any,
      isRequired: dto.is_required,
      isSubmitted: dto.is_submitted,
      submissionDate: dto.submission_date ? new Date(dto.submission_date) : undefined,
      reviewerNotes: dto.reviewer_notes,
      status: dto.status,
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at)
    });
  }

  // Create DTO to Entity
  static fromCreateDtoToEntity(dto: CreateTenderDocumentDTO, id: string): TenderDocument {
    return TenderDocument.create({
      id,
      projectId: dto.project_id,
      documentId: dto.document_id || '',
      category: dto.category as any,
      subcategory: dto.subcategory as any,
      isRequired: dto.is_required ?? false,
      isSubmitted: dto.is_submitted ?? false,
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
      document_title: documentTitle,
      document_url: documentUrl,
      days_until_deadline: daysUntilDeadline,
      is_overdue: daysUntilDeadline < 0 && entity.status !== 'approved'
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
      is_required: entity.isRequired,
      is_submitted: entity.isSubmitted,
      submission_date: entity.submissionDate?.toISOString(),
      document_url: documentUrl
    };
  }

  // Update DTO to partial entity data
  static fromUpdateDtoToEntityData(dto: UpdateTenderDocumentDTO): Partial<TenderDocument> {
    return {
      category: dto.category as any,
      subcategory: dto.subcategory as any,
      isRequired: dto.is_required,
      isSubmitted: dto.is_submitted,
      submissionDate: dto.submission_date ? new Date(dto.submission_date) : undefined,
      reviewerNotes: dto.reviewer_notes,
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
