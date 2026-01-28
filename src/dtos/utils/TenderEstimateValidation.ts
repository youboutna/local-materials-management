/**
 * Tender Estimate Validation Utilities - Hexagonal Architecture
 * Centralized validation logic for tender estimate operations
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';

export class TenderEstimateValidation {
  /**
   * Validate create tender estimate request
   */
  static validateCreateTenderEstimateRequest(request: {
    tender_id: string;
    submitted_by: string;
    total_amount: number;
    currency: string;
    validity_period: number;
    notes?: string;
    items?: Array<{
      item_code: string;
      description: string;
      unit: string;
      quantity: number;
      unit_price: number;
      category?: string;
      specifications?: string;
    }>;
  }): void {
    if (!request.tender_id) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Tender ID is required');
    }

    if (!request.submitted_by) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Submitted by is required');
    }

    if (request.total_amount <= 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Total amount must be positive');
    }

    if (request.total_amount > 999999999) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Total amount too large');
    }

    if (!request.currency || request.currency.length !== 3) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Valid currency code (3 characters) is required');
    }

    if (request.validity_period < 1 || request.validity_period > 365) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Validity period must be between 1 and 365 days');
    }

    if (request.notes && request.notes.length > 2000) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Notes too long (max 2000 characters)');
    }

    // Validate items if provided
    if (request.items) {
      this.validateTenderEstimateItems(request.items);
    }
  }

  /**
   * Validate tender estimate items
   */
  static validateTenderEstimateItems(items: Array<{
    item_code: string;
    description: string;
    unit: string;
    quantity: number;
    unit_price: number;
    category?: string;
    specifications?: string;
  }>): void {
    if (items.length === 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'At least one item is required');
    }

    if (items.length > 100) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Too many items (max 100)');
    }

    const itemCodes = new Set<string>();

    for (const item of items) {
      if (!item.item_code || item.item_code.trim().length === 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Item code is required');
      }

      if (itemCodes.has(item.item_code)) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, `Duplicate item code: ${item.item_code}`);
      }
      itemCodes.add(item.item_code);

      if (item.item_code.length > 50) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, `Item code too long: ${item.item_code}`);
      }

      if (!item.description || item.description.trim().length === 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Item description is required');
      }

      if (item.description.length > 500) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Item description too long (max 500 characters)');
      }

      if (!item.unit || item.unit.trim().length === 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Item unit is required');
      }

      if (item.unit.length > 20) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Item unit too long (max 20 characters)');
      }

      if (item.quantity <= 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Item quantity must be positive');
      }

      if (item.quantity > 999999) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Item quantity too large');
      }

      if (item.unit_price <= 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Item unit price must be positive');
      }

      if (item.unit_price > 999999) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Item unit price too large');
      }

      if (item.category && item.category.length > 50) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Item category too long (max 50 characters)');
      }

      if (item.specifications && item.specifications.length > 1000) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Item specifications too long (max 1000 characters)');
      }
    }
  }

  /**
   * Validate update tender estimate request
   */
  static validateUpdateTenderEstimateRequest(request: {
    status?: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected';
    total_amount?: number;
    currency?: string;
    validity_period?: number;
    notes?: string;
  }): void {
    if (request.status) {
      const validStatuses = ['draft', 'submitted', 'under_review', 'accepted', 'rejected'];
      if (!validStatuses.includes(request.status)) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, `Invalid status: ${request.status}`);
      }
    }

    if (request.total_amount !== undefined) {
      if (request.total_amount <= 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Total amount must be positive');
      }
      if (request.total_amount > 999999999) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Total amount too large');
      }
    }

    if (request.currency && request.currency.length !== 3) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Valid currency code (3 characters) is required');
    }

    if (request.validity_period !== undefined) {
      if (request.validity_period < 1 || request.validity_period > 365) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Validity period must be between 1 and 365 days');
      }
    }

    if (request.notes && request.notes.length > 2000) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Notes too long (max 2000 characters)');
    }
  }

  /**
   * Validate update tender estimate item request
   */
  static validateUpdateTenderEstimateItemRequest(request: {
    item_code?: string;
    description?: string;
    unit?: string;
    quantity?: number;
    unit_price?: number;
    category?: string;
    specifications?: string;
  }): void {
    if (request.item_code && request.item_code.length > 50) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Item code too long (max 50 characters)');
    }

    if (request.description && request.description.length > 500) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Item description too long (max 500 characters)');
    }

    if (request.unit && request.unit.length > 20) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Item unit too long (max 20 characters)');
    }

    if (request.quantity !== undefined) {
      if (request.quantity <= 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Item quantity must be positive');
      }
      if (request.quantity > 999999) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Item quantity too large');
      }
    }

    if (request.unit_price !== undefined) {
      if (request.unit_price <= 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Item unit price must be positive');
      }
      if (request.unit_price > 999999) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Item unit price too large');
      }
    }

    if (request.category && request.category.length > 50) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Item category too long (max 50 characters)');
    }

    if (request.specifications && request.specifications.length > 1000) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Item specifications too long (max 1000 characters)');
    }
  }

  /**
   * Validate tender ID format
   */
  static validateTenderId(tenderId: string): void {
    if (!tenderId) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Tender ID is required');
    }

    // Basic UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenderId)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid tender ID format');
    }
  }

  /**
   * Validate estimate ID format
   */
  static validateEstimateId(estimateId: string): void {
    if (!estimateId) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Estimate ID is required');
    }

    // Basic UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(estimateId)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid estimate ID format');
    }
  }

  /**
   * Validate status transition
   */
  static validateStatusTransition(currentStatus: string, newStatus: string): void {
    const validTransitions: Record<string, string[]> = {
      'draft': ['submitted', 'rejected'],
      'submitted': ['under_review', 'rejected'],
      'under_review': ['accepted', 'rejected'],
      'accepted': [], // Terminal state
      'rejected': ['submitted'] // Can be resubmitted
    };

    if (validTransitions[currentStatus] && !validTransitions[currentStatus].includes(newStatus)) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR, 
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  /**
   * Calculate business rules for tender estimates
   */
  static calculateBusinessRules(totalAmount: number, tenderBudget?: number): {
    requiresApproval: boolean;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    recommendedValidityPeriod: number;
  } {
    let requiresApproval = false;
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let recommendedValidityPeriod = 30; // Default 30 days

    // Risk level based on amount
    if (totalAmount > 1000000) {
      riskLevel = 'critical';
      requiresApproval = true;
      recommendedValidityPeriod = 90;
    } else if (totalAmount > 500000) {
      riskLevel = 'high';
      requiresApproval = true;
      recommendedValidityPeriod = 60;
    } else if (totalAmount > 100000) {
      riskLevel = 'medium';
      recommendedValidityPeriod = 45;
    }

    // Adjust based on tender budget if available
    if (tenderBudget) {
      const amountRatio = totalAmount / tenderBudget;
      if (amountRatio > 0.9) {
        riskLevel = 'critical';
        requiresApproval = true;
      } else if (amountRatio > 0.7) {
        riskLevel = 'high';
        requiresApproval = true;
      }
    }

    return {
      requiresApproval,
      riskLevel,
      recommendedValidityPeriod
    };
  }

  /**
   * Check for duplicate estimates
   */
  static checkForDuplicateEstimates(existingEstimates: Array<{
    tender_id: string;
    submitted_by: string;
    status: string;
  }>, newTenderId: string, newSubmittedBy: string): void {
    const activeEstimates = existingEstimates.filter(
      estimate => estimate.tender_id === newTenderId && 
               estimate.submitted_by === newSubmittedBy &&
               ['draft', 'submitted', 'under_review'].includes(estimate.status)
    );

    if (activeEstimates.length > 0) {
      throw new AppError(
        ErrorCode.CONFLICT,
        'User already has an active estimate for this tender'
      );
    }
  }

  /**
   * Validate user permissions
   */
  static validateUserPermissions(
    userRole: string,
    action: 'create' | 'submit' | 'review' | 'approve' | 'reject'
  ): void {
    const permissions: Record<string, string[]> = {
      'admin': ['create', 'submit', 'review', 'approve', 'reject'],
      'manager': ['create', 'submit', 'review', 'approve'],
      'supervisor': ['create', 'submit', 'review'],
      'contractor': ['create', 'submit'],
      'employee': ['create']
    };

    if (!permissions[userRole] || !permissions[userRole].includes(action)) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        `User role ${userRole} is not authorized to ${action} tender estimates`
      );
    }
  }

  /**
   * Validate currency code
   */
  static validateCurrencyCode(currency: string): void {
    const validCurrencies = ['MRU', 'EUR', 'USD', 'GBP', 'JPY', 'CFA'];
    
    if (!validCurrencies.includes(currency)) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        `Invalid currency code: ${currency}. Supported currencies: ${validCurrencies.join(', ')}`
      );
    }
  }
}
