import { describe, expect, it, vi } from 'vitest';
import { FunctionsHttpError } from '@supabase/supabase-js';
const mocks = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke: mocks.invoke } } }));
import { SupabaseNotificationAdapter } from '@/infrastructure/adapters/supabase/SupabaseNotificationAdapter';
describe('SMS gateway failure evidence', () => {
  it('returns the provider rejection rather than a generic non-2xx message', async () => {
    const body = '{"success":false,"providerStatus":400,"details":"Recipient is not verified"}';
    mocks.invoke.mockResolvedValue({ data: null, error: new FunctionsHttpError(new Response(body, { status: 400 })) });
    const result = await new SupabaseNotificationAdapter().sendSMS({ to: '+22212345678', message: 'Reminder' });
    expect(result.error?.message).toBe(body);
    expect(result.reference).toBeUndefined();
  });
});