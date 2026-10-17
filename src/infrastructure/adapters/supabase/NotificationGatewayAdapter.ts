/**
 * NotificationGatewayAdapter — single entry point for Supabase Edge Function
 * invocations and RPC calls used for notification-related side effects
 * (emails, tender submission notices, supplier password-reset tokens).
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export interface InvokeFunctionResult<T = any> {
  data: T | null;
  error: { message: string } | null;
}

export class NotificationGatewayAdapter {
  async invokeFunction<T = any>(name: string, body: Record<string, unknown> | undefined): Promise<InvokeFunctionResult<T>> {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.functions.invoke(name, { body });
    return { data: (data as T) ?? null, error: error ? { message: error.message } : null };
  }

  async rpc<T = any>(
    fn: string,
    params?: Record<string, unknown>,
    schema: 'public' | 'btp' = 'public'
  ): Promise<InvokeFunctionResult<T>> {
    const { supabase } = await import('@/integrations/supabase/client');
    const client = (supabase as SupabaseClient).schema(schema);
    const { data, error } = await client.rpc(fn, params);
    return { data: (data as T) ?? null, error: error ? { message: error.message } : null };
  }
}

export const notificationGatewayAdapter = new NotificationGatewayAdapter();
