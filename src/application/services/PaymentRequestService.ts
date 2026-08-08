import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
/**
 * Payment Request Service
 * Implements business logic for payment request management
 * Following hexagonal architecture principles
 */

import { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import { Payment, PaymentStatus } from '@/domain/entities/Payment';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { PaymentTransformer } from '@/dtos/transforms/PaymentTransformer';
import { PaymentRequestDTO, CreatePaymentRequestDTO, UpdatePaymentRequestDTO } from '@/dtos/entities/PaymentDTO';

export class PaymentRequestService {
  constructor(private paymentRepository: IPaymentRepository) {}

  /**
   * Get all payment requests
   */
  async getAllPaymentRequests(): Promise<PaymentRequestDTO[]> {
    try {
      const payments = await this.paymentRepository.findAll();
      return payments.map(payment => PaymentTransformer.paymentToRequestDTO(payment));
    } catch (error) {
      console.error('PaymentRequestService.getAllPaymentRequests failed:', error);
      throw error;
    }
  }

  /**
   * Get payment requests by project
   */
  async getPaymentRequestsByProject(projectId: string): Promise<PaymentRequestDTO[]> {
    try {
      const payments = await this.paymentRepository.findByProjectId(projectId);
      return payments.map(payment => PaymentTransformer.paymentToRequestDTO(payment));
    } catch (error) {
      console.error('PaymentRequestService.getPaymentRequestsByProject failed:', error);
      throw error;
    }
  }

  /**
   * Get payment request by ID
   */
  async getPaymentRequestById(id: string): Promise<PaymentRequestDTO | null> {
    try {
      const payment = await this.paymentRepository.findById(id);
      return payment ? PaymentTransformer.paymentToRequestDTO(payment) : null;
    } catch (error) {
      console.error('PaymentRequestService.getPaymentRequestById failed:', error);
      throw error;
    }
  }

  /**
   * Create new payment request
   */
  async createPaymentRequest(data: CreatePaymentRequestDTO): Promise<PaymentRequestDTO> {
    try {
      const paymentEntity = PaymentTransformer.requestDTOToPayment({
        ...data,
        status: 'pending',
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      await this.paymentRepository.save(paymentEntity);
      const created = await this.paymentRepository.findById(paymentEntity.id);
      if (!created) throw new Error('Payment request not found after creation');
      return PaymentTransformer.paymentToRequestDTO(created);
    } catch (error) {
      console.error('PaymentRequestService.createPaymentRequest failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create payment request');
    }
  }

  /**
   * Update payment request
   */
  async updatePaymentRequest(id: string, data: UpdatePaymentRequestDTO): Promise<PaymentRequestDTO> {
    try {
      const updates = {
        ...data,
        status: this.mapStatus(data.status),
        updatedAt: new Date().toISOString()
      };
      
      await this.paymentRepository.update(id, updates);
      const updated = await this.paymentRepository.findById(id);
      if (!updated) throw new Error('Payment request not found after update');
      return PaymentTransformer.paymentToRequestDTO(updated);
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
  async getPaymentRequestsByStatus(status: string): Promise<PaymentRequestDTO[]> {
    try {
      const paymentStatus = this.mapStatus(status);
      const payments = await this.paymentRepository.findByStatus(paymentStatus);
      return payments.map(payment => PaymentTransformer.paymentToRequestDTO(payment));
    } catch (error) {
      console.error('PaymentRequestService.getPaymentRequestsByStatus failed:', error);
      throw error;
    }
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

  /**
   * Validate project requirements for payment request
   */
  async validateProjectRequirements(projectId: string): Promise<{
    hasValidGuarantee: boolean;
    hasValidInsurance: boolean;
    hasRecentInspection: boolean;
  }> {
    try {
      // Default validation - in a real implementation, this would check actual records
      return {
        hasValidGuarantee: true,
        hasValidInsurance: true,
        hasRecentInspection: true,
      };
    } catch (error) {
      console.error('PaymentRequestService.validateProjectRequirements failed:', error);
      return {
        hasValidGuarantee: false,
        hasValidInsurance: false,
        hasRecentInspection: false,
      };
    }
  }

  /**
   * Get payment requests by supplier
   */
  async getPaymentRequestsBySupplier(supplierId: string): Promise<PaymentRequestDTO[]> {
    try {
      // For now, use getAllPaymentRequests and filter
      const allRequests = await this.getAllPaymentRequests();
      return allRequests.filter(req => req.supplierId === supplierId);
    } catch (error) {
      console.error('PaymentRequestService.getPaymentRequestsBySupplier failed:', error);
      throw error;
    }
  }
}

let paymentRequestServiceInstance: PaymentRequestService | null = null;
export function getPaymentRequestService(): PaymentRequestService {
  if (!paymentRequestServiceInstance) {
    paymentRequestServiceInstance = new PaymentRequestService(RepositoryFactory.getPaymentRepository());
  }
  return paymentRequestServiceInstance;
}
