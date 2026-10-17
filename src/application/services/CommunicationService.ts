// src/application/services/CommunicationService.ts
/**
 * Communication Service - Hexagonal Architecture
 * Utilise désormais EmailService pour l’envoi réel (découplé de Supabase)
 */

import { NotificationService } from './NotificationService';
import { notificationGatewayAdapter } from '@/infrastructure/adapters/supabase/NotificationGatewayAdapter';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { getUserService } from './UserService';


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

export interface EmailAttachmentPayload {
  filename: string;
  /** Contenu encodé en base64 */
  content: string;
  contentType?: string;
  encoding?: 'base64';
}

export interface SendEmailPayload {
  to: string | string[];
  subject: string;
  /** Corps texte (utilisé aussi comme fallback HTML si `html` absent) */
  message: string;
  html?: string;
  replyTo?: string;
  attachments?: EmailAttachmentPayload[];
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
  static async resolveRecipient(recipientId: string): Promise<{ id: string; email: string; phone: string }> {
    const user = await getUserService().getUserById(recipientId);
    if (!user) throw new Error('Destinataire introuvable');
    return { id: user.id, email: user.email || '', phone: user.phone || '' };
  }

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
    const recipientId = typeof payload.to === 'string' && isUuid(payload.to) ? payload.to : null;
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
      console.log('[CommunicationService] No internal notification recipient for email delivery');
    }

    // 2. Envoi côté serveur (Edge Function) : jamais d'appel direct au provider
    //    depuis le navigateur (CORS + clé API exposée).
    try {
      const { data, error } = await notificationGatewayAdapter.invokeFunction<{
        success?: boolean;
        messageId?: string;
        error?: string;
      }>('send-email-notification', {
        to: payload.to,
        subject: payload.subject,
        message: payload.message,
        html: payload.html,
        replyTo: payload.replyTo,
        attachments: payload.attachments,
        priority: payload.priority,
        actionType: payload.actionType,
        metadata: payload.metadata,
      });


      if (error || !data?.success) {
        const details = error?.message || data?.error || 'Unknown edge function error';
        console.error('[CommunicationService] sendEmail failed:', details);
        return { success: false, channel: 'email' };
      }

      console.log('[CommunicationService] Email sent via edge function', {
        recipientCount: Array.isArray(payload.to) ? payload.to.length : 1,
      });
      return { success: true, channel: 'email', reference: data.messageId };
    } catch (error) {
      console.error('[CommunicationService] sendEmail error:', error);
      return { success: false, channel: 'email' };
    }

  }

  static async sendSMS(payload: SendSmsPayload): Promise<CommunicationResult> {
    let to = payload.to;
    try {
      if (isUuid(to)) to = (await this.resolveRecipient(to)).phone;
      if (!/^\+[1-9]\d{7,14}$/.test(to) || !payload.message.trim()) return { success: false, channel: 'sms' };
    } catch { return { success: false, channel: 'sms' }; }
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
          to,
          message: payload.message,
        });
        if (error) return { success: false, channel: 'sms' };
      } else {
        console.warn('[CommunicationService] sendSMS not implemented by repository');
        return { success: false, channel: 'sms' };
      }
    } catch (error) {
      console.error('CommunicationService.sendSMS: exception', error);
      return { success: false, channel: 'sms' };
    }

    return { success: true, channel: 'sms' };
  }

  static async scheduleCall(payload: ScheduleCallPayload): Promise<CommunicationResult> {
    if (!payload.recipientPhone || isUuid(payload.recipientPhone) || !payload.scheduledFor ||
        !Number.isFinite(Date.parse(payload.scheduledFor))) {
      return { success: false, channel: 'call' };
    }
    try {
      const result = await notificationGatewayAdapter.invokeFunction<{ success?: boolean }>('schedule-call', {
        ...payload,
        priority: payload.priority ?? 'medium',
        actionType: payload.actionType ?? 'follow_up',
      });
      if (result.error || !result.data?.success) return { success: false, channel: 'call' };
    } catch (error) {
      console.error('CommunicationService.scheduleCall: exception', error);
      return { success: false, channel: 'call' };
    }
    return { success: true, channel: 'call' };
  }

  static async sendMail(payload: Omit<SendEmailPayload, 'to'> & { to: string }): Promise<CommunicationResult> {
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