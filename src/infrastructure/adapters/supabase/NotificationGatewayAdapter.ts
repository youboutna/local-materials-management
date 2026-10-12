/**
 * NotificationGatewayAdapter — single entry point for Supabase Edge Function
 * invocations and RPC calls used for notification-related side effects
 * (emails, tender submission notices, supplier password-reset tokens).
 */
import { supabase } from '@/integrations/supabase/client';
import { btpClient } from '@/integrations/supabase/schema-clients';

export interface InvokeFunctionResult<T = any> {
  data: T | null;
  error: { message: string } | null;
}

export class NotificationGatewayAdapter {
  async invokeFunction<T = any>(name: string, body: Record<string, unknown> | undefined): Promise<InvokeFunctionResult<T>> {
    const { data, error } = await supabase.functions.invoke(name, { body });
    return { data: (data as T) ?? null, error: error ? { message: error.message } : null };
  }

  async rpc<T = any>(
    fn: string,
    params?: Record<string, unknown>,
    schema: 'public' | 'btp' = 'public'
  ): Promise<InvokeFunctionResult<T>> {
    const client = schema === 'btp' ? btpClient : supabase;
    const { data, error } = await client.rpc(fn as any, params as any);
    return { data: (data as T) ?? null, error: error ? { message: error.message } : null };
  }
}

export const notificationGatewayAdapter = new NotificationGatewayAdapter();
