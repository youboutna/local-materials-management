/**
 * Supabase Notification Adapter
 * Implements INotificationRepository for Supabase notifications and functions
 * Following hexagonal architecture principles
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  INotificationRepository, 
  NotificationData, 
  EmailData, 
  SMSData, 
  CallData 
} from '@/domain/repositories/INotificationRepository';

export class SupabaseNotificationAdapter implements INotificationRepository {
  /**
   * Create notification
   */
  async createNotification(notification: Omit<NotificationData, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ notification: NotificationData | null; error: Error | null }> {
    try {
      // Colonnes réellement persistées dans public.notifications
      const payload = {
        recipient_id: notification.recipientId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.read ?? false,
        priority: notification.priority ?? 'medium',
        expires_at: notification.expiresAt ?? null,
        action_url: notification.actionUrl ?? null,
        metadata: notification.metadata ?? {},
      };

      const { data, error } = await supabase
        .from('notifications')
        .insert(payload as never)
        .select()
        .single();

      if (error) {
        console.error('SupabaseNotificationAdapter.createNotification failed:', error.message, error);
        return { notification: null, error: new Error(error.message) };
      }

      const row = data as Record<string, unknown>;
      const notificationData: NotificationData = {
        id: row.id as string,
        recipientId: row.recipient_id as string,
        title: row.title as string,
        message: row.message as string,
        type: row.type as NotificationData['type'],
        read: row.read as boolean,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
        priority: (row.priority as NotificationData['priority']) ?? undefined,
        expiresAt: (row.expires_at as string | null) ?? null,
        actionUrl: (row.action_url as string | null) ?? null,
        metadata:
          row.metadata && typeof row.metadata === 'object'
            ? (row.metadata as Record<string, unknown>)
            : null,
      };

      return { notification: notificationData, error: null };
    } catch (error) {
      console.error('SupabaseNotificationAdapter.createNotification exception:', error);
      return { notification: null, error: error as Error };
    }
  }


  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, limit = 50): Promise<{ notifications: NotificationData[]; error: Error | null }> {
    try {
      console.log('SupabaseNotificationAdapter.getUserNotifications: Querying notifications for userId:', userId, 'limit:', limit);
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      console.log('SupabaseNotificationAdapter.getUserNotifications: Supabase response:', {
        hasError: !!error,
        error: error,
        dataCount: data?.length || 0,
        data: data
      });

      if (error) {
        console.error('SupabaseNotificationAdapter.getUserNotifications: Supabase error:', error);
        return { notifications: [], error };
      }

      const notifications: NotificationData[] = data.map(item => {
        const row = item as Record<string, unknown>;
        return {
          id: row.id as string,
          recipientId: row.recipient_id as string,
          title: row.title as string,
          message: row.message as string,
          type: row.type as NotificationData['type'],
          read: row.read as boolean,
          createdAt: row.created_at as string,
          updatedAt: row.updated_at as string,
          priority: (row.priority as NotificationData['priority']) ?? undefined,
          expiresAt: (row.expires_at as string | null) ?? null,
          actionUrl: (row.action_url as string | null) ?? null,
          metadata:
            row.metadata && typeof row.metadata === 'object'
              ? (row.metadata as Record<string, unknown>)
              : null,
        };
      });


      console.log('SupabaseNotificationAdapter.getUserNotifications: Successfully mapped', notifications.length, 'notifications');

      return { notifications, error: null };
    } catch (error) {
      console.error('SupabaseNotificationAdapter.getUserNotifications: Exception caught:', error);
      return { notifications: [], error: error as Error };
    }
  }

  /**
   * List every notification (administration)
   */
  async listAllNotifications(limit = 200): Promise<{ notifications: NotificationData[]; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) return { notifications: [], error };

      const notifications: NotificationData[] = (data || []).map(item => ({
        id: item.id,
        recipientId: item.recipient_id,
        title: item.title,
        message: item.message,
        type: item.type as NotificationData['type'],
        read: item.read,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        priority: undefined,
        expiresAt: null,
        actionUrl: null,
        metadata: item.metadata && typeof item.metadata === 'object' ? item.metadata as Record<string, any> : null
      }));

      return { notifications, error: null };
    } catch (error) {
      return { notifications: [], error: error as Error };
    }
  }

  /**
   * Get a single notification by id
   */
  async getNotificationById(notificationId: string): Promise<{ notification: NotificationData | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', notificationId)
        .maybeSingle();

      if (error) return { notification: null, error };
      return { notification: data ? this.mapRow(data) : null, error: null };
    } catch (error) {
      return { notification: null, error: error as Error };
    }
  }

  /**
   * Partially update a notification and return the persisted row
   */
  async updateNotification(
    notificationId: string,
    patch: Partial<Omit<NotificationData, 'id' | 'createdAt'>>
  ): Promise<{ notification: NotificationData | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', notificationId)
        .select()
        .maybeSingle();

      if (error) return { notification: null, error };
      if (!data) return { notification: null, error: new Error('Notification not found') };
      return { notification: this.mapRow(data), error: null };
    } catch (error) {
      return { notification: null, error: error as Error };
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Mark notification as unread
   */
  async markAsUnread(notificationId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: false, updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Mark all notifications of a recipient as read
   */
  async markAllAsRead(userId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('recipient_id', userId)
        .eq('read', false);

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Map a raw notifications row to the domain shape
   */
  private mapRow(row: Record<string, any>): NotificationData {
    return {
      id: row.id,
      recipientId: row.recipient_id,
      title: row.title,
      message: row.message,
      type: row.type as NotificationData['type'],
      read: row.read,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      metadata:
        row.metadata && typeof row.metadata === 'object'
          ? (row.metadata as Record<string, any>)
          : null,
    };
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Send email via Supabase function
   */
  async sendEmail(data: EmailData): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.functions.invoke('send-email-notification', {
        body: JSON.stringify(data)
      });

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Send SMS via Supabase function
   */
  async sendSMS(data: SMSData): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.functions.invoke('send-sms-notification', {
        body: JSON.stringify(data)
      });

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Schedule call via Supabase function
   */
  async scheduleCall(data: CallData): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.functions.invoke('schedule-call', {
        body: JSON.stringify(data)
      });

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId: string): Promise<{ count: number; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('recipient_id', userId)
        .eq('read', false);

      if (error) {
        return { count: 0, error };
      }

      return { count: data?.length || 0, error: null };
    } catch (error) {
      return { count: 0, error: error as Error };
    }
  }

  /**
   * Get system-wide notifications (type = 'system')
   */
  async getSystemNotifications(limit = 100): Promise<{ notifications: NotificationData[]; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('type', 'system')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { notifications: [], error };
      }

      const notifications: NotificationData[] = (data ?? []).map(item => ({
        id: item.id,
        recipientId: item.recipient_id,
        title: item.title,
        message: item.message,
        type: item.type as NotificationData['type'],
        read: item.read,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        priority: undefined,
        expiresAt: null,
        actionUrl: null,
        metadata: item.metadata && typeof item.metadata === 'object' ? item.metadata as Record<string, any> : null,
      }));

      return { notifications, error: null };
    } catch (error) {
      return { notifications: [], error: error as Error };
    }
  }
}
