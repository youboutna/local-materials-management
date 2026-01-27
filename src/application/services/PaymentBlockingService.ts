/**
 * Payment Blocking Service - Hexagonal Architecture
 * Business logic for managing payment blocks and control actions
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export interface PaymentBlock {
  id: string;
  payment_request_id: string;
  block_reason: string;
  block_type: 'financial' | 'document' | 'compliance' | 'technical';
  status: 'active' | 'resolved' | 'cancelled';
  blocked_amount: number;
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentControlAction {
  id: string;
  payment_block_id: string;
  action_type: 'review' | 'approve' | 'reject' | 'request_document' | 'escalate';
  description: string;
  assigned_to?: string;
  due_date?: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
  completed_at?: string;
}

// Service DTOs for data exchange
export interface CreatePaymentBlockRequestDto {
  payment_request_id: string;
  block_reason: string;
  block_type: 'financial' | 'document' | 'compliance' | 'technical';
  blocked_amount: number;
}

export interface ResolvePaymentBlockRequestDto {
  block_id: string;
  resolution_notes: string;
  resolved_by: string;
}

export interface CreatePaymentControlActionRequestDto {
  payment_block_id: string;
  action_type: 'review' | 'approve' | 'reject' | 'request_document' | 'escalate';
  description: string;
  assigned_to?: string;
  due_date?: string;
  created_by?: string;
}

export interface PaymentBlockStatsDto {
  total: number;
  active: number;
  resolved: number;
  cancelled: number;
  totalBlockedAmount: number;
}

export interface PaymentEligibilityValidationDto {
  canProceed: boolean;
  warningReasons?: PaymentWarningReasonDto[];
  blockingReasons?: PaymentBlockingReasonDto[];
}

export interface PaymentWarningReasonDto {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  recommendedAction?: string;
}

export interface PaymentBlockingReasonDto {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  actionRequired?: string;
}

export interface PaymentProcessingResultDto {
  success: boolean;
  message: string;
  blockReasons?: string[];
}

export class PaymentBlockingService {
  constructor(
    private paymentRepository: IPaymentRepository = RepositoryFactory.getPaymentRepository()
  ) {}
  /**
   * Block a payment request
   */
  async blockPayment(request: CreatePaymentBlockRequestDto): Promise<PaymentBlock> {
    try {
      if (!request.payment_request_id || !request.block_reason || !request.block_type) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Payment request ID, block reason, and block type are required');
      }

      if (request.blocked_amount < 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Blocked amount must be positive');
      }

      // For now, return mock data as payment blocking repository is not available
      // TODO: Implement proper payment blocking when repository is available
      console.warn('PaymentBlockingService.blockPayment: Payment blocking repository not available');
      
      const now = new Date().toISOString();
      return {
        id: crypto.randomUUID(),
        payment_request_id: request.payment_request_id,
        block_reason: request.block_reason,
        block_type: request.block_type,
        blocked_amount: request.blocked_amount,
        status: 'active',
        created_at: now,
        updated_at: now
      };
    } catch (error) {
      console.error('PaymentBlockingService.blockPayment failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to block payment');
    }
  }

  /**
   * Get all active payment blocks
   */
  async getActivePaymentBlocks(): Promise<PaymentBlock[]> {
    try {
      // For now, return mock data as payment blocking repository is not available
      // TODO: Implement proper payment blocking retrieval when repository is available
      console.warn('PaymentBlockingService.getActivePaymentBlocks: Payment blocking repository not available');
      
      return [];
    } catch (error) {
      console.error('PaymentBlockingService.getActivePaymentBlocks failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get active payment blocks');
    }
  }

  /**
   * Get payment blocks for a specific payment request
   */
  async getPaymentBlocks(paymentRequestId: string): Promise<PaymentBlock[]> {
    try {
      if (!paymentRequestId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Payment request ID is required');
      }

      // For now, return mock data as payment blocking repository is not available
      // TODO: Implement proper payment blocking retrieval when repository is available
      console.warn('PaymentBlockingService.getPaymentBlocks: Payment blocking repository not available');
      
      return [];
    } catch (error) {
      console.error('PaymentBlockingService.getPaymentBlocks failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get payment blocks');
    }
  }

  /**
   * Resolve a payment block
   */
  async resolvePaymentBlock(request: ResolvePaymentBlockRequestDto): Promise<PaymentBlock> {
    try {
      if (!request.block_id || !request.resolution_notes || !request.resolved_by) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Block ID, resolution notes, and resolved by are required');
      }

      // For now, return mock data as payment blocking repository is not available
      // TODO: Implement proper payment blocking resolution when repository is available
      console.warn('PaymentBlockingService.resolvePaymentBlock: Payment blocking repository not available');
      
      const now = new Date().toISOString();
      return {
        id: request.block_id,
        payment_request_id: 'mock-payment-request-id',
        block_reason: 'Mock block reason',
        block_type: 'financial',
        blocked_amount: 1000,
        status: 'resolved',
        resolved_at: now,
        resolved_by: request.resolved_by,
        resolution_notes: request.resolution_notes,
        created_at: now,
        updated_at: now
      };
    } catch (error) {
      console.error('PaymentBlockingService.resolvePaymentBlock failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to resolve payment block');
    }
  }

  /**
   * Cancel a payment block
   */
  async cancelPaymentBlock(blockId: string): Promise<PaymentBlock> {
    try {
      if (!blockId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Block ID is required');
      }

      // For now, return mock data as payment blocking repository is not available
      // TODO: Implement proper payment blocking cancellation when repository is available
      console.warn('PaymentBlockingService.cancelPaymentBlock: Payment blocking repository not available');
      
      const now = new Date().toISOString();
      return {
        id: blockId,
        payment_request_id: 'mock-payment-request-id',
        block_reason: 'Mock block reason',
        block_type: 'financial',
        blocked_amount: 1000,
        status: 'cancelled',
        created_at: now,
        updated_at: now
      };
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

      // For now, return mock data as payment blocking repository is not available
      // TODO: Implement proper payment blocking check when repository is available
      console.warn('PaymentBlockingService.isPaymentBlocked: Payment blocking repository not available');
      
      return false;
    } catch (error) {
      console.error('PaymentBlockingService.isPaymentBlocked failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to check if payment is blocked');
    }
  }

  /**
   * Get payment block history for a payment request
   */
  async getPaymentBlockHistory(paymentRequestId: string): Promise<PaymentBlock[]> {
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
  async getPaymentBlockStats(): Promise<PaymentBlockStatsDto> {
    try {
      // For now, return mock data as payment blocking repository is not available
      // TODO: Implement proper payment blocking statistics when repository is available
      console.warn('PaymentBlockingService.getPaymentBlockStats: Payment blocking repository not available');
      
      return {
        total: 0,
        active: 0,
        resolved: 0,
        cancelled: 0,
        totalBlockedAmount: 0
      };
    } catch (error) {
      console.error('PaymentBlockingService.getPaymentBlockStats failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get payment block stats');
    }
  }

  /**
   * Create a payment control action
   */
  async createPaymentControlAction(request: CreatePaymentControlActionRequestDto): Promise<PaymentControlAction> {
    try {
      if (!request.payment_block_id || !request.action_type || !request.description) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Payment block ID, action type, and description are required');
      }

      // For now, return mock data as payment blocking repository is not available
      // TODO: Implement proper payment control action creation when repository is available
      console.warn('PaymentBlockingService.createPaymentControlAction: Payment blocking repository not available');
      
      const now = new Date().toISOString();
      return {
        id: crypto.randomUUID(),
        payment_block_id: request.payment_block_id,
        action_type: request.action_type,
        description: request.description,
        status: 'pending',
        assigned_to: request.assigned_to,
        due_date: request.due_date,
        created_by: request.created_by || 'system',
        created_at: now
      };
    } catch (error) {
      console.error('PaymentBlockingService.createPaymentControlAction failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create payment control action');
    }
  }

  /**
   * Get control actions for a payment block
   */
  async getPaymentControlActions(blockId: string): Promise<PaymentControlAction[]> {
    try {
      if (!blockId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Block ID is required');
      }

      // For now, return mock data as payment blocking repository is not available
      // TODO: Implement proper payment control action retrieval when repository is available
      console.warn('PaymentBlockingService.getPaymentControlActions: Payment blocking repository not available');
      
      return [];
    } catch (error) {
      console.error('PaymentBlockingService.getPaymentControlActions failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get payment control actions');
    }
  }

  /**
   * Complete a payment control action
   */
  async completePaymentControlAction(actionId: string): Promise<PaymentControlAction> {
    try {
      if (!actionId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Action ID is required');
      }

      // For now, return mock data as payment blocking repository is not available
      // TODO: Implement proper payment control action completion when repository is available
      console.warn('PaymentBlockingService.completePaymentControlAction: Payment blocking repository not available');
      
      const now = new Date().toISOString();
      return {
        id: actionId,
        payment_block_id: 'mock-payment-block-id',
        action_type: 'review',
        description: 'Mock action description',
        status: 'completed',
        assigned_to: 'mock-user',
        due_date: now,
        created_by: 'system',
        created_at: now,
        completed_at: now
      };
    } catch (error) {
      console.error('PaymentBlockingService.completePaymentControlAction failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to complete payment control action');
    }
  }

  /**
   * Get overdue control actions
   */
  async getOverdueActions(): Promise<PaymentControlAction[]> {
    try {
      // For now, return mock data as payment blocking repository is not available
      // TODO: Implement proper overdue actions retrieval when repository is available
      console.warn('PaymentBlockingService.getOverdueActions: Payment blocking repository not available');
      
      return [];
    } catch (error) {
      console.error('PaymentBlockingService.getOverdueActions failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get overdue actions');
    }
  }

  /**
   * Validate payment eligibility
   */
  async validatePaymentEligibility(paymentRequestId: string): Promise<PaymentEligibilityValidationDto> {
    try {
      if (!paymentRequestId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Payment request ID is required');
      }

      // Get payment request details
      const paymentRequest = await (this.paymentRepository as unknown as { findById: (id: string) => Promise<unknown> }).findById(paymentRequestId);
      
      if (!paymentRequest) {
        return {
          canProceed: false,
          warningReasons: [],
          blockingReasons: [{
            type: 'payment_not_found',
            description: 'Payment request not found',
            severity: 'critical',
            actionRequired: 'Verify payment request ID'
          }]
        };
      }

      const paymentData = paymentRequest as {
        id: string;
        amount: number;
        status: string;
        project_id: string;
        vendor_id: string;
        due_date: string;
        created_at: string;
        documents?: string[];
      };

      const warningReasons: PaymentWarningReasonDto[] = [];
      const blockingReasons: PaymentBlockingReasonDto[] = [];

      // 1. Check payment status
      if (paymentData.status === 'cancelled' || paymentData.status === 'rejected') {
        blockingReasons.push({
          type: 'invalid_status',
          description: `Payment cannot proceed: status is ${paymentData.status}`,
          severity: 'critical',
          actionRequired: 'Contact finance department'
        });
      }

      // 2. Check due date
      const dueDate = new Date(paymentData.due_date);
      const today = new Date();
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

      if (daysUntilDue < 0) {
        blockingReasons.push({
          type: 'overdue',
          description: `Payment is ${Math.abs(daysUntilDue)} days overdue`,
          severity: 'high',
          actionRequired: 'Immediate review required'
        });
      } else if (daysUntilDue <= 3) {
        warningReasons.push({
          type: 'urgent_payment',
          description: `Payment due in ${daysUntilDue} days`,
          severity: 'medium',
          recommendedAction: 'Process payment urgently'
        });
      }

      // 3. Check amount limits and decompte compatibility
      const projectBudget = await this.getProjectBudget(paymentData.project_id);
      const totalPaidAmount = await this.getTotalPaidAmount(paymentData.project_id);
      const remainingBudget = projectBudget - totalPaidAmount;
      
      if (paymentData.amount > remainingBudget) {
        blockingReasons.push({
          type: 'budget_exceeded',
          description: `Payment amount ${paymentData.amount} exceeds remaining budget ${remainingBudget}`,
          severity: 'critical',
          actionRequired: 'Review project budget allocation or increase budget'
        });
      } else if (paymentData.amount > remainingBudget * 0.8) {
        warningReasons.push({
          type: 'budget_warning',
          description: `Payment uses ${(paymentData.amount / remainingBudget * 100).toFixed(1)}% of remaining budget`,
          severity: 'high',
          recommendedAction: 'Monitor remaining budget closely'
        });
      }

      // Check decompte sequence compliance
      const lastDecompteNumber = await this.getLastDecompteNumber(paymentData.project_id);
      const expectedDecompteNumber = lastDecompteNumber + 1;
      
      if (paymentData.amount <= 0) {
        blockingReasons.push({
          type: 'invalid_amount',
          description: 'Payment amount must be positive',
          severity: 'critical',
          actionRequired: 'Verify payment calculation'
        });
      }

      // 4. Check project progress and milestone completion
      const projectProgress = await this.getProjectProgress(paymentData.project_id);
      const requiredProgressForPayment = await this.getRequiredProgressForPayment(paymentRequestId);
      
      if (projectProgress < requiredProgressForPayment) {
        blockingReasons.push({
          type: 'insufficient_progress',
          description: `Project progress ${projectProgress}% is below required ${requiredProgressForPayment}% for this payment`,
          severity: 'critical',
          actionRequired: 'Complete required work milestones before payment'
        });
      } else if (projectProgress < requiredProgressForPayment + 5) {
        warningReasons.push({
          type: 'progress_warning',
          description: `Project progress ${projectProgress}% is close to minimum requirement`,
          severity: 'medium',
          recommendedAction: 'Verify all work is properly documented'
        });
      }

      // 5. Check inspection compliance
      const pendingInspections = await this.getPendingInspections(paymentData.project_id);
      const criticalInspections = pendingInspections.filter(i => i.priority === 'critical');
      
      if (criticalInspections.length > 0) {
        blockingReasons.push({
          type: 'pending_critical_inspections',
          description: `${criticalInspections.length} critical inspections pending approval`,
          severity: 'critical',
          actionRequired: 'Complete all critical inspections before payment'
        });
      } else if (pendingInspections.length > 0) {
        warningReasons.push({
          type: 'pending_inspections',
          description: `${pendingInspections.length} inspections pending approval`,
          severity: 'medium',
          recommendedAction: 'Ensure inspections are documented in payment request'
        });
      }

      // 6. Check resource allocation and material availability
      const resourceUtilization = await this.getResourceUtilization(paymentData.project_id);
      if (resourceUtilization > 95) {
        warningReasons.push({
          type: 'resource_pressure',
          description: `Resource utilization at ${resourceUtilization}% - verify capacity for next phase`,
          severity: 'high',
          recommendedAction: 'Review resource allocation for upcoming work'
        });
      }

      // 7. Check if required documents are present and valid
      const requiredDocuments = await this.getRequiredDocumentsForPayment(paymentRequestId);
      const missingDocuments = requiredDocuments.filter(doc => !paymentData.documents?.includes(doc.id));
      
      if (missingDocuments.length > 0) {
        blockingReasons.push({
          type: 'missing_required_documents',
          description: `Missing required documents: ${missingDocuments.map(d => d.name).join(', ')}`,
          severity: 'critical',
          actionRequired: 'Upload all required documents before payment processing'
        });
      }

      // 8. Validate payment timing and sequence
      const lastPaymentDate = await this.getLastPaymentDate(paymentData.project_id);
      const minDaysBetweenPayments = 7; // Business rule: minimum 7 days between payments
      const daysSinceLastPayment = lastPaymentDate ? 
        Math.ceil((today.getTime() - new Date(lastPaymentDate).getTime()) / (1000 * 3600 * 24)) : 
        Infinity;

      if (daysSinceLastPayment < minDaysBetweenPayments) {
        blockingReasons.push({
          type: 'payment_frequency_violation',
          description: `Only ${daysSinceLastPayment} days since last payment (minimum: ${minDaysBetweenPayments} days)`,
          severity: 'critical',
          actionRequired: 'Respect payment processing timeline'
        });
      }

      // 9. Check contractual compliance
      const contractTerms = await this.getContractTerms(paymentData.project_id);
      const paymentTermsViolations = await this.validatePaymentTerms(paymentData, contractTerms);
      
      if (paymentTermsViolations.length > 0) {
        blockingReasons.push(...paymentTermsViolations.map(violation => ({
          type: 'contract_violation',
          description: violation.description,
          severity: 'critical' as const,
          actionRequired: violation.actionRequired
        })));
      }

      // 10. Check supplier/vendor compliance
      if (paymentData.vendor_id) {
        const vendorCompliance = await this.checkVendorCompliance(paymentData.vendor_id);
        
        if (!vendorCompliance.isCompliant) {
          blockingReasons.push({
            type: 'vendor_non_compliance',
            description: `Vendor ${paymentData.vendor_id} has compliance issues: ${vendorCompliance.issues.join(', ')}`,
            severity: 'critical',
            actionRequired: 'Resolve vendor compliance issues before payment'
          });
        } else if (vendorCompliance.warnings.length > 0) {
          warningReasons.push({
            type: 'vendor_warning',
            description: `Vendor has warnings: ${vendorCompliance.warnings.join(', ')}`,
            severity: 'medium',
            recommendedAction: 'Monitor vendor performance closely'
          });
        }
      }

      // 5. Check for existing blocks
      const existingBlocks = await this.getActiveBlocksForPayment(paymentRequestId);
      if (existingBlocks.length > 0) {
        blockingReasons.push({
          type: 'existing_blocks',
          description: `${existingBlocks.length} active payment blocks exist`,
          severity: 'critical',
          actionRequired: 'Resolve all existing blocks first'
        });
      }

      // 6. Check vendor status (simplified)
      if (paymentData.vendor_id) {
        // In real implementation, check vendor compliance status
        warningReasons.push({
          type: 'vendor_review',
          description: 'Vendor compliance check recommended',
          severity: 'low',
          recommendedAction: 'Verify vendor status'
        });
      }

      // 7. Check budget availability (simplified)
      if (paymentData.project_id) {
        // In real implementation, check project budget
        if (paymentData.amount > 50000) {
          warningReasons.push({
            type: 'budget_impact',
            description: 'Payment may impact project budget',
            severity: 'medium',
            recommendedAction: 'Review project budget allocation'
          });
        }
      }

      const canProceed = blockingReasons.length === 0;

      return {
        canProceed,
        warningReasons,
        blockingReasons
      };
    } catch (error) {
      console.error('PaymentBlockingService.validatePaymentEligibility failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to validate payment eligibility');
    }
  }

  // ============= PROJECT MANAGEMENT BUSINESS LOGIC METHODS =============

  /**
   * Get project total budget
   */
  private async getProjectBudget(projectId: string): Promise<number> {
    try {
      const project = await (this.paymentRepository as unknown as { 
        getProjectById: (id: string) => Promise<unknown> 
      }).getProjectById(projectId);
      
      return (project as { budget?: number })?.budget || 0;
    } catch (error) {
      console.error('PaymentBlockingService.getProjectBudget failed:', error);
      return 0;
    }
  }

  /**
   * Get total amount already paid for project
   */
  private async getTotalPaidAmount(projectId: string): Promise<number> {
    try {
      const payments = await (this.paymentRepository as unknown as { 
        getPaymentsByProject: (id: string) => Promise<unknown[]> 
      }).getPaymentsByProject(projectId);
      
      if (!payments || payments.length === 0) return 0;
      
      return payments.reduce((total: number, payment: unknown) => {
        const paymentData = payment as { amount?: number; status: string };
        return paymentData.status === 'completed' ? total + (paymentData.amount || 0) : total;
      }, 0);
    } catch (error) {
      console.error('PaymentBlockingService.getTotalPaidAmount failed:', error);
      return 0;
    }
  }

  /**
   * Get last decompte number for project
   */
  private async getLastDecompteNumber(projectId: string): Promise<number> {
    try {
      const decomptes = await (this.paymentRepository as unknown as { 
        getDecomptesByProject: (id: string) => Promise<unknown[]> 
      }).getDecomptesByProject(projectId);
      
      if (!decomptes || decomptes.length === 0) return 0;
      
      return Math.max(...decomptes.map((d: unknown) => (d as { decompte_number: number }).decompte_number || 0));
    } catch (error) {
      console.error('PaymentBlockingService.getLastDecompteNumber failed:', error);
      return 0;
    }
  }

  /**
   * Get current project progress percentage
   */
  private async getProjectProgress(projectId: string): Promise<number> {
    try {
      const project = await (this.paymentRepository as unknown as { 
        getProjectById: (id: string) => Promise<unknown> 
      }).getProjectById(projectId);
      
      return (project as { progress?: number })?.progress || 0;
    } catch (error) {
      console.error('PaymentBlockingService.getProjectProgress failed:', error);
      return 0;
    }
  }

  /**
   * Get required progress for specific payment
   */
  private async getRequiredProgressForPayment(paymentRequestId: string): Promise<number> {
    try {
      const paymentRequest = await (this.paymentRepository as unknown as { 
        findById: (id: string) => Promise<unknown> 
      }).findById(paymentRequestId);
      
      // Business rule: payment requires minimum 10% progress per 10% of payment amount
      const paymentData = paymentRequest as { amount?: number };
      const projectBudget = await this.getProjectBudget((paymentRequest as { project_id: string }).project_id);
      const paymentPercentage = projectBudget > 0 ? ((paymentData.amount || 0) / projectBudget) * 100 : 0;
      
      return Math.min(10 + (paymentPercentage * 0.8), 100); // Max 100% required
    } catch (error) {
      console.error('PaymentBlockingService.getRequiredProgressForPayment failed:', error);
      return 10; // Default minimum 10%
    }
  }

  /**
   * Get pending inspections for project
   */
  private async getPendingInspections(projectId: string): Promise<Array<{ id: string; priority: string }>> {
    try {
      const inspections = await (this.paymentRepository as unknown as { 
        getInspectionsByProject: (id: string) => Promise<unknown[]> 
      }).getInspectionsByProject(projectId);
      
      if (!inspections || inspections.length === 0) return [];
      
      return inspections
        .filter((i: unknown) => (i as { status: string }).status === 'pending')
        .map((i: unknown) => ({
          id: (i as { id: string }).id,
          priority: (i as { priority?: string }).priority || 'normal'
        }));
    } catch (error) {
      console.error('PaymentBlockingService.getPendingInspections failed:', error);
      return [];
    }
  }

  /**
   * Get resource utilization percentage
   */
  private async getResourceUtilization(projectId: string): Promise<number> {
    try {
      const resources = await (this.paymentRepository as unknown as { 
        getResourcesByProject: (id: string) => Promise<unknown[]> 
      }).getResourcesByProject(projectId);
      
      if (!resources || resources.length === 0) return 0;
      
      const totalAllocated = resources.reduce((total: number, r: unknown) => {
        return total + ((r as { allocated_hours?: number }).allocated_hours || 0);
      }, 0);
      
      const totalAvailable = resources.reduce((total: number, r: unknown) => {
        return total + ((r as { available_hours?: number }).available_hours || 0);
      }, 0);
      
      return totalAvailable > 0 ? (totalAllocated / totalAvailable) * 100 : 0;
    } catch (error) {
      console.error('PaymentBlockingService.getResourceUtilization failed:', error);
      return 0;
    }
  }

  /**
   * Get required documents for payment
   */
  private async getRequiredDocumentsForPayment(paymentRequestId: string): Promise<Array<{ id: string; name: string }>> {
    try {
      const paymentRequest = await (this.paymentRepository as unknown as { 
        findById: (id: string) => Promise<unknown> 
      }).findById(paymentRequestId);
      
      const paymentData = paymentRequest as { 
        amount?: number; 
        project_id: string;
        type?: string;
      };
      
      const requiredDocs: Array<{ id: string; name: string }> = [];
      
      // Always require invoice
      requiredDocs.push({ id: 'invoice', name: 'Facture' });
      
      // Require PV for payments > 50k
      if ((paymentData.amount || 0) > 50000) {
        requiredDocs.push({ id: 'pv', name: 'Procès-verbal de réception' });
      }
      
      // Require bank guarantee for first payment
      const lastDecompteNumber = await this.getLastDecompteNumber(paymentData.project_id);
      if (lastDecompteNumber === 0) {
        requiredDocs.push({ id: 'bank_guarantee', name: 'Garantie bancaire' });
      }
      
      // Require progress report for milestone payments
      if (paymentData.type === 'milestone') {
        requiredDocs.push({ id: 'progress_report', name: 'Rapport de progression' });
      }
      
      return requiredDocs;
    } catch (error) {
      console.error('PaymentBlockingService.getRequiredDocumentsForPayment failed:', error);
      return [];
    }
  }

  /**
   * Get last payment date for project
   */
  private async getLastPaymentDate(projectId: string): Promise<string | null> {
    try {
      const payments = await (this.paymentRepository as unknown as { 
        getPaymentsByProject: (id: string) => Promise<unknown[]> 
      }).getPaymentsByProject(projectId);
      
      if (!payments || payments.length === 0) return null;
      
      const completedPayments = payments
        .filter((p: unknown) => (p as { status: string }).status === 'completed')
        .map((p: unknown) => (p as { processed_date: string }).processed_date)
        .filter((date: string) => date);
      
      return completedPayments.length > 0 ? 
        completedPayments.sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime())[0] : 
        null;
    } catch (error) {
      console.error('PaymentBlockingService.getLastPaymentDate failed:', error);
      return null;
    }
  }

  /**
   * Get contract terms for project
   */
  private async getContractTerms(projectId: string): Promise<{
    paymentFrequency: number;
    retentionRate: number;
    maxPaymentAmount: number;
    requiredDocuments: string[];
  }> {
    try {
      const contract = await (this.paymentRepository as unknown as { 
        getContractByProject: (id: string) => Promise<unknown> 
      }).getContractByProject(projectId);
      
      const contractData = contract as {
        payment_frequency?: number;
        retention_rate?: number;
        max_payment_amount?: number;
        required_documents?: string[];
      };
      
      return {
        paymentFrequency: contractData.payment_frequency || 7,
        retentionRate: contractData.retention_rate || 0.05,
        maxPaymentAmount: contractData.max_payment_amount || 100000,
        requiredDocuments: contractData.required_documents || ['invoice']
      };
    } catch (error) {
      console.error('PaymentBlockingService.getContractTerms failed:', error);
      return {
        paymentFrequency: 7,
        retentionRate: 0.05,
        maxPaymentAmount: 100000,
        requiredDocuments: ['invoice']
      };
    }
  }

  /**
   * Validate payment terms compliance
   */
  private async validatePaymentTerms(
    paymentData: { amount?: number; project_id: string },
    contractTerms: { paymentFrequency: number; retentionRate: number; maxPaymentAmount: number }
  ): Promise<Array<{ description: string; actionRequired: string }>> {
    const violations: Array<{ description: string; actionRequired: string }> = [];
    
    // Check payment amount against contract maximum
    if ((paymentData.amount || 0) > contractTerms.maxPaymentAmount) {
      violations.push({
        description: `Payment amount exceeds contract maximum of ${contractTerms.maxPaymentAmount}`,
        actionRequired: 'Obtain approval for amount exceeding contract terms'
      });
    }
    
    // Check retention rate compliance
    const projectBudget = await this.getProjectBudget(paymentData.project_id);
    const expectedRetention = (paymentData.amount || 0) * contractTerms.retentionRate;
    
    violations.push({
      description: `Ensure ${contractTerms.retentionRate * 100}% retention (${expectedRetention}) is applied`,
      actionRequired: 'Apply proper retention rate according to contract'
    });
    
    return violations;
  }

  /**
   * Check vendor compliance status
   */
  private async checkVendorCompliance(vendorId: string): Promise<{
    isCompliant: boolean;
    issues: string[];
    warnings: string[];
  }> {
    try {
      const vendor = await (this.paymentRepository as unknown as { 
        getVendorById: (id: string) => Promise<unknown> 
      }).getVendorById(vendorId);
      
      const vendorData = vendor as {
        compliance_status?: string;
        certifications?: string[];
        last_audit_date?: string;
        payment_issues?: number;
      };
      
      const issues: string[] = [];
      const warnings: string[] = [];
      
      // Check compliance status
      if (vendorData.compliance_status !== 'compliant') {
        issues.push(`Vendor compliance status: ${vendorData.compliance_status || 'unknown'}`);
      }
      
      // Check certifications
      if (!vendorData.certifications || vendorData.certifications.length === 0) {
        warnings.push('No certifications on record');
      }
      
      // Check audit recency
      if (vendorData.last_audit_date) {
        const daysSinceAudit = Math.ceil(
          (new Date().getTime() - new Date(vendorData.last_audit_date).getTime()) / (1000 * 3600 * 24)
        );
        if (daysSinceAudit > 365) {
          warnings.push('Audit more than 1 year old');
        }
      } else {
        warnings.push('No audit record found');
      }
      
      // Check payment history
      if ((vendorData.payment_issues || 0) > 0) {
        issues.push(`${vendorData.payment_issues} payment issues in history`);
      }
      
      return {
        isCompliant: issues.length === 0,
        issues,
        warnings
      };
    } catch (error) {
      console.error('PaymentBlockingService.checkVendorCompliance failed:', error);
      return {
        isCompliant: false,
        issues: ['Unable to verify vendor compliance'],
        warnings: []
      };
    }
  }

  /**
   * Get active blocks for a payment request
   */
  private async getActiveBlocksForPayment(paymentRequestId: string): Promise<PaymentBlock[]> {
    try {
      // In a real implementation, this would query the payment blocks repository
      // For now, return empty array as no blocks exist
      return [];
    } catch (error) {
      console.error('PaymentBlockingService.getActiveBlocksForPayment failed:', error);
      return [];
    }
  }

  /**
   * Attempt payment processing
   */
  async attemptPayment(paymentRequestId: string): Promise<PaymentProcessingResultDto> {
    try {
      if (!paymentRequestId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Payment request ID is required');
      }

      const validation = await this.validatePaymentEligibility(paymentRequestId);
      
      if (!validation.canProceed) {
        return {
          success: false,
          message: 'Payment blocked due to unresolved issues',
          blockReasons: validation.blockingReasons?.map(r => r.description)
        };
      }

      // Simulate payment processing
      try {
        // In a real implementation, this would integrate with payment gateway
        return {
          success: true,
          message: 'Payment processed successfully'
        };
      } catch (error) {
        return {
          success: false,
          message: 'Payment processing failed'
        };
      }
    } catch (error) {
      console.error('PaymentBlockingService.attemptPayment failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to attempt payment');
    }
  }
}
