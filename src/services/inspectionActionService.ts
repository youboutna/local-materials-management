import { supabase } from '@/integrations/supabase/client';
import { sendNotification } from './notificationService';

export interface InspectionControlAction {
  id: string;
  inspectionId: string;
  projectId: string;
  inspectorId: string;
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

export const createInspectionAction = async (actionData: Omit<InspectionControlAction, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<InspectionControlAction> => {
  try {
    const action: InspectionControlAction = {
      ...actionData,
      id: `insp-action-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const existingActions = getStoredInspectionActions();
    existingActions.push(action);
    localStorage.setItem('inspectionControlActions', JSON.stringify(existingActions));

    await executeInspectionAction(action);

    return action;
  } catch (error) {
    console.error('Error creating inspection action:', error);
    throw error;
  }
};

export const executeInspectionAction = async (action: InspectionControlAction): Promise<void> => {
  try {
    switch (action.actionType) {
      case 'task_assignment':
        await executeInspectionTaskAssignment(action);
        break;
      case 'hierarchy_notification':
        await executeInspectionHierarchyNotification(action);
        break;
      case 'sms':
      case 'call':
      case 'email':
      case 'mail':
        await executeInspectionCommunication(action);
        break;
    }
  } catch (error) {
    console.error('Error executing inspection action:', error);
    throw error;
  }
};

const executeInspectionTaskAssignment = async (action: InspectionControlAction): Promise<void> => {
  if (action.assigneeId) {
    await sendNotification({
      recipient_id: action.assigneeId,
      title: `Tâche inspection: ${action.title}`,
      message: action.message,
      type: 'task_assigned',
      related_id: action.inspectionId,
      metadata: {
        actionId: action.id,
        inspectionId: action.inspectionId,
        projectId: action.projectId,
        dueDate: action.dueDate,
        priority: action.priority,
        task_type: 'inspection_follow_up'
      }
    });
  }

  for (const recipientId of action.recipientIds) {
    if (recipientId !== action.assigneeId) {
      await sendNotification({
        recipient_id: recipientId,
        title: `Nouvelle tâche d'inspection assignée`,
        message: `Une tâche d'inspection a été assignée: ${action.title}`,
        type: 'inspection_required',
        related_id: action.inspectionId,
        metadata: {
          actionId: action.id,
          assigneeId: action.assigneeId,
          priority: action.priority
        }
      });
    }
  }
};

const executeInspectionHierarchyNotification = async (action: InspectionControlAction): Promise<void> => {
  const escalationTitles = {
    team: 'Notification équipe - Inspection',
    supervisor: 'Escalade superviseur - Inspection',
    manager: 'Escalade manager - Inspection',
    director: 'Escalade direction - Inspection'
  };

  for (const recipientId of action.recipientIds) {
    await sendNotification({
      recipient_id: recipientId,
      title: escalationTitles[action.escalationLevel || 'team'],
      message: action.message,
      type: 'inspection_overdue',
      related_id: action.inspectionId,
      metadata: {
        actionId: action.id,
        escalationLevel: action.escalationLevel,
        inspectionId: action.inspectionId,
        projectId: action.projectId,
        inspectorId: action.inspectorId,
        priority: action.priority
      }
    });
  }
};

const executeInspectionCommunication = async (action: InspectionControlAction): Promise<void> => {
  const communicationTitles = {
    sms: 'SMS - Suivi inspection',
    call: 'Appel programmé - Inspection',
    email: `Email: ${action.title}`,
    mail: 'Courrier postal programmé - Inspection'
  };

  for (const recipientId of action.recipientIds) {
    await sendNotification({
      recipient_id: recipientId,
      title: communicationTitles[action.actionType],
      message: action.message,
      type: 'inspection_required',
      related_id: action.inspectionId,
      metadata: {
        actionId: action.id,
        communicationType: action.actionType,
        originalMessage: action.message,
        priority: action.priority
      }
    });
  }
};

export const getInspectionActions = (inspectionId?: string): InspectionControlAction[] => {
  const actions = getStoredInspectionActions();
  return inspectionId ? actions.filter(action => action.inspectionId === inspectionId) : actions;
};

const getStoredInspectionActions = (): InspectionControlAction[] => {
  try {
    const stored = localStorage.getItem('inspectionControlActions');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};