/**
 * Tender Service - Hexagonal Architecture
 * Implements business logic for tender management
 */

import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import {
  TenderOption,
  SearchTendersOptions,
  GetProjectTendersRequestDto,
  GetTenderByIdRequestDto,
  CreateTenderDocumentRequestDto,
  TenderSharingSecretDTO,
  CreateSharingSecretDTO,
  CreateAccessLogDTO,
  ValidateSecretResponseDTO
} from '@/dtos/entities/TenderServiceDTO';
import { CreateTenderDocumentDTO, TenderDocumentDTO } from '@/dtos/entities/TenderDocumentDTO';
import { TenderDocumentTransformer } from '@/dtos/transforms/TenderDocumentTransformer';
import { ITenderRepository } from '@/domain/repositories/ITenderRepository';
import { IParsedInvoiceRepository } from '@/domain/repositories/IParsedInvoiceRepository';
import { ITenderDocumentRepository } from '@/domain/repositories/ITenderDocumentRepository';
import { Tender } from '@/domain/entities/Tender';

export class TenderService {
  constructor(
    private tenderRepository: ITenderRepository = RepositoryFactory.getTenderRepository(),
    private parsedInvoiceRepository: IParsedInvoiceRepository = RepositoryFactory.getParsedInvoiceRepository(),
    private tenderDocumentRepository: ITenderDocumentRepository = RepositoryFactory.getTenderDocumentRepository()
  ) {}

  // ============= STATIC METHODS FOR BACKWARD COMPATIBILITY =============
  
  /**
   * Static: Get published tenders for submission
   */
  static async getPublishedTendersForSubmission(): Promise<Tender[]> {
    const service = new TenderService();
    return service.getAllTenders();
  }

  // ============= END STATIC METHODS =============

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

  /**
   * Generate a unique secret code for tender sharing
   */
  async generateSecretCode(): Promise<string> {
    try {
      // This would need to be implemented with proper secret generation logic
      // For now, generate a simple random code
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    } catch (error) {
      console.error('Error generating secret code:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to generate secret code');
    }
  }

  /**
   * Create a new sharing secret for tender documents
   */
  async createSharingSecret(dto: CreateSharingSecretDTO): Promise<TenderSharingSecretDTO> {
    try {
      const secretCode = await this.generateSecretCode();
      
      // This would need to be implemented with proper database logic
      console.warn('createSharingSecret not fully implemented in TenderService');
      
      const secret: TenderSharingSecretDTO = {
        id: crypto.randomUUID(),
        tender_id: dto.tender_id,
        secret_code: secretCode,
        supplier_email: dto.supplier_email,
        supplier_id: dto.supplier_id || '',
        expires_at: dto.expires_at,
        max_access_count: dto.max_access_count || 10,
        current_access_count: 0,
        workflow_phase: dto.workflow_phase,
        workflow_stage: dto.workflow_stage,
        allowed_document_ids: dto.allowed_document_ids,
        metadata: dto.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
      };

      return secret;
    } catch (error) {
      console.error('Error creating sharing secret:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create sharing secret');
    }
  }

  /**
   * Validate a sharing secret
   */
  async validateSecret(secretCode: string, supplierEmail: string): Promise<ValidateSecretResponseDTO> {
    try {
      // This would need to be implemented with proper validation logic
      console.warn('validateSecret not fully implemented in TenderService');
      
      return {
        valid: false,
        error: 'Secret validation not implemented'
      };
    } catch (error) {
      console.error('Error validating secret:', error);
      return {
        valid: false,
        error: 'Failed to validate secret'
      };
    }
  }

  /**
   * Log access to shared documents
   */
  async logAccess(dto: CreateAccessLogDTO): Promise<void> {
    try {
      // This would need to be implemented with proper logging logic
      console.warn('logAccess not implemented in TenderService');
      console.log('Access logged:', dto);
    } catch (error) {
      console.error('Error logging access:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to log access');
    }
  }

  /**
   * Get sharing secrets for a tender
   */
  async getTenderSharingSecrets(tenderId: string): Promise<TenderSharingSecretDTO[]> {
    try {
      // This would need to be implemented with proper retrieval logic
      console.warn('getTenderSharingSecrets not implemented in TenderService');
      return [];
    } catch (error) {
      console.error('Error getting tender sharing secrets:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get sharing secrets');
    }
  }

}
