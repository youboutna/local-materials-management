// src/application/services/CommunicationService.ts
/**
 * Communication Service - Hexagonal Architecture
 * Utilise désormais EmailService pour l’envoi réel (découplé de Supabase)
 */

import { NotificationService } from './NotificationService';
import { notificationGatewayAdapter } from '@/infrastructure/adapters/supabase/NotificationGatewayAdapter';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { getUserService } from './UserService';
import type { CreateNotificationRequestDTO } from '@/dtos/entities/NotificationDTO';


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
  channel: 'task' | 'email' | 'sms' | 'call' | 'mail' | 'notification' | 'whatsapp' | 'google_meet' | 'microsoft_teams';
  reference?: string;
  status?: 'accepted' | 'scheduled' | 'persisted' | 'link_prepared' | 'failed' | 'not_configured';
  url?: string;
}

/**
 * Vérifie si une chaîne est un UUID valide
 */
const isUuid = (value: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
};

export class CommunicationService {
  static async sendNotification(payload: CreateNotificationRequestDTO): Promise<CommunicationResult> {
    const notification = await NotificationService.createNotification(payload);
    return { success: true, channel: 'notification', reference: notification.id, status: 'persisted' };
  }

  static async prepareWhatsApp(payload: SendSmsPayload): Promise<CommunicationResult> {
    try {
      const phone = isUuid(payload.to) ? (await this.resolveRecipient(payload.to)).phone : payload.to;
      if (!/^\+[1-9]\d{7,14}$/.test(phone)) return { success: false, channel: 'whatsapp', status: 'failed' };
      return { success: true, channel: 'whatsapp', status: 'link_prepared', url: `https://wa.me/${phone.slice(1)}?text=${encodeURIComponent(payload.message)}` };
    } catch { return { success: false, channel: 'whatsapp', status: 'failed' }; }
  }

  static prepareMeetingLink(channel: 'google_meet' | 'microsoft_teams', value: string): CommunicationResult {
    try {
      const url = new URL(value);
      const allowed = channel === 'google_meet'
        ? url.hostname === 'meet.google.com'
        : ['teams.microsoft.com', 'teams.live.com', 'teams.cloud.microsoft'].includes(url.hostname);
      if (!allowed || url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid meeting link');
      return { success: true, channel, status: 'link_prepared', url: url.href };
    } catch { return { success: false, channel, status: 'failed' }; }
  }

  static requireSuccess(result: CommunicationResult): CommunicationResult {
    if (!result.success) throw new Error(`Communication ${result.channel} failed or is not configured`);
    return result;
  }

  static async resolveRecipient(recipientId: string): Promise<{ id: string; email: string; phone: string }> {
    const user = await getUserService().getUserById(recipientId).catch(() => null);
    if (user) return { id: user.id, email: user.email || '', phone: user.phone || '' };
    const { getEmployeeService } = await import('./EmployeeService');
    const employee = await getEmployeeService().getEmployeeById(recipientId);
    if (!employee) throw new Error('Destinataire introuvable');
    return { id: employee.userId || '', email: employee.email || '', phone: employee.phone || '' };
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
    let to: string | string[];
    try {
      const inputs = Array.isArray(payload.to) ? payload.to : [payload.to];
      const emails = await Promise.all(inputs.map(async value => isUuid(value) ? (await this.resolveRecipient(value)).email : value.trim()));
      if (!emails.length || emails.some(value => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) return { success: false, channel: 'email' };
      to = Array.isArray(payload.to) ? [...new Set(emails)] : emails[0];
    } catch { return { success: false, channel: 'email' }; }
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
        to,
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
      return { success: true, channel: 'email', reference: data.messageId, status: 'accepted' };
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
        const { error, reference, status } = await repo.sendSMS({
          to,
          message: payload.message,
        });
        if (error) return { success: false, channel: 'sms' };
        return { success: true, channel: 'sms', reference, status: 'accepted' };
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
      const result = await notificationGatewayAdapter.invokeFunction<{ success?: boolean; callId?: string }>('schedule-call', {
        ...payload,
        priority: payload.priority ?? 'medium',
        actionType: payload.actionType ?? 'follow_up',
      });
      if (result.error || !result.data?.success) return { success: false, channel: 'call' };
      return { success: true, channel: 'call', status: 'scheduled', reference: result.data.callId };
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

    return { success: false, channel: 'mail', status: 'not_configured' };
  }
}

export const communicationService = CommunicationService;
export default CommunicationService;