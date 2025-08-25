import { supabase } from '@/integrations/supabase/client';
import { sendNotification } from './notificationService';

export interface InsuranceControlAction {
  id: string;
  insuranceId: string;
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

export const createInsuranceAction = async (actionData: Omit<InsuranceControlAction, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<InsuranceControlAction> => {
  try {
    const action: InsuranceControlAction = {
      ...actionData,
      id: `ins-action-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const existingActions = getStoredInsuranceActions();
    existingActions.push(action);
    localStorage.setItem('insuranceControlActions', JSON.stringify(existingActions));

    await executeInsuranceAction(action);

    return action;
  } catch (error) {
    console.error('Error creating insurance action:', error);
    throw error;
  }
};

export const executeInsuranceAction = async (action: InsuranceControlAction): Promise<void> => {
  try {
    switch (action.actionType) {
      case 'task_assignment':
        await executeInsuranceTaskAssignment(action);
        break;
      case 'hierarchy_notification':
        await executeInsuranceHierarchyNotification(action);
        break;
      case 'sms':
      case 'call':
      case 'email':
      case 'mail':
        await executeInsuranceCommunication(action);
        break;
    }
  } catch (error) {
    console.error('Error executing insurance action:', error);
    throw error;
  }
};

const executeInsuranceTaskAssignment = async (action: InsuranceControlAction): Promise<void> => {
  if (action.assigneeId) {
    await sendNotification({
      recipient_id: action.assigneeId,
      title: `Tâche assurance: ${action.title}`,
      message: action.message,
      type: 'task_assigned',
      related_id: action.insuranceId,
      metadata: {
        actionId: action.id,
        insuranceId: action.insuranceId,
        projectId: action.projectId,
        dueDate: action.dueDate,
        priority: action.priority,
        task_type: 'insurance_renewal'
      }
    });
  }

  for (const recipientId of action.recipientIds) {
    if (recipientId !== action.assigneeId) {
      await sendNotification({
        recipient_id: recipientId,
        title: `Nouvelle tâche d'assurance assignée`,
        message: `Une tâche d'assurance a été assignée: ${action.title}`,
        type: 'insurance_expiry',
        related_id: action.insuranceId,
        metadata: {
          actionId: action.id,
          assigneeId: action.assigneeId,
          priority: action.priority
        }
      });
    }
  }
};

const executeInsuranceHierarchyNotification = async (action: InsuranceControlAction): Promise<void> => {
  const escalationTitles = {
    team: 'Notification équipe - Assurance',
    supervisor: 'Escalade superviseur - Assurance',
    manager: 'Escalade manager - Assurance',
    director: 'Escalade direction - Assurance'
  };

  for (const recipientId of action.recipientIds) {
    await sendNotification({
      recipient_id: recipientId,
      title: escalationTitles[action.escalationLevel || 'team'],
      message: action.message,
      type: 'insurance_expiry',
      related_id: action.insuranceId,
      metadata: {
        actionId: action.id,
        escalationLevel: action.escalationLevel,
        insuranceId: action.insuranceId,
        projectId: action.projectId,
        contractorId: action.contractorId,
        priority: action.priority
      }
    });
  }
};

const executeInsuranceCommunication = async (action: InsuranceControlAction): Promise<void> => {
  const communicationTitles = {
    sms: 'SMS - Renouvellement assurance',
    call: 'Appel programmé - Assurance',
    email: `Email: ${action.title}`,
    mail: 'Courrier postal programmé - Assurance'
  };

  for (const recipientId of action.recipientIds) {
    await sendNotification({
      recipient_id: recipientId,
      title: communicationTitles[action.actionType],
      message: action.message,
      type: 'insurance_update',
      related_id: action.insuranceId,
      metadata: {
        actionId: action.id,
        communicationType: action.actionType,
        originalMessage: action.message,
        priority: action.priority
      }
    });
  }
};

export const getInsuranceActions = (insuranceId?: string): InsuranceControlAction[] => {
  const actions = getStoredInsuranceActions();
  return insuranceId ? actions.filter(action => action.insuranceId === insuranceId) : actions;
};

const getStoredInsuranceActions = (): InsuranceControlAction[] => {
  try {
    const stored = localStorage.getItem('insuranceControlActions');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};