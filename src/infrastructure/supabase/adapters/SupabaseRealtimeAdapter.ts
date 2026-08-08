/**
 * Supabase Realtime Adapter
 * Implements IRealtimeRepository using supabase.channel(...).on('postgres_changes', ...)
 */

import type {
  IRealtimeRepository,
  RealtimePayload,
  RealtimeSubscription,
} from '@/domain/repositories/IRealtimeRepository';

// Minimal shape to avoid depending on supabase-js types directly in the adapter signature
interface RealtimeChannelLike {
  unsubscribe: () => Promise<'ok' | 'timed out' | 'error'>;
}

export class SupabaseRealtimeAdapter implements IRealtimeRepository {
  private channels: Map<string, RealtimeChannelLike> = new Map();

  async subscribe(subscription: RealtimeSubscription): Promise<string> {
    const { supabase } = await import('@/integrations/supabase/client');

    const channel = supabase
      .channel(`realtime-${subscription.id}`)
      .on(
        'postgres_changes' as any,
        {
          event: subscription.event ?? '*',
          schema: 'public',
          table: subscription.table,
          filter: subscription.filter,
        },
        (payload: any) => {
          const realtimePayload: RealtimePayload = {
            eventType: payload.eventType,
            table: payload.table,
            schema: payload.schema,
            new: payload.new,
            old: payload.old,
            commit_timestamp: payload.commit_timestamp,
          };
          subscription.callback(realtimePayload);
        }
      )
      .subscribe();

    this.channels.set(subscription.id, channel as unknown as RealtimeChannelLike);
    return subscription.id;
  }

  async unsubscribe(subscriptionId: string): Promise<void> {
    const channel = this.channels.get(subscriptionId);
    if (!channel) return;

    const { supabase } = await import('@/integrations/supabase/client');
    await supabase.removeChannel(channel as any);
    this.channels.delete(subscriptionId);
  }

  async unsubscribeAll(): Promise<void> {
    const { supabase } = await import('@/integrations/supabase/client');
    for (const [, channel] of this.channels) {
      await supabase.removeChannel(channel as any);
    }
    this.channels.clear();
  }

  getActiveSubscriptionsCount(): number {
    return this.channels.size;
  }
}
