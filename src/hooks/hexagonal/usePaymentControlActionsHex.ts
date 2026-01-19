import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';

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

export const usePaymentControlActionsHex = () => {
  const queryClient = useQueryClient();

  // Task assignment mutation
  const taskAssignmentMutation = useMutation({
    mutationFn: async ({ values, metadata }: { values: ActionFormData; metadata: ActionMetadata }) => {
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
            priority: values.priority,
            assignedBy: user?.id
          }
        });

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Tâche assignée avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Hierarchy notification mutation
  const hierarchyNotificationMutation = useMutation({
    mutationFn: async ({ values, metadata }: { values: ActionFormData; metadata: ActionMetadata }) => {
      const { data: hierarchy } = await supabase
        .rpc('get_escalation_targets', { 
          project_id_param: metadata.projectId, 
          escalation_level_param: values.escalationLevel 
        });

      // Send notifications to hierarchy
      for (const member of (hierarchy || [])) {
        await supabase
          .from('notifications')
          .insert({
            recipient_id: member.employee_id,
            title: values.title,
            message: values.message,
            type: 'hierarchy_notification',
            related_id: metadata.paymentId,
            metadata: {
              ...metadata,
              escalationLevel: values.escalationLevel,
              hierarchyPosition: member.position_title
            }
          });
      }

      return { success: true, hierarchy };
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Notification hiérarchique envoyée avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // SMS notification mutation
  const smsNotificationMutation = useMutation({
    mutationFn: async ({ values, metadata }: { values: ActionFormData; metadata: ActionMetadata }) => {
      const { error } = await supabase.functions.invoke('send-sms-notification', {
        body: {
          recipients: values.recipientIds,
          message: values.message,
          priority: values.priority,
          metadata: {
            ...metadata,
            paymentId: metadata.paymentId,
            actionType: 'sms'
          }
        }
      });

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "SMS envoyé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Call action mutation
  const callActionMutation = useMutation({
    mutationFn: async ({ values, metadata }: { values: ActionFormData; metadata: ActionMetadata }) => {
      const { error } = await supabase.functions.invoke('schedule-call', {
        body: {
          recipients: values.recipientIds,
          subject: values.title,
          notes: values.message,
          priority: values.priority,
          metadata: {
            ...metadata,
            paymentId: metadata.paymentId,
            actionType: 'call'
          }
        }
      });

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Appel programmé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Email action mutation
  const emailActionMutation = useMutation({
    mutationFn: async ({ values, metadata }: { values: ActionFormData; metadata: ActionMetadata }) => {
      const { error } = await supabase.functions.invoke('send-email-notification', {
        body: {
          recipients: values.recipientIds,
          subject: values.title,
          message: values.message,
          priority: values.priority,
          notificationChannels: values.notificationChannels,
          metadata: {
            ...metadata,
            paymentId: metadata.paymentId,
            actionType: 'email'
          }
        }
      });

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Email envoyé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mail action mutation
  const mailActionMutation = useMutation({
    mutationFn: async ({ values, metadata }: { values: ActionFormData; metadata: ActionMetadata }) => {
      const { error } = await supabase
        .from('notifications')
        .insert({
          recipient_id: values.recipientIds[0], // First recipient for mail
          title: values.title,
          message: values.message,
          type: 'postal_mail',
          related_id: metadata.paymentId,
          metadata: {
            ...metadata,
            actionType: 'mail',
            allRecipients: values.recipientIds,
            requiresPhysicalDelivery: true
          }
        });

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Courrier postal créé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Execute action based on type
  const executeAction = async (values: ActionFormData, metadata: ActionMetadata) => {
    switch (values.actionType) {
      case 'task_assignment':
        return await taskAssignmentMutation.mutateAsync({ values, metadata });
      case 'hierarchy_notification':
        return await hierarchyNotificationMutation.mutateAsync({ values, metadata });
      case 'sms':
        return await smsNotificationMutation.mutateAsync({ values, metadata });
      case 'call':
        return await callActionMutation.mutateAsync({ values, metadata });
      case 'email':
        return await emailActionMutation.mutateAsync({ values, metadata });
      case 'mail':
        return await mailActionMutation.mutateAsync({ values, metadata });
      default:
        throw new Error(`Action type not supported: ${values.actionType}`);
    }
  };

  return {
    taskAssignmentMutation,
    hierarchyNotificationMutation,
    smsNotificationMutation,
    callActionMutation,
    emailActionMutation,
    mailActionMutation,
    executeAction,
    isLoading: taskAssignmentMutation.isPending || 
              hierarchyNotificationMutation.isPending || 
              smsNotificationMutation.isPending || 
              callActionMutation.isPending || 
              emailActionMutation.isPending || 
              mailActionMutation.isPending,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  };
};
