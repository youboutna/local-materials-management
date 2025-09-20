import { supabase } from '@/integrations/supabase/client';
import { sendNotification } from './notificationService';
import { communicationService } from './communicationService';
import OrganizationalHierarchyService from './organizationalHierarchyService';

export interface InspectionControlAction {
  id: string;
  inspectionId: string;
  projectId: string;
  inspectorId?: string;
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

export const createInspectionAction = async (actionData: Omit<InspectionControlAction, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<InspectionControlAction> => {
  try {
    // Fetch real project and inspection data
    const [projectData, inspectionData, projectEmployees, inspectionDocuments] = await Promise.all([
      // Get project details
      supabase
        .from('projects')
        .select('*')
        .eq('id', actionData.projectId)
        .single(),
      
      // Get inspection details
      supabase
        .from('inspections')
        .select('*')
        .eq('id', actionData.inspectionId)
        .single(),
      
      // Get project team members
      supabase
        .from('employees')
        .select('id, full_name, email, phone, position, department')
        .eq('is_active', true),
      
      // Get inspection documents
      supabase
        .from('documents')
        .select('*')
        .eq('inspection_id', actionData.inspectionId)
    ]);

    const action: InspectionControlAction = {
      ...actionData,
      id: `insp-action-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        ...actionData.metadata,
        project: projectData.data,
        inspection: inspectionData.data,
        availableEmployees: projectEmployees.data || [],
        relatedDocuments: inspectionDocuments.data || []
      }
    };

    // Execute action immediately - no need for localStorage
    await executeInspectionAction(action);

    // Track action in notifications table
    await supabase.from('notifications').insert({
      type: 'system',
      title: `Action exécutée: ${action.title}`,
      message: `Action ${action.actionType} exécutée pour inspection ${action.inspectionId}`,
      recipient_id: '00000000-0000-0000-0000-000000000000', // System notification
      metadata: {
        actionType: action.actionType,
        entityType: 'inspection',
        entityId: action.inspectionId,
        projectId: action.projectId,
        priority: action.priority,
        executedAt: action.createdAt
      },
      related_id: action.inspectionId
    });

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
    try {
      // Get assignee details
      const { data: assignee } = await supabase
        .from('employees')
        .select('id, full_name, email')
        .eq('id', action.assigneeId)
        .single();

      if (assignee) {
        // Use the communication service to assign task
        await communicationService.assignTask({
          assigneeId: action.assigneeId,
          assigneeName: assignee.full_name,
          assigneeEmail: assignee.email || undefined,
          title: action.title,
          description: action.message,
          priority: action.priority,
          dueDate: action.dueDate,
          projectId: action.projectId,
          relatedId: action.inspectionId,
          actionType: action.actionType,
          metadata: {
            actionId: action.id,
            inspectionId: action.inspectionId,
            projectId: action.projectId,
            task_type: 'inspection_follow_up'
          }
        });
      }
    } catch (error) {
      console.error('Error assigning inspection task:', error);
      // Fallback to notification only
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
  try {
    // Get organizational hierarchy for inspection-related notifications
    const escalationTargets = await OrganizationalHierarchyService.findNotificationRecipients(
      action.projectId,
      {
        type: 'inspection',
        priority: action.priority,
        escalationLevel: action.escalationLevel,
        department: 'construction'
      }
    );

    const escalationTitles = {
      team: 'Notification équipe - Inspection',
      supervisor: 'Escalade superviseur - Inspection',  
      manager: 'Escalade manager - Inspection',
      director: 'Escalade direction - Inspection'
    };

    for (const target of escalationTargets) {
      await sendNotification({
        recipient_id: target.employee_id,
        title: escalationTitles[action.escalationLevel || 'team'],
        message: `${action.message}\n\nInspection: ${action.inspectionId}\nProjet: ${action.projectId}\nNiveau: ${target.hierarchy_level}`,
        type: 'inspection_overdue',
        related_id: action.inspectionId,
        metadata: {
          actionId: action.id,
          escalationLevel: action.escalationLevel,
          inspectionId: action.inspectionId,
          projectId: action.projectId,
          inspectorId: action.inspectorId,
          priority: action.priority,
          hierarchyLevel: target.hierarchy_level,
          targetPosition: target.position_title
        }
      });
    }
  } catch (error) {
    console.error('Error in inspection hierarchy notification:', error);
  }
};

const executeInspectionCommunication = async (action: InspectionControlAction): Promise<void> => {
  try {
    // Get employee details for communication
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
              subject: action.title,
              message: action.message,
              priority: action.priority,
              actionType: action.actionType,
              metadata: {
                ...action.metadata,
                actionId: action.id,
                inspectionId: action.inspectionId,
                projectId: action.projectId
              }
            });
          }
          break;

        case 'sms':
          if (employee.phone) {
            await communicationService.sendSMS({
              to: employee.phone,
              message: action.message,
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
              subject: action.title,
              message: action.message,
              priority: action.priority,
              scheduledFor: action.dueDate,
              actionType: action.actionType,
              metadata: action.metadata
            });
          }
          break;
      }

      // Still send notification for tracking
      await sendNotification({
        recipient_id: employee.id,
        title: `📢 ${action.title}`,
        message: `Communication ${action.actionType}: ${action.message}`,
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
  } catch (error) {
    console.error('Error in inspection communication:', error);
    throw error;
  }
};

export const getInspectionActions = async (inspectionId?: string): Promise<any[]> => {
  // Get action history from notifications table
  const query = supabase
    .from('notifications')
    .select('*')
    .eq('type', 'system')
    .like('metadata->entityType', 'inspection');

  if (inspectionId) {
    query.eq('metadata->entityId', inspectionId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching inspection actions:', error);
    return [];
  }

  return data || [];
};