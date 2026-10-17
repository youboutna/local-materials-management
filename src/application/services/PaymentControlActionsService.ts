/**
 * Payment Control Actions Service - Hexagonal Architecture
 * Business logic for payment control actions and notifications
 */

import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { CommunicationService } from './CommunicationService';

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
    private notificationRepository = RepositoryFactory.getNotificationRepository(),
    private communication = CommunicationService,
  ) {}

  private validate(values: ActionFormData, metadata: ActionMetadata): void {
    if (!values.recipientIds?.length || !values.title?.trim() || !values.message?.trim() || !metadata.paymentId || !metadata.projectId) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Recipients, title, message, payment and project are required');
    }
  }

  private async notify(values: ActionFormData, metadata: ActionMetadata, type: 'info' | 'warning'): Promise<void> {
    this.validate(values, metadata);
    for (const recipientId of values.recipientIds) {
      const result = await this.notificationRepository.createNotification({
        recipientId, title: values.title, message: values.message, type, read: false,
        projectId: metadata.projectId,
        metadata: { ...metadata, channel: 'notification' },
      });
      if (result.error) throw result.error;
      if (!result.notification) throw new Error('Notification was not persisted');
    }
  }

  async createTaskAssignment(values: ActionFormData, metadata: ActionMetadata): Promise<void> {
    this.validate(values, metadata);
    for (const assigneeId of values.recipientIds) {
      const result = await this.communication.assignTask({
        assigneeId, title: values.title, description: values.message,
        priority: values.priority, dueDate: values.dueDate,
        projectId: metadata.projectId, relatedId: metadata.paymentId,
        actionType: values.actionType, metadata: { ...metadata },
      });
      if (!result.success) throw new Error('Task assignment failed');
    }
  }

  async sendSMSNotification(values: ActionFormData, metadata: ActionMetadata): Promise<void> {
    this.validate(values, metadata);
    for (const id of values.recipientIds) {
      const contact = await this.communication.resolveRecipient(id);
      if (!contact.phone) throw new Error('Recipient phone is missing');
      const result = await this.communication.sendSMS({ to: contact.phone, message: values.message, priority: values.priority, actionType: values.actionType, metadata: { ...metadata } });
      if (!result.success) throw new Error('SMS delivery failed');
    }
  }

  async scheduleCall(values: ActionFormData, metadata: ActionMetadata): Promise<void> {
    this.validate(values, metadata);
    for (const recipientId of values.recipientIds) {
      const contact = await this.communication.resolveRecipient(recipientId);
      const result = await this.communication.scheduleCall({
        recipientId, recipientPhone: contact.phone, subject: values.title,
        message: values.message, priority: values.priority, scheduledFor: values.dueDate,
        actionType: values.actionType, metadata: { ...metadata },
      });
      if (!result.success) throw new Error('Call scheduling failed');
    }
  }

  async sendEmailNotification(values: ActionFormData, metadata: ActionMetadata): Promise<void> {
    this.validate(values, metadata);
    for (const id of values.recipientIds) {
      const contact = await this.communication.resolveRecipient(id);
      if (!contact.email) throw new Error('Recipient email is missing');
      const result = await this.communication.sendEmail({ to: contact.email, subject: values.title, message: values.message, priority: values.priority, actionType: values.actionType, metadata: { ...metadata } });
      if (!result.success) throw new Error('Email delivery failed');
    }
  }

  async createHierarchyNotification(values: ActionFormData, metadata: ActionMetadata): Promise<void> {
    await this.notify(values, metadata, 'warning');
    for (const channel of values.notificationChannels ?? []) {
      if (channel === 'email') await this.sendEmailNotification(values, metadata);
      else if (channel === 'sms') await this.sendSMSNotification(values, metadata);
      else if (channel === 'call') await this.scheduleCall(values, metadata);
    }
  }

  async createMailAction(values: ActionFormData, metadata: ActionMetadata): Promise<void> {
    this.validate(values, metadata);
    throw new AppError(ErrorCode.VALIDATION_ERROR, 'Postal delivery is not configured; no letter was sent');
  }
}

let paymentControlActionsServiceInstance: PaymentControlActionsService | null = null;
export function getPaymentControlActionsService(): PaymentControlActionsService {
  if (!paymentControlActionsServiceInstance) {
    paymentControlActionsServiceInstance = new PaymentControlActionsService();
  }
  return paymentControlActionsServiceInstance;
}
