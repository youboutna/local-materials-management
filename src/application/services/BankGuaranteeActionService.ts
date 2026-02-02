/**
 * Bank Guarantee Action Service - Hexagonal Architecture
 * Business logic for bank guarantee action management
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { IBankGuaranteeRepository } from '@/domain/repositories/IBankGuaranteeRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

// Service DTOs for data exchange
export interface BankGuaranteeActionDTO {
  id: string;
  guarantee_id: string;
  action_type: 'notification' | 'claim' | 'renewal' | 'cancellation' | 'extension' | 'modification';
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  created_by: string;
  due_date?: string;
  completed_at?: string;
  documents: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BankGuaranteeActionTemplateDTO {
  id: string;
  action_type: BankGuaranteeActionDTO['action_type'];
  title_template: string;
  description_template: string;
  priority: BankGuaranteeActionDTO['priority'];
  default_due_days: number;
  required_documents: string[];
  is_active: boolean;
}

export interface CreateBankGuaranteeActionRequestDto {
  guarantee_id: string;
  action_type: BankGuaranteeActionDTO['action_type'];
  title: string;
  description: string;
  priority?: BankGuaranteeActionDTO['priority'];
  assigned_to?: string;
  created_by: string;
  due_date?: string;
  documents?: string[];
  notes?: string;
}

export interface UpdateBankGuaranteeActionRequestDto {
  title?: string;
  description?: string;
  status?: BankGuaranteeActionDTO['status'];
  priority?: BankGuaranteeActionDTO['priority'];
  assigned_to?: string;
  due_date?: string;
  documents?: string[];
  notes?: string;
}

export interface BankGuaranteeActionStatistics {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  failed: number;
  overdue: number;
  by_type: Record<string, number>;
  by_priority: Record<string, number>;
}

export class BankGuaranteeActionService {
  constructor(
    private bankGuaranteeRepository: IBankGuaranteeRepository = RepositoryFactory.getBankGuaranteeRepository()
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
      // For now, return empty array as action repository is not available
      // TODO: Implement proper action retrieval when action repository is available
      console.warn('BankGuaranteeActionService.getActionsByGuaranteeId: Action repository not available');
      return [];
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
      // For now, throw not implemented as action repository is not available
      // TODO: Implement proper action update when action repository is available
      throw new AppError(ErrorCode.NOT_IMPLEMENTED, 'Action update not yet implemented');
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
      // For now, throw not implemented as action repository is not available
      // TODO: Implement proper action deletion when action repository is available
      throw new AppError(ErrorCode.NOT_IMPLEMENTED, 'Action deletion not yet implemented');
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
      // For now, return null as action repository is not available
      // TODO: Implement proper action retrieval when action repository is available
      console.warn('BankGuaranteeActionService.getActionById: Action repository not available');
      return null;
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
