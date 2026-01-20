/**
 * Hexagonal hook for payment control actions
 * Replaces direct supabase calls in PaymentControlActions.tsx
 */

import { useMutation } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { AuthService } from '@/application/services/AuthService';
import { NotificationService } from '@/application/services/NotificationService';
import { toast } from '@/hooks/use-toast';

interface ActionMetadata {
  paymentId: string;
  projectId: string;
  contractorId: string;
  amount: number;
  blockingReasons?: any[];
  actionType: string;
  priority: string;
  escalationLevel?: string;
  dueDate?: string;
}

export function usePaymentActionsHex() {
  const authService = new AuthService(RepositoryFactory.getAuthRepository());
  const notificationService = new NotificationService(RepositoryFactory.getNotificationRepository());

  // Create notification mutation
  const createNotificationMutation = useMutation({
    mutationFn: async ({ recipientId, title, message, type, relatedId, metadata }: {
      recipientId: string;
      title: string;
      message: string;
      type: string;
      relatedId: string;
      metadata?: any;
    }) => {
      await notificationService.notifyUser(recipientId, title, message, type as any);
    }
  });

  // Task assignment mutation
  const taskAssignmentMutation = useMutation({
    mutationFn: async ({ values, metadata }: { values: any; metadata: ActionMetadata }) => {
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
    mutationFn: async ({ values, metadata }: { values: any; metadata: ActionMetadata }) => {
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
    mutationFn: async ({ values, metadata }: { values: any; metadata: ActionMetadata }) => {
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
    mutationFn: async ({ values, metadata }: { values: any; metadata: ActionMetadata }) => {
      await notificationService.sendEmail({
        to: values.recipientIds,
        subject: values.title,
        body: values.message
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
        for (const recipientId of values.recipientIds) {
          await createNotificationMutation.mutateAsync({
            recipientId,
            title: values.title,
            message: values.message,
            type: 'payment_action',
            relatedId: metadata.paymentId,
            metadata
          });
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
