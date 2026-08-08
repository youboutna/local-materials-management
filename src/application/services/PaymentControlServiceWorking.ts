/**
 * Payment Control Service - Hexagonal Architecture (Working Version)
 * 
 * Business use cases for payment control and blocking functionality
 * Simplified version that works with existing DTOs and repositories
 */

import { PaymentControlSummaryDTO } from '@/dtos/entities/PaymentDTO';;
import { PaymentDTO } from '@/dtos/entities/PaymentDTO';
import { NotificationDTO } from '@/dtos/entities/NotificationDTO';
import { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import { INotificationRepository } from '@/domain/repositories/INotificationRepository';

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
      // Validate input
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      // Get date range for the period
      const { startDate, endDate } = this.getDateRangeForPeriod(period);

      // Fetch payments for the period (using existing repository method)
      const payments = await this.getPaymentsByDateRange(startDate, endDate, userId);

      // Calculate dashboard metrics
      const totalPayments = payments.length;
      const blockedPayments = payments.filter(p => this.isPaymentBlocked(p)).length;
      const pendingApprovals = payments.filter(p => p.status === 'pending').length;
      const overduePayments = payments.filter(p => this.isOverdue(p)).length;

      // Get currency (default to EUR)
      const currency = 'EUR';

      // Create payment summaries
      const paymentSummaries = await Promise.all(
        payments.map(payment => this.createPaymentSummary(payment))
      );

      // Create dashboard DTO
      const dashboard: PaymentControlDashboardDTO = {
        id: crypto.randomUUID(),
        totalPayments,
        blockedPayments,
        pendingApprovals,
        overduePayments,
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
      // Validate input
      if (!paymentId || !reason || !blockedBy) {
        throw new ValidationError('Payment ID, reason, and blocked by are required');
      }

      // Get payment
      const payment = await this.paymentRepository.findById(paymentId);
      if (!payment) {
        throw new PaymentControlServiceError('Payment not found', 'PAYMENT_NOT_FOUND');
      }

      // Check if payment can be blocked
      if (this.isPaymentBlocked(payment as any)) {
        throw new PaymentControlServiceError('Payment is already blocked', 'PAYMENT_ALREADY_BLOCKED');
      }

      if ((payment as any).status === 'completed') {
        throw new PaymentControlServiceError('Cannot block a completed payment', 'CANNOT_BLOCK_COMPLETED');
      }

      // Create blocking interface record (we'll store this separately since PaymentDTO doesn't support blocked status)
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

      // Send notifications
      const notifications = await this.sendBlockingNotifications(payment as any, reason, blockedBy);
      blockingInterface.notifications = notifications;

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

  async approvePayment(
    paymentId: string, 
    approvedBy: string, 
    notes?: string
  ): Promise<PaymentDTO> {
    try {
      // Validate input
      if (!paymentId || !approvedBy) {
        throw new ValidationError('Payment ID and approved by are required');
      }

      // Get payment
      const payment = await this.paymentRepository.findById(paymentId);
      if (!payment) {
        throw new PaymentControlServiceError('Payment not found', 'PAYMENT_NOT_FOUND');
      }

      // Check if payment can be approved
      if (payment.status === 'completed') {
        throw new PaymentControlServiceError('Payment is already completed', 'PAYMENT_ALREADY_COMPLETED');
      }

      // Update payment status to approved
      await this.paymentRepository.update(paymentId, {
        status: 'approved' as any,
        paymentDate: new Date().toISOString()
      } as any);

      // Send approval notifications
      await this.sendApprovalNotifications(payment as any, approvedBy, notes);

      // Refetch updated payment
      const updatedPayment = await this.paymentRepository.findById(paymentId);
      return {
        id: paymentId,
        projectId: (updatedPayment as any)?.projectId || '',
        contractorId: (updatedPayment as any)?.contractorId || '',
        ...(updatedPayment || {})
      } as PaymentDTO;
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

  // =================== PRIVATE HELPER METHODS ===================

  private getDateRangeForPeriod(period: 'week' | 'month' | 'quarter' | 'year'): { startDate: string; endDate: string } {
    const now = new Date();
    const endDate = now.toISOString();
    
    let startDate: Date;
    
    switch (period) {
      case 'week': {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      }
      case 'month': {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      }
      case 'quarter': {
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      }
      case 'year': {
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      }
      default: {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    }
    
    return {
      startDate: startDate.toISOString(),
      endDate
    };
  }

  private async getPaymentsByDateRange(startDate: string, endDate: string, userId: string): Promise<PaymentDTO[]> {
    // This would use the actual repository method
    // For now, return empty array as placeholder
    return [];
  }

  private isOverdue(payment: PaymentDTO): boolean {
    if (!payment.paymentDate) return false;
    return new Date(payment.paymentDate) < new Date() && payment.status !== 'completed';
  }

  private isPaymentBlocked(payment: PaymentDTO): boolean {
    // This would check against a separate blocking records table
    // For now, return false as placeholder
    return false;
  }

  private async createPaymentSummary(payment: PaymentDTO): Promise<PaymentControlSummaryDTO> {
    return {
      id: payment.id,
      projectId: payment.projectId,
      projectName: `Project ${payment.projectId}`, // Placeholder
      amount: payment.amount,
      currency: 'EUR', // Default currency
      status: this.getPaymentControlStatus(payment),
      dueDate: payment.paymentDate,
      blockedReason: undefined,
      supplier: payment.contractorName,
      priority: this.calculatePaymentPriority(payment)
    };
  }

  private getPaymentControlStatus(payment: PaymentDTO): 'pending' | 'approved' | 'blocked' | 'overdue' {
    if (this.isPaymentBlocked(payment)) return 'blocked';
    if (this.isOverdue(payment)) return 'overdue';
    if (payment.status === 'approved') return 'approved';
    return 'pending';
  }

  private calculatePaymentPriority(payment: PaymentDTO): 'low' | 'medium' | 'high' {
    // Calculate priority based on amount and status
    if (payment.amount > 50000) return 'high';
    if (payment.amount > 10000) return 'medium';
    return 'low';
  }

  private async sendBlockingNotifications(payment: PaymentDTO, reason: string, blockedBy: string): Promise<NotificationDTO[]> {
    const notifications: NotificationDTO[] = [];
    
    // Create notification for contractor
    const contractorNotification: NotificationDTO = {
      id: crypto.randomUUID(),
      recipient_id: payment.contractorId,
      title: 'Payment Blocked',
      message: `Your payment of ${payment.amount} EUR has been blocked. Reason: ${reason}`,
      type: 'error',
      read: false,
      created_at: new Date().toISOString(),
      priority: 'high'
    };
    
    // Store notification (using a simple approach)
    notifications.push(contractorNotification);
    
    return notifications;
  }

  private async sendApprovalNotifications(payment: PaymentDTO, approvedBy: string, notes?: string): Promise<void> {
    // Create notification for contractor
    const notification: NotificationDTO = {
      id: crypto.randomUUID(),
      recipient_id: payment.contractorId,
      title: 'Payment Approved',
      message: `Your payment of ${payment.amount} EUR has been approved${notes ? `. Notes: ${notes}` : ''}`,
      type: 'success',
      read: false,
      created_at: new Date().toISOString(),
      priority: 'medium'
    };
    
    // Store notification (using a simple approach)
    console.log('Notification created:', notification);
  }
}
