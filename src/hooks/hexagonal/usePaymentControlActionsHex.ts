import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import { PaymentControlActionsService } from '@/application/services/PaymentControlActionsService';
import type { ActionFormData, ActionMetadata } from '@/application/services/PaymentControlActionsService';

export const actionFormSchema = z.object({
  actionType: z.enum(['task_assignment', 'hierarchy_notification', 'sms', 'call', 'email', 'mail']),
  assigneeId: z.string().optional(),
  recipientIds: z.array(z.string()).min(1, 'Au moins un destinataire requis'),
  title: z.string().min(1, 'Titre requis'),
  message: z.string().min(1, 'Message requis'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  dueDate: z.string().optional(),
  escalationLevel: z.enum(['team', 'supervisor', 'manager', 'director']).optional(),
  documentReferences: z.array(z.string()).optional(),
  followUpRequired: z.boolean().default(false),
  notificationChannels: z.array(z.string()).optional()
});

export type ActionFormData = z.infer<typeof actionFormSchema>;

export interface PaymentControlActionsProps {
  paymentId: string;
  projectId: string;
  contractorId: string;
  amount: number;
  blockingReasons?: Array<{
    reason: string;
    description: string;
    severity: 'warning' | 'blocking';
  }>;
}

export interface ActionMetadata {
  paymentId: string;
  projectId: string;
  contractorId: string;
  amount: number;
  blockingReasons?: Array<{
    reason: string;
    description: string;
    severity: 'warning' | 'blocking';
  }>;
  actionType: string;
  priority: string;
  escalationLevel?: string;
  dueDate?: string;
  documentReferences?: string[];
  followUpRequired?: boolean;
  notificationChannels?: string[];
}

export const usePaymentControlActionsHex = (props: PaymentControlActionsProps) => {
  const queryClient = useQueryClient();
  const paymentControlService = PaymentControlActionsService.create();

  // Task assignment mutation
  const taskAssignmentMutation = useMutation({
    mutationFn: async ({ values, metadata }: { values: ActionFormData; metadata: ActionMetadata }) => {
      await paymentControlService.createTaskAssignment(values, metadata);
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Tâche assignée',
        description: 'La tâche a été assignée avec succès',
      });
      queryClient.invalidateQueries({ queryKey: ['payment-actions', props.paymentId] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur d\'assignation',
        description: 'Impossible d\'assigner la tâche',
        variant: 'destructive',
      });
    }
  });

  // Hierarchy notification mutation
  const hierarchyNotificationMutation = useMutation({
    mutationFn: async ({ values, metadata }: { values: ActionFormData; metadata: ActionMetadata }) => {
      await paymentControlService.createHierarchyNotification(values, metadata);
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Notification hiérarchique envoyée',
        description: 'La notification a été envoyée à la hiérarchie',
      });
      queryClient.invalidateQueries({ queryKey: ['payment-actions', props.paymentId] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur de notification',
        description: 'Impossible d\'envoyer la notification hiérarchique',
        variant: 'destructive',
      });
    }
  });

  // SMS notification mutation
  const smsNotificationMutation = useMutation({
    mutationFn: async ({ values, metadata }: { values: ActionFormData; metadata: ActionMetadata }) => {
      await paymentControlService.sendSMSNotification(values, metadata);
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'SMS envoyé',
        description: 'La notification SMS a été envoyée',
      });
      queryClient.invalidateQueries({ queryKey: ['payment-actions', props.paymentId] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur SMS',
        description: 'Impossible d\'envoyer le SMS',
        variant: 'destructive',
      });
    }
  });

  // Call action mutation
  const callActionMutation = useMutation({
    mutationFn: async ({ values, metadata }: { values: ActionFormData; metadata: ActionMetadata }) => {
      await paymentControlService.scheduleCall(values, metadata);
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Appel programmé',
        description: 'L\'appel a été programmé avec succès',
      });
      queryClient.invalidateQueries({ queryKey: ['payment-actions', props.paymentId] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur d\'appel',
        description: 'Impossible de programmer l\'appel',
        variant: 'destructive',
      });
    }
  });

  // Email action mutation
  const emailActionMutation = useMutation({
    mutationFn: async ({ values, metadata }: { values: ActionFormData; metadata: ActionMetadata }) => {
      await paymentControlService.sendEmailNotification(values, metadata);
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Email envoyé',
        description: 'L\'email a été envoyé avec succès',
      });
      queryClient.invalidateQueries({ queryKey: ['payment-actions', props.paymentId] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur email',
        description: 'Impossible d\'envoyer l\'email',
        variant: 'destructive',
      });
    }
  });

  // Mail action mutation
  const mailActionMutation = useMutation({
    mutationFn: async ({ values, metadata }: { values: ActionFormData; metadata: ActionMetadata }) => {
      await paymentControlService.createMailAction(values, metadata);
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Courrier envoyé',
        description: 'Le courrier a été envoyé avec succès',
      });
      queryClient.invalidateQueries({ queryKey: ['payment-actions', props.paymentId] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur courrier',
        description: 'Impossible d\'envoyer le courrier',
        variant: 'destructive',
      });
    }
  });

  // Get action type handler
  const getActionHandler = (actionType: string) => {
    switch (actionType) {
      case 'task_assignment':
        return taskAssignmentMutation;
      case 'hierarchy_notification':
        return hierarchyNotificationMutation;
      case 'sms':
        return smsNotificationMutation;
      case 'call':
        return callActionMutation;
      case 'email':
        return emailActionMutation;
      case 'mail':
        return mailActionMutation;
      default:
        throw new Error(`Action type not supported: ${actionType}`);
    }
  };

  // Execute action based on type
  const executeAction = (values: ActionFormData) => {
    const metadata: ActionMetadata = {
      paymentId: props.paymentId,
      projectId: props.projectId,
      contractorId: props.contractorId,
      amount: props.amount,
      blockingReasons: props.blockingReasons,
      actionType: values.actionType,
      priority: values.priority,
      escalationLevel: values.escalationLevel,
      dueDate: values.dueDate,
      documentReferences: values.documentReferences,
      followUpRequired: values.followUpRequired,
      notificationChannels: values.notificationChannels
    };

    const handler = getActionHandler(values.actionType);
    return handler.mutateAsync({ values, metadata });
  };

  return {
    // Mutations
    taskAssignmentMutation,
    hierarchyNotificationMutation,
    smsNotificationMutation,
    callActionMutation,
    emailActionMutation,
    mailActionMutation,

    // Utilities
    executeAction,
    getActionHandler,

    // Loading states
    isLoading: 
      taskAssignmentMutation.isPending ||
      hierarchyNotificationMutation.isPending ||
      smsNotificationMutation.isPending ||
      callActionMutation.isPending ||
      emailActionMutation.isPending ||
      mailActionMutation.isPending,

    // Error states
    errors: {
      taskAssignment: taskAssignmentMutation.error,
      hierarchyNotification: hierarchyNotificationMutation.error,
      sms: smsNotificationMutation.error,
      call: callActionMutation.error,
      email: emailActionMutation.error,
      mail: mailActionMutation.error
    }
  };
};
