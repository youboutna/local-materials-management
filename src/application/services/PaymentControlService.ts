/**
 * Payment Control Service - Hexagonal Architecture
 * 
 * Business use cases for payment control and blocking functionality
 */

import { 
  PaymentControlDashboardDTO, 
  PaymentControlSummaryDTO, 
  PaymentBlockingInterfaceDTO 
} from '@/dtos/entities/MonitoringDTOs';
import { PaymentDTO } from '@/dtos/entities/PaymentDTO';
import { NotificationDTO } from '@/dtos/entities/NotificationDTO';
import { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import { INotificationRepository } from '@/domain/repositories/INotificationRepository';
import { PaymentTransformer } from '@/dtos/transforms/PaymentTransformer';

// =================== ERROR CLASSES ===================

export class PaymentControlServiceError extends Error {
  constructor(
    message: string,
    public code: string = 'PAYMENT_CONTROL_ERROR',
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PaymentControlServiceError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// =================== PAYMENT CONTROL SERVICE ===================

export class PaymentControlService {
  constructor(
    private paymentRepository: IPaymentRepository,
    private notificationRepository: INotificationRepository
  ) {}

  // =================== DASHBOARD OPERATIONS ===================

  async getPaymentControlDashboard(userId: string, period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<PaymentControlDashboardDTO> {
    try {
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const { startDate, endDate } = this.getDateRangeForPeriod(period);

      // Use findBetweenDates which exists on IPaymentRepository
      const paymentEntities = await this.paymentRepository.findBetweenDates(startDate, endDate);
      const payments = paymentEntities.map(p => PaymentTransformer.toDTO(p));

      const totalPayments = payments.length;
      const pendingApprovals = payments.filter(p => p.status === 'pending').length;

      const currency = 'EUR';

      const paymentSummaries = payments.map(payment => this.createPaymentSummary(payment));

      const dashboard: PaymentControlDashboardDTO = {
        id: crypto.randomUUID(),
        totalPayments,
        blockedPayments: 0,
        pendingApprovals,
        overduePayments: 0,
        currency,
        period,
        payments: paymentSummaries,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return dashboard;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof PaymentControlServiceError) {
        throw error;
      }
      throw new PaymentControlServiceError(
        `Failed to get payment control dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_DASHBOARD_FAILED'
      );
    }
  }

  async blockPayment(
    paymentId: string, 
    reason: string, 
    blockedBy: string,
    autoRelease: boolean = false,
    releaseConditions: string[] = []
  ): Promise<PaymentBlockingInterfaceDTO> {
    try {
      if (!paymentId || !reason || !blockedBy) {
        throw new ValidationError('Payment ID, reason, and blocked by are required');
      }

      const payment = await this.paymentRepository.findById(paymentId);
      if (!payment) {
        throw new PaymentControlServiceError('Payment not found', 'PAYMENT_NOT_FOUND');
      }

      if (payment.status === 'completed') {
        throw new PaymentControlServiceError('Cannot block a completed payment', 'CANNOT_BLOCK_COMPLETED');
      }

      // Update payment status to pending (closest available status)
      await this.paymentRepository.update(paymentId, {
        status: 'pending' as any
      });

      const blockingInterface: PaymentBlockingInterfaceDTO = {
        id: crypto.randomUUID(),
        paymentId,
        blockingReason: reason,
        blockedBy,
        blockedAt: new Date().toISOString(),
        autoRelease,
        releaseConditions,
        notifications: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return blockingInterface;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof PaymentControlServiceError) {
        throw error;
      }
      throw new PaymentControlServiceError(
        `Failed to block payment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'BLOCK_PAYMENT_FAILED'
      );
    }
  }

  async unblockPayment(
    paymentId: string, 
    unblockedBy: string, 
    reason?: string
  ): Promise<PaymentDTO> {
    try {
      if (!paymentId || !unblockedBy) {
        throw new ValidationError('Payment ID and unblocked by are required');
      }

      const payment = await this.paymentRepository.findById(paymentId);
      if (!payment) {
        throw new PaymentControlServiceError('Payment not found', 'PAYMENT_NOT_FOUND');
      }

      await this.paymentRepository.update(paymentId, {
        status: 'pending' as any
      });

      // Re-fetch the updated payment
      const updatedPayment = await this.paymentRepository.findById(paymentId);
      return PaymentTransformer.toDTO(updatedPayment || payment);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof PaymentControlServiceError) {
        throw error;
      }
      throw new PaymentControlServiceError(
        `Failed to unblock payment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UNBLOCK_PAYMENT_FAILED'
      );
    }
  }

  async approvePayment(
    paymentId: string, 
    approvedBy: string, 
    notes?: string
  ): Promise<PaymentDTO> {
    try {
      if (!paymentId || !approvedBy) {
        throw new ValidationError('Payment ID and approved by are required');
      }

      const payment = await this.paymentRepository.findById(paymentId);
      if (!payment) {
        throw new PaymentControlServiceError('Payment not found', 'PAYMENT_NOT_FOUND');
      }

      if (payment.status === 'completed') {
        throw new PaymentControlServiceError('Payment is already completed', 'PAYMENT_ALREADY_COMPLETED');
      }

      await this.paymentRepository.update(paymentId, {
        status: 'approved' as any
      });

      const updatedPayment = await this.paymentRepository.findById(paymentId);
      return PaymentTransformer.toDTO(updatedPayment || payment);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof PaymentControlServiceError) {
        throw error;
      }
      throw new PaymentControlServiceError(
        `Failed to approve payment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'APPROVE_PAYMENT_FAILED'
      );
    }
  }

  async rejectPayment(
    paymentId: string, 
    rejectedBy: string, 
    reason: string
  ): Promise<PaymentDTO> {
    try {
      if (!paymentId || !rejectedBy || !reason) {
        throw new ValidationError('Payment ID, rejected by, and reason are required');
      }

      const payment = await this.paymentRepository.findById(paymentId);
      if (!payment) {
        throw new PaymentControlServiceError('Payment not found', 'PAYMENT_NOT_FOUND');
      }

      if (payment.status === 'completed') {
        throw new PaymentControlServiceError('Cannot reject a completed payment', 'CANNOT_REJECT_COMPLETED');
      }

      await this.paymentRepository.update(paymentId, {
        status: 'rejected' as any
      });

      const updatedPayment = await this.paymentRepository.findById(paymentId);
      return PaymentTransformer.toDTO(updatedPayment || payment);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof PaymentControlServiceError) {
        throw error;
      }
      throw new PaymentControlServiceError(
        `Failed to reject payment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'REJECT_PAYMENT_FAILED'
      );
    }
  }

  // =================== PRIVATE HELPER METHODS ===================

  private getDateRangeForPeriod(period: 'week' | 'month' | 'quarter' | 'year'): { startDate: string; endDate: string } {
    const now = new Date();
    const endDate = now.toISOString();
    
    let startDate: Date;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    return {
      startDate: startDate.toISOString(),
      endDate
    };
  }

  private createPaymentSummary(payment: PaymentDTO): PaymentControlSummaryDTO {
    return {
      id: payment.id,
      projectId: payment.projectId,
      projectName: `Project ${payment.projectId}`,
      amount: payment.amount,
      currency: 'EUR',
      status: (payment.status || 'pending') as 'pending' | 'approved' | 'blocked' | 'overdue',
      dueDate: payment.paymentDate || '',
      supplier: payment.contractorName || 'Unknown',
      priority: payment.amount > 50000 ? 'high' : payment.amount > 10000 ? 'medium' : 'low'
    };
  }
}
