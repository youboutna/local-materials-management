/**
 * Adapters techniques des ports de communication.
 * L'appel aux Edge Functions / au dépôt de notifications est un détail d'infrastructure.
 */
import type {
  CallRequest, CommunicationProviders, EmailMessage, ICallProvider, IEmailProvider, ISmsProvider,
  ProviderDispatchResult, SmsMessage,
} from '@/domain/interfaces/CommunicationProviders';
import { notificationGatewayAdapter } from '@/infrastructure/adapters/supabase/NotificationGatewayAdapter';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';

export class EdgeFunctionEmailAdapter implements IEmailProvider {
  async send(message: EmailMessage): Promise<ProviderDispatchResult> {
    const { data, error } = await notificationGatewayAdapter.invokeFunction<{ success?: boolean; messageId?: string; error?: string }>(
      'send-email-notification', { ...message },
    );
    if (error || !data?.success) return { success: false, error: error?.message || data?.error || 'email provider error' };
    return { success: true, reference: data.messageId };
  }
}

export class NotificationRepositorySmsAdapter implements ISmsProvider {
  async send(message: SmsMessage): Promise<ProviderDispatchResult> {
    const repo = RepositoryFactory.getNotificationRepository();
    if (!repo || typeof repo.sendSMS !== 'function') return { success: false, error: 'sms not configured' };
    const { error, reference } = await repo.sendSMS(message);
    return error ? { success: false, error: String(error) } : { success: true, reference };
  }
}

export class EdgeFunctionCallAdapter implements ICallProvider {
  async schedule(request: CallRequest): Promise<ProviderDispatchResult> {
    const { data, error } = await notificationGatewayAdapter.invokeFunction<{ success?: boolean; callId?: string }>(
      'schedule-call', { ...request },
    );
    if (error || !data?.success) return { success: false, error: error?.message || 'call provider error' };
    return { success: true, reference: data.callId };
  }
}

export const createDefaultCommunicationProviders = (): CommunicationProviders => ({
  email: new EdgeFunctionEmailAdapter(),
  sms: new NotificationRepositorySmsAdapter(),
  call: new EdgeFunctionCallAdapter(),
});
