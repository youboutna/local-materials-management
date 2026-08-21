// src/application/services/CommunicationService.ts
/**
 * Communication Service - Hexagonal Architecture
 * Utilise désormais EmailService pour l’envoi réel (découplé de Supabase)
 */

import { NotificationService } from './NotificationService';

export type CommunicationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface AssignTaskPayload {
  assigneeId: string;
  assigneeName?: string;
  assigneeEmail?: string;
  title: string;
  description: string;
  priority: CommunicationPriority;
  dueDate?: string;
  projectId?: string;
  relatedId?: string;
  actionType?: string;
  metadata?: Record<string, unknown>;
}

export interface SendEmailPayload {
  to: string;
  subject: string;
  message: string;
  priority?: CommunicationPriority;
  actionType?: string;
  metadata?: Record<string, unknown>;
}

export interface SendSmsPayload {
  to: string;
  message: string;
  priority?: CommunicationPriority;
  actionType?: string;
  metadata?: Record<string, unknown>;
}

export interface ScheduleCallPayload {
  recipientId: string;
  recipientPhone: string;
  subject: string;
  message: string;
  priority?: CommunicationPriority;
  scheduledFor?: string;
  actionType?: string;
  metadata?: Record<string, unknown>;
}

export interface CommunicationResult {
  success: boolean;
  channel: 'task' | 'email' | 'sms' | 'call' | 'mail';
  reference?: string;
}

export class CommunicationService {
  static async assignTask(payload: AssignTaskPayload): Promise<CommunicationResult> {
    await NotificationService.createNotification({
      recipientId: payload.assigneeId,
      title: `Tâche assignée: ${payload.title}`,
      message: payload.description,
      type: 'info',
      relatedId: payload.relatedId,
      metadata: {
        channel: 'task',
        priority: payload.priority,
        dueDate: payload.dueDate,
        projectId: payload.projectId,
        actionType: payload.actionType,
        ...(payload.metadata ?? {}),
      },
    });
    return { success: true, channel: 'task' };
  }

  static async sendEmail(payload: SendEmailPayload): Promise<CommunicationResult> {
    // 1. Persister la notification (comportement existant)
    await NotificationService.createNotification({
      recipientId: payload.to,
      title: `📧 ${payload.subject}`,
      message: payload.message,
      type: 'system',
      metadata: {
        channel: 'email',
        to: payload.to,
        priority: payload.priority,
        actionType: payload.actionType,
        ...(payload.metadata ?? {}),
      },
    });

    // 2. Envoyer l'email via l'Edge Function (les secrets du provider restent côté serveur)
    try {
      const { notificationGatewayAdapter } = await import(
        '@/infrastructure/adapters/supabase/NotificationGatewayAdapter'
      );
      const { data, error } = await notificationGatewayAdapter.invokeFunction<{
        success?: boolean;
        messageId?: string;
      }>('send-email-notification', {
        to: payload.to,
        subject: payload.subject,
        message: payload.message,
        priority: payload.priority,
        actionType: payload.actionType,
        metadata: payload.metadata ?? {},
      });
      if (error) throw new Error(error.message);
      return { success: true, channel: 'email', reference: data?.messageId };
    } catch (error) {
      console.error('CommunicationService.sendEmail: error', error);
      // On ne throw pas pour ne pas bloquer le workflow
      return { success: false, channel: 'email' };
    }

  }

  static async sendSMS(payload: SendSmsPayload): Promise<CommunicationResult> {
    await NotificationService.createNotification({
      recipientId: payload.to,
      title: '📱 SMS',
      message: payload.message,
      type: 'system',
      metadata: {
        channel: 'sms',
        to: payload.to,
        priority: payload.priority,
        actionType: payload.actionType,
        ...(payload.metadata ?? {}),
      },
    });
    return { success: true, channel: 'sms' };
  }

  static async scheduleCall(payload: ScheduleCallPayload): Promise<CommunicationResult> {
    await NotificationService.createNotification({
      recipientId: payload.recipientId,
      title: `📞 Appel programmé: ${payload.subject}`,
      message: payload.message,
      type: 'system',
      metadata: {
        channel: 'call',
        phone: payload.recipientPhone,
        priority: payload.priority,
        scheduledFor: payload.scheduledFor,
        actionType: payload.actionType,
        ...(payload.metadata ?? {}),
      },
    });
    return { success: true, channel: 'call' };
  }

  static async sendMail(payload: SendEmailPayload): Promise<CommunicationResult> {
    await NotificationService.createNotification({
      recipientId: payload.to,
      title: `📮 Courrier: ${payload.subject}`,
      message: payload.message,
      type: 'system',
      metadata: {
        channel: 'mail',
        to: payload.to,
        priority: payload.priority,
        actionType: payload.actionType,
        ...(payload.metadata ?? {}),
      },
    });
    return { success: true, channel: 'mail' };
  }
}

export const communicationService = CommunicationService;
export default CommunicationService;