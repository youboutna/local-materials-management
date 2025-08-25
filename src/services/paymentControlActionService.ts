import { supabase } from '@/integrations/supabase/client';
import { sendNotification } from './notificationService';

export interface PaymentControlAction {
  id: string;
  paymentId: string;
  projectId: string;
  contractorId: string;
  actionType: 'task_assignment' | 'hierarchy_notification' | 'sms' | 'call' | 'email' | 'mail';
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

export const createPaymentControlAction = async (actionData: Omit<PaymentControlAction, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<PaymentControlAction> => {
  try {
    const action: PaymentControlAction = {
      ...actionData,
      id: `action-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store action in local storage for now (would be database in production)
    const existingActions = getStoredActions();
    existingActions.push(action);
    localStorage.setItem('paymentControlActions', JSON.stringify(existingActions));

    // Execute the action based on type
    await executeAction(action);

    return action;
  } catch (error) {
    console.error('Error creating payment control action:', error);
    throw error;
  }
};

export const executeAction = async (action: PaymentControlAction): Promise<void> => {
  try {
    switch (action.actionType) {
      case 'task_assignment':
        await executeTaskAssignment(action);
        break;
      case 'hierarchy_notification':
        await executeHierarchyNotification(action);
        break;
      case 'sms':
        await executeSMSAction(action);
        break;
      case 'call':
        await executeCallAction(action);
        break;
      case 'email':
        await executeEmailAction(action);
        break;
      case 'mail':
        await executeMailAction(action);
        break;
    }
  } catch (error) {
    console.error('Error executing action:', error);
    throw error;
  }
};

const executeTaskAssignment = async (action: PaymentControlAction): Promise<void> => {
  console.log('Executing task assignment:', action);
  
  // Create task assignment notification
  if (action.assigneeId) {
    await sendNotification({
      recipient_id: action.assigneeId,
      title: `Tâche assignée: ${action.title}`,
      message: action.message,
      type: 'task_assigned',
      related_id: action.paymentId,
      metadata: {
        actionId: action.id,
        paymentId: action.paymentId,
        projectId: action.projectId,
        dueDate: action.dueDate,
        priority: action.priority,
        task_type: 'payment_resolution'
      }
    });
  }

  // Notify all recipients
  for (const recipientId of action.recipientIds) {
    if (recipientId !== action.assigneeId) {
      await sendNotification({
        recipient_id: recipientId,
        title: `Nouvelle tâche de paiement assignée`,
        message: `Une tâche a été assignée pour résoudre les problèmes de paiement: ${action.title}`,
        type: 'project_update',
        related_id: action.paymentId,
        metadata: {
          actionId: action.id,
          assigneeId: action.assigneeId,
          priority: action.priority
        }
      });
    }
  }
};

const executeHierarchyNotification = async (action: PaymentControlAction): Promise<void> => {
  console.log('Executing hierarchy notification:', action);
  
  const escalationTitles = {
    team: 'Notification équipe',
    supervisor: 'Escalade superviseur',
    manager: 'Escalade manager',
    director: 'Escalade direction'
  };

  for (const recipientId of action.recipientIds) {
    await sendNotification({
      recipient_id: recipientId,
      title: escalationTitles[action.escalationLevel || 'team'],
      message: action.message,
      type: 'compliance_alert',
      related_id: action.paymentId,
      metadata: {
        actionId: action.id,
        escalationLevel: action.escalationLevel,
        paymentId: action.paymentId,
        projectId: action.projectId,
        contractorId: action.contractorId,
        priority: action.priority
      }
    });
  }
};

const executeSMSAction = async (action: PaymentControlAction): Promise<void> => {
  console.log('Executing SMS action:', action);
  
  // In a real implementation, this would integrate with an SMS service
  for (const recipientId of action.recipientIds) {
    await sendNotification({
      recipient_id: recipientId,
      title: 'SMS - Contrôle de paiement',
      message: `SMS envoyé: ${action.message}`,
      type: 'project_update',
      related_id: action.paymentId,
      metadata: {
        actionId: action.id,
        communicationType: 'sms',
        originalMessage: action.message
      }
    });
  }
};

const executeCallAction = async (action: PaymentControlAction): Promise<void> => {
  console.log('Executing call action:', action);
  
  for (const recipientId of action.recipientIds) {
    await sendNotification({
      recipient_id: recipientId,
      title: 'Appel programmé - Contrôle de paiement',
      message: `Appel prévu concernant: ${action.message}`,
      type: 'project_update',
      related_id: action.paymentId,
      metadata: {
        actionId: action.id,
        communicationType: 'call',
        callReason: action.message,
        priority: action.priority
      }
    });
  }
};

const executeEmailAction = async (action: PaymentControlAction): Promise<void> => {
  console.log('Executing email action:', action);
  
  // In a real implementation, this would send actual emails
  for (const recipientId of action.recipientIds) {
    await sendNotification({
      recipient_id: recipientId,
      title: `Email: ${action.title}`,
      message: action.message,
      type: 'project_update',
      related_id: action.paymentId,
      metadata: {
        actionId: action.id,
        communicationType: 'email',
        emailSubject: action.title,
        priority: action.priority
      }
    });
  }
};

const executeMailAction = async (action: PaymentControlAction): Promise<void> => {
  console.log('Executing mail action:', action);
  
  for (const recipientId of action.recipientIds) {
    await sendNotification({
      recipient_id: recipientId,
      title: 'Courrier postal programmé',
      message: `Courrier postal préparé: ${action.message}`,
      type: 'project_update',
      related_id: action.paymentId,
      metadata: {
        actionId: action.id,
        communicationType: 'mail',
        mailContent: action.message,
        priority: action.priority
      }
    });
  }
};

export const getPaymentControlActions = (paymentId?: string): PaymentControlAction[] => {
  const actions = getStoredActions();
  return paymentId ? actions.filter(action => action.paymentId === paymentId) : actions;
};

export const updateActionStatus = (actionId: string, status: PaymentControlAction['status']): void => {
  const actions = getStoredActions();
  const actionIndex = actions.findIndex(action => action.id === actionId);
  
  if (actionIndex !== -1) {
    actions[actionIndex].status = status;
    actions[actionIndex].updatedAt = new Date().toISOString();
    localStorage.setItem('paymentControlActions', JSON.stringify(actions));
  }
};

const getStoredActions = (): PaymentControlAction[] => {
  try {
    const stored = localStorage.getItem('paymentControlActions');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const getHierarchyUsers = async (escalationLevel: string): Promise<Array<{id: string, name: string, role: string}>> => {
  // Mock data - in real implementation, this would query user roles
  const hierarchyMap = {
    team: [
      { id: 'user-001', name: 'Jean Dupont', role: 'Gestionnaire de projet' },
      { id: 'user-002', name: 'Marie Martin', role: 'Contrôleur financier' }
    ],
    supervisor: [
      { id: 'user-003', name: 'Pierre Supervisor', role: 'Superviseur' },
    ],
    manager: [
      { id: 'user-004', name: 'Claire Manager', role: 'Manager' },
    ],
    director: [
      { id: 'user-005', name: 'Robert Director', role: 'Directeur' },
    ]
  };

  return hierarchyMap[escalationLevel as keyof typeof hierarchyMap] || [];
};