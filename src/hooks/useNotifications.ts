
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Notification, NotificationMetadata } from '@/types/notification';
import { useToast } from '@/hooks/use-toast';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchNotifications = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id' as any, user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedNotifications = (data || []).map(notification => ({
        ...notification,
        metadata: notification.metadata as NotificationMetadata
      })) as Notification[];

      setNotifications(mappedNotifications);
      setUnreadCount(mappedNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les notifications.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true } as any)
        .eq('id' as any, notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true } as any)
        .eq('recipient_id' as any, user.id)
        .eq('read' as any, false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const createNotification = async (
    recipientId: string,
    title: string,
    message: string,
    type: string,
    relatedId?: string,
    metadata?: NotificationMetadata
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
          metadata: metadata || {}
        } as any);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Subscribe to real-time notifications
    if (user?.id) {
      const channel = supabase
        .channel('user-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${user.id}`
          },
          (payload) => {
            const newNotification = {
              ...payload.new,
              metadata: payload.new.metadata as NotificationMetadata
            } as Notification;
            
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            toast({
              title: newNotification.title,
              description: newNotification.message,
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    createNotification,
    refetch: fetchNotifications
  };
};
