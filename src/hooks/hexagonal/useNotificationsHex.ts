/**
 * Hexagonal Hook: useNotificationsHex
 * 
 * Hook for notification management following hexagonal architecture
 * Uses NotificationService for business logic
 * Provides React Query integration for state management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NotificationService } from '@/application/services/NotificationService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { NotificationDTO } from '@/dtos/entities/NotificationDTO';
import { CreateNotificationRequestDTO, UpdateNotificationRequestDTO } from '@/dtos/entities/NotificationDTO';

// =================== INTERFACES ===================

export interface UseNotificationsHexResult {
  notifications: NotificationDTO[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  
  // Mutations
  createNotification: (data: CreateNotificationRequestDTO) => Promise<NotificationDTO>;
  updateNotification: (id: string, data: UpdateNotificationRequestDTO) => Promise<NotificationDTO>;
  markAsRead: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  
  // Specific queries
  getPaymentNotifications: () => Promise<NotificationDTO[]>;
  getUnreadCount: () => Promise<number>;
}

// =================== HOOK IMPLEMENTATION ===================

export function useNotificationsHex(): UseNotificationsHexResult {
  const queryClient = useQueryClient();
  
  // Initialize service with repository
  const notificationService = new NotificationService(RepositoryFactory.getNotificationRepository());

  // Get all notifications
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getAllNotifications(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get payment notifications specifically
  const getPaymentNotifications = async (): Promise<NotificationDTO[]> => {
    return notificationService.getNotificationsByType([
      'payment_due',
      'payment_completed', 
      'payment_failed',
      'payment_pending',
      'payment_blocked',
      'payment_warning'
    ]);
  };

  // Get unread count
  const getUnreadCount = async (): Promise<number> => {
    return notificationService.getUnreadCount();
  };

  // Create notification mutation
  const createNotificationMutation = useMutation({
    mutationFn: (data: CreateNotificationRequestDTO) => 
      notificationService.createNotification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: Error) => {
      console.error('Failed to create notification:', error);
    }
  });

  // Update notification mutation
  const updateNotificationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNotificationRequestDTO }) =>
      notificationService.updateNotification(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: Error) => {
      console.error('Failed to update notification:', error);
    }
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => 
      notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: Error) => {
      console.error('Failed to mark notification as read:', error);
    }
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (id: string) => 
      notificationService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: Error) => {
      console.error('Failed to delete notification:', error);
    }
  });

  return {
    notifications,
    isLoading,
    error: error?.message || null,
    refetch,
    
    createNotification: createNotificationMutation.mutateAsync,
    updateNotification: (id: string, data: UpdateNotificationRequestDTO) => 
      updateNotificationMutation.mutateAsync({ id, data }),
    markAsRead: markAsReadMutation.mutateAsync,
    deleteNotification: deleteNotificationMutation.mutateAsync,
    
    getPaymentNotifications,
    getUnreadCount
  };
}

export default useNotificationsHex;
