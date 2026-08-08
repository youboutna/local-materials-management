/**
 * Hexagonal hook for payment control actions
 * Replaces direct supabase calls in PaymentControlActions.tsx
 */

import { AuthService, getAuthService} from '@/application/services/AuthService';
import { NotificationService } from '@/application/services/NotificationService';
import { toast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation } from '@tanstack/react-query';

export interface PaymentActionRequest {
  projectId: string;
  contractorId: string;
  amount: number;
  blockingReasons?: Record<string, unknown>[];
  actionType: string;
  priority: string;
  escalationLevel?: string;
}

export interface ActionMetadata {
  userId: string;
  timestamp: string;
  source: string;
  context?: Record<string, unknown>;
}

export interface NotificationRequest {
  recipientId: string;
  title: string;
  message: string;
  type: string;
  relatedId?: string;
  metadata?: Record<string, unknown>;
}

export interface TaskAssignmentRequest {
  assigneeId: string;
  title: string;
  message: string;
  dueDate?: string;
  priority?: string;
}

export interface SmsRequest {
  recipientIds: string[];
  message: string;
}

export interface CallRequest {
  recipientIds: string[];
  message: string;
  dueDate: string;
}

export interface EmailRequest {
  recipientIds: string[];
  subject: string;
  body: string;
}

export interface ActionMetadata {
  userId: string;
  timestamp: string;
  source: string;
  context?: Record<string, unknown>;
  paymentId?: string;
}

export function usePaymentActionsHex() {
  const authService = getAuthService();
  const notificationService = new NotificationService(RepositoryFactory.getNotificationRepository());

  // Create notification mutation
  const createNotificationMutation = useMutation({
    mutationFn: async (notification: NotificationRequest) => {
      await notificationService.notifyUser(
        notification.recipientId,
        notification.title,
        notification.message,
        notification.type as any
      );
    },
    onSuccess: () => {
      toast({ title: 'Notification créée', description: 'Notification envoyée avec succès' });
    },
    onError: (error: Error | unknown) => {
      toast({ 
        title: 'Erreur', 
        description: error instanceof Error ? error.message : 'Failed to create notification', 
        variant: 'destructive' 
      });
    }
  });

  // Task assignment mutation
  const taskAssignmentMutation = useMutation({
    mutationFn: async ({ values, metadata }: { values: TaskAssignmentRequest; metadata: ActionMetadata }) => {
      const user = await authService.getCurrentUser();
      
      await notificationService.notifyUser(
        values.assigneeId,
        values.title,
        values.message,
        'info'
      );
    },
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Tâche assignée' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  // SMS notification via edge function
  const sendSmsMutation = useMutation({
    mutationFn: async ({ values, metadata }: { values: SmsRequest; metadata: ActionMetadata }) => {
      await notificationService.sendSMS({
        to: values.recipientIds,
        message: values.message
      });
    },
    onSuccess: () => {
      toast({ title: 'Succès', description: 'SMS envoyé' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  // Schedule call via edge function
  const scheduleCallMutation = useMutation({
    mutationFn: async ({ values, metadata }: { values: CallRequest; metadata: ActionMetadata }) => {
      await notificationService.scheduleCall({
        to: values.recipientIds[0],
        message: values.message,
        scheduled_at: values.dueDate
      });
    },
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Appel programmé' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  // Email notification via edge function
  const sendEmailMutation = useMutation({
    mutationFn: async ({ values, metadata }: { values: EmailRequest; metadata: ActionMetadata }) => {
      await notificationService.sendEmail({
        to: values.recipientIds,
        subject: values.subject,
        body: values.body
      });
    },
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Email envoyé' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  // Execute action based on type
  const executeAction = async (actionType: string, values: any, metadata: ActionMetadata) => {
    switch (actionType) {
      case 'task_assignment':
        return taskAssignmentMutation.mutateAsync({ values, metadata });
      case 'sms':
        return sendSmsMutation.mutateAsync({ values, metadata });
      case 'call':
        return scheduleCallMutation.mutateAsync({ values, metadata });
      case 'email':
        return sendEmailMutation.mutateAsync({ values, metadata });
      default:
        // For other types, just create notifications
        if (values.recipientIds) {
          for (const recipientId of values.recipientIds) {
            await createNotificationMutation.mutateAsync({
              recipientId,
              title: values.title || 'Action',
              message: values.message || '',
              type: 'payment_action',
              relatedId: metadata.paymentId,
              metadata: metadata as any
            });
          }
        }
    }
  };

  return {
    executeAction,
    createNotification: createNotificationMutation.mutateAsync,
    assignTask: taskAssignmentMutation.mutateAsync,
    sendSms: sendSmsMutation.mutateAsync,
    scheduleCall: scheduleCallMutation.mutateAsync,
    sendEmail: sendEmailMutation.mutateAsync,
    isPending: taskAssignmentMutation.isPending || 
               sendSmsMutation.isPending || 
               scheduleCallMutation.isPending || 
               sendEmailMutation.isPending
  };
}
