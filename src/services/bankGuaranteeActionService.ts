import { supabase } from '@/integrations/supabase/client';
import { sendNotification } from './notificationService';

export interface BankGuaranteeControlAction {
  id: string;
  bankGuaranteeId: string;
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

export const createBankGuaranteeAction = async (actionData: Omit<BankGuaranteeControlAction, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<BankGuaranteeControlAction> => {
  try {
    const action: BankGuaranteeControlAction = {
      ...actionData,
      id: `bg-action-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const existingActions = getStoredBankGuaranteeActions();
    existingActions.push(action);
    localStorage.setItem('bankGuaranteeControlActions', JSON.stringify(existingActions));

    await executeBankGuaranteeAction(action);

    return action;
  } catch (error) {
    console.error('Error creating bank guarantee action:', error);
    throw error;
  }
};

export const executeBankGuaranteeAction = async (action: BankGuaranteeControlAction): Promise<void> => {
  try {
    switch (action.actionType) {
      case 'task_assignment':
        await executeBankGuaranteeTaskAssignment(action);
        break;
      case 'hierarchy_notification':
        await executeBankGuaranteeHierarchyNotification(action);
        break;
      case 'sms':
      case 'call':
      case 'email':
      case 'mail':
        await executeBankGuaranteeCommunication(action);
        break;
    }
  } catch (error) {
    console.error('Error executing bank guarantee action:', error);
    throw error;
  }
};

const executeBankGuaranteeTaskAssignment = async (action: BankGuaranteeControlAction): Promise<void> => {
  if (action.assigneeId) {
    await sendNotification({
      recipient_id: action.assigneeId,
      title: `Tâche garantie bancaire: ${action.title}`,
      message: action.message,
      type: 'task_assigned',
      related_id: action.projectId,
      metadata: {
        actionId: action.id,
        bankGuaranteeId: action.bankGuaranteeId,
        projectId: action.projectId,
        dueDate: action.dueDate,
        priority: action.priority,
        task_type: 'bank_guarantee_resolution'
      }
    });
  }

  for (const recipientId of action.recipientIds) {
    if (recipientId !== action.assigneeId) {
      await sendNotification({
        recipient_id: recipientId,
        title: `Nouvelle tâche garantie bancaire assignée`,
        message: `Une tâche a été assignée pour gérer la garantie bancaire: ${action.title}`,
        type: 'bank_guarantee_trigger',
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

const executeBankGuaranteeHierarchyNotification = async (action: BankGuaranteeControlAction): Promise<void> => {
  const escalationTitles = {
    team: 'Notification équipe - Garantie bancaire',
    supervisor: 'Escalade superviseur - Garantie bancaire',
    manager: 'Escalade manager - Garantie bancaire',
    director: 'Escalade direction - Garantie bancaire'
  };

  for (const recipientId of action.recipientIds) {
    await sendNotification({
      recipient_id: recipientId,
      title: escalationTitles[action.escalationLevel || 'team'],
      message: action.message,
      type: 'bank_guarantee_trigger',
      related_id: action.projectId,
      metadata: {
        actionId: action.id,
        escalationLevel: action.escalationLevel,
        bankGuaranteeId: action.bankGuaranteeId,
        projectId: action.projectId,
        contractorId: action.contractorId,
        priority: action.priority
      }
    });
  }
};

const executeBankGuaranteeCommunication = async (action: BankGuaranteeControlAction): Promise<void> => {
  const communicationTitles = {
    sms: 'SMS - Garantie bancaire',
    call: 'Appel programmé - Garantie bancaire',
    email: `Email: ${action.title}`,
    mail: 'Courrier postal programmé - Garantie bancaire'
  };

  for (const recipientId of action.recipientIds) {
    await sendNotification({
      recipient_id: recipientId,
      title: communicationTitles[action.actionType],
      message: action.message,
      type: 'bank_guarantee_trigger',
      related_id: action.projectId,
      metadata: {
        actionId: action.id,
        communicationType: action.actionType,
        originalMessage: action.message,
        priority: action.priority
      }
    });
  }
};

export const getBankGuaranteeActions = (bankGuaranteeId?: string): BankGuaranteeControlAction[] => {
  const actions = getStoredBankGuaranteeActions();
  return bankGuaranteeId ? actions.filter(action => action.bankGuaranteeId === bankGuaranteeId) : actions;
};

const getStoredBankGuaranteeActions = (): BankGuaranteeControlAction[] => {
  try {
    const stored = localStorage.getItem('bankGuaranteeControlActions');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};