import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  recipient_id?: string;
  recipient_type: 'user' | 'role' | 'all';
  role?: string;
  project_id?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  action_url?: string;
  is_read: boolean;
  read_at?: string;
  expires_at?: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  title_template: string;
  message_template: string;
  type: Notification['type'];
  priority: Notification['priority'];
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class NotificationService {
  
  /**
   * Create a new notification
   * @param notificationData The notification data
   * @returns The created notification
   */
  static async createNotification(notificationData: Omit<Notification, 'id' | 'created_at' | 'is_read'>): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        ...notificationData,
        is_read: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      throw new Error(`Failed to create notification: ${error.message}`);
    }

    return data;
  }

  /**
   * Get notifications for a user
   * @param userId The user ID
   * @param limit Maximum number of notifications to fetch
   * @param offset Offset for pagination
   * @returns Array of notifications
   */
  static async getUserNotifications(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .or(`recipient_type.eq.all),and(recipient_type.eq.role)`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching user notifications:', error);
      throw new Error(`Failed to fetch user notifications: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get notifications for a role
   * @param role The role name
   * @param limit Maximum number of notifications to fetch
   * @returns Array of notifications
   */
  static async getRoleNotifications(role: string, limit: number = 50): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_type', 'role')
      .eq('role', role)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching role notifications:', error);
      throw new Error(`Failed to fetch role notifications: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get project notifications
   * @param projectId The project ID
   * @param limit Maximum number of notifications to fetch
   * @returns Array of notifications
   */
  static async getProjectNotifications(projectId: string, limit: number = 50): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching project notifications:', error);
      throw new Error(`Failed to fetch project notifications: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Mark a notification as read
   * @param notificationId The notification ID
   * @param userId The user ID marking it as read
   * @returns The updated notification
   */
  static async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('recipient_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error marking notification as read:', error);
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }

    return data;
  }

  /**
   * Mark multiple notifications as read
   * @param notificationIds Array of notification IDs
   * @param userId The user ID marking them as read
   * @returns Number of notifications marked as read
   */
  static async markMultipleAsRead(notificationIds: string[], userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .in('id', notificationIds)
      .eq('recipient_id', userId);

    if (error) {
      console.error('Error marking multiple notifications as read:', error);
      throw new Error(`Failed to mark multiple notifications as read: ${error.message}`);
    }

    return data?.length || 0;
  }

  /**
   * Delete a notification
   * @param notificationId The notification ID
   */
  static async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      throw new Error(`Failed to delete notification: ${error.message}`);
    }
  }

  /**
   * Get unread notifications count for a user
   * @param userId The user ID
   * @returns Number of unread notifications
   */
  static async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('recipient_id', userId)
      .eq('is_read', false)
      .or(`recipient_type.eq.all),and(recipient_type.eq.role)`);

    if (error) {
      console.error('Error fetching unread count:', error);
      throw new Error(`Failed to fetch unread count: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Create a notification from template
   * @param templateId The template ID
   * @param variables The variables to substitute
   * @param recipientData The recipient data
   * @returns The created notification
   */
  static async createFromTemplate(
    templateId: string,
    variables: Record<string, any>,
    recipientData: {
      recipient_id?: string;
      recipient_type: Notification['recipient_type'];
      role?: string;
      project_id?: string;
    }
  ): Promise<Notification> {
    // Get the template
    const { data: template, error: templateError } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      throw new Error('Template not found or inactive');
    }

    // Substitute variables in templates
    const title = this.substituteVariables(template.title_template, variables);
    const message = this.substituteVariables(template.message_template, variables);

    // Create notification
    return await this.createNotification({
      title,
      message,
      type: template.type,
      priority: template.priority,
      ...recipientData
    });
  }

  /**
   * Send a system notification
   * @param title The notification title
   * @param message The notification message
   * @param priority The notification priority
   * @param metadata Additional metadata
   * @returns The created notification
   */
  static async sendSystemNotification(
    title: string,
    message: string,
    priority: Notification['priority'] = 'medium',
    metadata?: Record<string, any>
  ): Promise<Notification> {
    return await this.createNotification({
      title,
      message,
      type: 'system',
      priority,
      recipient_type: 'all',
      metadata
    });
  }

  /**
   * Send a project notification
   * @param projectId The project ID
   * @param title The notification title
   * @param message The notification message
   * @param type The notification type
   * @param priority The notification priority
   * @param recipientType The recipient type
   * @param role The role (if recipient_type is 'role')
   * @returns The created notification
   */
  static async sendProjectNotification(
    projectId: string,
    title: string,
    message: string,
    type: Notification['type'] = 'info',
    priority: Notification['priority'] = 'medium',
    recipientType: Notification['recipient_type'] = 'all',
    role?: string
  ): Promise<Notification> {
    return await this.createNotification({
      title,
      message,
      type,
      priority,
      recipient_type: recipientType,
      role,
      project_id: projectId
    });
  }

  /**
   * Clean up expired notifications
   * @returns Number of cleaned up notifications
   */
  static async cleanupExpiredNotifications(): Promise<number> {
    const { data, error } = await supabase
      .from('notifications')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Error cleaning up expired notifications:', error);
      throw new Error(`Failed to clean up expired notifications: ${error.message}`);
    }

    return (data || []).length;
  }

  /**
   * Get notification statistics
   * @returns Statistics object
   */
  static async getNotificationStats(): Promise<{
    total: number;
    unread: number;
    read: number;
    byType: Record<Notification['type'], number>;
    byPriority: Record<Notification['priority'], number>;
  }> {
    const { data, error } = await supabase
      .from('notifications')
      .select('type, priority, is_read');

    if (error) {
      console.error('Error fetching notification stats:', error);
      throw new Error(`Failed to fetch notification stats: ${error.message}`);
    }

    const stats = {
      total: data?.length || 0,
      unread: 0,
      read: 0,
      byType: {
        info: 0,
        success: 0,
        warning: 0,
        error: 0,
        system: 0
      },
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0
      }
    };

    if (data) {
      for (const notification of data) {
        if (notification.is_read) {
          stats.read++;
        } else {
          stats.unread++;
        }

        stats.byType[notification.type]++;
        stats.byPriority[notification.priority]++;
      }
    }

    return stats;
  }

  /**
   * Substitute variables in a template string
   * @param template The template string
   * @param variables The variables object
   * @returns The substituted string
   */
  private static substituteVariables(template: string, variables: Record<string, any>): string {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    }
    
    return result;
  }
}
