/**
 * Parsed Invoice Repository Interface
 * Defines contract for parsed invoice data access
 * Following hexagonal architecture principles
 */

import { ParsedInvoiceEntity } from '@/domain/entities/ParsedInvoice';

export interface IParsedInvoiceRepository {
  /**
   * Find parsed invoice by ID
   */
  findById(id: string): Promise<ParsedInvoiceEntity | null>;

  /**
   * Find all parsed invoices for a specific project
   */
  findByProjectId(projectId: string): Promise<ParsedInvoiceEntity[]>;

  /**
   * Find parsed invoices by tender ID
   */
  findByTenderId(tenderId: string): Promise<ParsedInvoiceEntity[]>;

  /**
   * Find parsed invoices by supplier ID
   */
  findBySupplierId(supplierId: string): Promise<ParsedInvoiceEntity[]>;

  /**
   * Find parsed invoices by status
   */
  findByStatus(status: string): Promise<ParsedInvoiceEntity[]>;

  /**
   * Create new parsed invoice
   */
  create(invoice: Omit<ParsedInvoiceEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ParsedInvoiceEntity>;

  /**
   * Update existing parsed invoice
   */
  update(id: string, updates: Partial<ParsedInvoiceEntity>): Promise<ParsedInvoiceEntity>;

  /**
   * Delete parsed invoice
   */
  delete(id: string): Promise<void>;

  /**
   * Find all parsed invoices (with optional filters)
   */
  findAll(filters?: {
    projectId?: string;
    tenderId?: string;
    supplierId?: string;
    status?: string;
    dateRange?: {
      startDate: string;
      endDate: string;
    };
  }): Promise<ParsedInvoiceEntity[]>;

  /**
   * Search parsed invoices with criteria
   */
  search(criteria: {
    projectId?: string;
    searchTerm?: string;
    status?: string;
    dateRange?: {
      startDate: string;
      endDate: string;
    };
    limit?: number;
    offset?: number;
  }): Promise<{
    invoices: ParsedInvoiceEntity[];
    total: number;
  }>;

  /**
   * Check if parsed invoice exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Count parsed invoices for a project
   */
  countByProject(projectId: string): Promise<number>;

  /**
   * Get parsed invoices with file information
   */
  getWithFileInfo(projectId?: string): Promise<ParsedInvoiceEntity[]>;

  /**
   * Update parsing status
   */
  updateParsingStatus(id: string, status: string, error?: string): Promise<void>;
}
