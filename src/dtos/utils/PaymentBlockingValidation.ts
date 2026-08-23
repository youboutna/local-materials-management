/**
 * Payment Blocking Validation Utilities - Hexagonal Architecture
 * Centralized validation logic for payment blocking operations
 src/dtos/utils/PaymentBlockingValidation.ts
*/

import { AppError, ErrorCode } from '@/utils/errorHandling';

export class PaymentBlockingValidation {
  /**
   * Validate create payment block request
   */
  static validateCreatePaymentBlockRequest(request: {
    paymentRequestId: string;
    blockReason: string;
    blockType: 'financial' | 'document' | 'compliance' | 'technical';
    blockedAmount: number;
  }): void {
    if (!request.paymentRequestId) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Payment request ID is required');
    }
    if (!request.blockReason || request.blockReason.trim().length === 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Block reason is required');
    }
    if (request.blockReason.length > 500) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Block reason too long (max 500 characters)');
    }
    if (!request.blockType) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Block type is required');
    }
    const validTypes = ['financial', 'document', 'compliance', 'technical'];
    if (!validTypes.includes(request.blockType)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, `Invalid block type: ${request.blockType}`);
    }
    if (request.blockedAmount < 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Blocked amount must be positive');
    }
    if (request.blockedAmount > 999999999) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Blocked amount too large');
    }
  }

  /**
   * Validate resolve payment block request
   */
  static validateResolvePaymentBlockRequest(request: {
    blockId: string;
    resolutionNotes: string;
    resolvedBy: string;
  }): void {
    if (!request.blockId) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Block ID is required');
    }
    if (!request.resolutionNotes || request.resolutionNotes.trim().length === 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Resolution notes are required');
    }
    if (request.resolutionNotes.length > 1000) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Resolution notes too long (max 1000 characters)');
    }
    if (!request.resolvedBy) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Resolved by is required');
    }
  }

  /**
   * Validate create payment control action request
   */
  static validateCreatePaymentControlActionRequest(request: {
    paymentBlockId: string;
    actionType: 'review' | 'approve' | 'reject' | 'request_document' | 'escalate';
    description: string;
    assignedTo?: string;
    dueDate?: string;
    createdBy?: string;
  }): void {
    if (!request.paymentBlockId) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Payment block ID is required');
    }
    if (!request.actionType) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Action type is required');
    }
    const validActionTypes = ['review', 'approve', 'reject', 'request_document', 'escalate'];
    if (!validActionTypes.includes(request.actionType)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, `Invalid action type: ${request.actionType}`);
    }
    if (!request.description || request.description.trim().length === 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Description is required');
    }
    if (request.description.length > 1000) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Description too long (max 1000 characters)');
    }
    if (request.dueDate) {
      const dueDate = new Date(request.dueDate);
      const now = new Date();
      if (dueDate <= now) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Due date must be in the future');
      }
      const maxFutureDate = new Date();
      maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 1);
      if (dueDate > maxFutureDate) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Due date cannot be more than 1 year in the future');
      }
    }
  }

  /**
   * Validate payment request ID format (UUID)
   */
  static validatePaymentRequestId(paymentRequestId: string): void {
    if (!paymentRequestId) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Payment request ID is required');
    }
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
      'resolved': [],
      'cancelled': []
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
      'completed': [],
      'cancelled': []
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
    const maxBlockableAmount = projectBudget * 0.8;
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
    return { maxBlockableAmount, requiresEscalation, riskLevel };
  }

  /**
   * Check for duplicate active blocks on the same payment request
   */
  static checkForDuplicateBlocks(existingBlocks: Array<{
    paymentRequestId: string;
    status: string;
  }>, newPaymentRequestId: string): void {
    const activeBlocks = existingBlocks.filter(
      block => block.paymentRequestId === newPaymentRequestId && block.status === 'active'
    );
    if (activeBlocks.length > 0) {
      throw new AppError(
        ErrorCode.BUSINESS_RULE_VIOLATION,
        'Payment request already has an active block'
      );
    }
  }

  /**
   * Validate user permissions for block actions
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