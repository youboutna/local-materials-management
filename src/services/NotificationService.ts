import { supabase } from '@/integrations/supabase/client';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export interface CreateNotificationDTO {
  recipient_id: string;
  title: string;
  message: string;
  type?: string;
  related_id?: string;
  metadata?: Record<string, any>;
}

export interface CreateSupplierNotificationDTO {
  supplier_id: string;
  notification_type: string;
  email: string;
  message?: string;
  metadata?: Record<string, any>;
}

export class NotificationService {
  /**
   * Create a notification for a user
   */
  static async createNotification(notification: CreateNotificationDTO) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          recipient_id: notification.recipient_id,
          title: notification.title,
          message: notification.message,
          type: notification.type || 'info',
          related_id: notification.related_id,
          metadata: notification.metadata || {},
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Erreur lors de la création de la notification'
      );
    }
  }

  /**
   * Create multiple notifications at once
   */
  static async createBatchNotifications(notifications: CreateNotificationDTO[]) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert(
          notifications.map(n => ({
            recipient_id: n.recipient_id,
            title: n.title,
            message: n.message,
            type: n.type || 'info',
            related_id: n.related_id,
            metadata: n.metadata || {},
            created_at: new Date().toISOString()
          }))
        )
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating batch notifications:', error);
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Erreur lors de la création des notifications'
      );
    }
  }

  /**
   * Create a supplier notification
   */
  static async createSupplierNotification(notification: CreateSupplierNotificationDTO) {
    try {
      const { data, error } = await supabase
        .from('supplier_notifications')
        .insert({
          supplier_id: notification.supplier_id,
          notification_type: notification.notification_type,
          email: notification.email,
          message: notification.message,
          metadata: notification.metadata,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating supplier notification:', error);
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Erreur lors de la création de la notification fournisseur'
      );
    }
  }

  /**
   * Get notifications for a user
   */
  static async getUserNotifications(userId: string, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Erreur lors de la récupération des notifications'
      );
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Erreur lors de la mise à jour de la notification'
      );
    }
  }
}
