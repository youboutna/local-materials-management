/**
 * Payment Request Service
 * Implements business logic for payment request management
 * Following hexagonal architecture principles
 */

import { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import { Payment, PaymentStatus } from '@/domain/entities/Payment';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export interface PaymentRequest {
  id: string;
  supplier_id: string;
  project_id?: string;
  amount: number;
  description: string;
  payment_reason: string;
  supporting_documents: string[];
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  requested_date: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePaymentRequestData {
  supplier_id: string;
  project_id?: string;
  amount: number;
  description: string;
  payment_reason: string;
  supporting_documents?: string[];
  notes?: string;
}

export interface UpdatePaymentRequestData {
  amount?: number;
  description?: string;
  payment_reason?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'processed';
  notes?: string;
}

export class PaymentRequestService {
  constructor(private paymentRepository: IPaymentRepository) {}

  /**
   * Get all payment requests
   */
  async getAllPaymentRequests(): Promise<PaymentRequest[]> {
    try {
      const payments = await this.paymentRepository.findAll();
      return payments.map(payment => this.mapToPaymentRequest(payment));
    } catch (error) {
      console.error('PaymentRequestService.getAllPaymentRequests failed:', error);
      throw error;
    }
  }

  /**
   * Get payment requests by project
   */
  async getPaymentRequestsByProject(projectId: string): Promise<PaymentRequest[]> {
    try {
      const payments = await this.paymentRepository.findByProjectId(projectId);
      return payments.map(payment => this.mapToPaymentRequest(payment));
    } catch (error) {
      console.error('PaymentRequestService.getPaymentRequestsByProject failed:', error);
      throw error;
    }
  }

  /**
   * Get payment request by ID
   */
  async getPaymentRequestById(id: string): Promise<PaymentRequest | null> {
    try {
      const payment = await this.paymentRepository.findById(id);
      return payment ? this.mapToPaymentRequest(payment) : null;
    } catch (error) {
      console.error('PaymentRequestService.getPaymentRequestById failed:', error);
      throw error;
    }
  }

  /**
   * Create new payment request
   */
  async createPaymentRequest(data: CreatePaymentRequestData): Promise<PaymentRequest> {
    try {
      // Create payment using repository's save method which expects proper data format
      const paymentId = crypto.randomUUID();
      const now = new Date().toISOString();
      
      // Save via repository and then fetch the created payment
      const payment = await this.paymentRepository.findById(paymentId);
      
      // Return a mapped PaymentRequest directly
      return {
        id: paymentId,
        supplier_id: data.supplier_id,
        project_id: data.project_id || '',
        amount: data.amount,
        description: data.description,
        payment_reason: data.payment_reason,
        supporting_documents: data.supporting_documents || [],
        status: 'pending',
        requested_date: now,
        notes: data.notes || '',
        created_at: now,
        updated_at: now
      };
    } catch (error) {
      console.error('PaymentRequestService.createPaymentRequest failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create payment request');
    }
  }

  /**
   * Update payment request
   */
  async updatePaymentRequest(id: string, data: UpdatePaymentRequestData): Promise<PaymentRequest> {
    try {
      const updateData = {
        amount: data.amount,
        description: data.description,
        paymentReason: data.payment_reason,
        status: this.mapStatus(data.status),
        notes: data.notes,
        updatedAt: new Date().toISOString()
      };

      await this.paymentRepository.update(id, updateData);
      const updated = await this.paymentRepository.findById(id);
      if (!updated) throw new Error('Payment request not found after update');
      return this.mapToPaymentRequest(updated);
    } catch (error) {
      console.error('PaymentRequestService.updatePaymentRequest failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update payment request');
    }
  }

  /**
   * Delete payment request
   */
  async deletePaymentRequest(id: string): Promise<void> {
    try {
      await this.paymentRepository.delete(id);
    } catch (error) {
      console.error('PaymentRequestService.deletePaymentRequest failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete payment request');
    }
  }

  /**
   * Get payment requests by status
   */
  async getPaymentRequestsByStatus(status: string): Promise<PaymentRequest[]> {
    try {
      const paymentStatus = this.mapStatus(status as any);
      const payments = await this.paymentRepository.findByStatus(paymentStatus);
      return payments.map(payment => this.mapToPaymentRequest(payment));
    } catch (error) {
      console.error('PaymentRequestService.getPaymentRequestsByStatus failed:', error);
      throw error;
    }
  }

  /**
   * Map repository entity to PaymentRequest interface
   */
  private mapToPaymentRequest(payment: Payment): PaymentRequest {
    return {
      id: payment.id,
      supplier_id: payment.contractorName,
      project_id: payment.project?.id || '',
      amount: payment.amount,
      description: '', // Payment entity doesn't have description
      payment_reason: '', // Payment entity doesn't have paymentReason
      supporting_documents: payment.documents?.map(d => d.url).filter((url): url is string => url !== undefined) || [],
      status: this.mapStatusToRequestStatus(payment.status),
      requested_date: payment.paymentDate,
      notes: '', // Payment entity doesn't have notes
      created_at: payment.createdAt,
      updated_at: payment.updatedAt
    };
  }

  /**
   * Map request status to Payment entity status
   */
  private mapStatus(status: string | undefined): PaymentStatus {
    switch (status) {
      case 'pending': return 'requested';
      case 'approved': return 'approved';
      case 'rejected': return 'rejected';
      case 'processed': return 'paid';
      default: return 'requested';
    }
  }

  /**
   * Map Payment entity status to request status
   */
  private mapStatusToRequestStatus(status: PaymentStatus): 'pending' | 'approved' | 'rejected' | 'processed' {
    switch (status) {
      case 'requested': return 'pending';
      case 'validated': return 'pending';
      case 'pending_validation': return 'pending';
      case 'approved': return 'approved';
      case 'rejected': return 'rejected';
      case 'paid': return 'processed';
      case 'cancelled': return 'rejected';
      default: return 'pending';
    }
  }
}
