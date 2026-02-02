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
import { CreateTenderDocumentDTO, TenderDocumentDTO } from '@/dtos/entities/TenderDocumentDTO';

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

// Tender sharing interfaces from legacy service
export interface TenderSharingSecretDTO {
  id: string;
  tender_id: string;
  secret_code: string;
  supplier_email: string;
  supplier_id: string;
  expires_at: string;
  max_access_count: number;
  current_access_count: number;
  workflow_phase: string;
  workflow_stage: string;
  allowed_document_ids: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface CreateSharingSecretDTO {
  tender_id: string;
  supplier_email: string;
  supplier_id?: string;
  expires_at: string;
  max_access_count?: number;
  workflow_phase: string;
  workflow_stage: string;
  allowed_document_ids: string[];
  metadata?: Record<string, unknown>;
}

export interface CreateAccessLogDTO {
  secret_code: string;
  supplier_email: string;
  access_ip?: string;
  user_agent?: string;
  access_type: 'view' | 'download' | 'upload';
  document_ids?: string[];
}

export interface ValidateSecretResponseDTO {
  valid: boolean;
  secret?: TenderSharingSecretDTO;
  remaining_access?: number;
  expired?: boolean;
  error?: string;
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

  /**
   * Generate a unique secret code for tender sharing
   * Legacy compatibility method from TenderSharingService
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
   * Legacy compatibility method from TenderSharingService
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
   * Legacy compatibility method from TenderSharingService
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
   * Legacy compatibility method from TenderSharingService
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
   * Legacy compatibility method from TenderSharingService
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

  /**
   * Revoke a sharing secret
   * Legacy compatibility method from TenderSharingService
   */
  async revokeSharingSecret(secretId: string): Promise<void> {
    try {
      // This would need to be implemented with proper revocation logic
      console.warn('revokeSharingSecret not implemented in TenderService');
      console.log('Secret revoked:', secretId);
    } catch (error) {
      console.error('Error revoking sharing secret:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to revoke sharing secret');
    }
  }

  /**
   * Get access logs for a secret
   * Legacy compatibility method from TenderSharingService
   */
  async getAccessLogs(secretCode: string): Promise<CreateAccessLogDTO[]> {
    try {
      // This would need to be implemented with proper retrieval logic
      console.warn('getAccessLogs not implemented in TenderService');
      return [];
    } catch (error) {
      console.error('Error getting access logs:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get access logs');
    }
  }
}
