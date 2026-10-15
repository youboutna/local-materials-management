/**
 * Tender Document Service - Hexagonal Architecture
 * Implements business logic for tender document management
 */

import { ITenderDocumentRepository } from '@/domain/repositories/ITenderDocumentRepository';
import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import { Document, DocumentType } from '@/domain/entities/Document';
import {
    ApproveTenderDocumentRequestDTO,
    CreateTenderDocumentDTO,
    DeleteTenderDocumentRequestDTO,
    GetProjectStatisticsRequestDTO,
    GetProjectTenderDocumentsRequestDTO,
    GetTenderDocumentByIdRequestDTO,
    RejectTenderDocumentRequestDTO,
    SubmitTenderDocumentRequestDTO,
    TenderDocumentDTO,
    TenderDocumentListDTO,
    TenderDocumentStatsDTO,
    UpdateTenderDocumentRequestDTO
} from '@/dtos/entities/TenderDocumentDTO';
import { TenderDocumentTransformer } from '@/dtos/transforms/TenderDocumentTransformer';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export class TenderDocumentService {
  constructor(
    private tenderDocumentRepository: ITenderDocumentRepository = RepositoryFactory.getTenderDocumentRepository(),
    private documentRepository: IDocumentRepository = RepositoryFactory.getDocumentRepository()
  ) {}

  async createTenderLevelDocument(input: CreateTenderDocumentUploadInput): Promise<{
    document: Document;
    tenderDoc: { id: string };
  }> {
    if (!input.tenderId || !input.title.trim() || !input.fileUrl) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Tender ID, title and file URL are required');
    }
    return this.persistTenderDocument(input);
  }

  async createTenderDocumentUpload(
    input: CreateTenderDocumentUploadInput
  ): Promise<{ documentId?: string; error?: string; stage?: 'document' | 'tender_document' }> {
    let document: Document;
    try {
      document = await this.createGedDocument({
        ...input,
        documentType: input.documentType ?? DocumentType.CONTRACT,
      });
    } catch (error) {
      console.error('TenderDocumentService.createTenderDocumentUpload document insert failed:', error);
      return { error: error instanceof Error ? error.message : String(error), stage: 'document' };
    }

    try {
      await this.tenderDocumentRepository.createTenderDocumentAssociation({
        tenderId: input.tenderId,
        projectId: input.projectId,
        documentId: document.id,
        category: input.category,
        subcategory: input.subcategory,
        isRequired: input.isRequired ?? true,
        isSubmitted: input.isSubmitted ?? true,
        status: input.status ?? 'draft',
        submissionDate: new Date().toISOString(),
      });
      return { documentId: document.id };
    } catch (error) {
      console.error('TenderDocumentService.createTenderDocumentUpload association insert failed:', error);
      try {
        await this.documentRepository.delete(document.id);
      } catch (cleanupError) {
        console.error('TenderDocumentService.createTenderDocumentUpload document cleanup failed:', cleanupError);
      }
      return {
        documentId: document.id,
        error: error instanceof Error ? error.message : String(error),
        stage: 'tender_document',
      };
    }
  }

  private async persistTenderDocument(input: CreateTenderDocumentUploadInput): Promise<{
    document: Document;
    tenderDoc: { id: string };
  }> {
    const document = await this.createGedDocument(input);
    try {
      const tenderDoc = await this.tenderDocumentRepository.createTenderDocumentAssociation({
        tenderId: input.tenderId,
        projectId: input.projectId,
        documentId: document.id,
        category: input.category,
        subcategory: input.subcategory,
        isRequired: input.isRequired ?? false,
        isSubmitted: input.isSubmitted ?? true,
        status: input.status ?? 'pending',
        submissionDate: new Date().toISOString(),
      });
      return { document, tenderDoc };
    } catch (error) {
      try {
        await this.documentRepository.delete(document.id);
      } catch (cleanupError) {
        console.error('TenderDocumentService.createTenderLevelDocument document cleanup failed:', cleanupError);
      }
      throw error;
    }
  }

  private async createGedDocument(input: CreateTenderDocumentUploadInput): Promise<Document> {
    return this.documentRepository.save(Document.create({
      id: crypto.randomUUID(),
      projectId: input.projectId,
      title: input.title,
      description: input.description,
      fileUrl: input.fileUrl,
      fileName: input.fileName,
      fileSize: input.fileSize,
      mimeType: input.mimeType,
      documentType: input.documentType ?? DocumentType.TENDER,
    }));
  }

  /**
   * Create a new tender document
   */
  async createTenderDocument(data: CreateTenderDocumentDTO): Promise<TenderDocumentDTO> {
    try {
      if (!data) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Tender document data is required');
      }

      // Generate ID (in a real app, this would come from the repository or a UUID generator)
      const id = crypto.randomUUID();
      
      // Transform DTO to Entity
      const entity = TenderDocumentTransformer.fromCreateDtoToEntity(data, id);
      
      // Validate entity
      if (!entity.isValid()) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid tender document data');
      }
      
      // Save entity
      const savedEntity = await this.tenderDocumentRepository.save(entity);
      
      // Transform back to DTO
      return TenderDocumentTransformer.toDTO(savedEntity);
    } catch (error) {
      console.error('TenderDocumentService.createTenderDocument failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create tender document');
    }
  }

  /**
   * Get tender document by ID
   */
  async getTenderDocumentById(request: GetTenderDocumentByIdRequestDTO): Promise<TenderDocumentDTO | null> {
    try {
      if (!request.id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Tender document ID is required');
      }

      const entity = await this.tenderDocumentRepository.findById(request.id);
      
      if (!entity) {
        return null;
      }
      
      return TenderDocumentTransformer.toDTO(entity);
    } catch (error) {
      console.error('TenderDocumentService.getTenderDocumentById failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get tender document');
    }
  }

  /**
   * Get all tender documents for a project
   */
  async getProjectTenderDocuments(request: GetProjectTenderDocumentsRequestDTO): Promise<TenderDocumentListDTO[]> {
    try {
      if (!request.projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const entities = await this.tenderDocumentRepository.findByProjectId(request.projectId);
      
      // Transform to list DTOs (would need document service for titles/URLs in real implementation)
      return entities.map(entity => TenderDocumentTransformer.toListDTO(entity));
    } catch (error) {
      console.error('TenderDocumentService.getProjectTenderDocuments failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get project tender documents');
    }
  }

  /**
   * Update tender document
   */
  async updateTenderDocument(request: UpdateTenderDocumentRequestDTO): Promise<TenderDocumentDTO> {
    try {
      if (!request.id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Tender document ID is required');
      }
      if (!request.data) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Update data is required');
      }

      // Get existing entity
      const existingEntity = await this.tenderDocumentRepository.findById(request.id);
      
      if (!existingEntity) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Tender document not found');
      }
      
      // Transform update data
      const updateData = TenderDocumentTransformer.fromUpdateDtoToEntityData(request.data);
      
      // Update entity
      const updatedEntity = await this.tenderDocumentRepository.update(request.id, updateData);
      
      return TenderDocumentTransformer.toDTO(updatedEntity);
    } catch (error) {
      console.error('TenderDocumentService.updateTenderDocument failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update tender document');
    }
  }

  /**
   * Delete tender document
   */
  async deleteTenderDocument(request: DeleteTenderDocumentRequestDTO): Promise<void> {
    try {
      if (!request.id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Tender document ID is required');
      }

      await this.tenderDocumentRepository.delete(request.id);
    } catch (error) {
      console.error('TenderDocumentService.deleteTenderDocument failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete tender document');
    }
  }

  /**
   * Submit tender document
   */
  async submitTenderDocument(request: SubmitTenderDocumentRequestDTO): Promise<TenderDocumentDTO> {
    try {
      if (!request.id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Tender document ID is required');
      }

      const entity = await this.tenderDocumentRepository.findById(request.id);
      
      if (!entity) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Tender document not found');
      }
      
      if (!entity.canBeSubmitted()) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Document cannot be submitted in current status');
      }
      
      // Submit the document
      entity.submit();
      
      const updatedEntity = await this.tenderDocumentRepository.update(request.id, entity);
      
      return TenderDocumentTransformer.toDTO(updatedEntity);
    } catch (error) {
      console.error('TenderDocumentService.submitTenderDocument failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to submit tender document');
    }
  }

  /**
   * Approve tender document
   */
  async approveTenderDocument(request: ApproveTenderDocumentRequestDTO): Promise<TenderDocumentDTO> {
    try {
      if (!request.id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Tender document ID is required');
      }

      const entity = await this.tenderDocumentRepository.findById(request.id);
      
      if (!entity) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Tender document not found');
      }
      
      if (!entity.canBeApproved()) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Document cannot be approved in current status');
      }
      
      // Approve the document
      entity.approve(request.notes);
      
      const updatedEntity = await this.tenderDocumentRepository.update(request.id, entity);
      
      return TenderDocumentTransformer.toDTO(updatedEntity);
    } catch (error) {
      console.error('TenderDocumentService.approveTenderDocument failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to approve tender document');
    }
  }

  /**
   * Reject tender document
   */
  async rejectTenderDocument(request: RejectTenderDocumentRequestDTO): Promise<TenderDocumentDTO> {
    try {
      if (!request.id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Tender document ID is required');
      }
      if (!request.notes) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Rejection notes are required');
      }

      const entity = await this.tenderDocumentRepository.findById(request.id);
      
      if (!entity) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Tender document not found');
      }
      
      if (!entity.canBeRejected()) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Document cannot be rejected in current status');
      }
      
      // Reject the document
      entity.reject(request.notes);
      
      const updatedEntity = await this.tenderDocumentRepository.update(request.id, entity);
      
      return TenderDocumentTransformer.toDTO(updatedEntity);
    } catch (error) {
      console.error('TenderDocumentService.rejectTenderDocument failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to reject tender document');
    }
  }

  /**
   * Get project statistics
   */
  async getProjectStatistics(request: GetProjectStatisticsRequestDTO): Promise<TenderDocumentStatsDTO> {
    try {
      if (!request.projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const documents = await this.tenderDocumentRepository.findByProjectId(request.projectId);
      
      return TenderDocumentTransformer.calculateStats(documents);
    } catch (error) {
      console.error('TenderDocumentService.getProjectStatistics failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get project statistics');
    }
  }


  /**
   * Get tender documents joined with their linked document metadata.
   */
  async getTenderDocumentsWithDocument(tenderId: string) {
    try {
      if (!tenderId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Tender ID is required');
      }
      return await this.tenderDocumentRepository.findByTenderIdWithDocument(tenderId);
    } catch (error) {
      console.error('TenderDocumentService.getTenderDocumentsWithDocument failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get tender documents');
    }
  }

  /**
   * Get workflow-step-level documents for a tender.
   */
  async getWorkflowStepDocuments(tenderId: string) {
    try {
      if (!tenderId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Tender ID is required');
      }
      return await this.tenderDocumentRepository.findStepDocumentsByTenderId(tenderId);
    } catch (error) {
      console.error('TenderDocumentService.getWorkflowStepDocuments failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get workflow step documents');
    }
  }
}

let tenderDocumentServiceInstance: TenderDocumentService | null = null;

export function getTenderDocumentService(): TenderDocumentService {
  if (!tenderDocumentServiceInstance) {
    tenderDocumentServiceInstance = new TenderDocumentService();
  }
  return tenderDocumentServiceInstance;
}

export interface CreateTenderDocumentUploadInput {
  tenderId?: string;
  projectId?: string;
  title: string;
  description: string;
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  documentType?: DocumentType;
  category: string;
  subcategory: string;
  isRequired?: boolean;
  isSubmitted?: boolean;
  status?: string;
}

/**
 * Crée le document GED puis la ligne tender_documents associée (upload formulaire AO).
 * Accès DB encapsulé ici : aucun appel Supabase côté UI.
 */
export async function createTenderDocumentUpload(
  input: CreateTenderDocumentUploadInput
): Promise<{ documentId?: string; error?: string; stage?: 'document' | 'tender_document' }> {
  return getTenderDocumentService().createTenderDocumentUpload(input);
}
