import { describe, expect, it, vi } from 'vitest';
import { TwilioSmsProvider, validateSmsRequest } from '../../../../supabase/functions/_shared/SmsProvider';
const env = (key: string) => ({ LOVABLE_API_KEY: 'test-only', TWILIO_API_KEY: 'test-only', TWILIO_FROM_NUMBER: '+15550000001' })[key];
describe('SMS provider outcomes', () => {
  it('rejects UUIDs rather than using them as phone numbers', () => {
    expect(() => validateSmsRequest({ to: 'a0000000-0000-0000-0000-000000000001', message: 'Reminder' })).toThrow();
  });
  it('never sends when sender configuration is missing', async () => {
    const http = vi.fn();
    expect((await new TwilioSmsProvider(() => undefined, http).send({ to: '+22212345678', message: 'Reminder' })).success).toBe(false);
    expect(http).not.toHaveBeenCalled();
  });
  it('reports queued acceptance with reference, not handset delivery', async () => {
    const http = vi.fn().mockResolvedValue(new Response(JSON.stringify({ sid: 'SM-test', status: 'queued' }), { status: 201 }));
    expect(await new TwilioSmsProvider(env, http).send({ to: '+22212345678', message: 'Reminder' })).toEqual({ success: true, messageId: 'SM-test', status: 'queued' });
    expect(http.mock.calls[0][1].body.get('To')).toBe('+22212345678');
  });
  it('rejects HTTP and application-level provider failures', async () => {
    for (const response of [new Response('{"code":21608}', { status: 400 }), new Response('{"sid":"SM-test","status":"failed"}', { status: 200 })]) {
      expect((await new TwilioSmsProvider(env, vi.fn().mockResolvedValue(response)).send({ to: '+22212345678', message: 'Reminder' })).success).toBe(false);
    }
  });
  it('preserves provider rejection status and details', async () => {
    const body = '{"code":21608,"message":"Recipient is not verified"}';
    expect(await new TwilioSmsProvider(env, vi.fn().mockResolvedValue(new Response(body, { status: 400 }))).send({ to: '+22212345678', message: 'Reminder' })).toMatchObject({ success: false, providerStatus: 400, details: body });
  });
  it('uses the configured messaging service rather than a sender number', async () => {
    const service = `MG${'a'.repeat(32)}`;
    const http = vi.fn().mockResolvedValue(new Response('{"sid":"SM-test","status":"queued"}', { status: 201 }));
    await new TwilioSmsProvider(key => key === 'TWILIO_MESSAGING_SERVICE_SID' ? service : env(key), http).send({ to: '+22212345678', message: 'Reminder' });
    expect(http.mock.calls[0][1].body.get('MessagingServiceSid')).toBe(service);
    expect(http.mock.calls[0][1].body.has('From')).toBe(false);
  });
  it('rejects malformed messaging services before a paid request', async () => {
    const http = vi.fn();
    expect(await new TwilioSmsProvider(key => key === 'TWILIO_MESSAGING_SERVICE_SID' ? 'invalid' : env(key), http).send({ to: '+22212345678', message: 'Reminder' })).toMatchObject({ success: false });
    expect(http).not.toHaveBeenCalled();
  });
});
import { createSmsProvider, GatewayApiSmsProvider } from '../../../../supabase/functions/_shared/SmsProvider';
describe('GatewayAPI SMS provider', () => {
  const env = (k: string) => ({ LOVABLE_API_KEY: 'l', GATEWAYAPI_API_KEY: 'g' } as Record<string, string>)[k];
  it('sends the number without + and reports accepted, not delivered', async () => {
    const http = vi.fn().mockResolvedValue(new Response('{"msg_id":"01ABC"}', { status: 202 }));
    expect(await new GatewayApiSmsProvider(env, http).send({ to: '+22212345678', message: 'Hi' })).toEqual({ success: true, messageId: '01ABC', status: 'accepted' });
    expect(JSON.parse(http.mock.calls[0][1].body)).toMatchObject({ recipient: 22212345678, sender: 'Hadratech' });
  });
  it('is chosen when linked, unless SMS_PROVIDER=twilio', () => {
    expect(createSmsProvider(env)).toBeInstanceOf(GatewayApiSmsProvider);
    expect(createSmsProvider(k => k === 'SMS_PROVIDER' ? 'twilio' : env(k))).not.toBeInstanceOf(GatewayApiSmsProvider);
  });
});
