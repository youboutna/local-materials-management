/**
 * Hexagonal hook for payment control actions
 * Replaces direct supabase calls in PaymentControlActions.tsx
 */

import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
      const { error } = await supabase
        .from('notifications')
        .insert({
          recipient_id: recipientId,
          title,
          message,
          type,
          related_id: relatedId,
          metadata
        });
      if (error) throw error;
    }
  });

  // Task assignment mutation
  const taskAssignmentMutation = useMutation({
    mutationFn: async ({ values, metadata }: { values: any; metadata: ActionMetadata }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('notifications')
        .insert({
          recipient_id: values.assigneeId,
          title: values.title,
          message: values.message,
          type: 'task_assignment',
          related_id: metadata.paymentId,
          metadata: {
            ...metadata,
            actionType: 'task_assignment',
            dueDate: values.dueDate,
            assignedBy: user?.id || 'system'
          }
        });
      
      if (error) throw error;
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
      const { error } = await supabase.functions.invoke('send-sms-notification', {
        body: {
          recipients: values.recipientIds,
          message: values.message,
          priority: values.priority,
          relatedTo: { type: 'payment', id: metadata.paymentId }
        }
      });
      if (error) throw error;
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
      const { error } = await supabase.functions.invoke('schedule-call', {
        body: {
          recipients: values.recipientIds,
          message: values.message,
          scheduledFor: values.dueDate,
          relatedTo: { type: 'payment', id: metadata.paymentId }
        }
      });
      if (error) throw error;
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
      const { error } = await supabase.functions.invoke('send-email-notification', {
        body: {
          recipients: values.recipientIds,
          subject: values.title,
          message: values.message,
          priority: values.priority,
          relatedTo: { type: 'payment', id: metadata.paymentId }
        }
      });
      if (error) throw error;
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
