/**
 * Tender Service
 * Implements business logic for tender management
 */

import { ITenderRepository } from '@/domain/repositories/ITenderRepository';
import { IParsedInvoiceRepository } from '@/domain/repositories/IParsedInvoiceRepository';
import { ITenderDocumentRepository } from '@/domain/repositories/ITenderDocumentRepository';
import { Tender } from '@/domain/entities/Tender';
import { TenderDocumentTransformer } from '@/dtos/transforms/TenderDocumentTransformer';
import { CreateTenderDocumentDTO, TenderDocumentDTO } from '@/dtos/transforms/TenderDocumentDTO';
import { AppError, ErrorCode, ErrorLogger } from '@/utils/errorHandling';

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

export class TenderService {
  static getTenderSubmissions(id: string): any {
    throw new Error("Method not implemented.");
  }
  constructor(
    private tenderRepository: ITenderRepository,
    private parsedInvoiceRepository: IParsedInvoiceRepository,
    private tenderDocumentRepository: ITenderDocumentRepository
  ) {}

  /**
   * Get tenders for a specific project
   */
  async getProjectTenders(options: SearchTendersOptions = {}): Promise<TenderOption[]> {
    try {
      if (!options.projectId) {
        return [];
      }

      // Get parsed invoices related to the project (tender documents)
      const parsedInvoices = await this.parsedInvoiceRepository.findByProjectId(options.projectId);
      
      const tenderOptions: TenderOption[] = parsedInvoices.map((item, index) => ({
        id: item.id,
        title: item.fileName || `Appel d'offres ${index + 1}`,
        reference: `AO-${options.projectId}-${index + 1}`,
        project_id: options.projectId as string,
        status: 'active'
      }));

      console.log('Project tenders retrieved successfully:', {
        projectId: options.projectId,
        tenderCount: tenderOptions.length
      });

      return tenderOptions.slice(0, options.limit || 10);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get project tenders';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage, { options }));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage, { options });
    }
  }

  /**
   * Get tender by ID
   */
  async getTenderById(id: string): Promise<Tender | null> {
    try {
      const tender = await this.tenderRepository.findById(id);
      
      if (!tender) {
        console.warn('Tender not found:', id);
        return null;
      }

      return tender;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get tender';
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage, { tenderId: id });
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to get all tenders';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage));
      return [];
    }
  }

  /**
   * Create a tender document
   */
  async createTenderDocument(data: CreateTenderDocumentDTO): Promise<TenderDocumentDTO> {
    try {
      // Generate ID
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

}
