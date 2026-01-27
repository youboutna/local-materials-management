/**
 * Payment Control Actions Service - Hexagonal Architecture
 * Business logic for payment control actions and notifications
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export interface ActionFormData {
  actionType: 'task_assignment' | 'hierarchy_notification' | 'sms' | 'call' | 'email' | 'mail';
  assigneeId?: string;
  recipientIds: string[];
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  escalationLevel?: 'team' | 'supervisor' | 'manager' | 'director';
  documentReferences?: string[];
  followUpRequired?: boolean;
  notificationChannels?: string[];
}

export interface ActionMetadata {
  paymentId: string;
  projectId: string;
  contractorId: string;
  amount: number;
  blockingReasons?: Array<{
    reason: string;
    description: string;
    severity: 'warning' | 'blocking';
  }>;
  actionType: string;
  priority: string;
  escalationLevel?: string;
  dueDate?: string;
  documentReferences?: string[];
  followUpRequired?: boolean;
  notificationChannels?: string[];
}

export class PaymentControlActionsService {
  constructor(
    private authRepository = RepositoryFactory.getAuthRepository(),
    private notificationRepository = RepositoryFactory.getNotificationRepository()
  ) {}

  async createTaskAssignment(values: ActionFormData, metadata: ActionMetadata): Promise<void> {
    try {
      if (!values.recipientIds || values.recipientIds.length === 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Recipient IDs are required');
      }
      if (!values.title || !values.message) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Title and message are required');
      }
      if (!metadata.paymentId || !metadata.projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Payment ID and project ID are required in metadata');
      }

      const authResult = await this.authRepository.getCurrentUser();
      const userId = authResult?.user?.id || 'system';
      
      // Create task assignment notification for each recipient
      for (const recipientId of values.recipientIds) {
        await this.notificationRepository.createNotification({
          recipient_id: recipientId,
          title: values.title,
          message: values.message,
          type: 'info',
          read: false
        });
      }
      
      console.log('Task assignment created:', { values, metadata, createdBy: userId });
    } catch (error) {
      console.error('PaymentControlActionsService.createTaskAssignment failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create task assignment');
    }
  }

  async sendSMSNotification(values: ActionFormData, metadata: ActionMetadata): Promise<void> {
    try {
      if (!values.recipientIds || values.recipientIds.length === 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Recipient IDs are required');
      }
      if (!values.message) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Message is required');
      }
      if (!metadata.paymentId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Payment ID is required in metadata');
      }

      // SMS notification logic - would use NotificationService
      console.log('SMS notification:', {
        recipients: values.recipientIds,
        message: values.message,
        metadata
      });
      
      // Create notification records for tracking
      for (const recipientId of values.recipientIds) {
        await this.notificationRepository.createNotification({
          recipient_id: recipientId,
          title: values.title,
          message: values.message,
          type: 'info',
          read: false
        });
      }
    } catch (error) {
      console.error('PaymentControlActionsService.sendSMSNotification failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to send SMS notification');
    }
  }

  async scheduleCall(values: ActionFormData, metadata: ActionMetadata): Promise<void> {
    try {
      if (!values.recipientIds || values.recipientIds.length === 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Recipient IDs are required');
      }
      if (!values.title || !values.message) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Title and message are required');
      }
      if (!metadata.paymentId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Payment ID is required in metadata');
      }

      // Call scheduling logic - would use CommunicationService
      console.log('Call scheduled:', {
        recipients: values.recipientIds,
        subject: values.title,
        message: values.message,
        priority: values.priority,
        metadata
      });
      
      for (const recipientId of values.recipientIds) {
        await this.notificationRepository.createNotification({
          recipient_id: recipientId,
          title: `Appel programmé: ${values.title}`,
          message: values.message,
          type: 'info',
          read: false
        });
      }
    } catch (error) {
      console.error('PaymentControlActionsService.scheduleCall failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to schedule call');
    }
  }

  async sendEmailNotification(values: ActionFormData, metadata: ActionMetadata): Promise<void> {
    try {
      if (!values.recipientIds || values.recipientIds.length === 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Recipient IDs are required');
      }
      if (!values.title || !values.message) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Title and message are required');
      }
      if (!metadata.paymentId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Payment ID is required in metadata');
      }

      // Email notification logic - would use EmailService
      console.log('Email notification:', {
        recipients: values.recipientIds,
        subject: values.title,
        message: values.message,
        priority: values.priority,
        metadata
      });
      
      for (const recipientId of values.recipientIds) {
        await this.notificationRepository.createNotification({
          recipient_id: recipientId,
          title: values.title,
          message: values.message,
          type: 'info',
          read: false
        });
      }
    } catch (error) {
      console.error('PaymentControlActionsService.sendEmailNotification failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to send email notification');
    }
  }

  async createHierarchyNotification(values: ActionFormData, metadata: ActionMetadata): Promise<void> {
    try {
      if (!values.recipientIds || values.recipientIds.length === 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Recipient IDs are required');
      }
      if (!values.title || !values.message) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Title and message are required');
      }
      if (!metadata.paymentId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Payment ID is required in metadata');
      }

      const authResult = await this.authRepository.getCurrentUser();
      const userId = authResult?.user?.id || 'system';
      
      // Hierarchy notification logic
      for (const recipientId of values.recipientIds) {
        await this.notificationRepository.createNotification({
          recipient_id: recipientId,
          title: values.title,
          message: values.message,
          type: 'warning',
          read: false
        });
      }
      
      console.log('Hierarchy notification created:', { values, metadata, createdBy: userId });
    } catch (error) {
      console.error('PaymentControlActionsService.createHierarchyNotification failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create hierarchy notification');
    }
  }

  async createMailAction(values: ActionFormData, metadata: ActionMetadata): Promise<void> {
    try {
      if (!values.recipientIds || values.recipientIds.length === 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Recipient IDs are required');
      }
      if (!values.title || !values.message) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Title and message are required');
      }
      if (!metadata.paymentId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Payment ID is required in metadata');
      }

      // Mail action logic - would use MailService
      console.log('Mail action:', {
        recipients: values.recipientIds,
        subject: values.title,
        message: values.message,
        priority: values.priority,
        metadata
      });
      
      for (const recipientId of values.recipientIds) {
        await this.notificationRepository.createNotification({
          recipient_id: recipientId,
          title: `Courrier: ${values.title}`,
          message: values.message,
          type: 'info',
          read: false
        });
      }
    } catch (error) {
      console.error('PaymentControlActionsService.createMailAction failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create mail action');
    }
  }
}
