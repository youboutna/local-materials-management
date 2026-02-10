/**
 * Payment Control Service - Hexagonal Architecture
 * 
 * Business use cases for payment control and blocking functionality
 * Following hexagonal architecture patterns with proper error handling
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
      // Validate input
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      // Get date range for the period
      const { startDate, endDate } = this.getDateRangeForPeriod(period);

      // Fetch payments for the period
      const payments = await this.paymentRepository.findByDateRange(startDate, endDate, userId);

      // Calculate dashboard metrics
      const totalPayments = payments.length;
      const blockedPayments = payments.filter(p => p.status === 'blocked').length;
      const pendingApprovals = payments.filter(p => p.status === 'pending').length;
      const overduePayments = payments.filter(p => this.isOverdue(p)).length;

      // Get currency (assume first payment's currency or default)
      const currency = payments[0]?.currency || 'EUR';

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
      if (payment.status === 'blocked') {
        throw new PaymentControlServiceError('Payment is already blocked', 'PAYMENT_ALREADY_BLOCKED');
      }

      if (payment.status === 'paid') {
        throw new PaymentControlServiceError('Cannot block a paid payment', 'CANNOT_BLOCK_PAID');
      }

      // Update payment status
      await this.paymentRepository.update(paymentId, {
        status: 'blocked' as any, // Temporary fix until PaymentDTO supports blocked status
        blockedReason: reason,
        blockedBy,
        blockedAt: new Date().toISOString()
      } as any);

      // Create blocking interface record
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
      const notifications = await this.sendBlockingNotifications(updatedPayment, reason, blockedBy);
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

  async unblockPayment(
    paymentId: string, 
    unblockedBy: string, 
    reason?: string
  ): Promise<PaymentDTO> {
    try {
      // Validate input
      if (!paymentId || !unblockedBy) {
        throw new ValidationError('Payment ID and unblocked by are required');
      }

      // Get payment
      const payment = await this.paymentRepository.findById(paymentId);
      if (!payment) {
        throw new PaymentControlServiceError('Payment not found', 'PAYMENT_NOT_FOUND');
      }

      // Check if payment is blocked
      if (payment.status !== 'blocked') {
        throw new PaymentControlServiceError('Payment is not blocked', 'PAYMENT_NOT_BLOCKED');
      }

      // Update payment status
      const updatedPayment = await this.paymentRepository.update(paymentId, {
        status: 'pending',
        unblockedBy,
        unblockedAt: new Date().toISOString(),
        unblockReason: reason
      });

      // Send unblocking notifications
      await this.sendUnblockingNotifications(updatedPayment, unblockedBy, reason);

      return PaymentTransformer.toDTO(updatedPayment);
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
      if (payment.status === 'paid') {
        throw new PaymentControlServiceError('Payment is already paid', 'PAYMENT_ALREADY_PAID');
      }

      if (payment.status === 'blocked') {
        throw new PaymentControlServiceError('Cannot approve a blocked payment', 'CANNOT_APPROVE_BLOCKED');
      }

      // Update payment status
      const updatedPayment = await this.paymentRepository.update(paymentId, {
        status: 'approved',
        approvedBy,
        approvedAt: new Date().toISOString(),
        approvalNotes: notes
      });

      // Send approval notifications
      await this.sendApprovalNotifications(updatedPayment, approvedBy, notes);

      return PaymentTransformer.toDTO(updatedPayment);
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
      // Validate input
      if (!paymentId || !rejectedBy || !reason) {
        throw new ValidationError('Payment ID, rejected by, and reason are required');
      }

      // Get payment
      const payment = await this.paymentRepository.findById(paymentId);
      if (!payment) {
        throw new PaymentControlServiceError('Payment not found', 'PAYMENT_NOT_FOUND');
      }

      // Check if payment can be rejected
      if (payment.status === 'paid') {
        throw new PaymentControlServiceError('Cannot reject a paid payment', 'CANNOT_REJECT_PAID');
      }

      // Update payment status
      const updatedPayment = await this.paymentRepository.update(paymentId, {
        status: 'rejected',
        rejectedBy,
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason
      });

      // Send rejection notifications
      await this.sendRejectionNotifications(updatedPayment, rejectedBy, reason);

      return PaymentTransformer.toDTO(updatedPayment);
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

  private isOverdue(payment: PaymentDTO): boolean {
    if (!payment.dueDate) return false;
    return new Date(payment.dueDate) < new Date() && payment.status !== 'paid';
  }

  private async createPaymentSummary(payment: PaymentDTO): Promise<PaymentControlSummaryDTO> {
    // Get project details (would need project repository)
    const projectName = `Project ${payment.projectId}`; // Placeholder
    
    return {
      id: payment.id,
      projectId: payment.projectId,
      projectName,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status as 'pending' | 'approved' | 'blocked' | 'overdue',
      dueDate: payment.dueDate || '',
      blockedReason: payment.blockedReason,
      supplier: payment.supplierName || 'Unknown',
      priority: this.calculatePaymentPriority(payment)
    };
  }

  private calculatePaymentPriority(payment: PaymentDTO): 'low' | 'medium' | 'high' {
    // Calculate priority based on amount, due date, and status
    if (payment.status === 'blocked') return 'high';
    
    if (payment.dueDate) {
      const daysUntilDue = Math.ceil((new Date(payment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue <= 3) return 'high';
      if (daysUntilDue <= 7) return 'medium';
    }
    
    if (payment.amount > 50000) return 'medium';
    
    return 'low';
  }

  private async sendBlockingNotifications(payment: PaymentDTO, reason: string, blockedBy: string): Promise<NotificationDTO[]> {
    const notifications: NotificationDTO[] = [];
    
    // Notify supplier
    const supplierNotification: NotificationDTO = {
      id: crypto.randomUUID(),
      recipientId: payment.supplierId || '',
      title: 'Payment Blocked',
      message: `Your payment of ${payment.amount} ${payment.currency} has been blocked. Reason: ${reason}`,
      type: 'payment_blocked',
      relatedId: payment.id,
      read: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await this.notificationRepository.save(supplierNotification);
    notifications.push(supplierNotification);
    
    // Notify project manager
    const managerNotification: NotificationDTO = {
      id: crypto.randomUUID(),
      recipientId: payment.projectManagerId || '',
      title: 'Payment Blocked',
      message: `Payment of ${payment.amount} ${payment.currency} for ${payment.supplierName} has been blocked by ${blockedBy}. Reason: ${reason}`,
      type: 'payment_blocked',
      relatedId: payment.id,
      read: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await this.notificationRepository.save(managerNotification);
    notifications.push(managerNotification);
    
    return notifications;
  }

  private async sendUnblockingNotifications(payment: any, unblockedBy: string, reason?: string): Promise<void> {
    // Notify supplier
    await this.notificationRepository.create({
      recipientId: payment.supplierId,
      title: 'Payment Unblocked',
      message: `Your payment of ${payment.amount} ${payment.currency} has been unblocked${reason ? `. Reason: ${reason}` : ''}`,
      type: 'payment_unblocked',
      relatedId: payment.id,
      read: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Notify project manager
    await this.notificationRepository.create({
      recipientId: payment.projectManagerId,
      title: 'Payment Unblocked',
      message: `Payment of ${payment.amount} ${payment.currency} for ${payment.supplierName} has been unblocked by ${unblockedBy}`,
      type: 'payment_unblocked',
      relatedId: payment.id,
      read: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  private async sendApprovalNotifications(payment: any, approvedBy: string, notes?: string): Promise<void> {
    // Notify supplier
    await this.notificationRepository.create({
      recipientId: payment.supplierId,
      title: 'Payment Approved',
      message: `Your payment of ${payment.amount} ${payment.currency} has been approved${notes ? `. Notes: ${notes}` : ''}`,
      type: 'payment_approved',
      relatedId: payment.id,
      read: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Notify finance team
    await this.notificationRepository.create({
      recipientId: 'finance_team', // Would need actual finance team user ID
      title: 'Payment Approved - Ready for Processing',
      message: `Payment of ${payment.amount} ${payment.currency} for ${payment.supplierName} has been approved by ${approvedBy}`,
      type: 'payment_approved',
      relatedId: payment.id,
      read: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  private async sendRejectionNotifications(payment: any, rejectedBy: string, reason: string): Promise<void> {
    // Notify supplier
    await this.notificationRepository.create({
      recipientId: payment.supplierId,
      title: 'Payment Rejected',
      message: `Your payment of ${payment.amount} ${payment.currency} has been rejected. Reason: ${reason}`,
      type: 'payment_rejected',
      relatedId: payment.id,
      read: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Notify project manager
    await this.notificationRepository.create({
      recipientId: payment.projectManagerId,
      title: 'Payment Rejected',
      message: `Payment of ${payment.amount} ${payment.currency} for ${payment.supplierName} has been rejected by ${rejectedBy}. Reason: ${reason}`,
      type: 'payment_rejected',
      relatedId: payment.id,
      read: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
}
