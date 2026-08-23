/**
 * Notification DTOs
 * Data Transfer Objects for notification operations
 */

export interface NotificationDTO {
  id: string;
  recipientId: string;
  title: string;

  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  read: boolean;
  /** Contexte métier (doctrine : toute entité porte projectId + phaseId). */
  projectId?: string | null;
  phaseId?: string | null;
  createdAt: string;
  updatedAt?: string;
  priority?: 'low' | 'medium' | 'high';
  expiresAt?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface CreateNotificationRequestDTO {
  recipientId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  projectId?: string | null;
  phaseId?: string | null;
  priority?: 'low' | 'medium' | 'high';
  expiresAt?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  // Legacy fields for backward compatibility
  relatedId?: string;
  read?: boolean;
}


export interface UpdateNotificationRequestDTO {
  title?: string;
  message?: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'system';
  read?: boolean;
  priority?: 'low' | 'medium' | 'high';
  expiresAt?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface NotificationListDTO {
  notifications: NotificationDTO[];
  total: number;
  unreadCount: number;
  page?: number;
  limit?: number;
}

export interface NotificationStatsDTO {
  totalNotifications: number;
  unreadNotifications: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  recentNotifications: NotificationDTO[];
}
