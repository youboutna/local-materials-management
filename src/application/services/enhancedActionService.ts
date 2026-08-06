/**
 * Enhanced Action Service - Hexagonal Architecture
 * Business logic for enhanced action management across different entities
 * 
 * Event-driven system that executes actions and triggers appropriate services
 * No database persistence - pure event-driven like Action system
 */

import { InspectionService } from '@/application/services/InspectionService';
import { NotificationService } from '@/application/services/NotificationService';
import { PaymentService } from '@/application/services/PaymentService';
import { ProjectService } from '@/application/services/ProjectService';
import { TaskAssignmentService } from '@/application/services/TaskAssignmentService';
import {
    CreateEnhancedActionRequestDTO,
    EnhancedActionDTO
} from '@/dtos/entities/ActionDTO';
import { TaskStatus, TaskPriority } from '@/dtos/entities/TaskAssignmentDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';

/**
 * Event-driven Action Types
 * Based on user requirements: "programmer une inspection", "programmer un appel", "informer hierarchie", "envoyer notification"
 */
export type ActionType = 
  | 'schedule_inspection'    // Programmer une inspection
  | 'schedule_call'          // Programmer un appel
  | 'inform_hierarchy'       // Informer la hiérarchie
  | 'send_notification'      // Envoyer notification
  | 'assign_task'           // Assigner une tâche
  | 'approve_payment'        // Approuver un paiement
  | 'escalate_issue'        // Escalader un problème
  | 'request_document'       // Demander un document
  | 'schedule_meeting'       // Planifier une réunion;

/**
 * Action Event Payload
 */
export interface ActionEvent {
  id: string;
  type: ActionType;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  projectId?: string;
  entityId?: string;
  entityType?: 'project' | 'inspection' | 'task' | 'payment' | 'document';
  metadata: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  scheduledFor?: string;
  recipients?: string[];
}

/**
 * Enhanced Action Service
 * Event-driven business logic for action execution
 * Follows hexagonal architecture - pure business logic in service layer
 */
export class EnhancedActionService {
  private notificationService: NotificationService;
  private inspectionService: InspectionService;
  private projectService: ProjectService;
  private taskAssignmentService: TaskAssignmentService;
  private paymentService: PaymentService;
  
  // Event-driven in-memory storage for actions (like Action system)
  private actionRecords: Map<string, EnhancedActionDTO> = new Map();

  constructor() {
    this.notificationService = new NotificationService();
    this.inspectionService = new InspectionService(RepositoryFactory.getInspectionRepository());
    this.projectService = new ProjectService(RepositoryFactory.getProjectRepository());
    this.taskAssignmentService = new TaskAssignmentService(RepositoryFactory.getTaskAssignmentRepository());
    this.paymentService = new PaymentService(RepositoryFactory.getPaymentRepository());
  }

  /**
   * Execute action based on type
   * Event-driven: triggers appropriate services
   */
  async executeAction(actionEvent: ActionEvent): Promise<void> {
    try {
      switch (actionEvent.type) {
        case 'schedule_inspection':
          await this.handleScheduleInspection(actionEvent);
          break;

        case 'schedule_call':
          await this.handleScheduleCall(actionEvent);
          break;

        case 'inform_hierarchy':
          await this.handleInformHierarchy(actionEvent);
          break;

        case 'send_notification':
          await this.handleSendNotification(actionEvent);
          break;

        case 'assign_task':
          await this.handleAssignTask(actionEvent);
          break;

        case 'approve_payment':
          await this.handleApprovePayment(actionEvent);
          break;

        case 'escalate_issue':
          await this.handleEscalateIssue(actionEvent);
          break;

        case 'request_document':
          await this.handleRequestDocument(actionEvent);
          break;

        case 'schedule_meeting':
          await this.handleScheduleMeeting(actionEvent);
          break;

        default:
          console.warn(`Unknown action type: ${actionEvent.type}`);
      }
    } catch (error) {
      console.error(`Error executing action ${actionEvent.type}:`, error);
      throw error;
    }
  }

  /**
   * Handle "Programmer une inspection" action
   */
  private async handleScheduleInspection(actionEvent: ActionEvent): Promise<void> {
    console.log(`🔍 Scheduling inspection: ${actionEvent.title}`);
    
    if (actionEvent.projectId && actionEvent.assigneeId) {
      // Create inspection through service
      try {
        await this.inspectionService.createInspection({
          status: 'scheduled',
          progressAtInspection: 0,
          comments: actionEvent.description,
          projectId: actionEvent.projectId,
          inspector: actionEvent.assigneeId,
          date: actionEvent.scheduledFor
        });

        // Send notification to assignee
        await this.notificationService.createNotification({
          recipient_id: actionEvent.assigneeId || '',
          title: 'Nouvelle inspection planifiée',
          message: `Inspection "${actionEvent.title}" planifiée pour ${actionEvent.scheduledFor || 'dès que possible'}`,
          type: 'info',
          metadata: {
            actionId: actionEvent.id,
            projectId: actionEvent.projectId
          }
        });

        console.log('✅ Inspection scheduled successfully');
      } catch (error) {
        console.error('❌ Failed to schedule inspection:', error);
      }
    }
  }

  /**
   * Handle "Programmer un appel" action
   */
  private async handleScheduleCall(actionEvent: ActionEvent): Promise<void> {
    console.log(`📞 Scheduling call: ${actionEvent.title}`);
    
    if (actionEvent.assigneeId) {
      // Send call notification
      await this.notificationService.createNotification({
        recipient_id: actionEvent.assigneeId || '',
        title: 'Appel planifié',
        message: `Veuillez appeler concernant: ${actionEvent.description}`,
        type: 'info',
        metadata: {
          actionId: actionEvent.id,
          projectId: actionEvent.projectId,
          scheduledFor: actionEvent.scheduledFor
        }
      });

      console.log('✅ Call scheduled successfully');
    }
  }

  /**
   * Handle "Informer la hiérarchie" action
   */
  private async handleInformHierarchy(actionEvent: ActionEvent): Promise<void> {
    console.log(`👔 Informing hierarchy: ${actionEvent.title}`);
    
    if (actionEvent.projectId) {
      // Get project stakeholders to inform hierarchy
      try {
        const project = await this.projectService.getProjectById(actionEvent.projectId);
        if (project) {
          // Send notifications to project managers and stakeholders
          const hierarchyMessage = `Information hiérarchique: ${actionEvent.description}`;
          
          await this.notificationService.createNotification({
            recipient_id: project.projectManagerId || '',
            title: 'Information hiérarchique',
            message: hierarchyMessage,
            type: 'info',
            priority: 'high',
            metadata: {
              actionId: actionEvent.id,
              projectId: actionEvent.projectId,
              originalAction: actionEvent.title
            }
          });

          console.log('✅ Hierarchy informed successfully');
        }
      } catch (error) {
        console.error('❌ Failed to inform hierarchy:', error);
      }
    }
  }

  /**
   * Handle "Envoyer notification" action
   */
  private async handleSendNotification(actionEvent: ActionEvent): Promise<void> {
    console.log(`📢 Sending notification: ${actionEvent.title}`);
    
    const recipients = actionEvent.recipients || [actionEvent.assigneeId].filter(Boolean) as string[];
    
    for (const recipientId of recipients) {
      await this.notificationService.createNotification({
        recipient_id: recipientId || '',
        title: actionEvent.title,
        message: actionEvent.description,
        type: 'info',
        priority: actionEvent.priority === 'urgent' ? 'high' : actionEvent.priority,
        metadata: {
          actionId: actionEvent.id,
          projectId: actionEvent.projectId,
          senderId: actionEvent.createdBy
        }
      });
    }

    console.log(`✅ Notification sent to ${recipients.length} recipients`);
  }

  /**
   * Handle "Assigner une tâche" action
   * Utilise TaskAssignmentService pour la gestion des tâches
   */
  private async handleAssignTask(actionEvent: ActionEvent): Promise<void> {
    console.log(`📋 Assigning task: ${actionEvent.title}`);
    
    if (actionEvent.projectId && actionEvent.assigneeId && actionEvent.entityId) {
      try {
        // Mettre à jour la tâche avec TaskAssignmentService
        await this.taskAssignmentService.update(actionEvent.entityId, {
          assigneeId: actionEvent.assigneeId,
          status: TaskStatus.IN_PROGRESS,
          priority: actionEvent.priority === 'urgent' ? TaskPriority.HIGH : TaskPriority.MEDIUM,
          name: actionEvent.title,
          description: actionEvent.description,
          projectId: actionEvent.projectId,
        });

        // Envoyer une notification à l'assigné
        await this.notificationService.createNotification({
          recipient_id: actionEvent.assigneeId || '',
          title: 'Nouvelle tâche assignée',
          message: `Tâche "${actionEvent.title}" vous a été assignée`,
          type: 'info',
          metadata: {
            actionId: actionEvent.id,
            projectId: actionEvent.projectId,
            taskId: actionEvent.entityId
          }
        });

        console.log('✅ Task assigned successfully');
      } catch (error) {
        console.error('❌ Failed to assign task:', error);
      }
    }
  }

  /**
   * Handle "Approuver un paiement" action
   */
  private async handleApprovePayment(actionEvent: ActionEvent): Promise<void> {
    console.log(`💳 Approving payment: ${actionEvent.title}`);
    
    if (actionEvent.entityId && actionEvent.projectId) {
      try {
        // Update payment status through PaymentService
        await this.paymentService.updatePayment(actionEvent.entityId, {
          amount: 0, // Required field, will be updated by service
          paymentDate: new Date().toISOString(),
          transactionId: `approved-${Date.now()}`,
          projectId: actionEvent.projectId || '',
          contractorId: '',
          contractorName: '',
          contractorContact: '',
          paymentMethod: 'bank_transfer',
          progressAtPayment: 0
        });
        
        // Send payment approval notification
        await this.notificationService.createNotification({
          recipient_id: actionEvent.assigneeId || '',
          title: 'Paiement approuvé',
          message: `Paiement "${actionEvent.title}" a été approuvé`,
          type: 'success',
          priority: 'high',
          metadata: {
            actionId: actionEvent.id,
            projectId: actionEvent.projectId,
            paymentId: actionEvent.entityId
          }
        });

        console.log('✅ Payment approved successfully');
      } catch (error) {
        console.error('❌ Failed to approve payment:', error);
      }
    }
  }

  /**
   * Handle "Escalader un problème" action
   */
  private async handleEscalateIssue(actionEvent: ActionEvent): Promise<void> {
    console.log(`⚠️ Escalating issue: ${actionEvent.title}`);
    
    // Send escalation notification to management
    await this.notificationService.createNotification({
      recipient_id: actionEvent.assigneeId || '',
      title: 'Problème escaladé',
      message: `Problème escaladé: ${actionEvent.description}`,
      type: 'warning',
      priority: 'high',
      metadata: {
        actionId: actionEvent.id,
        projectId: actionEvent.projectId,
        escalationLevel: 'high'
      }
    });

    console.log('✅ Issue escalated successfully');
  }

  /**
   * Handle "Demander un document" action
   */
  private async handleRequestDocument(actionEvent: ActionEvent): Promise<void> {
    console.log(`📄 Requesting document: ${actionEvent.title}`);
    
    await this.notificationService.createNotification({
      recipient_id: actionEvent.assigneeId || '',
      title: 'Document demandé',
      message: `Document demandé: ${actionEvent.description}`,
      type: 'info',
      metadata: {
        actionId: actionEvent.id,
        projectId: actionEvent.projectId,
        documentRequest: actionEvent.metadata as Record<string, unknown>
      } as Record<string, unknown>
    });

    console.log('✅ Document requested successfully');
  }

  /**
   * Handle "Planifier une réunion" action
   */
  private async handleScheduleMeeting(actionEvent: ActionEvent): Promise<void> {
    console.log(`📅 Scheduling meeting: ${actionEvent.title}`);
    
    const recipients = actionEvent.recipients || [actionEvent.assigneeId].filter(Boolean) as string[];
    
    for (const recipientId of recipients) {
      await this.notificationService.createNotification({
        recipient_id: recipientId || '',
        title: 'Réunion planifiée',
        message: `Réunion "${actionEvent.title}" planifiée pour ${actionEvent.scheduledFor || 'à déterminer'}`,
        type: 'info',
        priority: actionEvent.priority === 'urgent' ? 'high' : actionEvent.priority,
        metadata: {
          actionId: actionEvent.id,
          projectId: actionEvent.projectId,
          scheduledFor: actionEvent.scheduledFor
        }
      });
    }

    console.log(`✅ Meeting scheduled for ${recipients.length} participants`);
  }

  /**
   * Create an insurance action
   * Event-driven: stores in memory and triggers execution
   */
  async createInsuranceAction(request: CreateEnhancedActionRequestDTO): Promise<EnhancedActionDTO> {
    try {
      // Validate required fields
      if (!request.insuranceId || !request.projectId || !request.actionType || !request.title || !request.message) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Missing required fields for insurance action');
      }

      // Validate action type
      const validActionTypes = ['task_assignment', 'hierarchy_notification', 'sms', 'call', 'email', 'mail'];
      if (!validActionTypes.includes(request.actionType)) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, `Invalid action type: ${request.actionType}`);
      }

      // Create action
      const action: EnhancedActionDTO = {
        id: `action-${Date.now()}-${crypto.randomUUID().slice(0, 9)}`,
        entityType: 'insurance',
        entityId: request.insuranceId,
        projectId: request.projectId,
        contractorId: request.contractorId,
        actionType: request.actionType,
        title: request.title,
        message: request.message,
        priority: request.priority || 'medium',
        status: 'pending',
        assigneeId: request.assigneeId,
        recipientIds: request.recipientIds || [],
        metadata: request.metadata,
        createdBy: 'system', // Will be updated with actual user ID
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store in memory (event-driven like Action system)
      this.actionRecords.set(action.id, action);
      
      // Execute the action
      const actionEvent: ActionEvent = {
        id: action.id,
        type: 'send_notification' as ActionType,
        title: action.title,
        description: action.message,
        priority: action.priority as 'low' | 'medium' | 'high' | 'urgent',
        assigneeId: action.assigneeId,
        projectId: action.projectId,
        entityId: action.entityId,
        entityType: action.entityType as 'project' | 'inspection' | 'task' | 'payment' | 'document',
        metadata: action.metadata as Record<string, unknown> || {},
        createdBy: action.createdBy,
        createdAt: action.createdAt,
        scheduledFor: undefined,
        recipients: action.recipientIds
      };
      
      await this.executeAction(actionEvent);
      
      console.log('EnhancedActionService.createInsuranceAction:', action);
      return action;
    } catch (error) {
      console.error('EnhancedActionService.createInsuranceAction failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create insurance action');
    }
  }

  /**
   * Create a bank guarantee action
   * Event-driven: stores in memory and triggers execution
   */
  async createBankGuaranteeAction(request: CreateEnhancedActionRequestDTO): Promise<EnhancedActionDTO> {
    try {
      // Validate required fields
      if (!request.insuranceId || !request.actionType || !request.title || !request.message) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Missing required fields for bank guarantee action');
      }

      // Create action
      const action: EnhancedActionDTO = {
        id: `action-${Date.now()}-${crypto.randomUUID().slice(0, 9)}`,
        entityType: 'bankGuarantee',
        entityId: request.insuranceId,
        projectId: request.projectId,
        contractorId: request.contractorId,
        actionType: request.actionType,
        title: request.title,
        message: request.message,
        priority: request.priority || 'medium',
        status: 'pending',
        assigneeId: request.assigneeId,
        recipientIds: request.recipientIds || [],
        metadata: request.metadata,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store in memory (event-driven like Action system)
      this.actionRecords.set(action.id, action);
      
      // Execute the action
      const actionEvent: ActionEvent = {
        id: action.id,
        type: 'send_notification' as ActionType,
        title: action.title,
        description: action.message,
        priority: action.priority as 'low' | 'medium' | 'high' | 'urgent',
        assigneeId: action.assigneeId,
        projectId: action.projectId,
        entityId: action.entityId,
        entityType: action.entityType as 'project' | 'inspection' | 'task' | 'payment' | 'document',
        metadata: action.metadata as Record<string, unknown> || {},
        createdBy: action.createdBy,
        createdAt: action.createdAt,
        scheduledFor: undefined,
        recipients: action.recipientIds
      };
      
      await this.executeAction(actionEvent);
      
      console.log('EnhancedActionService.createBankGuaranteeAction:', action);
      return action;
    } catch (error) {
      console.error('EnhancedActionService.createBankGuaranteeAction failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create bank guarantee action');
    }
  }

  /**
   * Create a payment action
   * Event-driven: stores in memory and triggers execution
   */
  async createPaymentAction(request: CreateEnhancedActionRequestDTO): Promise<EnhancedActionDTO> {
    try {
      // Validate required fields
      if (!request.insuranceId || !request.actionType || !request.title || !request.message) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Missing required fields for payment action');
      }

      // Create action
      const action: EnhancedActionDTO = {
        id: `action-${Date.now()}-${crypto.randomUUID().slice(0, 9)}`,
        entityType: 'payment',
        entityId: request.insuranceId,
        projectId: request.projectId,
        contractorId: request.contractorId,
        actionType: request.actionType,
        title: request.title,
        message: request.message,
        priority: request.priority || 'medium',
        status: 'pending',
        assigneeId: request.assigneeId,
        recipientIds: request.recipientIds || [],
        metadata: request.metadata,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store in memory (event-driven like Action system)
      this.actionRecords.set(action.id, action);
      
      // Execute the action
      const actionEvent: ActionEvent = {
        id: action.id,
        type: 'approve_payment' as ActionType,
        title: action.title,
        description: action.message,
        priority: action.priority as 'low' | 'medium' | 'high' | 'urgent',
        assigneeId: action.assigneeId,
        projectId: action.projectId,
        entityId: action.entityId,
        entityType: action.entityType as 'project' | 'inspection' | 'task' | 'payment' | 'document',
        metadata: action.metadata as Record<string, unknown> || {},
        createdBy: action.createdBy,
        createdAt: action.createdAt,
        scheduledFor: undefined,
        recipients: action.recipientIds
      };
      
      await this.executeAction(actionEvent);
      
      console.log('EnhancedActionService.createPaymentAction:', action);
      return action;
    } catch (error) {
      console.error('EnhancedActionService.createPaymentAction failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create payment action');
    }
  }

  /**
   * Get actions by entity type and ID
   * Event-driven: retrieves from in-memory storage
   */
  async getActionsByEntity(entityType: EnhancedActionDTO['entityType'], entityId: string): Promise<EnhancedActionDTO[]> {
    try {
      // Filter actions from in-memory storage
      const actions = Array.from(this.actionRecords.values()).filter(
        action => action.entityType === entityType && action.entityId === entityId
      );
      
      console.log(`EnhancedActionService.getActionsByEntity: Found ${actions.length} actions for ${entityType}:${entityId}`);
      return actions;
    } catch (error) {
      console.error('EnhancedActionService.getActionsByEntity failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch entity actions');
    }
  }

  /**
   * Update an action status
   * Event-driven: updates in-memory storage
   */
  async updateActionStatus(actionId: string, status: EnhancedActionDTO['status']): Promise<EnhancedActionDTO> {
    try {
      const action = this.actionRecords.get(actionId);
      if (!action) {
        throw new AppError(ErrorCode.NOT_FOUND, `Action with ID ${actionId} not found`);
      }

      // Update action in memory
      const updatedAction: EnhancedActionDTO = {
        ...action,
        status,
        updatedAt: new Date().toISOString()
      };
      
      this.actionRecords.set(actionId, updatedAction);
      
      console.log(`EnhancedActionService.updateActionStatus: Updated action ${actionId} to ${status}`);
      return updatedAction;
    } catch (error) {
      console.error('EnhancedActionService.updateActionStatus failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update action status');
    }
  }

  /**
   * Get actions by assignee
   * Event-driven: retrieves from in-memory storage
   */
  async getActionsByAssignee(assigneeId: string): Promise<EnhancedActionDTO[]> {
    try {
      // Filter actions from in-memory storage
      const actions = Array.from(this.actionRecords.values()).filter(
        action => action.assigneeId === assigneeId
      );
      
      console.log(`EnhancedActionService.getActionsByAssignee: Found ${actions.length} actions for assignee ${assigneeId}`);
      return actions;
    } catch (error) {
      console.error('EnhancedActionService.getActionsByAssignee failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch assigned actions');
    }
  }

  /**
   * Get all actions (for debugging/admin)
   */
  async getAllActions(): Promise<EnhancedActionDTO[]> {
    try {
      const actions = Array.from(this.actionRecords.values());
      console.log(`EnhancedActionService.getAllActions: Found ${actions.length} total actions`);
      return actions;
    } catch (error) {
      console.error('EnhancedActionService.getAllActions failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch all actions');
    }
  }

  /**
   * Delete an action
   * Event-driven: removes from in-memory storage
   */
  async deleteAction(actionId: string): Promise<boolean> {
    try {
      const deleted = this.actionRecords.delete(actionId);
      console.log(`EnhancedActionService.deleteAction: ${deleted ? 'Deleted' : 'Not found'} action ${actionId}`);
      return deleted;
    } catch (error) {
      console.error('EnhancedActionService.deleteAction failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete action');
    }
  }
}

// Unified action request type for backward compatibility
export interface UnifiedActionRequest {
  actionType: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  recipientIds: string[];
  dueDate?: string;
  escalationLevel?: string;
  entityType: string;
  entityId: string;
  projectId?: string;
  contractorId?: string;
  metadata?: Record<string, unknown>;
}

// Static execution result
export interface ActionExecutionResult {
  success: boolean;
  notificationsSent: number;
  error?: string;
}

// Static methods namespace for backward compatibility
export const EnhancedActionServiceStatic = {
  async executeAction(request: UnifiedActionRequest): Promise<ActionExecutionResult> {
    const service = new EnhancedActionService();
    try {
      await service.createInsuranceAction({
        insuranceId: request.entityId,
        projectId: request.projectId,
        contractorId: request.contractorId,
        actionType: request.actionType as 'taskAssignment' | 'hierarchyNotification' | 'sms' | 'call' | 'email' | 'mail' | 'notification',
        title: request.title,
        message: request.message,
        priority: (request.priority === 'urgent' ? 'high' : request.priority) as 'low' | 'medium' | 'high',
        assigneeId: request.assigneeId,
        recipientIds: request.recipientIds,
        metadata: request.metadata
      });
      return { success: true, notificationsSent: request.recipientIds.length };
    } catch (error: unknown) {
      console.error('EnhancedActionService.executeAction failed:', error);
      return { success: false, notificationsSent: 0, error: error instanceof Error ? error.message : String(error) };
    }
  }
};

// Attach static method to class for backward compatibility
(EnhancedActionService as unknown as Record<string, unknown>).executeAction = EnhancedActionServiceStatic.executeAction;

// Export a singleton instance for backward compatibility
const enhancedActionService = new EnhancedActionService();

// Export the create function as used in UnifiedInsuranceManager
export const createInsuranceAction = enhancedActionService.createInsuranceAction.bind(enhancedActionService);

export default enhancedActionService;