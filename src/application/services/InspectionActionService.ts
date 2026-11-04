import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { NotificationService } from './NotificationService';
import { communicationService } from './CommunicationService';
import OrganizationalHierarchyService from './OrganizationalHierarchyService';
const ctx = () => RepositoryFactory.getControlActionContextRepository();


// Destinataire technique des notifications système (traçabilité des actions).
/** Action tracking goes to the user who executed it, never to a placeholder recipient. */
async function resolveActorId(): Promise<string | null> {
  const { getAuthService } = await import('./AuthService');
  return (await getAuthService().getCurrentUser())?.id ?? null;
}

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
      ctx().findRecord('project', actionData.projectId).then((data) => ({ data })),
      
      // Get inspection details
      ctx().findRecord('inspection', actionData.inspectionId).then((data) => ({ data })),
      
      // Get project team members
      ctx().findActiveEmployees().then((data) => ({ data })),
      
      // Get inspection documents
      ctx().findDocumentsByInspection(actionData.inspectionId).then((data) => ({ data }))
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
    const actorId = await resolveActorId();
    if (actorId) await NotificationService.createNotification({
      recipientId: actorId,
      title: `Action exécutée: ${action.title}`,
      message: `Action ${action.actionType} exécutée pour inspection ${action.inspectionId}`,
      type: 'system',
      priority: action.priority === 'urgent' ? 'high' : action.priority,
      relatedId: action.inspectionId,
      metadata: {
        actionType: action.actionType,
        entityType: 'inspection',
        entityId: action.inspectionId,
        projectId: action.projectId,
        priority: action.priority,
        executedAt: action.createdAt
      }
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
      const assignee: any = await ctx().findEmployee(action.assigneeId);

      if (assignee) {
        // Use the communication service to assign task
        await communicationService.assignTask({
          assigneeId: action.assigneeId,
          assigneeName: assignee.full_name ?? undefined,
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
      await NotificationService.createNotification({
        recipientId: action.assigneeId,
        title: `Tâche inspection: ${action.title}`,
        message: action.message,
        type: 'task_assigned' as any,
        relatedId: action.inspectionId,
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
      await NotificationService.createNotification({
        recipientId: recipientId,
        title: `Nouvelle tâche d'inspection assignée`,
        message: `Une tâche d'inspection a été assignée: ${action.title}`,
        type: 'inspection_required' as any,
        relatedId: action.inspectionId,
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
      await NotificationService.createNotification({
        recipientId: target.employee_id,
        title: escalationTitles[action.escalationLevel || 'team'],
        message: `${action.message}\n\nInspection: ${action.inspectionId}\nProjet: ${action.projectId}\nNiveau: ${target.hierarchy_level}`,
        type: 'inspection_overdue' as any,
        relatedId: action.inspectionId,
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
    if (!action.recipientIds.length) throw new Error('Communication recipients are required');
    const employees = await Promise.all(action.recipientIds.map(id => communicationService.resolveRecipient(id)));
    for (const employee of employees) {
      if (action.actionType === 'email' && !employee.email) throw new Error('Recipient email is missing');
      if (['sms','call'].includes(action.actionType) && !employee.phone) throw new Error('Recipient phone is missing');
      if (action.actionType === 'call' && !employee.id) throw new Error('Call requires a linked user');
      switch (action.actionType) {
        case 'email':
          if (employee.email) {
            communicationService.requireSuccess(await communicationService.sendEmail({
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
            }));
          }
          break;

        case 'sms':
          if (employee.phone) {
            communicationService.requireSuccess(await communicationService.sendSMS({
              to: employee.phone,
              message: action.message,
              priority: action.priority,
              actionType: action.actionType,
              metadata: action.metadata
            }));
          }
          break;

        case 'call':
          if (employee.phone) {
            communicationService.requireSuccess(await communicationService.scheduleCall({
              recipientId: employee.id ?? "",
              recipientPhone: employee.phone,
              subject: action.title,
              message: action.message,
              priority: action.priority,
              scheduledFor: action.dueDate,
              actionType: action.actionType,
              metadata: action.metadata
            }));
          }
          break;
      }

      // Track only accepted sends for linked users.
      if (employee.id) await communicationService.sendNotification({
        recipientId: employee.id ?? "",
        title: `📢 ${action.title}`,
        message: `Communication ${action.actionType}: ${action.message}`,
        type: 'inspection_required' as any,
        relatedId: action.inspectionId,
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
  const data = await ctx().findActionHistory('inspection', inspectionId);

  return data || [];
};