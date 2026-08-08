/**
 * InvoiceService - Hexagonal service for invoice operations
 * Handles supplier invoice data through proper architecture layers
 */

import { ParsedInvoiceDTO, CreateInvoiceDTO, UpdateInvoiceDTO } from '@/dtos/entities/InvoiceDTO';
import { IParsedInvoiceRepository } from '@/domain/repositories/IParsedInvoiceRepository';
import { ParsedInvoiceEntity, InvoiceStatus } from '@/domain/entities/ParsedInvoice';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export class InvoiceService {
  constructor(private repository: IParsedInvoiceRepository) {}

  /**
   * Get parsed invoices for a supplier
   * Replaces direct supabase.from("parsed_invoices") calls
   */
  async getParsedInvoices(supplierId: string): Promise<ParsedInvoiceDTO[]> {
    try {
      // Business logic validation
      if (!supplierId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Supplier ID is required');
      }

      // Delegate to repository
      const invoices = await this.repository.findBySupplierId(supplierId);
      
      // Transform entities to DTOs
      return invoices.map(invoice => this.entityToDTO(invoice));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch parsed invoices');
    }
  }

  /**
   * Get parsed invoice by ID
   */
  async getInvoiceById(id: string): Promise<ParsedInvoiceDTO | null> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invoice ID is required');
      }

      const invoice = await this.repository.findById(id);
      return invoice ? this.entityToDTO(invoice) : null;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch invoice');
    }
  }

  /**
   * Create new parsed invoice
   */
  async createParsedInvoice(invoiceData: Omit<ParsedInvoiceEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ParsedInvoiceDTO> {
    try {
      // Business validation
      this.validateParsedInvoiceData(invoiceData);

      // Delegate to repository
      const createdInvoice = await this.repository.create(invoiceData);
      
      return this.entityToDTO(createdInvoice);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to create parsed invoice');
    }
  }

  /**
   * Update parsed invoice
   */
  async updateParsedInvoice(id: string, updateData: Partial<ParsedInvoiceEntity>): Promise<ParsedInvoiceDTO> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invoice ID is required');
      }

      const updatedInvoice = await this.repository.update(id, updateData);
      
      return this.entityToDTO(updatedInvoice);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to update parsed invoice');
    }
  }

  /**
   * Delete parsed invoice
   */
  async deleteParsedInvoice(id: string): Promise<void> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invoice ID is required');
      }

      await this.repository.delete(id);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to delete parsed invoice');
    }
  }

  /**
   * Get parsed invoices by status
   */
  async getParsedInvoicesByStatus(status: InvoiceStatus): Promise<ParsedInvoiceDTO[]> {
    try {
      const invoices = await this.repository.findByStatus(status);
      return invoices.map(invoice => this.entityToDTO(invoice));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch parsed invoices by status');
    }
  }

  /**
   * Get parsed invoices by date range
   */
  async getParsedInvoicesByDateRange(startDate: string, endDate: string): Promise<ParsedInvoiceDTO[]> {
    try {
      // Business validation
      if (!startDate || !endDate) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Start date and end date are required');
      }

      if (new Date(startDate) > new Date(endDate)) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Start date must be before end date');
      }

      const invoices = await this.repository.findAll({
        dateRange: { startDate, endDate }
      });
      return invoices.map(invoice => this.entityToDTO(invoice));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch parsed invoices by date range');
    }
  }

  /**
   * Calculate parsed invoice statistics
   */
  async getParsedInvoiceStatistics(supplierId?: string): Promise<{
    totalInvoices: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    averageAmount: number;
  }> {
    try {
      const invoices = supplierId 
        ? await this.getParsedInvoices(supplierId)
        : await this.repository.findAll().then(invoices => invoices.map(invoice => this.entityToDTO(invoice)));

      // Business logic: Calculate statistics
      const stats = {
        totalInvoices: invoices.length,
        totalAmount: invoices.reduce((sum, inv) => sum + (inv.invoiceData?.amount || 0), 0),
        paidAmount: invoices.filter(inv => inv.processingStatus === 'completed').reduce((sum, inv) => sum + (inv.invoiceData?.amount || 0), 0),
        pendingAmount: invoices.filter(inv => inv.processingStatus === 'processing').reduce((sum, inv) => sum + (inv.invoiceData?.amount || 0), 0),
        overdueAmount: invoices.filter(inv => inv.invoiceData?.dueDate && new Date(inv.invoiceData.dueDate) < new Date()).reduce((sum, inv) => sum + (inv.invoiceData?.amount || 0), 0),
        averageAmount: invoices.length > 0 ? invoices.reduce((sum, inv) => sum + (inv.invoiceData?.amount || 0), 0) / invoices.length : 0
      };

      return stats;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to calculate parsed invoice statistics');
    }
  }

  // Private helper methods for business logic

  private validateParsedInvoiceData(invoice: Omit<ParsedInvoiceEntity, 'id' | 'createdAt' | 'updatedAt'>): void {
    // Business validation rules
    if (!invoice.fileName) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'File name is required');
    }

    if (!invoice.originalFileName) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Original file name is required');
    }

    if (!invoice.filePath) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'File path is required');
    }

    if (!invoice.uploadedBy) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Uploader ID is required');
    }

    // Validate amount if present
    if (invoice.amount !== null && invoice.amount !== undefined && invoice.amount <= 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invoice amount must be greater than 0');
    }

    // Validate due date if present
    if (invoice.dueDate) {
      const dueDate = new Date(invoice.dueDate);
      if (isNaN(dueDate.getTime())) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid due date format');
      }
    }
  }

  private entityToDTO(entity: ParsedInvoiceEntity): ParsedInvoiceDTO {
    return {
      id: entity.id,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      originalFileName: entity.originalFileName,
      parsedAt: entity.processedAt || entity.createdAt,
      supplierInfo: {
        supplierId: entity.supplierId || '',
        name: entity.extractedData?.supplierName || 'Unknown',
        email: entity.extractedData?.supplierEmail,
        phone: entity.extractedData?.supplierPhone,
        address: entity.extractedData?.supplierAddress,
        taxId: entity.extractedData?.supplierTaxId
      },
      invoiceData: {
        invoiceNumber: entity.invoiceNumber || '',
        issueDate: entity.invoiceDate || '',
        dueDate: entity.dueDate || '',
        amount: entity.amount || 0,
        currency: entity.currency || 'EUR',
        taxAmount: entity.extractedData?.taxAmount,
        totalAmount: entity.extractedData?.totalAmount,
        description: entity.extractedData?.description
      },
      lineItems: entity.extractedData?.lineItems || [],
      extractionConfidence: entity.extractedData?.confidence || 0,
      validationStatus: entity.status === 'validated' ? 'validated' : 
                       entity.status === 'rejected' ? 'rejected' : 
                       entity.status === 'pending' ? 'pending' : 'needs_review',
      validationErrors: entity.validationErrors || undefined,
      processingStatus: entity.status === 'validated' ? 'completed' : 
                       entity.status === 'rejected' ? 'failed' : 
                       entity.status === 'processing' ? 'processing' : 'completed'
    };
  }
}

let invoiceServiceInstance: InvoiceService | null = null;
export function getInvoiceService(): InvoiceService {
  if (!invoiceServiceInstance) {
    invoiceServiceInstance = new InvoiceService(RepositoryFactory.getParsedInvoiceRepository());
  }
  return invoiceServiceInstance;
}
