/**
 * Tender Service
 * Implements business logic for tender management
 */

import { ITenderRepository } from '@/domain/repositories/ITenderRepository';
import { IParsedInvoiceRepository } from '@/domain/repositories/IParsedInvoiceRepository';
import { Tender } from '@/domain/entities/Tender';
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
  constructor(
    private tenderRepository: ITenderRepository,
    private parsedInvoiceRepository: IParsedInvoiceRepository
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
        project_id: options.projectId,
        status: 'active'
      }));

      ErrorLogger.log('info', 'Project tenders retrieved successfully', {
        projectId: options.projectId,
        tenderCount: tenderOptions.length
      });

      return tenderOptions.slice(0, options.limit || 10);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get project tenders';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage, { options }), 'TenderService.getProjectTenders failed');
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
        ErrorLogger.log('warning', 'Tender not found', { tenderId: id });
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
      
      ErrorLogger.log('info', 'All tenders retrieved successfully', {
        tenderCount: tenders.length
      });

      return tenders;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get all tenders';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage), 'TenderService.getAllTenders failed');
    }
  }
}
