import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useNotifications = (userId: string) => {
  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id' as any, userId as any)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map((notification: any) => ({
        ...notification,
        metadata: notification.metadata || {}
      }));
    },
    enabled: !!userId,
  });

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true } as any)
        .eq('id' as any, notificationId as any);

      if (error) throw error;
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true } as any)
        .eq('recipient_id' as any, userId as any)
        .eq('read' as any, false as any);

      if (error) throw error;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  return {
    notifications,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
  };
};
