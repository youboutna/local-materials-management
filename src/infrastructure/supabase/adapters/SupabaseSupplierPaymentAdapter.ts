// @ts-nocheck
/**
 * Supabase Adapter for Supplier Payment Repository
 * Implements ISupplierPaymentRepository interface using Supabase client
 * Following hexagonal architecture principles
 */

import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { ISupplierPaymentRepository } from '@/domain/repositories/ISupplierPaymentRepository';
import { SupplierPaymentRequestDTO } from '@/dtos/entities/SupplierPaymentDTO';
import { AppError, ErrorCode } from '@/utils/errorHandling';

// Database row type matching the table structure
interface SupplierPaymentRequestRow {
  id: string;
  inspection_id: string;
  supplier_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  requested_date: string;
  processed_date?: string;
  comments?: string;
  documents: string[];
  payment_type: string;
  bank_account?: string;
  invoice_number?: string;
  invoice_date?: string;
  work_description?: string;
  work_location?: string;
  work_period?: string;
  validated_by?: string;
  validated_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export class SupabaseSupplierPaymentAdapter implements ISupplierPaymentRepository {
  /**
   * Map database row to DTO
   */
  private mapToDTO(row: SupplierPaymentRequestRow): SupplierPaymentRequestDTO {
    return {
      id: row.id,
      inspectionId: row.inspection_id,
      supplierId: row.supplier_id,
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      requestedAt: row.requested_date,
      processedAt: row.processed_date,
      comments: row.comments,
      documents: row.documents || [],
      paymentType: row.payment_type,
      bankAccount: row.bank_account,
      invoiceNumber: row.invoice_number,
      invoiceDate: row.invoice_date,
      workDescription: row.work_description,
      workLocation: row.work_location,
      workPeriod: row.work_period,
      validatedBy: row.validated_by,
      validatedAt: row.validated_at,
      rejectionReason: row.rejection_reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Map DTO to database row format
   */
  private mapToRow(dto: Partial<SupplierPaymentRequestDTO>): Partial<SupplierPaymentRequestRow> {
    const row: Partial<SupplierPaymentRequestRow> = {};
    
    if (dto.inspectionId !== undefined) row.inspection_id = dto.inspectionId;
    if (dto.supplierId !== undefined) row.supplier_id = dto.supplierId;
    if (dto.amount !== undefined) row.amount = dto.amount;
    if (dto.currency !== undefined) row.currency = dto.currency;
    if (dto.status !== undefined) row.status = dto.status;
    if (dto.requestedAt !== undefined) row.requested_date = dto.requestedAt;
    if (dto.processedAt !== undefined) row.processed_date = dto.processedAt;
    if (dto.comments !== undefined) row.comments = dto.comments;
    if (dto.documents !== undefined) row.documents = dto.documents;
    if (dto.paymentType !== undefined) row.payment_type = dto.paymentType;
    if (dto.bankAccount !== undefined) row.bank_account = dto.bankAccount;
    if (dto.invoiceNumber !== undefined) row.invoice_number = dto.invoiceNumber;
    if (dto.invoiceDate !== undefined) row.invoice_date = dto.invoiceDate;
    if (dto.workDescription !== undefined) row.work_description = dto.workDescription;
    if (dto.workLocation !== undefined) row.work_location = dto.workLocation;
    if (dto.workPeriod !== undefined) row.work_period = dto.workPeriod;
    if (dto.validatedBy !== undefined) row.validated_by = dto.validatedBy;
    if (dto.validatedAt !== undefined) row.validated_at = dto.validatedAt;
    if (dto.rejectionReason !== undefined) row.rejection_reason = dto.rejectionReason;
    
    return row;
  }

  /**
   * Find payment request by inspection ID
   */
  async findByInspectionId(inspectionId: string): Promise<SupplierPaymentRequestDTO | null> {
    try {
      const { data, error } = await supabase
        .from('supplier_payment_requests')
        .select('*')
        .eq('inspection_id', inspectionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('SupabaseSupplierPaymentAdapter.findByInspectionId error:', error);
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to find payment request: ${error.message}`);
      }

      return data ? this.mapToDTO(data as SupplierPaymentRequestRow) : null;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('SupabaseSupplierPaymentAdapter.findByInspectionId failed:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to find payment request by inspection ID');
    }
  }

  /**
   * Create a new payment request
   */
  async create(data: Omit<SupplierPaymentRequestDTO, 'id' | 'createdAt' | 'updatedAt' | 'requestedAt' | 'processedAt'>): Promise<SupplierPaymentRequestDTO> {
    try {
      const rowData = {
        inspection_id: data.inspectionId,
        supplier_id: data.supplierId,
        amount: data.amount,
        currency: data.currency || 'MRU',
        status: data.status || 'pending',
        payment_type: data.paymentType,
        documents: data.documents || [],
        bank_account: data.bankAccount,
        invoice_number: data.invoiceNumber,
        invoice_date: data.invoiceDate,
        work_description: data.workDescription,
        work_location: data.workLocation,
        work_period: data.workPeriod,
        comments: data.comments,
        requested_date: new Date().toISOString()
      };

      const { data: result, error } = await supabase
        .from('supplier_payment_requests')
        .insert(rowData)
        .select()
        .single();

      if (error) {
        console.error('SupabaseSupplierPaymentAdapter.create error:', error);
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to create payment request: ${error.message}`);
      }

      return this.mapToDTO(result as SupplierPaymentRequestRow);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('SupabaseSupplierPaymentAdapter.create failed:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to create payment request');
    }
  }

  /**
   * Update payment request status
   */
  async updateStatus(id: string, status: string, comments?: string): Promise<SupplierPaymentRequestDTO> {
    try {
      const updateData: Record<string, unknown> = { 
        status,
        updated_at: new Date().toISOString()
      };
      
      if (comments) {
        updateData.comments = comments;
      }

      // Set processed date for terminal statuses
      if (['approved', 'rejected', 'paid'].includes(status)) {
        updateData.processed_date = new Date().toISOString();
      }

      // Set validated_at for approval/rejection
      if (['approved', 'rejected'].includes(status)) {
        updateData.validated_at = new Date().toISOString();
      }

      // Store rejection reason
      if (status === 'rejected' && comments) {
        updateData.rejection_reason = comments;
      }

      const { data, error } = await supabase
        .from('supplier_payment_requests')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('SupabaseSupplierPaymentAdapter.updateStatus error:', error);
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to update payment request status: ${error.message}`);
      }

      return this.mapToDTO(data as SupplierPaymentRequestRow);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('SupabaseSupplierPaymentAdapter.updateStatus failed:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to update payment request status');
    }
  }

  /**
   * Find payment request by ID
   */
  async findById(id: string): Promise<SupplierPaymentRequestDTO | null> {
    try {
      const { data, error } = await supabase
        .from('supplier_payment_requests')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('SupabaseSupplierPaymentAdapter.findById error:', error);
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to find payment request: ${error.message}`);
      }

      return data ? this.mapToDTO(data as SupplierPaymentRequestRow) : null;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('SupabaseSupplierPaymentAdapter.findById failed:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to find payment request by ID');
    }
  }

  /**
   * Find all payment requests for a supplier
   */
  async findBySupplierId(supplierId: string): Promise<SupplierPaymentRequestDTO[]> {
    try {
      const { data, error } = await supabase
        .from('supplier_payment_requests')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('SupabaseSupplierPaymentAdapter.findBySupplierId error:', error);
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to find payment requests: ${error.message}`);
      }

      return (data || []).map(row => this.mapToDTO(row as SupplierPaymentRequestRow));
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('SupabaseSupplierPaymentAdapter.findBySupplierId failed:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to find payment requests by supplier ID');
    }
  }

  /**
   * Find all pending payment requests
   */
  async findPending(): Promise<SupplierPaymentRequestDTO[]> {
    try {
      const { data, error } = await supabase
        .from('supplier_payment_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('SupabaseSupplierPaymentAdapter.findPending error:', error);
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to find pending payment requests: ${error.message}`);
      }

      return (data || []).map(row => this.mapToDTO(row as SupplierPaymentRequestRow));
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('SupabaseSupplierPaymentAdapter.findPending failed:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to find pending payment requests');
    }
  }

  /**
   * Find payment requests by project ID
   */
  async findByProjectId(projectId: string): Promise<SupplierPaymentRequestDTO[]> {
    try {
      // Get inspections for the project first
      const { data: inspections, error: inspError } = await supabase
        .from('inspections')
        .select('id')
        .eq('project_id', projectId);

      if (inspError) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to get project inspections: ${inspError.message}`);
      }

      const inspectionIds = inspections?.map(i => i.id) || [];
      if (inspectionIds.length === 0) return [];

      const { data, error } = await supabase
        .from('supplier_payment_requests')
        .select('*')
        .in('inspection_id', inspectionIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('SupabaseSupplierPaymentAdapter.findByProjectId error:', error);
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to find payment requests: ${error.message}`);
      }

      return (data || []).map(row => this.mapToDTO(row as SupplierPaymentRequestRow));
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('SupabaseSupplierPaymentAdapter.findByProjectId failed:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to find payment requests by project ID');
    }
  }
}
