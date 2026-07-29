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
  async createNotification(notification: Omit<NotificationData, 'id' | 'created_at' | 'updated_at'>): Promise<{ notification: NotificationData | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single();

      if (error) {
        return { notification: null, error };
      }

      const notificationData: NotificationData = {
        id: data.id,
        recipient_id: data.recipient_id,
        title: data.title,
        message: data.message,
        type: data.type as NotificationData['type'],
        read: data.read,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      return { notification: notificationData, error: null };
    } catch (error) {
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

      const notifications: NotificationData[] = data.map(item => ({
        id: item.id,
        recipient_id: item.recipient_id,
        title: item.title,
        message: item.message,
        type: item.type as NotificationData['type'],
        read: item.read,
        created_at: item.created_at,
        updated_at: item.updated_at,
        priority: undefined, // Pas dans la base de données actuelle
        expires_at: null, // Pas dans la base de données actuelle
        action_url: null, // Pas dans la base de données actuelle
        metadata: item.metadata && typeof item.metadata === 'object' ? item.metadata as Record<string, any> : null
      }));

      console.log('SupabaseNotificationAdapter.getUserNotifications: Successfully mapped', notifications.length, 'notifications');

      return { notifications, error: null };
    } catch (error) {
      console.error('SupabaseNotificationAdapter.getUserNotifications: Exception caught:', error);
      return { notifications: [], error: error as Error };
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
        recipient_id: item.recipient_id,
        title: item.title,
        message: item.message,
        type: item.type as NotificationData['type'],
        read: item.read,
        created_at: item.created_at,
        updated_at: item.updated_at,
        priority: undefined,
        expires_at: null,
        action_url: null,
        metadata: item.metadata && typeof item.metadata === 'object' ? item.metadata as Record<string, any> : null,
      }));

      return { notifications, error: null };
    } catch (error) {
      return { notifications: [], error: error as Error };
    }
  }
}
