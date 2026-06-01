/**
 * Hexagonal Hook: useNotificationsHex
 *
 * Notifications du **user courant** (jamais "system" comme recipient_id —
 * la colonne est UUID et provoque un 400 PostgREST).
 *
 * Conformité PROMPTS.md :
 *  - Pas de `onError` / `onSuccess` sur useQuery / useMutation (TanStack v5).
 *    On expose `isError` / `error` et on log dans le service.
 *  - Pas de Supabase direct dans le hook : passe par NotificationService.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NotificationService } from '@/application/services/NotificationService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { NotificationDTO } from '@/dtos/entities/NotificationDTO';
import { CreateNotificationRequestDTO, UpdateNotificationRequestDTO } from '@/dtos/entities/NotificationDTO';
import { useAuth } from '@/contexts/use-auth';

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

const PAYMENT_NOTIFICATION_TYPES = [
  'payment_due',
  'payment_completed',
  'payment_failed',
  'payment_pending',
  'payment_blocked',
  'payment_warning',
] as const;

export function useNotificationsHex(): UseNotificationsHexResult {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const notificationService = new NotificationService(
    RepositoryFactory.getNotificationRepository(),
  );

  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => notificationService.getUserNotifications(userId, 100),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const getPaymentNotifications = async (): Promise<NotificationDTO[]> => {
    if (!userId) return [];
    const all = await notificationService.getUserNotifications(userId, 200);
    return all.filter((n) => PAYMENT_NOTIFICATION_TYPES.includes(n.type as typeof PAYMENT_NOTIFICATION_TYPES[number]));
  };

  const getUnreadCount = async (): Promise<number> => {
    if (!userId) return 0;
    return notificationService.getUnreadCount(userId);
  };

  // ─── Mutations (TanStack v5 : pas de onSuccess/onError callbacks) ────────
  const createNotificationMutation = useMutation({
    mutationFn: (data: CreateNotificationRequestDTO) =>
      notificationService.createNotification(data),
  });

  const updateNotificationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNotificationRequestDTO }) =>
      notificationService.updateNotification(id, data),
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await notificationService.markNotificationAsRead(id);
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      await notificationService.deleteNotification(id);
    },
  });

  // Invalidation centralisée (côté hook, pas via callbacks de mutation).
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['notifications', userId] });

  return {
    notifications,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,

    createNotification: async (data) => {
      const res = await createNotificationMutation.mutateAsync(data);
      invalidate();
      return res;
    },
    updateNotification: async (id, data) => {
      const res = await updateNotificationMutation.mutateAsync({ id, data });
      invalidate();
      return res;
    },
    markAsRead: async (id) => {
      await markAsReadMutation.mutateAsync(id);
      invalidate();
    },
    deleteNotification: async (id) => {
      await deleteNotificationMutation.mutateAsync(id);
      invalidate();
    },

    getPaymentNotifications,
    getUnreadCount,
  };
}

export default useNotificationsHex;
