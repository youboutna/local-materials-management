// @ts-nocheck
import { supabase } from '@/integrations/supabase/client';
import { NotificationService } from './NotificationService';
import { communicationService } from './communicationService';
import OrganizationalHierarchyService from './organizationalHierarchyService';

export interface InsuranceControlAction {
  id: string;
  insuranceId: string;
  projectId: string;
  contractorId: string;
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

export const createInsuranceAction = async (actionData: Omit<InsuranceControlAction, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<InsuranceControlAction> => {
  try {
    // Fetch real project and insurance data
    const [projectData, insuranceData, projectEmployees, insuranceCompanies] = await Promise.all([
      // Get project details
      supabase
        .from('projects')
        .select('*')
        .eq('id', actionData.projectId)
        .single(),
      
      // Get insurance certificate details
      supabase
        .from('insurance_certificates')
        .select('*')
        .eq('id', actionData.insuranceId)
        .single(),
      
      // Get project team members
      supabase
        .from('employees')
        .select('id, full_name, email, phone, position, department')
        .eq('is_active', true),
      
      // Get insurance companies
      supabase
        .from('insurance_companies')
        .select('*')
    ]);

    const action: InsuranceControlAction = {
      ...actionData,
      id: `ins-action-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        ...actionData.metadata,
        project: projectData.data,
        insurance: insuranceData.data,
        availableEmployees: projectEmployees.data || [],
        insuranceCompanies: insuranceCompanies.data || []
      }
    };

    // Execute action directly without localStorage storage
    await executeInsuranceAction(action);

    // Track action execution in notifications table
    await supabase.from('notifications').insert({
      type: 'system',
      title: `Action exécutée: ${action.title}`,
      message: `Action ${action.actionType} exécutée pour assurance ${action.insuranceId}`,
      recipient_id: '00000000-0000-0000-0000-000000000000', // System notification
      metadata: {
        actionType: action.actionType,
        entityType: 'insurance',
        entityId: action.insuranceId,
        projectId: action.projectId,
        priority: action.priority,
        executedAt: action.createdAt
      },
      related_id: action.insuranceId
    });

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
          relatedId: action.insuranceId,
          actionType: action.actionType,
          metadata: {
            actionId: action.id,
            insuranceId: action.insuranceId,
            projectId: action.projectId,
            task_type: 'insurance_renewal'
          }
        });
      }
    } catch (error) {
      console.error('Error assigning insurance task:', error);
      // Fallback to notification only
      await NotificationService.createNotification({
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
  }

  for (const recipientId of action.recipientIds) {
    if (recipientId !== action.assigneeId) {
      await NotificationService.createNotification({
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
  try {
    // Get organizational hierarchy for insurance-related notifications
    const escalationTargets = await OrganizationalHierarchyService.findNotificationRecipients(
      action.projectId,
      {
        type: 'insurance',
        priority: action.priority,
        escalationLevel: action.escalationLevel,
        department: 'legal'
      }
    );

    const escalationTitles = {
      team: 'Notification équipe - Assurance',
      supervisor: 'Escalade superviseur - Assurance',
      manager: 'Escalade manager - Assurance',
      director: 'Escalade direction - Assurance'
    };

    for (const target of escalationTargets) {
      await NotificationService.createNotification({
        recipient_id: target.employee_id,
        title: escalationTitles[action.escalationLevel || 'team'],
        message: `${action.message}\n\nAssurance: ${action.insuranceId}\nProjet: ${action.projectId}\nNiveau: ${target.hierarchy_level}`,
        type: 'insurance_expiry',
        related_id: action.insuranceId,
        metadata: {
          actionId: action.id,
          escalationLevel: action.escalationLevel,
          insuranceId: action.insuranceId,
          projectId: action.projectId,
          contractorId: action.contractorId,
          priority: action.priority,
          hierarchyLevel: target.hierarchy_level,
          targetPosition: target.position_title
        }
      });
    }
  } catch (error) {
    console.error('Error in insurance hierarchy notification:', error);
  }
};

const executeInsuranceCommunication = async (action: InsuranceControlAction): Promise<void> => {
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
                insuranceId: action.insuranceId,
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
      await NotificationService.createNotification({
        recipient_id: employee.id,
        title: `📢 ${action.title}`,
        message: `Communication ${action.actionType}: ${action.message}`,
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
  } catch (error) {
    console.error('Error in insurance communication:', error);
    throw error;
  }
};

export const getInsuranceActions = async (insuranceId?: string): Promise<any[]> => {
  // Get action history from notifications table
  const query = supabase
    .from('notifications')
    .select('*')
    .eq('type', 'system')
    .like('metadata->entityType', 'insurance');

  if (insuranceId) {
    query.eq('metadata->entityId', insuranceId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching insurance actions:', error);
    return [];
  }

  return data || [];
};