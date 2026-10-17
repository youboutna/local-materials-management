export interface SmsRequest { to: string; message: string }
export interface SmsResult { success: boolean; messageId?: string; status?: string; error?: string; providerStatus?: number }
export interface SmsProvider { send(request: SmsRequest): Promise<SmsResult> }
export type SmsEnvironment = (name: string) => string | undefined;

export const SMS_POLICY = {
  allowedRoles: ['admin', 'super_admin', 'director', 'manager'],
  maxMessageLength: 1600,
  acceptedStatuses: ['accepted', 'queued', 'sending', 'sent', 'delivered'],
} as const;

export function validateSmsRequest(value: unknown): SmsRequest {
  if (!value || typeof value !== 'object') throw new Error('SMS request must be an object');
  const { to, message } = value as Record<string, unknown>;
  if (typeof to !== 'string' || !/^\+[1-9]\d{7,14}$/.test(to)) throw new Error('Recipient must be an E.164 phone number');
  if (typeof message !== 'string' || !message.trim() || message.length > SMS_POLICY.maxMessageLength) throw new Error('Invalid SMS message');
  return { to, message };
}

// Credentials only come from the server environment. Never accepts a provider URL from clients.
export class TwilioSmsProvider implements SmsProvider {
  constructor(private env: SmsEnvironment, private http: typeof fetch = fetch) {}
  async send(request: SmsRequest): Promise<SmsResult> {
    const apiKey = this.env('LOVABLE_API_KEY');
    const connectionKey = this.env('TWILIO_API_KEY');
    const from = this.env('TWILIO_FROM_NUMBER');
    const service = this.env('TWILIO_MESSAGING_SERVICE_SID');
    if (!apiKey || !connectionKey || (!from && !service)) return { success: false, error: 'SMS_PROVIDER_NOT_CONFIGURED' };
    if (from && !/^\+[1-9]\d{7,14}$/.test(from)) return { success: false, error: 'Invalid SMS sender configuration' };
    const body = new URLSearchParams({ To: request.to, Body: request.message });
    if (service) body.set('MessagingServiceSid', service);
    else if (from) body.set('From', from);
    const response = await this.http('https://connector-gateway.lovable.dev/twilio/Messages.json', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'X-Connection-Api-Key': connectionKey, 'Content-Type': 'application/x-www-form-urlencoded' },
      body, signal: AbortSignal.timeout(20000),
    });
    const result = await response.json().catch(() => ({})) as { sid?: string; status?: string; message?: string; error_code?: number; code?: number };
    if (!response.ok) return { success: false, providerStatus: response.status, error: `Twilio rejected SMS${result.code ? ` (code ${result.code})` : ''}` };
    if (!result.sid || !result.status || result.error_code || !(SMS_POLICY.acceptedStatuses as readonly string[]).includes(result.status)) {
      return { success: false, error: 'Twilio did not accept this SMS', providerStatus: response.status };
    }
    // Accepted/queued is not proof of handset delivery. Return the exact state.
    return { success: true, messageId: result.sid, status: result.status };
  }
}