import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/use-auth';
import { toast } from '@/hooks/use-toast';
import { NotificationService } from '@/application/services/NotificationService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { NotificationDTO } from '@/dtos/entities/NotificationDTO';

interface Notification {
  id: string;
  recipient_id: string;
  title: string;
  message: string;
  type: string;
  related_id?: string;
  read: boolean;
  created_at: string;
  metadata: Record<string, unknown>;
}

export const useNotifications = (userId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const actualUserId = userId || user?.id;
  
  // Initialize notification service with repository
  const notificationService = new NotificationService(RepositoryFactory.getNotificationRepository());

  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ['notifications', actualUserId],
    queryFn: async () => {
      if (!actualUserId) return [];
      
      try {
        const notifications = await notificationService.getUserNotifications(actualUserId);
        return notifications.map((notification: NotificationDTO) => ({
          id: notification.id,
          recipient_id: notification.recipient_id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          related_id: undefined, // NotificationDTO doesn't have related_id, set to undefined
          read: notification.read,
          created_at: notification.created_at,
          metadata: notification.metadata || {}
        }));
      } catch (err) {
        console.error('Error fetching notifications:', err);
        throw err;
      }
    },
    enabled: !!actualUserId,
  });

  const unreadCount = notifications.filter((n: Notification) => !n.read).length;

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markNotificationAsRead(notificationId);
      queryClient.invalidateQueries({ queryKey: ['notifications', actualUserId] });
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (!actualUserId) return;
      
      // Get all unread notifications for this user
      const unreadNotifications = notifications.filter(n => !n.read && n.recipient_id === actualUserId);
      
      // Mark all as read in parallel
      await Promise.all(unreadNotifications.map(n => notificationService.markNotificationAsRead(n.id)));
      
      queryClient.invalidateQueries({ queryKey: ['notifications', actualUserId] });
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const createNotification = async (
    recipientId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' | 'system',
    relatedId?: string,
    metadata?: Record<string, unknown>
  ) => {
    try {
      await notificationService.createNotification({
        recipient_id: recipientId,
        title,
        message,
        type,
        related_id: relatedId,
        metadata: metadata || {},
      });
      
      queryClient.invalidateQueries({ queryKey: ['notifications', recipientId] });
    } catch (err) {
      console.error('Error creating notification:', err);
      throw err;
    }
  };

  return {
    notifications,
    isLoading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    createNotification,
  };
};
