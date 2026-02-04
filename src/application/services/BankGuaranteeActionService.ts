/**
 * Bank Guarantee Action Service - Hexagonal Architecture
 * Business logic for bank guarantee action management
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { IBankGuaranteeRepository } from '@/domain/repositories/IBankGuaranteeRepository';
import { IActionRepository } from '@/domain/repositories/IActionRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import {
  BankGuaranteeActionDTO,
  BankGuaranteeActionTemplateDTO,
  CreateBankGuaranteeActionRequestDto,
  UpdateBankGuaranteeActionRequestDto,
  BankGuaranteeActionStatistics
} from '@/dtos/entities/BankGuaranteeDTO';

export class BankGuaranteeActionService {
  constructor(
    private bankGuaranteeRepository: IBankGuaranteeRepository = RepositoryFactory.getBankGuaranteeRepository(),
    private actionRepository: IActionRepository = RepositoryFactory.getActionRepository()
  ) {}

  /**
   * Create action (simplified interface)
   */
  async createAction(data: {
    guarantee_id: string;
    action_type: string;
    description: string;
    performed_by: string;
    metadata?: Record<string, unknown>;
  }): Promise<BankGuaranteeActionDTO> {
    // First get the guarantee to validate it exists
    const guarantee = await this.bankGuaranteeRepository.getById(data.guarantee_id);
    
    if (!guarantee) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Bank guarantee not found');
    }

    // Create full action record matching DTO
    const actionRecord: BankGuaranteeActionDTO = {
      id: `action-${Date.now()}`,
      guarantee_id: data.guarantee_id,
      action_type: data.action_type as BankGuaranteeActionDTO['action_type'],
      title: `Action: ${data.action_type}`,
      description: data.description,
      status: 'pending',
      priority: 'medium',
      created_by: data.performed_by,
      documents: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...(data.metadata || {})
    };

    // Update guarantee with new action
    const updatedGuarantee = await this.bankGuaranteeRepository.update(data.guarantee_id, {
      actions: [...(guarantee.actions || []), actionRecord]
    });

    if (!updatedGuarantee.actions) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create action');
    }

    // Return the newly created action
    return actionRecord;
  }
  
  /**
   * Create a new bank guarantee action
   */
  async createBankGuaranteeAction(actionData: CreateBankGuaranteeActionRequestDto): Promise<BankGuaranteeActionDTO> {
    try {
      // Validate required fields
      if (!actionData.guarantee_id || !actionData.action_type || !actionData.description || !actionData.created_by) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Missing required fields for action');
      }

      // Get the existing guarantee
      const guarantee = await this.bankGuaranteeRepository.getById(actionData.guarantee_id);
      if (!guarantee) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Bank guarantee not found');
      }

      // Create full action record
      const actionRecord: BankGuaranteeActionDTO = {
        id: `action-${Date.now()}`,
        guarantee_id: actionData.guarantee_id,
        action_type: actionData.action_type,
        title: actionData.title || `Action: ${actionData.action_type}`,
        description: actionData.description,
        status: 'pending',
        priority: actionData.priority || 'medium',
        assigned_to: actionData.assigned_to,
        created_by: actionData.created_by,
        due_date: actionData.due_date,
        documents: actionData.documents || [],
        notes: actionData.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Update guarantee with new action
      const updatedGuarantee = await this.bankGuaranteeRepository.update(
        actionData.guarantee_id, 
        {
          actions: [...(guarantee.actions || []), actionRecord]
        }
      );

      return actionRecord;
    } catch (error) {
      console.error('BankGuaranteeActionService.createBankGuaranteeAction failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create action');
    }
  }

  /**
   * Get all actions for a guarantee
   */
  async getActionsByGuaranteeId(guaranteeId: string): Promise<BankGuaranteeActionDTO[]> {
    try {
      const actions = await this.actionRepository.findByType(`bank-guarantee-${guaranteeId}`);
      return actions.map(action => ({
        id: action.id,
        guarantee_id: guaranteeId,
        action_type: action.type as BankGuaranteeActionDTO['action_type'],
        title: action.title,
        description: action.description,
        status: action.status as BankGuaranteeActionDTO['status'],
        priority: action.priority as BankGuaranteeActionDTO['priority'],
        assigned_to: action.assignedTo,
        created_by: action.createdBy,
        due_date: action.dueDate?.toISOString(),
        completed_at: action.completedAt?.toISOString(),
        documents: action.documents || [],
        notes: action.notes,
        created_at: action.createdAt.toISOString(),
        updated_at: action.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('BankGuaranteeActionService.getActionsByGuaranteeId failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch guarantee actions');
    }
  }
  
  /**
   * Update an action
   */
  async updateAction(id: string, updates: UpdateBankGuaranteeActionRequestDto): Promise<BankGuaranteeActionDTO> {
    try {
      const updatedAction = await this.actionRepository.update(id, {
        title: updates.title,
        description: updates.description,
        status: updates.status,
        priority: updates.priority,
        assignedTo: updates.assigned_to,
        dueDate: updates.due_date ? new Date(updates.due_date) : undefined,
        documents: updates.documents,
        notes: updates.notes
      });
      
      return {
        id: updatedAction.id,
        guarantee_id: '', // Will be set by caller
        action_type: '', // Will be set by caller
        title: updatedAction.title,
        description: updatedAction.description,
        status: updatedAction.status as BankGuaranteeActionDTO['status'],
        priority: updatedAction.priority as BankGuaranteeActionDTO['priority'],
        assigned_to: updatedAction.assignedTo,
        created_by: '', // Will be set by caller
        due_date: updatedAction.dueDate?.toISOString(),
        completed_at: updatedAction.completedAt?.toISOString(),
        documents: updatedAction.documents || [],
        notes: updatedAction.notes,
        created_at: updatedAction.createdAt.toISOString(),
        updated_at: updatedAction.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('BankGuaranteeActionService.updateAction failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update action');
    }
  }

  /**
   * Delete an action
   */
  async deleteAction(id: string): Promise<void> {
    try {
      await this.actionRepository.delete(id);
    } catch (error) {
      console.error('BankGuaranteeActionService.deleteAction failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete action');
    }
  }

  /**
   * Get action by ID
   */
  async getActionById(id: string): Promise<BankGuaranteeActionDTO | null> {
    try {
      const action = await this.actionRepository.findById(id);
      if (!action) return null;
      
      return {
        id: action.id,
        guarantee_id: '', // Will be set by caller
        action_type: '', // Will be set by caller
        title: action.title,
        description: action.description,
        status: action.status as BankGuaranteeActionDTO['status'],
        priority: action.priority as BankGuaranteeActionDTO['priority'],
        assigned_to: action.assignedTo,
        created_by: '', // Will be set by caller
        due_date: action.dueDate?.toISOString(),
        completed_at: action.completedAt?.toISOString(),
        documents: action.documents || [],
        notes: action.notes,
        created_at: action.createdAt.toISOString(),
        updated_at: action.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('BankGuaranteeActionService.getActionById failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch action');
    }
  }

  /**
   * Get actions by status
   */
  async getActionsByStatus(status: BankGuaranteeActionDTO['status']): Promise<BankGuaranteeActionDTO[]> {
    try {
      // For now, return empty array as action repository is not available
      // TODO: Implement proper action retrieval when action repository is available
      console.warn('BankGuaranteeActionService.getActionsByStatus: Action repository not available');
      return [];
    } catch (error) {
      console.error('BankGuaranteeActionService.getActionsByStatus failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch actions by status');
    }
  }

  /**
   * Get actions assigned to user
   */
  async getActionsByAssignee(userId: string): Promise<BankGuaranteeActionDTO[]> {
    try {
      // For now, return empty array as action repository is not available
      // TODO: Implement proper action retrieval when action repository is available
      console.warn('BankGuaranteeActionService.getActionsByAssignee: Action repository not available');
      return [];
    } catch (error) {
      console.error('BankGuaranteeActionService.getActionsByAssignee failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch assigned actions');
    }
  }

  /**
   * Complete an action
   */
  async completeAction(id: string, notes?: string): Promise<BankGuaranteeActionDTO> {
    try {
      // For now, throw not implemented as action repository is not available
      // TODO: Implement proper action completion when action repository is available
      throw new AppError(ErrorCode.NOT_IMPLEMENTED, 'Action completion not yet implemented');
    } catch (error) {
      console.error('BankGuaranteeActionService.completeAction failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to complete action');
    }
  }

  /**
   * Cancel an action
   */
  async cancelAction(id: string, reason?: string): Promise<BankGuaranteeActionDTO> {
    try {
      // For now, throw not implemented as action repository is not available
      // TODO: Implement proper action cancellation when action repository is available
      throw new AppError(ErrorCode.NOT_IMPLEMENTED, 'Action cancellation not yet implemented');
    } catch (error) {
      console.error('BankGuaranteeActionService.cancelAction failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to cancel action');
    }
  }

  /**
   * Create action from template
   */
  async createFromTemplate(
    templateId: string, 
    guaranteeId: string, 
    createdBy: string,
    assignedTo?: string
  ): Promise<BankGuaranteeActionDTO> {
    try {
      // For now, throw not implemented as template repository is not available
      // TODO: Implement proper template-based action creation when template repository is available
      throw new AppError(ErrorCode.NOT_IMPLEMENTED, 'Template-based action creation not yet implemented');
    } catch (error) {
      console.error('BankGuaranteeActionService.createFromTemplate failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create action from template');
    }
  }

  /**
   * Get action statistics for a guarantee
   */
  async getGuaranteeActionStats(guaranteeId: string): Promise<BankGuaranteeActionStatistics> {
    try {
      // For now, return empty statistics as action repository is not available
      // TODO: Implement proper action statistics when action repository is available
      console.warn('BankGuaranteeActionService.getGuaranteeActionStats: Action repository not available');
      return {
        total: 0,
        pending: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
        failed: 0,
        overdue: 0,
        by_type: {},
        by_priority: {}
      };
    } catch (error) {
      console.error('BankGuaranteeActionService.getGuaranteeActionStats failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get action stats');
    }
  }

  /**
   * Get all templates
   */
  async getTemplates(): Promise<BankGuaranteeActionTemplateDTO[]> {
    try {
      // For now, return empty array as template repository is not available
      // TODO: Implement proper template retrieval when template repository is available
      console.warn('BankGuaranteeActionService.getTemplates: Template repository not available');
      return [];
    } catch (error) {
      console.error('BankGuaranteeActionService.getTemplates failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch templates');
    }
  }
}
