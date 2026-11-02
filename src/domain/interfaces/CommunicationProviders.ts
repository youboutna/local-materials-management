/**
 * Ports de communication (domaine) — aucune dépendance technique.
 * Les implémentations (Edge Functions, SES, Twilio, GatewayAPI…) vivent
 * dans src/infrastructure/adapters/communication.
 */
export interface ProviderDispatchResult {
  success: boolean;
  reference?: string;
  error?: string;
}

export interface EmailMessage {
  to: string | string[];
  subject: string;
  message: string;
  html?: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: string; contentType?: string; encoding?: 'base64' }>;
  priority?: string;
  actionType?: string;
  metadata?: Record<string, unknown>;
}

export interface SmsMessage { to: string; message: string }

export interface CallRequest {
  recipientId: string;
  recipientPhone: string;
  subject: string;
  message: string;
  priority: string;
  scheduledFor?: string;
  actionType: string;
  metadata?: Record<string, unknown>;
}

export interface IEmailProvider { send(message: EmailMessage): Promise<ProviderDispatchResult> }
export interface ISmsProvider { send(message: SmsMessage): Promise<ProviderDispatchResult> }
export interface ICallProvider { schedule(request: CallRequest): Promise<ProviderDispatchResult> }

export interface CommunicationProviders {
  email: IEmailProvider;
  sms: ISmsProvider;
  call: ICallProvider;
}
