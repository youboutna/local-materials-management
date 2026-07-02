/**
 * Communication Service - Hexagonal Architecture
 *
 * Thin façade around NotificationService for cross-channel side-effects
 * (task assignment, email, SMS, scheduled call, postal mail). Real transport
 * providers (SendGrid, Twilio, etc.) are wired downstream via edge functions;
 * here we persist a traceable notification per invocation so the domain layer
 * remains provider-agnostic.
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
      recipient_id: payload.assigneeId,
      title: `Tâche assignée: ${payload.title}`,
      message: payload.description,
      type: 'info',
      related_id: payload.relatedId,
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
    await NotificationService.createNotification({
      recipient_id: payload.to,
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
    return { success: true, channel: 'email' };
  }

  static async sendSMS(payload: SendSmsPayload): Promise<CommunicationResult> {
    await NotificationService.createNotification({
      recipient_id: payload.to,
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
      recipient_id: payload.recipientId,
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
      recipient_id: payload.to,
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
