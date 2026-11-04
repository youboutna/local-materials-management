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

export interface BankGuaranteeControlAction {
  id: string;
  bankGuaranteeId: string;
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

export const createBankGuaranteeAction = async (actionData: Omit<BankGuaranteeControlAction, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<BankGuaranteeControlAction> => {
  try {
    // Fetch real project data and related entities
    const [projectData, bankGuaranteeData, projectEmployees, projectSuppliers] = await Promise.all([
      // Get project details
      ctx().findRecord('project', actionData.projectId).then((data) => ({ data })),
      
      // Get bank guarantee details
      ctx().findRecord('bank_guarantee', actionData.bankGuaranteeId).then((data) => ({ data })),
      
      // Get project employees
      ctx().findActiveEmployees().then((data) => ({ data })),
      
      // Get project suppliers/contractors
      ctx().findActiveSuppliers().then((data) => ({ data }))
    ]);

    const action: BankGuaranteeControlAction = {
      ...actionData,
      id: `bg-action-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        ...actionData.metadata,
        project: projectData.data,
        bankGuarantee: bankGuaranteeData.data,
        availableEmployees: projectEmployees.data || [],
        availableSuppliers: projectSuppliers.data || []
      }
    };

    // Execute action immediately - no need to store in localStorage
    await executeBankGuaranteeAction(action);

    // Optionally persist to notifications table for tracking
    const actorId = await resolveActorId();
    if (actorId) await NotificationService.createNotification({
      recipientId: actorId,
      title: `Action exécutée: ${action.title}`,
      message: `Action ${action.actionType} exécutée pour garantie bancaire ${action.bankGuaranteeId}`,
      type: 'system',
      priority: action.priority === 'urgent' ? 'high' : action.priority,
      relatedId: action.projectId,
      metadata: {
        actionType: action.actionType,
        entityType: 'bank_guarantee',
        entityId: action.bankGuaranteeId,
        projectId: action.projectId,
        priority: action.priority,
        executedAt: action.createdAt
      }
    });

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
          relatedId: action.bankGuaranteeId,
          actionType: action.actionType,
          metadata: {
            actionId: action.id,
            bankGuaranteeId: action.bankGuaranteeId,
            projectId: action.projectId,
            task_type: 'bank_guarantee_resolution'
          }
        });
      }
    } catch (error) {
      console.error('Error assigning bank guarantee task:', error);
      // Fallback to notification only
      await NotificationService.createNotification({
        recipientId: action.assigneeId,
        title: `Tâche garantie bancaire: ${action.title}`,
        message: action.message,
        type: 'task_assigned' as any,
        relatedId: action.projectId,
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
  }

  for (const recipientId of action.recipientIds) {
    if (recipientId !== action.assigneeId) {
      await NotificationService.createNotification({
        recipientId: recipientId,
        title: `Nouvelle tâche garantie bancaire assignée`,
        message: `Une tâche a été assignée pour gérer la garantie bancaire: ${action.title}`,
        type: 'bank_guarantee_trigger' as any,
        relatedId: action.projectId,
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
  try {
    // Get real organizational hierarchy for the project
    const escalationTargets = await OrganizationalHierarchyService.findNotificationRecipients(
      action.projectId,
      {
        type: 'bank_guarantee',
        priority: action.priority,
        escalationLevel: action.escalationLevel,
        requiresApproval: true
      } as any
    );

    const escalationTitles = {
      team: 'Notification équipe - Garantie bancaire',
      supervisor: 'Escalade superviseur - Garantie bancaire',
      manager: 'Escalade manager - Garantie bancaire',
      director: 'Escalade direction - Garantie bancaire'
    };

    // Get project organizations for context
    const projectOrgs = await OrganizationalHierarchyService.getProjectOrganizations(action.projectId);
    const primaryOrg = projectOrgs.find((org) => org.is_primary) || projectOrgs[0];


    for (const target of escalationTargets) {
      const hierarchyMessage = `
${action.message}

DÉTAILS HIÉRARCHIQUES:
- Organisation: ${primaryOrg?.organization_name || 'N/A'}
- Niveau d'escalade: ${action.escalationLevel?.toUpperCase() || 'ÉQUIPE'}
- Position destinataire: ${target.position_title}
- Département: ${(target as any).department}
- Niveau hiérarchique: ${target.hierarchy_level}

CONTEXTE PROJET:
- ID Projet: ${action.projectId}
- Garantie bancaire: ${action.bankGuaranteeId}
- Entrepreneur: ${action.contractorId}
      `;

      await NotificationService.createNotification({
        recipientId: target.employee_id,
        title: escalationTitles[action.escalationLevel || 'team'],
        message: hierarchyMessage,
        type: 'bank_guarantee_trigger' as any,
        relatedId: action.projectId,
        metadata: {
          actionId: action.id,
          escalationLevel: action.escalationLevel,
          bankGuaranteeId: action.bankGuaranteeId,
          projectId: action.projectId,
          contractorId: action.contractorId,
          priority: action.priority,
          hierarchyLevel: target.hierarchy_level,
          organizationName: primaryOrg?.organization_name,
          targetPosition: target.position_title,
          targetDepartment: (target as any).department
        }
      });
    }

    console.log(`Bank guarantee hierarchy notification sent to ${escalationTargets.length} recipients at ${action.escalationLevel} level`);
  } catch (error) {
    console.error('Error in bank guarantee hierarchy notification:', error);
    // Fallback to original recipients if hierarchy fails
    for (const recipientId of action.recipientIds) {
      await NotificationService.createNotification({
        recipientId: recipientId,
        title: `Escalade Garantie Bancaire - ${action.title}`,
        message: action.message,
        type: 'bank_guarantee_trigger' as any,
        relatedId: action.projectId,
        metadata: {
          actionId: action.id,
          escalationLevel: action.escalationLevel,
          priority: action.priority,
          fallbackNotification: true
        }
      });
    }
  }
};

const executeBankGuaranteeCommunication = async (action: BankGuaranteeControlAction): Promise<void> => {
  try {
    // Get real project stakeholders for communication
    const [projectEmployees, projectSuppliers, bankGuaranteeDetails] = await Promise.all([
      // Get project team members
      ctx().findActiveEmployees().then((data) => ({ data })),
      
      // Get project contractors/suppliers
      ctx().findActiveSuppliers().then((data) => ({ data })),
      
      // Get bank guarantee details with bank information
      ctx().findRecord('bank_guarantee', action.bankGuaranteeId).then((data) => ({ data }))
    ]);

    // Determine recipients based on action context
    let communicationTargets: any[] = [];
    
    if (action.recipientIds && action.recipientIds.length > 0) {
      // Use specified recipients
      const employees = projectEmployees.data?.filter(emp => action.recipientIds.includes(emp.id as any)) || [];
      communicationTargets = employees.map(emp => ({
        id: emp.id,
        name: emp.full_name,
        email: emp.email,
        phone: emp.phone,
        type: 'employee'
      }));
    } else {
      // Auto-select relevant stakeholders
      const relevantEmployees = projectEmployees.data?.filter(emp => 
        emp.department === 'finance' || 
        emp.department === 'legal' || 
        emp.position?.toLowerCase().includes('manager')
      ) || [];
      
      communicationTargets = relevantEmployees.map(emp => ({
        id: emp.id,
        name: emp.full_name,
        email: emp.email,
        phone: emp.phone,
        type: 'employee'
      }));
    }

    // Enhanced message with project context
    const contextualMessage = `
${action.message}

DÉTAILS GARANTIE BANCAIRE:
- Montant: ${bankGuaranteeDetails.data?.guarantee_amount || 'N/A'} 
- Banque: ${bankGuaranteeDetails.data?.bank_name || 'N/A'}
- Échéance: ${bankGuaranteeDetails.data?.expiry_date ? new Date(bankGuaranteeDetails.data.expiry_date).toLocaleDateString('fr-FR') : 'N/A'}
- Statut: ${bankGuaranteeDetails.data?.status || 'N/A'}

PROJET: ${action.metadata?.project?.title || action.projectId}
    `;

    if (!communicationTargets.length) throw new Error('Communication recipients are required');
    for (const target of communicationTargets) {
      const contact = await communicationService.resolveRecipient(target.id);
      if (action.actionType === 'email' && !contact.email) throw new Error('Recipient email is missing');
      if (['sms','call'].includes(action.actionType) && !contact.phone) throw new Error('Recipient phone is missing');
      if (action.actionType === 'call' && !contact.id) throw new Error('Call requires a linked user');
      switch (action.actionType) {
        case 'email':
          if (contact.email) {
            communicationService.requireSuccess(await communicationService.sendEmail({
              to: contact.email,
              subject: `[URGENT] ${action.title} - Garantie Bancaire`,
              message: contextualMessage,
              priority: action.priority,
              actionType: action.actionType,
              metadata: {
                ...action.metadata,
                actionId: action.id,
                bankGuaranteeId: action.bankGuaranteeId,
                projectId: action.projectId,
                bankGuaranteeDetails: bankGuaranteeDetails.data,
                targetType: target.type,
                targetName: target.name
              }
            }));
          }
          break;

        case 'sms':
          if (contact.phone) {
            const smsMessage = `[GARANTIE BANCAIRE] ${action.title}: ${action.message}. Projet: ${action.metadata?.project?.title || action.projectId}`;
            communicationService.requireSuccess(await communicationService.sendSMS({
              to: contact.phone,
              message: smsMessage,
              priority: action.priority,
              actionType: action.actionType,
              metadata: {
                ...action.metadata,
                targetName: target.name,
                bankGuaranteeAmount: bankGuaranteeDetails.data?.guarantee_amount
              }
            }));
          }
          break;

        case 'call':
          if (contact.phone) {
            communicationService.requireSuccess(await communicationService.scheduleCall({
              recipientId: contact.id,
              recipientPhone: contact.phone,
              subject: `[URGENT] Garantie Bancaire - ${action.title}`,
              message: contextualMessage,
              priority: action.priority,
              scheduledFor: action.dueDate,
              actionType: action.actionType,
              metadata: {
                ...action.metadata,
                bankGuaranteeDetails: bankGuaranteeDetails.data,
                projectData: action.metadata?.project
              }
            }));
          }
          break;
      }

      // Send tracking notification
      if (contact.id) await communicationService.sendNotification({
        recipientId: contact.id,
        title: `📢 ${action.title}`,
        message: `Communication ${action.actionType}: ${action.message}`,
        type: 'bank_guarantee_trigger' as any,
        relatedId: action.projectId,
        metadata: {
          actionId: action.id,
          communicationType: action.actionType,
          originalMessage: action.message,
          priority: action.priority,
          bankGuaranteeDetails: bankGuaranteeDetails.data,
          targetType: target.type
        }
      });
    }
  } catch (error) {
    console.error('Error in bank guarantee communication:', error);
    throw error;
  }
};

export const getBankGuaranteeActions = async (bankGuaranteeId?: string): Promise<any[]> => {
  // Get action history from notifications table
  const data = await ctx().findActionHistory('bank_guarantee', bankGuaranteeId);

  return data || [];
};