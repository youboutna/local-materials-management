// src/application/services/CommunicationService.ts
/**
 * Communication Service - Hexagonal Architecture
 * Utilise désormais EmailService pour l’envoi réel (découplé de Supabase)
 */

import { NotificationService } from './NotificationService';
import { createEmailService } from './email/EmailServiceFactory';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { getEmailProvider } from '@/config/app';

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

/**
 * Vérifie si une chaîne est un UUID valide
 */
const isUuid = (value: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
};

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
    // 1. Créer la notification SEULEMENT SI le destinataire est un UUID (utilisateur interne)
    const recipientId = isUuid(payload.to) ? payload.to : null;
    if (recipientId) {
      await NotificationService.createNotification({
        recipientId,
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
    } else {
      console.log(`[CommunicationService] Notification ignorée pour l'email externe: ${payload.to}`);
    }

    // 2. Toujours envoyer l'email via le service multi‑provider
    try {
      const emailService = createEmailService();
      const result = await emailService.sendEmail({
        to: payload.to,
        subject: payload.subject,
        html: payload.message.replace(/\n/g, '<br>'),
        text: payload.message,
      });
      const provider = getEmailProvider();
      console.log(`[CommunicationService] Email sent via ${provider} to ${payload.to}`);
      return { success: true, channel: 'email', reference: result.messageId };
    } catch (error) {
      console.error('[CommunicationService] sendEmail error:', error);
      return { success: false, channel: 'email' };
    }
  }

  static async sendSMS(payload: SendSmsPayload): Promise<CommunicationResult> {
    const recipientId = isUuid(payload.to) ? payload.to : null;
    if (recipientId) {
      await NotificationService.createNotification({
        recipientId,
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
    }

    try {
      const repo = RepositoryFactory.getNotificationRepository();
      if (repo && typeof repo.sendSMS === 'function') {
        const { error } = await repo.sendSMS({
          to: payload.to,
          message: payload.message,
        });
        if (error) {
          console.error('CommunicationService.sendSMS: error', error);
        }
      } else {
        console.warn('[CommunicationService] sendSMS not implemented by repository');
      }
    } catch (error) {
      console.error('CommunicationService.sendSMS: exception', error);
    }

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

    try {
      const repo = RepositoryFactory.getNotificationRepository();
      if (repo && typeof repo.scheduleCall === 'function') {
        await repo.scheduleCall({
          phoneNumber: payload.recipientPhone,
          scheduledFor: payload.scheduledFor,
          message: payload.message,
        });
      } else {
        console.warn('[CommunicationService] scheduleCall not implemented by repository');
      }
    } catch (error) {
      console.error('CommunicationService.scheduleCall: exception', error);
    }

    return { success: true, channel: 'call' };
  }

  static async sendMail(payload: SendEmailPayload): Promise<CommunicationResult> {
    const recipientId = isUuid(payload.to) ? payload.to : null;
    if (recipientId) {
      await NotificationService.createNotification({
        recipientId,
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
    }

    console.log(`[CommunicationService] Courrier à envoyer à ${payload.to}`);

    return { success: true, channel: 'mail' };
  }
}

export const communicationService = CommunicationService;
export default CommunicationService;