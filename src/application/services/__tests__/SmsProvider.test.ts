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
});