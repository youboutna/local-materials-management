/**
 * Supplier Payment Repository Implementation
 * Using Supabase as data source
 * Following hexagonal architecture principles
 */

import { supabase } from '@/integrations/supabase/client';
import { ISupplierPaymentRepository } from '@/domain/repositories/ISupplierPaymentRepository';
import { SupplierPaymentRequestDTO } from '@/dtos/entities/SupplierPaymentDTO';

export class SupplierPaymentRepository implements ISupplierPaymentRepository {
  /**
   * Find payment request by inspection ID
   */
  async findByInspectionId(inspectionId: string): Promise<SupplierPaymentRequestDTO | null> {
    try {
      const { data, error } = await supabase
        .from('supplier_payment_requests')
        .select('*')
        .eq('inspection_id', inspectionId)
        .eq('status', 'pending')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw error;
      }

      return this.mapToDTO(data);
    } catch (error) {
      console.error('Error finding payment request by inspection ID:', error);
      throw error;
    }
  }

  /**
   * Create a new payment request
   */
  async create(data: Omit<SupplierPaymentRequestDTO, 'id' | 'createdAt' | 'updatedAt' | 'requestedAt' | 'processedAt'>): Promise<SupplierPaymentRequestDTO> {
    try {
      const now = new Date().toISOString();
      const paymentData = {
        inspection_id: data.inspectionId,
        supplier_id: data.supplierId,
        amount: data.amount,
        currency: data.currency || 'XOF',
        status: data.status,
        comments: data.comments,
        documents: data.documents || [],
        payment_type: data.paymentType,
        bank_account: data.bankAccount,
        invoice_number: data.invoiceNumber,
        invoice_date: data.invoiceDate,
        work_description: data.workDescription,
        work_location: data.workLocation,
        work_period: data.workPeriod,
        description: data.workDescription || `Payment request for inspection ${data.inspectionId}`,
        payment_reason: data.paymentType,
        requested_at: now,
        created_at: now,
        updated_at: now,
      };

      const { data: result, error } = await supabase
        .from('supplier_payment_requests')
        .insert(paymentData)
        .select()
        .single();

      if (error) throw error;
      return this.mapToDTO(result);
    } catch (error) {
      console.error('Error creating payment request:', error);
      throw error;
    }
  }

  /**
   * Update payment request status
   */
  async updateStatus(id: string, status: string, comments?: string): Promise<SupplierPaymentRequestDTO> {
    try {
      const updateData: Record<string, any> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (comments) {
        updateData.comments = comments;
      }

      if (status === 'approved' || status === 'rejected') {
        updateData.processed_at = new Date().toISOString();
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = 'current_user'; // TODO: Get from auth context
      }

      const { data: result, error } = await supabase
        .from('supplier_payment_requests')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return this.mapToDTO(result);
    } catch (error) {
      console.error('Error updating payment request status:', error);
      throw error;
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
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return this.mapToDTO(data);
    } catch (error) {
      console.error('Error finding payment request by ID:', error);
      throw error;
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
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data.map(item => this.mapToDTO(item));
    } catch (error) {
      console.error('Error finding payment requests by supplier ID:', error);
      throw error;
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
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data.map(item => this.mapToDTO(item));
    } catch (error) {
      console.error('Error finding pending payment requests:', error);
      throw error;
    }
  }

  /**
   * Map database record to DTO
   */
  private mapToDTO(record: Record<string, unknown>): SupplierPaymentRequestDTO {
    return {
      id: record.id as string,
      inspectionId: record.inspection_id as string,
      supplierId: record.supplier_id as string,
      amount: record.amount as number,
      currency: (record.currency as string) || 'XOF',
      status: record.status as 'pending' | 'approved' | 'rejected' | 'paid',
      requestedAt: (record.requested_at as string) || (record.created_at as string),
      processedAt: record.processed_at as string,
      comments: record.comments as string,
      documents: (record.documents as string[]) || [],
      paymentType: record.payment_type as string,
      bankAccount: record.bank_account as string,
      invoiceNumber: record.invoice_number as string,
      invoiceDate: record.invoice_date as string,
      workDescription: record.work_description as string,
      workLocation: record.work_location as string,
      workPeriod: record.work_period as string,
      validatedBy: record.validated_by as string,
      validatedAt: record.validated_at as string,
      rejectionReason: record.rejection_reason as string,
      createdAt: record.created_at as string,
      updatedAt: record.updated_at as string,
    };
  }
}
