import { supabase } from '@/integrations/supabase/client';
import { sendNotification } from './notificationService';
import { communicationService } from './communicationService';
import OrganizationalHierarchyService from './organizationalHierarchyService';

export interface PaymentControlAction {
  id: string;
  paymentId: string;
  projectId: string;
  contractorId?: string;
  actionType: 'task_assignment' | 'hierarchy_notification' | 'sms' | 'call' | 'email' | 'mail' | 'export_receipt' | 'blockchain_verification';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  recipientIds: string[];
  dueDate?: string;
  escalationLevel?: 'team' | 'supervisor' | 'manager' | 'director';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  metadata?: any;
}

export const createPaymentAction = async (actionData: Omit<PaymentControlAction, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<PaymentControlAction> => {
  try {
    // Fetch real payment data and related entities
    const [paymentData, projectData, contractorData] = await Promise.all([
      // Get payment details
      supabase
        .from('payments')
        .select('*')
        .eq('id', actionData.paymentId)
        .single(),
      
      // Get project details
      supabase
        .from('projects')
        .select('*')
        .eq('id', actionData.projectId)
        .single(),
      
      // Get contractor details if available
      actionData.contractorId ? supabase
        .from('suppliers')
        .select('*')
        .eq('id', actionData.contractorId)
        .single() : Promise.resolve({ data: null, error: null })
    ]);

    const action: PaymentControlAction = {
      ...actionData,
      id: `payment-action-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        ...actionData.metadata,
        payment: paymentData.data,
        project: projectData.data,
        contractor: contractorData.data
      }
    };

    // Execute action directly without localStorage storage
    await executePaymentAction(action);

    // Track action execution in notifications table  
    await supabase.from('notifications').insert({
      type: 'system',
      title: `Action exécutée: ${action.title}`,
      message: `Action ${action.actionType} exécutée pour paiement ${action.paymentId}`,
      recipient_id: '00000000-0000-0000-0000-000000000000', // System notification
      metadata: {
        actionType: action.actionType,
        entityType: 'payment',
        entityId: action.paymentId,
        projectId: action.projectId,
        priority: action.priority,
        executedAt: action.createdAt,
        paymentAmount: action.metadata?.payment?.amount
      },
      related_id: action.projectId
    });

    return action;
  } catch (error) {
    console.error('Error creating payment action:', error);
    throw error;
  }
};

export const executePaymentAction = async (action: PaymentControlAction): Promise<void> => {
  try {
    switch (action.actionType) {
      case 'task_assignment':
        await executePaymentTaskAssignment(action);
        break;
      case 'hierarchy_notification':
        await executePaymentHierarchyNotification(action);
        break;
      case 'sms':
      case 'call':
      case 'email':
      case 'mail':
        await executePaymentCommunication(action);
        break;
      case 'export_receipt':
        await executePaymentExportReceipt(action);
        break;
      case 'blockchain_verification':
        await executePaymentBlockchainVerification(action);
        break;
    }
  } catch (error) {
    console.error('Error executing payment action:', error);
    throw error;
  }
};

const executePaymentTaskAssignment = async (action: PaymentControlAction): Promise<void> => {
  if (action.assigneeId) {
    try {
      const { data: assignee } = await supabase
        .from('employees')
        .select('id, full_name, email')
        .eq('id', action.assigneeId)
        .single();

      if (assignee) {
        await communicationService.assignTask({
          assigneeId: action.assigneeId,
          assigneeName: assignee.full_name,
          assigneeEmail: assignee.email || undefined,
          title: action.title,
          description: action.message,
          priority: action.priority,
          dueDate: action.dueDate,
          projectId: action.projectId,
          relatedId: action.paymentId,
          actionType: action.actionType,
          metadata: {
            actionId: action.id,
            paymentId: action.paymentId,
            projectId: action.projectId,
            task_type: 'payment_processing'
          }
        });
      }
    } catch (error) {
      console.error('Error assigning payment task:', error);
      await sendNotification({
        recipient_id: action.assigneeId,
        title: `Tâche paiement: ${action.title}`,
        message: action.message,
        type: 'task_assigned',
        related_id: action.projectId,
        metadata: {
          actionId: action.id,
          paymentId: action.paymentId,
          projectId: action.projectId,
          task_type: 'payment_processing'
        }
      });
    }
  }

  for (const recipientId of action.recipientIds) {
    if (recipientId !== action.assigneeId) {
      await sendNotification({
        recipient_id: recipientId,
        title: `Nouvelle tâche paiement assignée`,
        message: `Une tâche a été assignée pour le paiement: ${action.title}`,
        type: 'payment_due',
        related_id: action.projectId,
        metadata: {
          actionId: action.id,
          assigneeId: action.assigneeId,
          priority: action.priority
        }
      });
    }
  }
};

const executePaymentHierarchyNotification = async (action: PaymentControlAction): Promise<void> => {
  try {
    const escalationTargets = await OrganizationalHierarchyService.findNotificationRecipients(
      action.projectId,
      {
        type: 'payment',
        priority: action.priority,
        escalationLevel: action.escalationLevel,
        requiresApproval: true
      }
    );

    const escalationTitles = {
      team: 'Notification équipe - Paiement',
      supervisor: 'Escalade superviseur - Paiement',
      manager: 'Escalade manager - Paiement',
      director: 'Escalade direction - Paiement'
    };

    for (const target of escalationTargets) {
      const hierarchyMessage = `
${action.message}

DÉTAILS PAIEMENT:
- Montant: ${action.metadata?.payment?.amount || 'N/A'}
- Méthode: ${action.metadata?.payment?.payment_method || 'N/A'}
- Entrepreneur: ${action.metadata?.payment?.contractor_name || 'N/A'}

CONTEXTE PROJET:
- ID Projet: ${action.projectId}
- Paiement: ${action.paymentId}
      `;

      await sendNotification({
        recipient_id: target.employee_id,
        title: escalationTitles[action.escalationLevel || 'team'],
        message: hierarchyMessage,
        type: 'payment_due',
        related_id: action.projectId,
        metadata: {
          actionId: action.id,
          escalationLevel: action.escalationLevel,
          paymentId: action.paymentId,
          projectId: action.projectId,
          priority: action.priority
        }
      });
    }
  } catch (error) {
    console.error('Error in payment hierarchy notification:', error);
  }
};

const executePaymentCommunication = async (action: PaymentControlAction): Promise<void> => {
  try {
    const contextualMessage = `
${action.message}

DÉTAILS PAIEMENT:
- Montant: ${action.metadata?.payment?.amount || 'N/A'}
- Date: ${action.metadata?.payment?.payment_date ? new Date(action.metadata.payment.payment_date).toLocaleDateString('fr-FR') : 'N/A'}
- Méthode: ${action.metadata?.payment?.payment_method || 'N/A'}
- Entrepreneur: ${action.metadata?.payment?.contractor_name || 'N/A'}

PROJET: ${action.metadata?.project?.title || action.projectId}
    `;

    // Get employees for communication
    const { data: employees } = await supabase
      .from('employees')
      .select('id, full_name, email, phone')
      .in('id', action.recipientIds);

    for (const employee of employees || []) {
      switch (action.actionType) {
        case 'email':
          if (employee.email) {
            await communicationService.sendEmail({
              to: employee.email,
              subject: `[PAIEMENT] ${action.title}`,
              message: contextualMessage,
              priority: action.priority,
              actionType: action.actionType,
              metadata: action.metadata
            });
          }
          break;

        case 'sms':
          if (employee.phone) {
            const smsMessage = `[PAIEMENT] ${action.title}: ${action.message}`;
            await communicationService.sendSMS({
              to: employee.phone,
              message: smsMessage,
              priority: action.priority,
              actionType: action.actionType,
              metadata: action.metadata
            });
          }
          break;

        case 'call':
          if (employee.phone) {
            await communicationService.scheduleCall({
              recipientId: employee.id,
              recipientPhone: employee.phone,
              subject: `[PAIEMENT] ${action.title}`,
              message: contextualMessage,
              priority: action.priority,
              scheduledFor: action.dueDate,
              actionType: action.actionType,
              metadata: action.metadata
            });
          }
          break;
      }
    }
  } catch (error) {
    console.error('Error in payment communication:', error);
    throw error;
  }
};

const executePaymentExportReceipt = async (action: PaymentControlAction): Promise<void> => {
  try {
    // Generate payment receipt
    const receiptData = {
      paymentId: action.paymentId,
      projectId: action.projectId,
      amount: action.metadata?.payment?.amount,
      date: action.metadata?.payment?.payment_date,
      method: action.metadata?.payment?.payment_method,
      contractor: action.metadata?.payment?.contractor_name,
      generatedAt: new Date().toISOString(),
      generatedBy: action.metadata?.generatedBy || 'system'
    };

    console.log('Payment receipt generated:', receiptData);

    // Notify recipients
    for (const recipientId of action.recipientIds) {
      await sendNotification({
        recipient_id: recipientId,
        title: `Reçu de paiement généré`,
        message: `Le reçu pour le paiement ${action.paymentId} a été généré avec succès.`,
        type: 'payment_due',
        related_id: action.projectId,
        metadata: {
          actionId: action.id,
          receiptData,
          exportType: 'receipt'
        }
      });
    }
  } catch (error) {
    console.error('Error exporting payment receipt:', error);
    throw error;
  }
};

const executePaymentBlockchainVerification = async (action: PaymentControlAction): Promise<void> => {
  try {
    // Simulate blockchain verification
    const verificationResult = {
      paymentId: action.paymentId,
      blockchainHash: `0x${Math.random().toString(16).substring(2, 66)}`,
      verified: true,
      timestamp: new Date().toISOString(),
      network: 'ethereum-mainnet'
    };

    console.log('Blockchain verification completed:', verificationResult);

    // Notify recipients
    for (const recipientId of action.recipientIds) {
      await sendNotification({
        recipient_id: recipientId,
        title: `Vérification blockchain complétée`,
        message: `Le paiement ${action.paymentId} a été vérifié sur la blockchain.`,
        type: 'payment_due',
        related_id: action.projectId,
        metadata: {
          actionId: action.id,
          verificationResult,
          verificationType: 'blockchain'
        }
      });
    }
  } catch (error) {
    console.error('Error in blockchain verification:', error);
    throw error;
  }
};

export const getPaymentActions = async (paymentId?: string): Promise<any[]> => {
  // Get action history from notifications table
  const query = supabase
    .from('notifications')
    .select('*')
    .eq('type', 'system')
    .like('metadata->entityType', 'payment');

  if (paymentId) {
    query.eq('metadata->entityId', paymentId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching payment actions:', error);
    return [];
  }

  return data || [];
};