/**
 * Payment Service
 * Handles payment operations with hexagonal architecture
 * Following clean architecture principles
 */

import { Payment, PaymentStatus } from '@/domain/entities/Payment';
import { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import { PaymentDTO, CreatePaymentRequestDto, UpdatePaymentRequestDto } from '@/dtos/transforms/PaymentDomainTransformer';
import { PaymentDomainTransformer } from '@/dtos/transforms/PaymentDomainTransformer';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export class PaymentService {
  constructor(private paymentRepository: IPaymentRepository) {}

  /**
   * Get all payments
   */
  async getAllPayments(): Promise<PaymentDTO[]> {
    try {
      const payments = await this.paymentRepository.findAll();
      return payments.map(payment => PaymentDomainTransformer.toResponseDto(payment));
    } catch (error) {
      console.error('[PaymentService] Error fetching all payments:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch payments');
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(id: string): Promise<PaymentDTO | null> {
    try {
      const payment = await this.paymentRepository.findById(id);
      return payment ? PaymentDomainTransformer.toResponseDto(payment) : null;
    } catch (error) {
      console.error('[PaymentService] Error fetching payment:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch payment');
    }
  }

  /**
   * Create a new payment
   */
  async createPayment(data: CreatePaymentRequestDto): Promise<PaymentDTO> {
    try {
      // Transform DTO to Entity
      const paymentEntity = PaymentDomainTransformer.fromCreateDtoToEntity(data);
      
      // Save entity
      await this.paymentRepository.save(paymentEntity);
      
      // Transform back to DTO
      return PaymentDomainTransformer.toResponseDto(paymentEntity);
    } catch (error) {
      console.error('[PaymentService] Error creating payment:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create payment');
    }
  }

  /**
   * Update an existing payment
   */
  async updatePayment(id: string, data: UpdatePaymentRequestDto): Promise<void> {
    try {
      // Get existing payment
      const existingPayment = await this.paymentRepository.findById(id);
      if (!existingPayment) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Payment not found');
      }

      // Transform update data to partial entity
      const updateData = PaymentDomainTransformer.fromUpdateDtoToEntity(data);
      
      // Update entity
      await this.paymentRepository.update(id, updateData);
    } catch (error) {
      console.error('[PaymentService] Error updating payment:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update payment');
    }
  }

  /**
   * Delete a payment
   */
  async deletePayment(id: string): Promise<void> {
    try {
      const existingPayment = await this.paymentRepository.findById(id);
      if (!existingPayment) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Payment not found');
      }

      await this.paymentRepository.delete(id);
    } catch (error) {
      console.error('[PaymentService] Error deleting payment:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete payment');
    }
  }

  /**
   * Get payments by project
   */
  async getPaymentsByProject(projectId: string): Promise<PaymentDTO[]> {
    try {
      const payments = await this.paymentRepository.findByProjectId(projectId);
      return payments.map(payment => PaymentDomainTransformer.toResponseDto(payment));
    } catch (error) {
      console.error('[PaymentService] Error fetching project payments:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch project payments');
    }
  }

  /**
   * Get payments by status
   */
  async getPaymentsByStatus(status: string): Promise<PaymentDTO[]> {
    try {
      const payments = await this.paymentRepository.findByStatus(status as PaymentStatus);
      return payments.map(payment => PaymentDomainTransformer.toResponseDto(payment));
    } catch (error) {
      console.error('[PaymentService] Error fetching payments by status:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch payments by status');
    }
  }

  /**
   * Get payment summary for project
   */
  async getPaymentSummary(projectId: string): Promise<{
    total: number;
    paid: number;
    pending: number;
    rejected: number;
  }> {
    try {
      return await this.paymentRepository.getPaymentSummary(projectId);
    } catch (error) {
      console.error('[PaymentService] Error fetching payment summary:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch payment summary');
    }
  }
}
