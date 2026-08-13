/**
 * Parsed Invoice Adapter - Supabase Implementation
 * Implements IParsedInvoiceRepository using Supabase
 */

import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { IParsedInvoiceRepository } from '@/domain/repositories/IParsedInvoiceRepository';
import { ParsedInvoiceEntity, InvoiceStatus, InvoiceType } from '@/domain/entities/ParsedInvoice';
import { Json } from '@/integrations/supabase/types';

export class SupabaseParsedInvoiceAdapter implements IParsedInvoiceRepository {
  
  /**
   * Find parsed invoice by ID
   */
  async findById(id: string): Promise<ParsedInvoiceEntity | null> {
    try {
      const { data, error } = await supabase
        .from('parsed_invoices')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      return this.mapRowToEntity(data);
    } catch (error) {
      console.error('Error finding parsed invoice by ID:', error);
      throw error;
    }
  }

  /**
   * Find all parsed invoices for a specific project
   */
  async findByProjectId(projectId: string): Promise<ParsedInvoiceEntity[]> {
    try {
      const { data, error } = await supabase
        .from('parsed_invoices')
        .select('*')
        .eq('tender_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('Error finding parsed invoices by project ID:', error);
      throw error;
    }
  }

  /**
   * Find parsed invoices by tender ID
   */
  async findByTenderId(tenderId: string): Promise<ParsedInvoiceEntity[]> {
    try {
      const { data, error } = await supabase
        .from('parsed_invoices')
        .select('*')
        .eq('tender_id', tenderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('Error finding parsed invoices by tender ID:', error);
      throw error;
    }
  }

  /**
   * Find parsed invoices by supplier ID
   */
  async findBySupplierId(supplierId: string): Promise<ParsedInvoiceEntity[]> {
    try {
      const { data, error } = await supabase
        .from('parsed_invoices')
        .select('*')
        .eq('supplier_info', { supplier_id: supplierId })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('Error finding parsed invoices by supplier ID:', error);
      throw error;
    }
  }

  /**
   * Find parsed invoices by status
   */
  async findByStatus(status: string): Promise<ParsedInvoiceEntity[]> {
    try {
      const { data, error } = await supabase
        .from('parsed_invoices')
        .select('*')
        .eq('parsing_status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('Error finding parsed invoices by status:', error);
      throw error;
    }
  }

  /**
   * Create new parsed invoice
   */
  async create(invoice: Omit<ParsedInvoiceEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ParsedInvoiceEntity> {
    try {
      const now = new Date().toISOString();
      const rowData = this.mapEntityToRow(invoice);
      
      const { data, error } = await supabase
        .from('parsed_invoices')
        .insert({
          ...rowData,
          created_at: now,
          updated_at: now
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to create parsed invoice');

      return this.mapRowToEntity(data);
    } catch (error) {
      console.error('Error creating parsed invoice:', error);
      throw error;
    }
  }

  /**
   * Update existing parsed invoice
   */
  async update(id: string, updates: Partial<ParsedInvoiceEntity>): Promise<ParsedInvoiceEntity> {
    try {
      const rowData = this.mapEntityToRow(updates);
      
      const { data, error } = await supabase
        .from('parsed_invoices')
        .update({
          ...rowData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to update parsed invoice');

      return this.mapRowToEntity(data);
    } catch (error) {
      console.error('Error updating parsed invoice:', error);
      throw error;
    }
  }

  /**
   * Delete parsed invoice
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('parsed_invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting parsed invoice:', error);
      throw error;
    }
  }

  /**
   * Find all parsed invoices (with optional filters)
   */
  async findAll(filters?: {
    projectId?: string;
    tenderId?: string;
    supplierId?: string;
    status?: string;
    dateRange?: {
      startDate: string;
      endDate: string;
    };
  }): Promise<ParsedInvoiceEntity[]> {
    try {
      let query = supabase.from('parsed_invoices').select('*');

      if (filters?.tenderId) {
        query = query.eq('tender_id', filters.tenderId);
      }
      if (filters?.status) {
        query = query.eq('parsing_status', filters.status);
      }
      if (filters?.dateRange) {
        query = query
          .gte('invoice_date', filters.dateRange.startDate)
          .lte('invoice_date', filters.dateRange.endDate);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('Error finding all parsed invoices:', error);
      throw error;
    }
  }

  /**
   * Search parsed invoices with criteria
   */
  async search(criteria: {
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
  }> {
    try {
      let query = supabase.from('parsed_invoices').select('*', { count: 'exact' });

      if (criteria?.status) {
        query = query.eq('parsing_status', criteria.status);
      }
      if (criteria?.dateRange) {
        query = query
          .gte('invoice_date', criteria.dateRange.startDate)
          .lte('invoice_date', criteria.dateRange.endDate);
      }
      if (criteria?.searchTerm) {
        query = query.or(`invoice_number.ilike.%${criteria.searchTerm}%,file_name.ilike.%${criteria.searchTerm}%`);
      }

      if (criteria.limit && criteria.offset) {
        query = query.range(criteria.offset, criteria.offset + criteria.limit - 1);
      } else if (criteria.limit) {
        query = query.limit(criteria.limit);
      } else if (criteria.offset) {
        query = query.range(criteria.offset, 999999); // Large number pour obtenir tout à partir de l'offset
      }

      const { data, error, count } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return {
        invoices: (data || []).map(row => this.mapRowToEntity(row)),
        total: count || 0
      };
    } catch (error) {
      console.error('Error searching parsed invoices:', error);
      throw error;
    }
  }

  /**
   * Check if parsed invoice exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('parsed_invoices')
        .select('id')
        .eq('id', id)
        .single();

      if (error) return false;
      return !!data;
    } catch (error) {
      return false;
    }
  }

  /**
   * Count parsed invoices for a project
   */
  async countByProject(projectId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('parsed_invoices')
        .select('*', { count: 'exact', head: true })
        .eq('tender_id', projectId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error counting parsed invoices by project:', error);
      throw error;
    }
  }

  /**
   * Get parsed invoices with file information
   */
  async getWithFileInfo(projectId?: string): Promise<ParsedInvoiceEntity[]> {
    try {
      let query = supabase
        .from('parsed_invoices')
        .select('*');

      if (projectId) {
        query = query.eq('tender_id', projectId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('Error getting parsed invoices with file info:', error);
      throw error;
    }
  }

  /**
   * Update parsing status
   */
  async updateParsingStatus(id: string, status: string, error?: string): Promise<void> {
    try {
      const updateData: {
        parsing_status: string;
        updated_at: string;
        parsing_errors?: string;
      } = {
        parsing_status: status,
        updated_at: new Date().toISOString()
      };

      if (error) {
        updateData.parsing_errors = error;
      }

      const { error: updateError } = await supabase
        .from('parsed_invoices')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error updating parsing status:', error);
      throw error;
    }
  }

  /**
   * Map Supabase row to ParsedInvoiceEntity
   */
  private mapRowToEntity(row: any): ParsedInvoiceEntity {
    const supplierInfo = row.supplier_info as any;
    
    return ParsedInvoiceEntity.create({
      id: row.id,
      fileName: row.file_name || 'unknown',
      originalFileName: row.file_name || 'unknown',
      filePath: '', // filePath - not stored in parsed_invoices
      fileSize: 0, // fileSize - not stored
      mimeType: 'application/pdf', // mimeType - default
      invoiceNumber: row.invoice_number,
      invoiceDate: row.invoice_date,
      dueDate: null, // dueDate - not stored
      amount: row.total_amount,
      currency: 'EUR', // currency - default
      supplierId: supplierInfo?.supplier_id || null,
      projectId: null, // projectId - not directly stored, use tender_id
      tenderId: row.tender_id,
      invoiceType: 'supplier_invoice', // invoiceType - default
      status: (row.parsing_status as InvoiceStatus) || 'pending',
      extractedData: row.parsed_data,
      parsingErrors: row.parsing_errors ? [row.parsing_errors] : null,
      validationErrors: null, // validationErrors - not stored
      processedAt: row.created_at,
      uploadedBy: 'system', // uploadedBy - default
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  /**
   * Map ParsedInvoiceEntity to Supabase row
   */
  private mapEntityToRow(entity: Partial<ParsedInvoiceEntity>): {
    file_name?: string;
    invoice_number?: string;
    invoice_date?: string;
    total_amount?: number;
    tender_id?: string;
    parsed_data?: Json;
    parsing_errors?: string;
    parsing_status?: string;
    supplier_info?: Json;
  } {
    const row: {
      file_name?: string;
      invoice_number?: string;
      invoice_date?: string;
      total_amount?: number;
      tender_id?: string;
      parsed_data?: Json;
      parsing_errors?: string;
      parsing_status?: string;
      supplier_info?: Json;
    } = {};

    if (entity.fileName !== undefined) row.file_name = entity.fileName || undefined;
    if (entity.invoiceNumber !== undefined) row.invoice_number = entity.invoiceNumber || undefined;
    if (entity.invoiceDate !== undefined) row.invoice_date = entity.invoiceDate || undefined;
    if (entity.amount !== undefined) row.total_amount = entity.amount || undefined;
    if (entity.extractedData !== undefined) row.parsed_data = (entity.extractedData as unknown as Json) || undefined;
    if (entity.parsingErrors !== undefined) row.parsing_errors = entity.parsingErrors?.join(', ') || undefined;
    if (entity.status !== undefined) row.parsing_status = entity.status;
    if (entity.tenderId !== undefined) row.tender_id = entity.tenderId || undefined;

    // Map supplier info
    if (entity.supplierId) {
      row.supplier_info = { supplier_id: entity.supplierId } as unknown as Json;
    }

    return row;
  }
}
