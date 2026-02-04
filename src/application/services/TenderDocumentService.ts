/**
 * Tender Document Service - Hexagonal Architecture
 * Implements business logic for tender document management
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { ITenderDocumentRepository } from '@/domain/repositories/ITenderDocumentRepository';
import { TenderDocument } from '@/domain/entities/TenderDocument';
import { TenderDocumentTransformer } from '@/dtos/transforms/TenderDocumentTransformer';
import {
  TenderDocumentDTO,
  CreateTenderDocumentDTO,
  UpdateTenderDocumentDTO,
  TenderDocumentResponseDTO,
  TenderDocumentListDTO,
  TenderDocumentStatsDTO,
  GetTenderDocumentByIdRequestDTO,
  GetProjectTenderDocumentsRequestDTO,
  UpdateTenderDocumentRequestDTO,
  DeleteTenderDocumentRequestDTO,
  SubmitTenderDocumentRequestDTO,
  ApproveTenderDocumentRequestDTO,
  RejectTenderDocumentRequestDTO,
  GetProjectStatisticsRequestDTO
} from '@/dtos/entities/TenderDocumentDTO';

export class TenderDocumentService {
  constructor(
    private tenderDocumentRepository: ITenderDocumentRepository = RepositoryFactory.getTenderDocumentRepository()
  ) {}

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
}
