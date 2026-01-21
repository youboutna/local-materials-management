/**
 * Parsed Invoice Adapter - Supabase Implementation
 * Implements IParsedInvoiceRepository using Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import { IParsedInvoiceRepository } from '@/domain/repositories/IParsedInvoiceRepository';
import { ParsedInvoiceEntity, InvoiceStatus, InvoiceType } from '@/domain/entities/ParsedInvoice';

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

      if (criteria?.limit) {
        query = query.limit(criteria.limit);
      }
      if (criteria?.offset) {
        // Note: offset is not available in this Supabase client version
        // query = query.offset(criteria.offset);
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
    
    return new ParsedInvoiceEntity(
      row.id,
      row.file_name || 'unknown',
      row.file_name || 'unknown',
      '', // filePath - not stored in parsed_invoices
      0, // fileSize - not stored
      'application/pdf', // mimeType - default
      row.invoice_number,
      row.invoice_date,
      null, // dueDate - not stored
      row.total_amount,
      'EUR', // currency - default
      supplierInfo?.supplier_id || null,
      null, // projectId - not directly stored, use tender_id
      row.tender_id,
      'supplier_invoice', // invoiceType - default
      (row.parsing_status as InvoiceStatus) || 'pending',
      row.parsed_data,
      row.parsing_errors ? [row.parsing_errors] : null,
      null, // validationErrors - not stored
      row.created_at,
      'system', // uploadedBy - default
      row.created_at,
      row.updated_at
    );
  }

  /**
   * Map ParsedInvoiceEntity to Supabase row
   */
  private mapEntityToRow(entity: Partial<ParsedInvoiceEntity>): {
    id?: string;
    file_name?: string;
    original_file_name?: string;
    file_path?: string;
    file_size?: number;
    mime_type?: string;
    invoice_number?: string;
    invoice_date?: string;
    due_date?: string;
    amount?: number;
    currency?: string;
    supplier_id?: string;
    project_id?: string;
    tender_id?: string;
    invoice_type?: string;
    status?: string;
    extracted_data?: Record<string, unknown>;
    parsing_errors?: string;
    validation_errors?: string;
    processed_at?: string;
    uploaded_by?: string;
    created_at?: string;
    updated_at?: string;
  } {
    const row: {
      id?: string;
      file_name?: string;
      original_file_name?: string;
      file_path?: string;
      file_size?: number;
      mime_type?: string;
      invoice_number?: string;
      invoice_date?: string;
      due_date?: string;
      amount?: number;
      currency?: string;
      supplier_id?: string;
      project_id?: string;
      tender_id?: string;
      invoice_type?: string;
      status?: string;
      extracted_data?: Record<string, unknown>;
      parsing_errors?: string;
      validation_errors?: string;
      processed_at?: string;
      uploaded_by?: string;
      created_at?: string;
      updated_at?: string;
    } = {};

    if (entity.invoiceNumber !== undefined) row.invoice_number = entity.invoiceNumber;
    if (entity.invoiceDate !== undefined) row.invoice_date = entity.invoiceDate;
    if (entity.amount !== undefined) row.total_amount = entity.amount;
    if (entity.extractedData !== undefined) row.parsed_data = entity.extractedData;
    if (entity.parsingErrors !== undefined) row.parsing_errors = entity.parsingErrors?.join(', ') || null;
    if (entity.status !== undefined) row.parsing_status = entity.status;
    if (entity.tenderId !== undefined) row.tender_id = entity.tenderId;

    // Map supplier info
    if (entity.supplierId) {
      row.supplier_info = { supplier_id: entity.supplierId };
    }

    return row;
  }
}
