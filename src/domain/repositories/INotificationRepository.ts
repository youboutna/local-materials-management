/**
 * Notification Repository Interface
 * Defines the contract for notification operations
 * Following hexagonal architecture principles
 */

export interface NotificationData {
  id: string;
  recipient_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  read: boolean;
  created_at?: string;
  updated_at?: string;
  priority?: 'low' | 'medium' | 'high';
  expires_at?: string | null;
  action_url?: string | null;
  metadata?: Record<string, any> | null;
}

export interface EmailData {
  to: string | string[];
  subject: string;
  body: string;
  html?: string;
  from?: string;
  reply_to?: string;
}

export interface SMSData {
  to: string | string[];
  message: string;
  from?: string;
}

export interface CallData {
  to: string;
  from?: string;
  message?: string;
  scheduled_at?: string;
}

export interface INotificationRepository {
  /**
   * Create notification
   */
  createNotification(notification: Omit<NotificationData, 'id' | 'created_at' | 'updated_at'>): Promise<{ notification: NotificationData | null; error: Error | null }>;

  /**
   * Get user notifications
   */
  getUserNotifications(userId: string, limit?: number): Promise<{ notifications: NotificationData[]; error: Error | null }>;

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): Promise<{ error: Error | null }>;

  /**
   * Delete notification
   */
  deleteNotification(notificationId: string): Promise<{ error: Error | null }>;

  /**
   * Send email
   */
  sendEmail(data: EmailData): Promise<{ error: Error | null }>;

  /**
   * Send SMS
   */
  sendSMS(data: SMSData): Promise<{ error: Error | null }>;

  /**
   * Schedule call
   */
  scheduleCall(data: CallData): Promise<{ error: Error | null }>;

  /**
   * Get unread count for user
   */
  getUnreadCount(userId: string): Promise<{ count: number; error: Error | null }>;

  /**
   * Get system-wide notifications (type = 'system'), not scoped to a recipient
   */
  getSystemNotifications(limit?: number): Promise<{ notifications: NotificationData[]; error: Error | null }>;
}
