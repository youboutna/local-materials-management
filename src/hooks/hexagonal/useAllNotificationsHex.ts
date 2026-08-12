/**
 * Hexagonal hook: administration de toutes les notifications (btp.notifications)
 * UI -> Hook -> NotificationService -> Repository -> DB
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NotificationService } from '@/application/services/NotificationService';
import type {
  CreateNotificationRequestDTO,
  NotificationDTO,
  UpdateNotificationRequestDTO,
} from '@/dtos/entities/NotificationDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';

export function useAllNotificationsHex(limit = 200) {
  const queryClient = useQueryClient();
  const service = new NotificationService(RepositoryFactory.getNotificationRepository());

  const query = useQuery<NotificationDTO[]>({
    queryKey: ['notifications', 'all', limit],
    queryFn: () => service.getAllNotifications(limit),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['notifications'] });

  const createMutation = useMutation({
    mutationFn: (data: CreateNotificationRequestDTO) => service.createNotification(data),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNotificationRequestDTO }) =>
      service.updateNotification(id, data),
    onSuccess: invalidate,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => service.markNotificationAsRead(id),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => service.deleteNotification(id),
    onSuccess: invalidate,
  });

  return {
    notifications: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
    createNotification: createMutation.mutateAsync,
    updateNotification: updateMutation.mutateAsync,
    markAsRead: markAsReadMutation.mutateAsync,
    deleteNotification: deleteMutation.mutateAsync,
    isSaving:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
  };
}
