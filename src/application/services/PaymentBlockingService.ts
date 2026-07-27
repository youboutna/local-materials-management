/**
 * Payment Blocking Service - Hexagonal Architecture
 * Business logic for managing payment blocks and control actions
 * 
 * Pattern: Repository → Service → Transformer → DTO → Validation
 * Uses IPaymentBlockingRepository via PaymentBlockingAdapter (Supabase)
 */

import { IPaymentBlockingRepository, PaymentBlock, PaymentControlAction } from '@/domain/repositories/IPaymentBlockingRepository';
import {
    CreatePaymentBlockRequestDto,
    CreatePaymentControlActionRequestDto,
    GetPaymentBlockStatsRequestDto,
    PaymentBlockDTO,
    PaymentBlockingReasonDto,
    PaymentControlActionDTO,
    PaymentEligibilityValidationDto,
    PaymentWarningReasonDto,
    ResolvePaymentBlockRequestDto
} from '@/dtos/entities/PaymentDTO';
import { PaymentBlockingTransformer } from '@/dtos/transforms/PaymentBlockingTransformer';
import { PaymentBlockingValidation } from '@/dtos/utils/PaymentBlockingValidation';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';

// Re-export types for consumers
export type {
    CreatePaymentBlockRequestDto, CreatePaymentControlActionRequestDto,
    GetPaymentBlockStatsRequestDto, PaymentBlockDTO,
    PaymentControlActionDTO, PaymentEligibilityValidationDto, ResolvePaymentBlockRequestDto
};

// Processing result types
export interface PaymentProcessingResultDto {
  success: boolean;
  paymentId?: string;
  transactionId?: string;
  processedAt?: string;
  error?: string;
}

export class PaymentBlockingService {
  private paymentBlockingRepository: IPaymentBlockingRepository;

  constructor(paymentBlockingRepository?: IPaymentBlockingRepository) {
    this.paymentBlockingRepository = paymentBlockingRepository || RepositoryFactory.getPaymentBlockingRepository();
  }

  /**
   * Block a payment request
   * Validation → Repository → Transformer → DTO
   */
  async blockPayment(request: CreatePaymentBlockRequestDto): Promise<PaymentBlockDTO> {
    try {
      // 1. Validation Layer
      PaymentBlockingValidation.validateCreatePaymentBlockRequest(request);
      PaymentBlockingValidation.validatePaymentRequestId(request.payment_request_id);

      // 2. Business Logic - Check for duplicates
      const existingBlocks = await this.paymentBlockingRepository.getBlocksByPaymentRequest(request.payment_request_id);
      PaymentBlockingValidation.checkForDuplicateBlocks(existingBlocks, request.payment_request_id);

      // 3. Repository Layer - Create entity
      const blockData: Omit<PaymentBlock, 'id' | 'created_at' | 'updated_at'> = {
        payment_request_id: request.payment_request_id,
        block_reason: request.block_reason,
        block_type: request.block_type,
        blocked_amount: request.blocked_amount,
        status: 'active'
      };
      
      const createdBlock = await this.paymentBlockingRepository.createBlock(blockData);

      // 4. Transformer Layer - Convert to DTO
      return PaymentBlockingTransformer.toPaymentBlockDTO(createdBlock);
    } catch (error) {
      console.error('PaymentBlockingService.blockPayment failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to block payment');
    }
  }

  /**
   * Get all active payment blocks
   */
  async getActivePaymentBlocks(): Promise<PaymentBlockDTO[]> {
    try {
      const blocks = await this.paymentBlockingRepository.getActiveBlocks();
      return PaymentBlockingTransformer.toPaymentBlockDTOs(blocks);
    } catch (error) {
      console.error('PaymentBlockingService.getActivePaymentBlocks failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get active payment blocks');
    }
  }

  /**
   * Get payment blocks for a specific payment request
   */
  async getPaymentBlocks(paymentRequestId: string): Promise<PaymentBlockDTO[]> {
    try {
      PaymentBlockingValidation.validatePaymentRequestId(paymentRequestId);
      const blocks = await this.paymentBlockingRepository.getBlocksByPaymentRequest(paymentRequestId);
      return PaymentBlockingTransformer.toPaymentBlockDTOs(blocks);
    } catch (error) {
      console.error('PaymentBlockingService.getPaymentBlocks failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get payment blocks');
    }
  }

  /**
   * Resolve a payment block
   */
  async resolvePaymentBlock(request: ResolvePaymentBlockRequestDto): Promise<PaymentBlockDTO> {
    try {
      // 1. Validation Layer
      PaymentBlockingValidation.validateResolvePaymentBlockRequest(request);

      // 2. Repository Layer - Get current block
      const currentBlock = await this.paymentBlockingRepository.getBlockById(request.block_id);
      if (!currentBlock) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Payment block not found');
      }

      // 3. Business Logic - Validate status transition
      PaymentBlockingValidation.validateStatusTransition(currentBlock.status, 'resolved');

      // 4. Repository Layer - Update
      const updatedBlock = await this.paymentBlockingRepository.resolveBlock(
        request.block_id,
        request.resolution_notes,
        request.resolved_by
      );

      // 5. Transformer Layer
      return PaymentBlockingTransformer.toPaymentBlockDTO(updatedBlock);
    } catch (error) {
      console.error('PaymentBlockingService.resolvePaymentBlock failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to resolve payment block');
    }
  }

  /**
   * Cancel a payment block
   */
  async cancelPaymentBlock(blockId: string): Promise<PaymentBlockDTO> {
    try {
      if (!blockId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Block ID is required');
      }

      const cancelledBlock = await this.paymentBlockingRepository.cancelBlock(blockId);
      return PaymentBlockingTransformer.toPaymentBlockDTO(cancelledBlock);
    } catch (error) {
      console.error('PaymentBlockingService.cancelPaymentBlock failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to cancel payment block');
    }
  }

  /**
   * Check if a payment is blocked
   */
  async isPaymentBlocked(paymentRequestId: string): Promise<boolean> {
    try {
      if (!paymentRequestId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Payment request ID is required');
      }

      return await this.paymentBlockingRepository.isPaymentBlocked(paymentRequestId);
    } catch (error) {
      console.error('PaymentBlockingService.isPaymentBlocked failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to check if payment is blocked');
    }
  }

  /**
   * Get payment block history for a payment request
   */
  async getPaymentBlockHistory(paymentRequestId: string): Promise<PaymentBlockDTO[]> {
    try {
      if (!paymentRequestId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Payment request ID is required');
      }

      return this.getPaymentBlocks(paymentRequestId);
    } catch (error) {
      console.error('PaymentBlockingService.getPaymentBlockHistory failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get payment block history');
    }
  }

  /**
   * Get payment block statistics
   */
  async getPaymentBlockStats(): Promise<GetPaymentBlockStatsRequestDto> {
    try {
      const stats = await this.paymentBlockingRepository.getBlockStats();
      
      return {
        total: stats.totalBlocks,
        active: stats.activeBlocks,
        resolved: stats.resolvedBlocks,
        cancelled: stats.cancelledBlocks,
        totalBlockedAmount: stats.totalBlockedAmount,
        blocksByType: stats.blocksByType
      };
    } catch (error) {
      console.error('PaymentBlockingService.getPaymentBlockStats failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get payment block stats');
    }
  }

  /**
   * Create a payment control action
   */
  async createPaymentControlAction(request: CreatePaymentControlActionRequestDto): Promise<PaymentControlActionDTO> {
    try {
      if (!request.payment_block_id || !request.action_type || !request.description) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Payment block ID, action type, and description are required');
      }

      const actionData: Omit<PaymentControlAction, 'id' | 'created_at'> = {
        payment_block_id: request.payment_block_id,
        action_type: request.action_type,
        description: request.description,
        status: 'pending',
        assigned_to: request.assigned_to,
        due_date: request.due_date,
        created_by: request.created_by || 'system'
      };

      const createdAction = await this.paymentBlockingRepository.createAction(actionData);
      return PaymentBlockingTransformer.toPaymentControlActionDTO(createdAction);
    } catch (error) {
      console.error('PaymentBlockingService.createPaymentControlAction failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create payment control action');
    }
  }

  /**
   * Get control actions for a payment block
   */
  async getPaymentControlActions(blockId: string): Promise<PaymentControlActionDTO[]> {
    try {
      if (!blockId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Block ID is required');
      }

      const actions = await this.paymentBlockingRepository.getActionsByBlockId(blockId);
      return actions.map(action => PaymentBlockingTransformer.toPaymentControlActionDTO(action));
    } catch (error) {
      console.error('PaymentBlockingService.getPaymentControlActions failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get payment control actions');
    }
  }

  /**
   * Complete a payment control action
   */
  async completePaymentControlAction(actionId: string): Promise<PaymentControlActionDTO> {
    try {
      if (!actionId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Action ID is required');
      }

      const completedAction = await this.paymentBlockingRepository.completeAction(actionId);
      return PaymentBlockingTransformer.toPaymentControlActionDTO(completedAction);
    } catch (error) {
      console.error('PaymentBlockingService.completePaymentControlAction failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to complete payment control action');
    }
  }

  /**
   * Get overdue control actions
   */
  async getOverdueActions(): Promise<PaymentControlActionDTO[]> {
    try {
      const actions = await this.paymentBlockingRepository.getOverdueActions();
      return actions.map(action => PaymentBlockingTransformer.toPaymentControlActionDTO(action));
    } catch (error) {
      console.error('PaymentBlockingService.getOverdueActions failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get overdue actions');
    }
  }

  /**
   * Validate payment eligibility
   * Business logic for payment validation before processing
   */
  async validatePaymentEligibility(paymentRequestId: string): Promise<PaymentEligibilityValidationDto> {
    try {
      if (!paymentRequestId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Payment request ID is required');
      }

      const warningReasons: PaymentWarningReasonDto[] = [];
      const blockingReasons: PaymentBlockingReasonDto[] = [];

      // Check if payment is blocked
      const isBlocked = await this.isPaymentBlocked(paymentRequestId);
      if (isBlocked) {
        const blocks = await this.getPaymentBlocks(paymentRequestId);
        const activeBlocks = blocks.filter(b => b.status === 'active');
        
        for (const block of activeBlocks) {
          blockingReasons.push({
            type: block.block_type,
            description: block.block_reason,
            severity: 'critical',
            actionRequired: 'Resolve payment block before proceeding'
          });
        }
      }

      // Get overdue actions
      const overdueActions = await this.getOverdueActions();
      if (overdueActions.length > 0) {
        warningReasons.push({
          type: 'overdue_actions',
          description: `${overdueActions.length} overdue control action(s) pending`,
          severity: 'medium',
          recommendedAction: 'Complete overdue actions before processing payment'
        });
      }

      return {
        canProceed: blockingReasons.length === 0,
        warningReasons,
        blockingReasons
      };
    } catch (error) {
      console.error('PaymentBlockingService.validatePaymentEligibility failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to validate payment eligibility');
    }
  }

  /**
   * Process payment (if eligible)
   */
  async processPayment(paymentRequestId: string): Promise<PaymentProcessingResultDto> {
    try {
      // First validate eligibility
      const eligibility = await this.validatePaymentEligibility(paymentRequestId);
      
      if (!eligibility.canProceed) {
        return {
          success: false,
          error: (eligibility.blockingReasons || []).map(r => r.description).join('; ')
        };
      }

      // Payment processing logic would go here
      // For now, return success as actual payment processing is handled by PaymentService
      return {
        success: true,
        paymentId: paymentRequestId,
        transactionId: `TXN-${Date.now()}`,
        processedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('PaymentBlockingService.processPayment failed:', error);
      return {
        success: false,
        error: error instanceof AppError ? error.message : 'Payment processing failed'
      };
    }
  }
}
