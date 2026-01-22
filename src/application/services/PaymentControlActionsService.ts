/**
 * Payment Control Actions Service
 * Business logic for payment control actions and notifications
 */

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
      console.error('Error creating task assignment:', error);
      throw error;
    }
  }

  async sendSMSNotification(values: ActionFormData, metadata: ActionMetadata): Promise<void> {
    try {
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
      console.error('Error sending SMS notification:', error);
      throw error;
    }
  }

  async scheduleCall(values: ActionFormData, metadata: ActionMetadata): Promise<void> {
    try {
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
      console.error('Error scheduling call:', error);
      throw error;
    }
  }

  async sendEmailNotification(values: ActionFormData, metadata: ActionMetadata): Promise<void> {
    try {
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
      console.error('Error sending email notification:', error);
      throw error;
    }
  }

  async createHierarchyNotification(values: ActionFormData, metadata: ActionMetadata): Promise<void> {
    try {
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
      console.error('Error creating hierarchy notification:', error);
      throw error;
    }
  }

  async createMailAction(values: ActionFormData, metadata: ActionMetadata): Promise<void> {
    try {
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
      console.error('Error creating mail action:', error);
      throw error;
    }
  }

  static create(): PaymentControlActionsService {
    return new PaymentControlActionsService();
  }
}
