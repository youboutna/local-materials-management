/**
 * Realtime Repository Interface
 * Defines contract for real-time subscription operations
 * Following hexagonal architecture principles
 */

export interface RealtimeSubscription {
  id: string;
  table: string;
  filter?: string;
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  callback: (payload: RealtimePayload) => void;
}

export interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  new?: Record<string, unknown>;
  old?: Record<string, unknown>;
  commit_timestamp: string;
}

export interface IRealtimeRepository {
  /**
   * Subscribe to table changes
   */
  subscribe(subscription: RealtimeSubscription): Promise<string>;
  
  /**
   * Unsubscribe from table changes
   */
  unsubscribe(subscriptionId: string): Promise<void>;
  
  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll(): Promise<void>;
  
  /**
   * Get active subscriptions count
   */
  getActiveSubscriptionsCount(): number;
}
