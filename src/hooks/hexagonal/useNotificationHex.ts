/**
 * useNotificationHex - Hook hexagonal pour la gestion des notifications
 * Architecture hexagonale avec service centralisé
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { NotificationService } from '@/application/services/NotificationService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { 
  NotificationDTO, 
  CreateNotificationRequestDTO, 
  UpdateNotificationRequestDTO 
} from '@/dtos/entities/NotificationDTO';

// Types pour le hook
export interface NotificationHookReturn {
  notifications: NotificationDTO[];
  isLoading: boolean;
  error: Error | null;
  createNotification: (data: CreateNotificationRequestDTO) => Promise<NotificationDTO | null>;
  updateNotification: (id: string, data: UpdateNotificationRequestDTO) => Promise<NotificationDTO | null>;
  deleteNotification: (id: string) => Promise<boolean>;
  markAsRead: (id: string) => Promise<NotificationDTO | null>;
  markAsUnread: (id: string) => Promise<NotificationDTO | null>;
  getUnreadCount: () => number;
  refetch: () => void;
}

// Clés pour React Query
const QUERY_KEYS = {
  notifications: 'notifications',
  unreadCount: 'unread-count',
};

export function useNotificationHex(): NotificationHookReturn {
  const queryClient = useQueryClient();
  
  // Service centralisé
  const notificationService = new NotificationService(
    RepositoryFactory.getNotificationRepository()
  );

  // Récupérer toutes les notifications
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEYS.notifications],
    queryFn: async () => {
      try {
        return await notificationService.getAllNotifications();
      } catch (err) {
        console.error('useNotificationHex.getAllNotifications failed:', err);
        throw err instanceof AppError ? err : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch notifications');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Créer une notification
  const createNotificationMutation = useMutation({
    mutationFn: async (data: CreateNotificationRequestDTO) => {
      try {
        return await notificationService.createNotification(data);
      } catch (err) {
        console.error('useNotificationHex.createNotification failed:', err);
        throw err instanceof AppError ? err : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create notification');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.notifications] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.unreadCount] });
    },
  });

  // Mettre à jour une notification
  const updateNotificationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateNotificationRequestDTO }) => {
      try {
        return await notificationService.updateNotification(id, data);
      } catch (err) {
        console.error('useNotificationHex.updateNotification failed:', err);
        throw err instanceof AppError ? err : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update notification');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.notifications] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.unreadCount] });
    },
  });

  // Supprimer une notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await notificationService.deleteNotification(id);
        return true;
      } catch (err) {
        console.error('useNotificationHex.deleteNotification failed:', err);
        throw err instanceof AppError ? err : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete notification');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.notifications] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.unreadCount] });
    },
  });

  // Marquer comme lu
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        return await notificationService.markNotificationAsRead(id);
      } catch (err) {
        console.error('useNotificationHex.markAsRead failed:', err);
        throw err instanceof AppError ? err : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to mark notification as read');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.notifications] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.unreadCount] });
    },
  });

  // Marquer comme non lu
  const markAsUnreadMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        return await notificationService.markNotificationAsUnread(id);
      } catch (err) {
        console.error('useNotificationHex.markAsUnread failed:', err);
        throw err instanceof AppError ? err : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to mark notification as unread');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.notifications] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.unreadCount] });
    },
  });

  // Compter les notifications non lues
  const getUnreadCount = (): number => {
    return notifications.filter(notification => !notification.read).length;
  };

  // Fonctions exposées
  const createNotification = async (data: CreateNotificationRequestDTO): Promise<NotificationDTO | null> => {
    return await createNotificationMutation.mutateAsync(data);
  };

  const updateNotification = async (id: string, data: UpdateNotificationRequestDTO): Promise<NotificationDTO | null> => {
    return await updateNotificationMutation.mutateAsync({ id, data });
  };

  const deleteNotification = async (id: string): Promise<boolean> => {
    return await deleteNotificationMutation.mutateAsync(id);
  };

  const markAsRead = async (id: string): Promise<NotificationDTO | null> => {
    return await markAsReadMutation.mutateAsync(id);
  };

  const markAsUnread = async (id: string): Promise<NotificationDTO | null> => {
    return await markAsUnreadMutation.mutateAsync(id);
  };

  return {
    notifications,
    isLoading,
    error,
    createNotification,
    updateNotification,
    deleteNotification,
    markAsRead,
    markAsUnread,
    getUnreadCount,
    refetch,
  };
}

// Hook pour les notifications système (admin)
export function useSystemNotificationsHex(): NotificationHookReturn {
  const queryClient = useQueryClient();
  
  // Service centralisé
  const notificationService = new NotificationService(
    RepositoryFactory.getNotificationRepository()
  );

  // Récupérer les notifications système
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEYS.notifications, 'system'],
    queryFn: async () => {
      try {
        return await notificationService.getSystemNotifications();
      } catch (err) {
        console.error('useSystemNotificationsHex.getSystemNotifications failed:', err);
        throw err instanceof AppError ? err : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch system notifications');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Utiliser les mêmes mutations que le hook principal
  const {
    createNotification,
    updateNotification,
    deleteNotification,
    markAsRead,
    markAsUnread,
  } = useNotificationHex();

  const getUnreadCount = (): number => {
    return notifications.filter(notification => !notification.read).length;
  };

  return {
    notifications,
    isLoading,
    error,
    createNotification,
    updateNotification,
    deleteNotification,
    markAsRead,
    markAsUnread,
    getUnreadCount,
    refetch,
  };
}
