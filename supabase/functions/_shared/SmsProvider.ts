export interface SmsRequest { to: string; message: string }
export interface SmsResult { success: boolean; messageId?: string; status?: string; error?: string; providerStatus?: number; details?: string }
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
    if (service && !/^MG[0-9a-f]{32}$/i.test(service)) return { success: false, error: 'Invalid messaging service configuration' };
    if (!service && from && !/^\+[1-9]\d{7,14}$/.test(from)) return { success: false, error: 'Invalid SMS sender configuration' };
    const body = new URLSearchParams({ To: request.to, Body: request.message });
    if (service) body.set('MessagingServiceSid', service);
    else if (from) body.set('From', from);
    const response = await this.http('https://connector-gateway.lovable.dev/twilio/Messages.json', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'X-Connection-Api-Key': connectionKey, 'Content-Type': 'application/x-www-form-urlencoded' },
      body, signal: AbortSignal.timeout(20000),
    });
    const responseBody = await response.text();
    if (!response.ok) {
      console.error(`Twilio request failed [${response.status}]: ${responseBody}`);
      return { success: false, providerStatus: response.status, error: 'Twilio rejected SMS', details: responseBody };
    }
    let result: { sid?: string; status?: string; error_code?: number };
    try { result = JSON.parse(responseBody); }
    catch { return { success: false, providerStatus: response.status, error: 'Invalid Twilio response' }; }
    if (!result.sid || !result.status || result.error_code || !(SMS_POLICY.acceptedStatuses as readonly string[]).includes(result.status)) {
      return { success: false, error: 'Twilio did not accept this SMS', providerStatus: response.status };
    }
    // Accepted/queued is not proof of handset delivery. Return the exact state.
    return { success: true, messageId: result.sid, status: result.status };
  }
}

// GatewayAPI (EU) via the connector gateway. Sender is an alphanumeric name (max 11) or a number.
export class GatewayApiSmsProvider implements SmsProvider {
  constructor(private env: SmsEnvironment, private http: typeof fetch = fetch) {}
  async send(request: SmsRequest): Promise<SmsResult> {
    const apiKey = this.env('LOVABLE_API_KEY');
    const connectionKey = this.env('GATEWAYAPI_API_KEY');
    const sender = this.env('GATEWAYAPI_SENDER') || 'Hadratech';
    if (!apiKey || !connectionKey) return { success: false, error: 'SMS_PROVIDER_NOT_CONFIGURED' };
    if (!/^([A-Za-z0-9 ]{1,11}|\+?[1-9]\d{3,14})$/.test(sender)) return { success: false, error: 'Invalid SMS sender configuration' };
    const response = await this.http('https://connector-gateway.lovable.dev/gatewayapi/mobile/single', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'X-Connection-Api-Key': connectionKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: sender.replace(/^\+/, ''), recipient: Number(request.to.slice(1)), message: request.message }),
      signal: AbortSignal.timeout(20000),
    });
    const responseBody = await response.text();
    if (!response.ok) {
      console.error(`GatewayAPI request failed [${response.status}]: ${responseBody}`);
      return { success: false, providerStatus: response.status, error: 'GatewayAPI rejected SMS', details: responseBody };
    }
    let result: { msg_id?: string };
    try { result = JSON.parse(responseBody); }
    catch { return { success: false, providerStatus: response.status, error: 'Invalid GatewayAPI response' }; }
    if (!result.msg_id) return { success: false, providerStatus: response.status, error: 'GatewayAPI did not accept this SMS', details: responseBody };
    // 202 = accepted for sending, not proof of delivery.
    return { success: true, messageId: result.msg_id, status: 'accepted' };
  }
}

// SMS_PROVIDER=twilio|gatewayapi forces a provider; otherwise GatewayAPI is used when linked.
export function createSmsProvider(env: SmsEnvironment, http: typeof fetch = fetch): SmsProvider {
  const choice = env('SMS_PROVIDER')?.toLowerCase();
  if (choice === 'twilio') return new TwilioSmsProvider(env, http);
  if (choice === 'gatewayapi' || env('GATEWAYAPI_API_KEY')) return new GatewayApiSmsProvider(env, http);
  return new TwilioSmsProvider(env, http);
}