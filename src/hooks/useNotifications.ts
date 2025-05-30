
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const useNotifications = (userId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const actualUserId = userId || user?.id;

  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ['notifications', actualUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id' as any, actualUserId as any)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map((notification: any) => ({
        ...notification,
        metadata: notification.metadata || {}
      }));
    },
    enabled: !!actualUserId,
  });

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true } as any)
        .eq('id' as any, notificationId as any);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['notifications', actualUserId] });
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true } as any)
        .eq('recipient_id' as any, actualUserId as any)
        .eq('read' as any, false as any);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['notifications', actualUserId] });
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const createNotification = async (
    recipientId: string,
    title: string,
    message: string,
    type: string,
    relatedId?: string,
    metadata?: any
  ) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          recipient_id: recipientId,
          title,
          message,
          type,
          related_id: relatedId,
          metadata: metadata || {},
        } as any);

      if (error) throw error;
      
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
