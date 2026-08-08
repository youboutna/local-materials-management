/**
 * Supplier Notification Service - Hexagonal Architecture
 * Business logic for supplier notifications with proper error handling
 */

import { IAuthRepository } from '@/domain/repositories/IAuthRepository';
import { INotificationRepository } from '@/domain/repositories/INotificationRepository';
import { ITaskAssignmentRepository } from '@/domain/repositories/ITaskAssignmentRepository';
import { TaskAssignmentService } from '@/application/services/TaskAssignmentService';
import { TaskAssignmentDTO, TaskStatus } from '@/dtos/entities/TaskAssignmentDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';

import { SupplierNotificationResult } from '@/dtos/entities/NotificationDTO';
import { CreateSupplierNotificationRequestDTO } from '@/dtos/entities/NotificationDTO';
import { SupplierNotificationData } from '@/dtos/entities/NotificationDTO';
export interface GeneratePasswordResetRequestDTO {
  supplierEmail: string;
  supplierName: string;
  supplierId: string;
  expiryHours?: number;
}

export i
/**
 * Service for managing supplier notifications with hexagonal architecture
 */
export class SupplierNotificationService {
  private notificationRepository: INotificationRepository;
  private taskAssignmentService: TaskAssignmentService;
  private authRepository: IAuthRepository;

  constructor() {
    this.notificationRepository = RepositoryFactory.getNotificationRepository();
    this.taskAssignmentService = new TaskAssignmentService(
      RepositoryFactory.getTaskAssignmentRepository()
    );
    this.authRepository = RepositoryFactory.getAuthRepository();
  }

  /**
   * Send notification to supplier
   */
  async sendSupplierNotification(request: CreateSupplierNotificationRequestDTO): Promise<SupplierNotificationResult> {
    try {
      this.validateNotificationRequest(request);

      let completionUrl = request.completion_url;
      if (request.data.type === 'task_assignment' && request.data.task_id) {
        completionUrl = await this.generateTaskCompletionUrl(request.data.task_id);
      }

      const notificationData = {
        ...request.data,
        completion_url: completionUrl,
        priority: request.priority || 'medium',
        scheduled_at: request.scheduled_at || new Date().toISOString()
      };

      // Create notification record using available repository
      const result = await this.notificationRepository.createNotification({
        recipient_id: request.data.supplier_id || '',
        title: `Notification: ${request.data.type}`,
        message: `Notification sent to ${request.data.email}`,
        type: 'info' as const,
        read: false,
        metadata: notificationData as any
      });

      return {
        success: true,
        notification_id: result.notification?.id,
        sent_at: new Date().toISOString()
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
      this.validatePasswordResetRequest(request);

      // Use Supabase RPC via supabase client directly since IAuthRepository doesn't have invokeRPC
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: resetData, error } = await supabase.rpc('generate_supplier_reset_token', {
        supplier_email: request.supplierEmail
      });

      if (error || !resetData) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to generate reset token');
      }

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
   * Utilise TaskAssignmentService au lieu de ITaskRepository
   */
  async sendTaskAssignmentNotification(taskId: string, supplierId: string): Promise<SupplierNotificationResult> {
    try {
      // Utiliser TaskAssignmentService pour récupérer la tâche
      const task = await this.taskAssignmentService.getById(taskId);
      if (!task) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Task not found');
      }

      return await this.sendSupplierNotification({
        data: {
          type: 'task_assignment',
          email: '', // Would need supplier lookup
          supplier_id: supplierId,
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
   * Get notification history for supplier
   */
  async getSupplierNotificationHistory(supplierId: string, limit = 50): Promise<any[]> {
    try {
      if (!supplierId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Supplier ID is required');
      }
      const result = await this.notificationRepository.getUserNotifications(supplierId, limit);
      return result.notifications;
    } catch (error) {
      console.error('Error getting supplier notification history:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to get supplier notification history',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  // Private helper methods

  private validateNotificationRequest(request: CreateSupplierNotificationRequestDTO): void {
    if (!request.data) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Notification data is required');
    }
    if (!request.data.email || request.data.email.trim() === '') {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Email is required');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.data.email)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid email format');
    }
    if (!['password_reset', 'task_assignment', 'payment_request', 'inspection_required'].includes(request.data.type)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid notification type');
    }
  }

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
  }

  /**
   * Generate task completion URL
   * Utilise TaskAssignmentService au lieu de ITaskRepository
   */
  private async generateTaskCompletionUrl(taskId: string): Promise<string> {
    try {
      // Récupérer la tâche pour vérifier qu'elle existe
      const task = await this.taskAssignmentService.getById(taskId);
      if (!task) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Task not found');
      }

      const tokenData = {
        taskId,
        timestamp: Date.now(),
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000)
      };

      const token = btoa(JSON.stringify(tokenData));
      const completionUrl = `${window.location.origin}/supplier-portal?task=${token}`;

      // Mettre à jour la tâche avec la date de complétion prévue
      await this.taskAssignmentService.update(taskId, {
        completedAt: new Date(tokenData.expiresAt).toISOString(),
        metadata: {
          ...task.metadata,
          completionToken: token,
          completionUrl: completionUrl,
        }
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
   * Determine task priority based on task data
   * Utilise les enums de TaskAssignmentDTO
   */
  private determineTaskPriority(task: TaskAssignmentDTO): 'low' | 'medium' | 'high' | 'urgent' {
    // Utiliser la priorité de la tâche
    const priorityMap: Record<string, 'low' | 'medium' | 'high' | 'urgent'> = {
      'LOW': 'low',
      'MEDIUM': 'medium',
      'HIGH': 'high',
      'CRITICAL': 'urgent',
    };

    if (task.priority && priorityMap[task.priority]) {
      return priorityMap[task.priority];
    }
    
    // Si la tâche a une date d'échéance, calculer l'urgence
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
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