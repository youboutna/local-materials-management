/**
 * Tender Document Service
 * Implements business logic for tender document management
 */

import { ITenderDocumentRepository } from '@/domain/repositories/ITenderDocumentRepository';
import { TenderDocument } from '@/domain/entities/TenderDocument';
import { TenderDocumentTransformer } from '@/dtos/transforms/TenderDocumentTransformer';
import {
  TenderDocumentDTO,
  CreateTenderDocumentDTO,
  UpdateTenderDocumentDTO,
  TenderDocumentResponseDTO,
  TenderDocumentListDTO,
  TenderDocumentStatsDTO
} from '@/dtos/transforms/TenderDocumentDTO';
import { AppError, ErrorCode, ErrorLogger } from '@/utils/errorHandling';

export class TenderDocumentService {
  constructor(private tenderDocumentRepository: ITenderDocumentRepository) {}

  /**
   * Create a new tender document
   */
  async createTenderDocument(data: CreateTenderDocumentDTO): Promise<TenderDocumentDTO> {
    try {
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to create tender document';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage, { data }));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage, { data });
    }
  }

  /**
   * Get tender document by ID
   */
  async getTenderDocumentById(id: string): Promise<TenderDocumentDTO | null> {
    try {
      const entity = await this.tenderDocumentRepository.findById(id);
      
      if (!entity) {
        return null;
      }
      
      return TenderDocumentTransformer.toDTO(entity);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get tender document';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage, { id }));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage, { id });
    }
  }

  /**
   * Get all tender documents for a project
   */
  async getProjectTenderDocuments(projectId: string): Promise<TenderDocumentListDTO[]> {
    try {
      const entities = await this.tenderDocumentRepository.findByProjectId(projectId);
      
      // Transform to list DTOs (would need document service for titles/URLs in real implementation)
      return entities.map(entity => TenderDocumentTransformer.toListDTO(entity));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get project tender documents';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage, { projectId }));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage, { projectId });
    }
  }

  /**
   * Update tender document
   */
  async updateTenderDocument(id: string, data: UpdateTenderDocumentDTO): Promise<TenderDocumentDTO> {
    try {
      // Get existing entity
      const existingEntity = await this.tenderDocumentRepository.findById(id);
      
      if (!existingEntity) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Tender document not found');
      }
      
      // Transform update data
      const updateData = TenderDocumentTransformer.fromUpdateDtoToEntityData(data);
      
      // Update entity
      const updatedEntity = await this.tenderDocumentRepository.update(id, updateData);
      
      return TenderDocumentTransformer.toDTO(updatedEntity);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update tender document';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage, { id, data }));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage, { id, data });
    }
  }

  /**
   * Delete tender document
   */
  async deleteTenderDocument(id: string): Promise<void> {
    try {
      await this.tenderDocumentRepository.delete(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete tender document';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage, { id }));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage, { id });
    }
  }

  /**
   * Submit tender document
   */
  async submitTenderDocument(id: string): Promise<TenderDocumentDTO> {
    try {
      const entity = await this.tenderDocumentRepository.findById(id);
      
      if (!entity) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Tender document not found');
      }
      
      if (!entity.canBeSubmitted()) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Document cannot be submitted in current status');
      }
      
      // Submit the document
      entity.submit();
      
      const updatedEntity = await this.tenderDocumentRepository.update(id, entity);
      
      return TenderDocumentTransformer.toDTO(updatedEntity);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit tender document';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage, { id }));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage, { id });
    }
  }

  /**
   * Approve tender document
   */
  async approveTenderDocument(id: string, notes?: string): Promise<TenderDocumentDTO> {
    try {
      const entity = await this.tenderDocumentRepository.findById(id);
      
      if (!entity) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Tender document not found');
      }
      
      if (!entity.canBeApproved()) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Document cannot be approved in current status');
      }
      
      // Approve the document
      entity.approve(notes);
      
      const updatedEntity = await this.tenderDocumentRepository.update(id, entity);
      
      return TenderDocumentTransformer.toDTO(updatedEntity);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve tender document';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage, { id }));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage, { id });
    }
  }

  /**
   * Reject tender document
   */
  async rejectTenderDocument(id: string, notes: string): Promise<TenderDocumentDTO> {
    try {
      const entity = await this.tenderDocumentRepository.findById(id);
      
      if (!entity) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Tender document not found');
      }
      
      if (!entity.canBeRejected()) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Document cannot be rejected in current status');
      }
      
      // Reject the document
      entity.reject(notes);
      
      const updatedEntity = await this.tenderDocumentRepository.update(id, entity);
      
      return TenderDocumentTransformer.toDTO(updatedEntity);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject tender document';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage, { id }));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage, { id });
    }
  }

  /**
   * Get project statistics
   */
  async getProjectStatistics(projectId: string): Promise<TenderDocumentStatsDTO> {
    try {
      const documents = await this.tenderDocumentRepository.findByProjectId(projectId);
      
      return TenderDocumentTransformer.calculateStats(documents);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get project statistics';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage, { projectId }));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage, { projectId });
    }
  }
}
