/**
 * Bank Guarantee Action Service - Hexagonal Architecture
 * Business logic for bank guarantee action management
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { IBankGuaranteeRepository } from '@/domain/repositories/IBankGuaranteeRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import {
  BankGuaranteeActionDTO,
  CreateBankGuaranteeActionRequestDto,
  UpdateBankGuaranteeActionRequestDto,
  BankGuaranteeActionStatistics
} from '@/dtos/entities/BankGuaranteeDTO';
import { BankGuaranteeActionDTO as BankGuaranteeActionExternalDTO } from '@/dtos/bank-guarantees/BankGuaranteeActionDTO';

export class BankGuaranteeActionService {
  constructor(
    private bankGuaranteeRepository: IBankGuaranteeRepository = RepositoryFactory.getBankGuaranteeRepository()
  ) {}

  private normalizeActionType(actionType: string): BankGuaranteeActionDTO['type'] {
    const validTypes: BankGuaranteeActionDTO['type'][] = ['notification', 'claim', 'renewal', 'cancellation', 'extension'];
    if (validTypes.includes(actionType as BankGuaranteeActionDTO['type'])) {
      return actionType as BankGuaranteeActionDTO['type'];
    }
    return 'notification'; // Default fallback
  }

  /**
   * Create action (simplified interface) - static method for backward compatibility
   */
  static async create(data: {
    guarantee_id: string;
    action_type: string;
    title?: string;
    description: string;
    performed_by: string;
    created_by?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    metadata?: Record<string, unknown>;
  }): Promise<BankGuaranteeActionDTO> {
    const service = new BankGuaranteeActionService();
    return service.createAction(data);
  }

  /**
   * Create action (instance method)
   */
  async createAction(data: {
    guarantee_id: string;
    action_type: string;
    title?: string;
    description: string;
    performed_by: string;
    created_by?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    metadata?: Record<string, unknown>;
  }): Promise<BankGuaranteeActionDTO> {
    // First get the guarantee to validate it exists
    const guarantee = await this.bankGuaranteeRepository.getById(data.guarantee_id);
    
    if (!guarantee) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Bank guarantee not found');
    }

    const now = new Date().toISOString();
    const actionType = this.normalizeActionType(data.action_type);
    
    // Create full action record matching DTO
    const actionRecord: BankGuaranteeActionDTO = {
      id: `action-${Date.now()}`,
      guaranteeId: data.guarantee_id,
      type: actionType,
      status: 'pending',
      performedBy: data.performed_by,
      notes: data.description,
      createdAt: now,
      updatedAt: now
    };

    // Update guarantee with new action
    await this.bankGuaranteeRepository.update(data.guarantee_id, {
      actions: [...(guarantee.actions || []), actionRecord]
    });

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

      const now = new Date().toISOString();
      const actionType = this.normalizeActionType(actionData.action_type);

      // Create full action record
      const actionRecord: BankGuaranteeActionDTO = {
        id: `action-${Date.now()}`,
        guaranteeId: actionData.guarantee_id,
        type: actionType,
        status: 'pending',
        performedBy: actionData.created_by,
        notes: actionData.description,
        createdAt: now,
        updatedAt: now
      };

      // Update guarantee with new action
      await this.bankGuaranteeRepository.update(
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
      const guarantee = await this.bankGuaranteeRepository.getById(guaranteeId);
      return guarantee?.actions || [];
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
      // For now, return a placeholder as we need guarantee context to update embedded actions
      const now = new Date().toISOString();
      return {
        id,
        guaranteeId: '',
        type: 'notification' as const,
        status: updates.status || 'pending',
        performedBy: updates.assigned_to || '',
        notes: updates.description,
        createdAt: now,
        updatedAt: now
      };
    } catch (error) {
      console.error('BankGuaranteeActionService.updateAction failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update action');
    }
  }

  /**
   * Delete an action
   */
  async deleteAction(guaranteeId: string, actionId: string): Promise<void> {
    try {
      const guarantee = await this.bankGuaranteeRepository.getById(guaranteeId);
      if (!guarantee) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Bank guarantee not found');
      }
      
      const updatedActions = (guarantee.actions || []).filter(a => a.id !== actionId);
      await this.bankGuaranteeRepository.update(guaranteeId, { actions: updatedActions });
    } catch (error) {
      console.error('BankGuaranteeActionService.deleteAction failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete action');
    }
  }

  /**
   * Get action by ID
   */
  async getActionById(guaranteeId: string, actionId: string): Promise<BankGuaranteeActionDTO | null> {
    try {
      const guarantee = await this.bankGuaranteeRepository.getById(guaranteeId);
      if (!guarantee) return null;
      
      return (guarantee.actions || []).find(a => a.id === actionId) || null;
    } catch (error) {
      console.error('BankGuaranteeActionService.getActionById failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch action');
    }
  }

  /**
   * Get actions by status
   */
  async getActionsByStatus(status: string): Promise<BankGuaranteeActionDTO[]> {
    try {
      // For now, return empty array - would need to scan all guarantees
      console.warn('BankGuaranteeActionService.getActionsByStatus: Not fully implemented');
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
      // For now, return empty array - would need to scan all guarantees
      console.warn('BankGuaranteeActionService.getActionsByAssignee: Not fully implemented');
      return [];
    } catch (error) {
      console.error('BankGuaranteeActionService.getActionsByAssignee failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch assigned actions');
    }
  }

  /**
   * Complete an action
   */
  async completeAction(guaranteeId: string, actionId: string, notes?: string): Promise<BankGuaranteeActionDTO> {
    try {
      const guarantee = await this.bankGuaranteeRepository.getById(guaranteeId);
      if (!guarantee) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Bank guarantee not found');
      }

      const actionIndex = (guarantee.actions || []).findIndex(a => a.id === actionId);
      if (actionIndex === -1) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Action not found');
      }

      const now = new Date().toISOString();
      const updatedAction: BankGuaranteeActionDTO = {
        ...guarantee.actions![actionIndex],
        notes: notes || guarantee.actions![actionIndex].notes,
        updatedAt: now
      };

      const updatedActions = [...(guarantee.actions || [])];
      updatedActions[actionIndex] = updatedAction;
      
      await this.bankGuaranteeRepository.update(guaranteeId, { actions: updatedActions });
      
      return updatedAction;
    } catch (error) {
      console.error('BankGuaranteeActionService.completeAction failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to complete action');
    }
  }

  /**
   * Get action statistics for a guarantee
   */
  async getGuaranteeActionStats(guaranteeId: string): Promise<BankGuaranteeActionStatistics> {
    try {
      const actions = await this.getActionsByGuaranteeId(guaranteeId);
      return {
        total: actions.length,
        pending: 0,
        in_progress: 0,
        completed: actions.length,
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
  async getTemplates(): Promise<unknown[]> {
    try {
      console.warn('BankGuaranteeActionService.getTemplates: Template repository not available');
      return [];
    } catch (error) {
      console.error('BankGuaranteeActionService.getTemplates failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch templates');
    }
  }
}
