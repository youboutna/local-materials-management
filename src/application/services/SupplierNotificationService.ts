/**
 * Supplier Notification Service - Hexagonal Architecture
 * Business logic for supplier notifications with proper error handling
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { ISupplierNotificationRepository } from '@/domain/repositories/ISupplierNotificationRepository';
import { ITaskRepository } from '@/domain/repositories/ITaskRepository';
import { IAuthRepository } from '@/domain/repositories/IAuthRepository';

export interface SupplierNotificationData {
  type: 'password_reset' | 'task_assignment' | 'payment_request' | 'inspection_required';
  email: string;
  supplier_name?: string;
  supplier_id?: string;
  task_id?: string;
  task_title?: string;
  payment_id?: string;
  payment_amount?: number;
  inspection_id?: string;
  inspection_date?: string;
}

export interface CreateSupplierNotificationRequestDTO {
  data: SupplierNotificationData;
  completion_url?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  scheduled_at?: string;
}

export interface GeneratePasswordResetRequestDTO {
  supplierEmail: string;
  supplierName: string;
  supplierId: string;
  expiryHours?: number;
}

export interface SupplierNotificationResult {
  success: boolean;
  notification_id?: string;
  sent_at?: string;
  error?: string;
}

/**
 * Service for managing supplier notifications with hexagonal architecture
 */
export class SupplierNotificationService {
  private supplierNotificationRepository: ISupplierNotificationRepository;
  private taskRepository: ITaskRepository;
  private authRepository: IAuthRepository;

  constructor() {
    this.supplierNotificationRepository = RepositoryFactory.getSupplierNotificationRepository();
    this.taskRepository = RepositoryFactory.getTaskRepository();
    this.authRepository = RepositoryFactory.getAuthRepository();
  }

  /**
   * Send notification to supplier
   */
  async sendSupplierNotification(request: CreateSupplierNotificationRequestDTO): Promise<SupplierNotificationResult> {
    try {
      // Validate request data
      this.validateNotificationRequest(request);

      // Generate completion URL for task assignments
      let completionUrl = request.completion_url;
      if (request.data.type === 'task_assignment' && request.data.task_id) {
        completionUrl = await this.generateTaskCompletionUrl(request.data.task_id);
      }

      // Prepare notification data
      const notificationData = {
        ...request.data,
        completion_url: completionUrl,
        priority: request.priority || 'medium',
        scheduled_at: request.scheduled_at || new Date().toISOString()
      };

      // Create notification record
      const notification = await this.supplierNotificationRepository.createNotification(notificationData);

      // Send notification via edge function
      const result = await this.authRepository.invokeFunction('send-supplier-notification', {
        body: notificationData
      });

      if (!result) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to send notification');
      }

      return {
        success: true,
        notification_id: notification.id,
        sent_at: notification.created_at
      };
    } catch (error) {
      console.error('Error sending supplier notification:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to send supplier notification',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Generate password reset token and send notification
   */
  async generateSupplierPasswordReset(request: GeneratePasswordResetRequestDTO): Promise<SupplierNotificationResult> {
    try {
      // Validate request data
      this.validatePasswordResetRequest(request);

      // Generate reset token
      const resetData = await this.authRepository.invokeRPC('generate_supplier_reset_token', {
        supplier_email: request.supplierEmail,
        expiry_hours: request.expiryHours || 24
      });

      if (!resetData) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to generate reset token');
      }

      // Send password reset notification
      const result = await this.sendSupplierNotification({
        data: {
          type: 'password_reset',
          email: request.supplierEmail,
          supplier_name: request.supplierName,
          supplier_id: request.supplierId
        },
        priority: 'high'
      });

      return result;
    } catch (error) {
      console.error('Error generating password reset:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to generate password reset',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Send task assignment notification
   */
  async sendTaskAssignmentNotification(taskId: string, supplierId: string): Promise<SupplierNotificationResult> {
    try {
      // Get task details
      const task = await this.taskRepository.findById(taskId);
      if (!task) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Task not found');
      }

      // Get supplier details
      const supplier = await this.supplierNotificationRepository.getSupplierById(supplierId);
      if (!supplier) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Supplier not found');
      }

      // Send notification
      return await this.sendSupplierNotification({
        data: {
          type: 'task_assignment',
          email: supplier.email,
          supplier_name: supplier.name,
          supplier_id: supplier.id,
          task_id: task.id,
          task_title: task.title
        },
        priority: this.determineTaskPriority(task)
      });
    } catch (error) {
      console.error('Error sending task assignment notification:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to send task assignment notification',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Send payment request notification
   */
  async sendPaymentRequestNotification(paymentId: string, supplierId: string): Promise<SupplierNotificationResult> {
    try {
      // Get payment details
      const payment = await this.supplierNotificationRepository.getPaymentById(paymentId);
      if (!payment) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Payment not found');
      }

      // Get supplier details
      const supplier = await this.supplierNotificationRepository.getSupplierById(supplierId);
      if (!supplier) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Supplier not found');
      }

      // Send notification
      return await this.sendSupplierNotification({
        data: {
          type: 'payment_request',
          email: supplier.email,
          supplier_name: supplier.name,
          supplier_id: supplier.id,
          payment_id: payment.id,
          payment_amount: payment.amount
        },
        priority: 'high'
      });
    } catch (error) {
      console.error('Error sending payment request notification:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to send payment request notification',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Send inspection required notification
   */
  async sendInspectionRequiredNotification(inspectionId: string, supplierId: string): Promise<SupplierNotificationResult> {
    try {
      // Get inspection details
      const inspection = await this.supplierNotificationRepository.getInspectionById(inspectionId);
      if (!inspection) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Inspection not found');
      }

      // Get supplier details
      const supplier = await this.supplierNotificationRepository.getSupplierById(supplierId);
      if (!supplier) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Supplier not found');
      }

      // Send notification
      return await this.sendSupplierNotification({
        data: {
          type: 'inspection_required',
          email: supplier.email,
          supplier_name: supplier.name,
          supplier_id: supplier.id,
          inspection_id: inspection.id,
          inspection_date: inspection.scheduled_date
        },
        priority: 'urgent'
      });
    } catch (error) {
      console.error('Error sending inspection required notification:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to send inspection required notification',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get notification history for supplier
   */
  async getSupplierNotificationHistory(supplierId: string, limit = 50): Promise<any[]> {
    try {
      if (!supplierId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Supplier ID is required');
      }

      return await this.supplierNotificationRepository.getNotificationsBySupplier(supplierId, limit);
    } catch (error) {
      console.error('Error getting supplier notification history:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to get supplier notification history',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      if (!notificationId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Notification ID is required');
      }

      await this.supplierNotificationRepository.updateNotification(notificationId, {
        read_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to mark notification as read',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  // Private helper methods

  /**
   * Validate notification request
   */
  private validateNotificationRequest(request: CreateSupplierNotificationRequestDTO): void {
    if (!request.data) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Notification data is required');
    }

    if (!request.data.email || request.data.email.trim() === '') {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Email is required');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.data.email)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid email format');
    }

    if (!['password_reset', 'task_assignment', 'payment_request', 'inspection_required'].includes(request.data.type)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid notification type');
    }

    // Validate type-specific requirements
    if (request.data.type === 'task_assignment' && !request.data.task_id) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Task ID is required for task assignment notifications');
    }

    if (request.data.type === 'payment_request' && !request.data.payment_id) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Payment ID is required for payment request notifications');
    }

    if (request.data.type === 'inspection_required' && !request.data.inspection_id) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID is required for inspection required notifications');
    }
  }

  /**
   * Validate password reset request
   */
  private validatePasswordResetRequest(request: GeneratePasswordResetRequestDTO): void {
    if (!request.supplierEmail || request.supplierEmail.trim() === '') {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Supplier email is required');
    }

    if (!request.supplierName || request.supplierName.trim() === '') {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Supplier name is required');
    }

    if (!request.supplierId || request.supplierId.trim() === '') {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Supplier ID is required');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.supplierEmail)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid email format');
    }

    if (request.expiryHours && (request.expiryHours < 1 || request.expiryHours > 168)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Expiry hours must be between 1 and 168');
    }
  }

  /**
   * Generate task completion URL
   */
  private async generateTaskCompletionUrl(taskId: string): Promise<string> {
    try {
      // Generate secure token
      const tokenData = {
        taskId,
        timestamp: Date.now(),
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
      };

      const token = btoa(JSON.stringify(tokenData));
      const completionUrl = `${window.location.origin}/supplier-portal?task=${token}`;

      // Update task with completion token
      await this.taskRepository.update(taskId, {
        completion_token: token,
        completion_url: completionUrl,
        token_expires_at: new Date(tokenData.expiresAt).toISOString()
      });

      return completionUrl;
    } catch (error) {
      console.error('Error generating task completion URL:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to generate task completion URL',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Determine task priority based on task properties
   */
  private determineTaskPriority(task: any): 'low' | 'medium' | 'high' | 'urgent' {
    if (task.priority === 'urgent') return 'urgent';
    if (task.priority === 'high') return 'high';
    if (task.priority === 'low') return 'low';
    
    // Determine based on due date
    if (task.due_date) {
      const dueDate = new Date(task.due_date);
      const now = new Date();
      const daysUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysUntilDue <= 1) return 'urgent';
      if (daysUntilDue <= 3) return 'high';
      if (daysUntilDue <= 7) return 'medium';
    }

    return 'medium';
  }
}

// Factory function for service instance
let supplierNotificationServiceInstance: SupplierNotificationService | null = null;

export function getSupplierNotificationService(): SupplierNotificationService {
  if (!supplierNotificationServiceInstance) {
    supplierNotificationServiceInstance = new SupplierNotificationService();
  }
  return supplierNotificationServiceInstance;
}

// Export legacy functions for backward compatibility
export const sendSupplierNotification = async (data: SupplierNotificationData) => {
  const service = getSupplierNotificationService();
  return await service.sendSupplierNotification({ data });
};

export const generateSupplierPasswordReset = async (supplierEmail: string, supplierName: string, supplierId: string) => {
  const service = getSupplierNotificationService();
  return await service.generateSupplierPasswordReset({
    supplierEmail,
    supplierName,
    supplierId
  });
};
