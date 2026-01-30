/**
 * Enhanced Action Service - Hexagonal Architecture
 * Business logic for enhanced action management across different entities
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

// Types pour les métadonnées d'action
export interface ActionMetadata {
  source?: string;
  category?: string;
  urgency?: 'normal' | 'urgent' | 'critical';
  attachments?: string[];
  customFields?: Record<string, string | number | boolean>;
  priority?: number;
  deadline?: Date;
  estimatedDuration?: number; // en minutes
  requiredSkills?: string[];
  location?: string;
  budget?: number;
}

// Action DTOs
export interface EnhancedActionDTO {
  id: string;
  entity_type: 'insurance' | 'bank_guarantee' | 'payment' | 'project' | 'document';
  entity_id: string;
  project_id?: string;
  contractor_id?: string;
  action_type: 'task_assignment' | 'hierarchy_notification' | 'sms' | 'call' | 'email' | 'mail' | 'notification';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignee_id?: string;
  recipient_ids: string[];
  metadata?: ActionMetadata;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface CreateEnhancedActionRequest {
  insuranceId?: string;
  projectId?: string;
  contractorId?: string;
  actionType: EnhancedActionDTO['action_type'];
  title: string;
  message: string;
  priority?: EnhancedActionDTO['priority'];
  assigneeId?: string;
  recipientIds?: string[];
  metadata?: Record<string, any>;
}

/**
 * Enhanced Action Service
 * Provides a unified interface for creating actions across different entity types
 */
export class EnhancedActionService {
  constructor() {}

  /**
   * Create an insurance action
   */
  async createInsuranceAction(request: CreateEnhancedActionRequest): Promise<EnhancedActionDTO> {
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
        id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        entity_type: 'insurance',
        entity_id: request.insuranceId,
        project_id: request.projectId,
        contractor_id: request.contractorId,
        action_type: request.actionType,
        title: request.title,
        message: request.message,
        priority: request.priority || 'medium',
        status: 'pending',
        assignee_id: request.assigneeId,
        recipient_ids: request.recipientIds || [],
        metadata: request.metadata,
        created_by: 'system', // Will be updated with actual user ID
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // For now, we'll create a notification through the notification service
      // TODO: Implement dedicated action repository when available
      console.log('EnhancedActionService.createInsuranceAction:', action);

      // Return the created action
      return action;
    } catch (error) {
      console.error('EnhancedActionService.createInsuranceAction failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create insurance action');
    }
  }

  /**
   * Create a bank guarantee action
   */
  async createBankGuaranteeAction(request: CreateEnhancedActionRequest): Promise<EnhancedActionDTO> {
    try {
      // Validate required fields
      if (!request.insuranceId || !request.actionType || !request.title || !request.message) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Missing required fields for bank guarantee action');
      }

      // Create action
      const action: EnhancedActionDTO = {
        id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        entity_type: 'bank_guarantee',
        entity_id: request.insuranceId,
        project_id: request.projectId,
        contractor_id: request.contractorId,
        action_type: request.actionType,
        title: request.title,
        message: request.message,
        priority: request.priority || 'medium',
        status: 'pending',
        assignee_id: request.assigneeId,
        recipient_ids: request.recipientIds || [],
        metadata: request.metadata,
        created_by: 'system',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('EnhancedActionService.createBankGuaranteeAction:', action);
      return action;
    } catch (error) {
      console.error('EnhancedActionService.createBankGuaranteeAction failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create bank guarantee action');
    }
  }

  /**
   * Create a payment action
   */
  async createPaymentAction(request: CreateEnhancedActionRequest): Promise<EnhancedActionDTO> {
    try {
      // Validate required fields
      if (!request.insuranceId || !request.actionType || !request.title || !request.message) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Missing required fields for payment action');
      }

      // Create action
      const action: EnhancedActionDTO = {
        id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        entity_type: 'payment',
        entity_id: request.insuranceId,
        project_id: request.projectId,
        contractor_id: request.contractorId,
        action_type: request.actionType,
        title: request.title,
        message: request.message,
        priority: request.priority || 'medium',
        status: 'pending',
        assignee_id: request.assigneeId,
        recipient_ids: request.recipientIds || [],
        metadata: request.metadata,
        created_by: 'system',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('EnhancedActionService.createPaymentAction:', action);
      return action;
    } catch (error) {
      console.error('EnhancedActionService.createPaymentAction failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create payment action');
    }
  }

  /**
   * Get actions by entity type and ID
   */
  async getActionsByEntity(entityType: EnhancedActionDTO['entity_type'], entityId: string): Promise<EnhancedActionDTO[]> {
    try {
      // For now, return empty array as action repository is not available
      // TODO: Implement proper action retrieval when action repository is available
      console.warn(`EnhancedActionService.getActionsByEntity: Action repository not available for ${entityType}:${entityId}`);
      return [];
    } catch (error) {
      console.error('EnhancedActionService.getActionsByEntity failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch entity actions');
    }
  }

  /**
   * Update an action status
   */
  async updateActionStatus(actionId: string, status: EnhancedActionDTO['status']): Promise<EnhancedActionDTO> {
    try {
      // For now, throw not implemented as action repository is not available
      // TODO: Implement proper action update when action repository is available
      throw new AppError(ErrorCode.NOT_IMPLEMENTED, 'Action status update not yet implemented');
    } catch (error) {
      console.error('EnhancedActionService.updateActionStatus failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update action status');
    }
  }

  /**
   * Get actions by assignee
   */
  async getActionsByAssignee(assigneeId: string): Promise<EnhancedActionDTO[]> {
    try {
      // For now, return empty array as action repository is not available
      // TODO: Implement proper action retrieval when action repository is available
      console.warn(`EnhancedActionService.getActionsByAssignee: Action repository not available for assignee ${assigneeId}`);
      return [];
    } catch (error) {
      console.error('EnhancedActionService.getActionsByAssignee failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch assigned actions');
    }
  }
}

// Export a singleton instance for backward compatibility
const enhancedActionService = new EnhancedActionService();

// Export the create function as used in UnifiedInsuranceManager
export const createInsuranceAction = enhancedActionService.createInsuranceAction.bind(enhancedActionService);

export default enhancedActionService;
