/**
 * InvoiceService - Hexagonal service for invoice operations
 * Handles supplier invoice data through proper architecture layers
 */

import { InvoiceDTO, CreateInvoiceDTO, UpdateInvoiceDTO, ParsedInvoiceDTO } from '@/dtos/entities/InvoiceDTO';
import { IInvoiceRepository } from '@/domain/repositories/IInvoiceRepository';
import { AppError, ErrorCode } from '@/utils/errors';

export class InvoiceService {
  constructor(private repository: IInvoiceRepository) {}

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
      const invoices = await this.repository.getParsedInvoices(supplierId);
      
      // Business logic: Process and validate invoice data
      return this.validateInvoiceData(invoices);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch parsed invoices');
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(id: string): Promise<InvoiceDTO | null> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invoice ID is required');
      }

      const invoice = await this.repository.findById(id);
      return invoice;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch invoice');
    }
  }

  /**
   * Create new invoice
   */
  async createInvoice(invoiceData: CreateInvoiceDTO): Promise<InvoiceDTO> {
    try {
      // Business validation
      this.validateInvoiceData(invoiceData);

      // Delegate to repository
      const createdInvoice = await this.repository.create(invoiceData);
      
      return createdInvoice;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to create invoice');
    }
  }

  /**
   * Update invoice
   */
  async updateInvoice(id: string, updateData: UpdateInvoiceDTO): Promise<InvoiceDTO> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invoice ID is required');
      }

      const updatedInvoice = await this.repository.update(id, updateData);
      
      if (!updatedInvoice) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Invoice not found');
      }

      return updatedInvoice;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to update invoice');
    }
  }

  /**
   * Delete invoice
   */
  async deleteInvoice(id: string): Promise<boolean> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invoice ID is required');
      }

      const deleted = await this.repository.delete(id);
      return deleted;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to delete invoice');
    }
  }

  /**
   * Get invoices by status
   */
  async getInvoicesByStatus(status: string): Promise<InvoiceDTO[]> {
    try {
      const invoices = await this.repository.findByStatus(status);
      return invoices;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch invoices by status');
    }
  }

  /**
   * Get invoices by date range
   */
  async getInvoicesByDateRange(startDate: string, endDate: string): Promise<InvoiceDTO[]> {
    try {
      // Business validation
      if (!startDate || !endDate) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Start date and end date are required');
      }

      if (new Date(startDate) > new Date(endDate)) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Start date must be before end date');
      }

      const invoices = await this.repository.findByDateRange(startDate, endDate);
      return invoices;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch invoices by date range');
    }
  }

  /**
   * Calculate invoice statistics
   */
  async getInvoiceStatistics(supplierId?: string): Promise<{
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
        : await this.repository.findAll();

      // Business logic: Calculate statistics
      const stats = {
        totalInvoices: invoices.length,
        totalAmount: invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
        paidAmount: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.amount || 0), 0),
        pendingAmount: invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + (inv.amount || 0), 0),
        overdueAmount: invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + (inv.amount || 0), 0),
        averageAmount: invoices.length > 0 ? invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0) / invoices.length : 0
      };

      return stats;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to calculate invoice statistics');
    }
  }

  // Private helper methods for business logic

  private validateInvoiceData(invoice: CreateInvoiceDTO | ParsedInvoiceDTO): void {
    // Business validation rules
    if (!invoice.supplierId) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Supplier ID is required');
    }

    if (!invoice.invoiceNumber || invoice.invoiceNumber.trim().length === 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invoice number is required');
    }

    if (!invoice.amount || invoice.amount <= 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invoice amount must be greater than 0');
    }

    if (!invoice.dueDate) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Due date is required');
    }

    // Validate date format
    const dueDate = new Date(invoice.dueDate);
    if (isNaN(dueDate.getTime())) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid due date format');
    }
  }

  private validateInvoiceData(invoices: ParsedInvoiceDTO[]): ParsedInvoiceDTO[] {
    // Business logic: Filter and validate parsed invoices
    return invoices.filter(invoice => {
      try {
        this.validateInvoiceData(invoice);
        return true;
      } catch {
        // Log invalid invoices but don't fail the entire operation
        console.warn('Invalid invoice data found:', invoice);
        return false;
      }
    });
  }
}
