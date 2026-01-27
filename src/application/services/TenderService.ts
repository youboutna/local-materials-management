/**
 * Tender Service - Hexagonal Architecture
 * Implements business logic for tender management
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { ITenderRepository } from '@/domain/repositories/ITenderRepository';
import { IParsedInvoiceRepository } from '@/domain/repositories/IParsedInvoiceRepository';
import { ITenderDocumentRepository } from '@/domain/repositories/ITenderDocumentRepository';
import { Tender } from '@/domain/entities/Tender';
import { TenderDocumentTransformer } from '@/dtos/transforms/TenderDocumentTransformer';
import { CreateTenderDocumentDTO, TenderDocumentDTO } from '@/dtos/transforms/TenderDocumentDTO';

export interface TenderOption {
  id: string;
  title: string;
  reference: string;
  project_id: string;
  status?: string;
}

export interface SearchTendersOptions {
  projectId?: string;
  limit?: number;
}

// Service DTOs for data exchange
export interface GetProjectTendersRequestDto {
  projectId?: string;
  limit?: number;
}

export interface GetTenderByIdRequestDto {
  id: string;
}

export interface CreateTenderDocumentRequestDto {
  data: CreateTenderDocumentDTO;
}

export class TenderService {
  constructor(
    private tenderRepository: ITenderRepository = RepositoryFactory.getTenderRepository(),
    private parsedInvoiceRepository: IParsedInvoiceRepository = RepositoryFactory.getParsedInvoiceRepository(),
    private tenderDocumentRepository: ITenderDocumentRepository = RepositoryFactory.getTenderDocumentRepository()
  ) {}

  /**
   * Get tenders for a specific project
   */
  async getProjectTenders(request: GetProjectTendersRequestDto): Promise<TenderOption[]> {
    try {
      if (!request.projectId) {
        return [];
      }

      // Get parsed invoices related to the project (tender documents)
      const parsedInvoices = await this.parsedInvoiceRepository.findByProjectId(request.projectId);
      
      const tenderOptions: TenderOption[] = parsedInvoices.map((item, index) => ({
        id: item.id,
        title: item.fileName || `Appel d'offres ${index + 1}`,
        reference: `AO-${request.projectId}-${index + 1}`,
        project_id: request.projectId as string,
        status: 'active'
      }));

      console.log('Project tenders retrieved successfully:', {
        projectId: request.projectId,
        tenderCount: tenderOptions.length
      });

      return tenderOptions.slice(0, request.limit || 10);
    } catch (error) {
      console.error('TenderService.getProjectTenders failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get project tenders');
    }
  }

  /**
   * Get tender by ID
   */
  async getTenderById(request: GetTenderByIdRequestDto): Promise<Tender | null> {
    try {
      if (!request.id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Tender ID is required');
      }

      const tender = await this.tenderRepository.findById(request.id);
      
      if (!tender) {
        console.warn('Tender not found:', request.id);
        return null;
      }

      return tender;
    } catch (error) {
      console.error('TenderService.getTenderById failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get tender');
    }
  }

  /**
   * Get all tenders
   */
  async getAllTenders(): Promise<Tender[]> {
    try {
      const tenders = await this.tenderRepository.findAll();
      
      console.log('All tenders retrieved successfully:', {
        tenderCount: tenders.length
      });

      return tenders;
    } catch (error) {
      console.error('TenderService.getAllTenders failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get all tenders');
    }
  }

  /**
   * Create a tender document
   */
  async createTenderDocument(request: CreateTenderDocumentRequestDto): Promise<TenderDocumentDTO> {
    try {
      if (!request.data) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Tender document data is required');
      }

      // Generate ID
      const id = crypto.randomUUID();
      
      // Transform DTO to Entity
      const entity = TenderDocumentTransformer.fromCreateDtoToEntity(request.data, id);
      
      // Validate entity
      if (!entity.isValid()) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid tender document data');
      }
      
      // Save entity
      const savedEntity = await this.tenderDocumentRepository.save(entity);
      
      // Transform back to DTO
      return TenderDocumentTransformer.toDTO(savedEntity);
    } catch (error) {
      console.error('TenderService.createTenderDocument failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create tender document');
    }
  }
}
