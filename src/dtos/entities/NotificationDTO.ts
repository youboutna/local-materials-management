/**
 * Notification DTOs
 * Data Transfer Objects for notification operations
 */

export interface NotificationDTO {
  id: string;
  recipient_id: string;
  title: string;
  
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  read: boolean;
  created_at: string;
  updated_at?: string;
  priority?: 'low' | 'medium' | 'high';
  expires_at?: string;
  action_url?: string;
  metadata?: Record<string, any>;
}

export interface CreateNotificationRequestDTO {
  recipient_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  priority?: 'low' | 'medium' | 'high';
  expires_at?: string;
  action_url?: string;
  metadata?: Record<string, any>;
}

export interface UpdateNotificationRequestDTO {
  title?: string;
  message?: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'system';
  read?: boolean;
  priority?: 'low' | 'medium' | 'high';
  expires_at?: string;
  action_url?: string;
  metadata?: Record<string, any>;
}

export interface NotificationListDTO {
  notifications: NotificationDTO[];
  total: number;
  unread_count: number;
  page?: number;
  limit?: number;
}

export interface NotificationStatsDTO {
  total_notifications: number;
  unread_notifications: number;
  by_type: Record<string, number>;
  by_priority: Record<string, number>;
  recent_notifications: NotificationDTO[];
}
