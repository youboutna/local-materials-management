/**
 * Payment Blocking Validation Utilities - Hexagonal Architecture
 * Centralized validation logic for payment blocking operations
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';

export class PaymentBlockingValidation {
  /**
   * Validate payment block request
   */
  static validateCreatePaymentBlockRequest(request: {
    payment_request_id: string;
    block_reason: string;
    block_type: 'financial' | 'document' | 'compliance' | 'technical';
    blocked_amount: number;
  }): void {
    if (!request.payment_request_id) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Payment request ID is required');
    }

    if (!request.block_reason || request.block_reason.trim().length === 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Block reason is required');
    }

    if (request.block_reason.length > 500) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Block reason too long (max 500 characters)');
    }

    if (!request.block_type) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Block type is required');
    }

    const validTypes = ['financial', 'document', 'compliance', 'technical'];
    if (!validTypes.includes(request.block_type)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, `Invalid block type: ${request.block_type}`);
    }

    if (request.blocked_amount < 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Blocked amount must be positive');
    }

    if (request.blocked_amount > 999999999) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Blocked amount too large');
    }
  }

  /**
   * Validate resolve payment block request
   */
  static validateResolvePaymentBlockRequest(request: {
    block_id: string;
    resolution_notes: string;
    resolved_by: string;
  }): void {
    if (!request.block_id) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Block ID is required');
    }

    if (!request.resolution_notes || request.resolution_notes.trim().length === 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Resolution notes are required');
    }

    if (request.resolution_notes.length > 1000) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Resolution notes too long (max 1000 characters)');
    }

    if (!request.resolved_by) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Resolved by is required');
    }
  }

  /**
   * Validate payment control action request
   */
  static validateCreatePaymentControlActionRequest(request: {
    payment_block_id: string;
    action_type: 'review' | 'approve' | 'reject' | 'request_document' | 'escalate';
    description: string;
    assigned_to?: string;
    due_date?: string;
    created_by?: string;
  }): void {
    if (!request.payment_block_id) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Payment block ID is required');
    }

    if (!request.action_type) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Action type is required');
    }

    const validActionTypes = ['review', 'approve', 'reject', 'request_document', 'escalate'];
    if (!validActionTypes.includes(request.action_type)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, `Invalid action type: ${request.action_type}`);
    }

    if (!request.description || request.description.trim().length === 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Description is required');
    }

    if (request.description.length > 1000) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Description too long (max 1000 characters)');
    }

    if (request.due_date) {
      const dueDate = new Date(request.due_date);
      const now = new Date();
      
      if (dueDate <= now) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Due date must be in the future');
      }

      // Check if due date is not too far in the future (max 1 year)
      const maxFutureDate = new Date();
      maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 1);
      
      if (dueDate > maxFutureDate) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Due date cannot be more than 1 year in the future');
      }
    }
  }

  /**
   * Validate payment request ID format
   */
  static validatePaymentRequestId(paymentRequestId: string): void {
    if (!paymentRequestId) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Payment request ID is required');
    }

    // Basic UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(paymentRequestId)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid payment request ID format');
    }
  }

  /**
   * Validate block status transition
   */
  static validateStatusTransition(currentStatus: string, newStatus: string): void {
    const validTransitions: Record<string, string[]> = {
      'active': ['resolved', 'cancelled'],
      'resolved': [], // Terminal state
      'cancelled': []  // Terminal state
    };

    if (validTransitions[currentStatus] && !validTransitions[currentStatus].includes(newStatus)) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR, 
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  /**
   * Validate action status transition
   */
  static validateActionStatusTransition(currentStatus: string, newStatus: string): void {
    const validTransitions: Record<string, string[]> = {
      'pending': ['completed', 'cancelled'],
      'completed': [], // Terminal state
      'cancelled': []   // Terminal state
    };

    if (validTransitions[currentStatus] && !validTransitions[currentStatus].includes(newStatus)) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR, 
        `Invalid action status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  /**
   * Calculate business rules for payment blocking
   */
  static calculateBusinessRules(paymentAmount: number, projectBudget: number): {
    maxBlockableAmount: number;
    requiresEscalation: boolean;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  } {
    const maxBlockableAmount = projectBudget * 0.8; // Max 80% of project budget
    
    let requiresEscalation = false;
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    const amountRatio = paymentAmount / projectBudget;
    
    if (amountRatio > 0.5) {
      riskLevel = 'critical';
      requiresEscalation = true;
    } else if (amountRatio > 0.3) {
      riskLevel = 'high';
      requiresEscalation = true;
    } else if (amountRatio > 0.1) {
      riskLevel = 'medium';
    }

    return {
      maxBlockableAmount,
      requiresEscalation,
      riskLevel
    };
  }

  /**
   * Check for duplicate blocks
   */
  static checkForDuplicateBlocks(existingBlocks: Array<{
    payment_request_id: string;
    status: string;
  }>, newPaymentRequestId: string): void {
    const activeBlocks = existingBlocks.filter(
      block => block.payment_request_id === newPaymentRequestId && 
               block.status === 'active'
    );

    if (activeBlocks.length > 0) {
      throw new AppError(
        ErrorCode.CONFLICT,
        'Payment request already has an active block'
      );
    }
  }

  /**
   * Validate user permissions
   */
  static validateUserPermissions(
    userRole: string,
    action: 'create' | 'resolve' | 'cancel' | 'escalate'
  ): void {
    const permissions: Record<string, string[]> = {
      'admin': ['create', 'resolve', 'cancel', 'escalate'],
      'manager': ['create', 'resolve', 'escalate'],
      'supervisor': ['create', 'escalate'],
      'employee': ['create']
    };

    if (!permissions[userRole] || !permissions[userRole].includes(action)) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        `User role ${userRole} is not authorized to ${action} payment blocks`
      );
    }
  }
}
