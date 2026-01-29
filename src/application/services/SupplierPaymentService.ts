/**
 * Supplier Payment Service - Hexagonal Architecture
 * Handles supplier payment requests and validations
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { SupplierPaymentRequestDTO } from '@/dtos/entities/SupplierPaymentDTO';
import { ISupplierPaymentRepository } from '@/domain/repositories/ISupplierPaymentRepository';

// Service DTOs for data exchange
export interface GetPendingPaymentRequestByInspectionIdRequestDto {
  inspectionId: string;
}

export interface CreatePaymentRequestRequestDto {
  inspectionId: string;
  supplierId: string;
  amount: number;
  paymentType: string;
  description?: string;
}

export interface UpdatePaymentRequestStatusRequestDto {
  id: string;
  status: string;
  comments?: string;
}

export interface GetPaymentRequestByIdRequestDto {
  id: string;
}

export interface GetPaymentRequestsBySupplierIdRequestDto {
  supplierId: string;
}

export interface ApprovePaymentRequestRequestDto {
  id: string;
  validatedBy: string;
}

export interface RejectPaymentRequestRequestDto {
  id: string;
  rejectionReason: string;
  validatedBy: string;
}

export interface MarkAsPaidRequestDto {
  id: string;
}

export class SupplierPaymentService {
  constructor(
    private repository: ISupplierPaymentRepository = RepositoryFactory.getSupplierRepository() as unknown as ISupplierPaymentRepository
  ) {}

  /**
   * Get pending payment request for an inspection
   */
  async getPendingPaymentRequestByInspectionId(request: GetPendingPaymentRequestByInspectionIdRequestDto): Promise<SupplierPaymentRequestDTO | null> {
    try {
      if (!request.inspectionId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID is required');
      }

      console.log(`[SupplierPaymentService] Checking for pending payment request for inspection: ${request.inspectionId}`);
      
      const paymentRequest = await this.repository.findByInspectionId(request.inspectionId);
      
      if (paymentRequest) {
        console.log(`[SupplierPaymentService] Found pending payment request: ${paymentRequest.id}`);
      } else {
        console.log(`[SupplierPaymentService] No pending payment request found for inspection: ${request.inspectionId}`);
      }
      
      return paymentRequest;
    } catch (error) {
      console.error('SupplierPaymentService.getPendingPaymentRequestByInspectionId failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get pending payment request');
    }
  }

  /**
   * Create a new payment request
   */
  async createPaymentRequest(request: CreatePaymentRequestRequestDto): Promise<SupplierPaymentRequestDTO> {
    try {
      // Validate required fields
      if (!request.inspectionId || !request.supplierId || !request.amount || !request.paymentType) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Missing required fields: inspectionId, supplierId, amount, paymentType');
      }
      
      // Validate amount
      if (request.amount <= 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Amount must be greater than 0');
      }

      console.log('[SupplierPaymentService] Creating payment request:', {
        inspectionId: request.inspectionId,
        supplierId: request.supplierId,
        amount: request.amount,
        paymentType: request.paymentType,
      });
      
      // Create DTO with required fields for repository
      const createData = {
        inspectionId: request.inspectionId,
        supplierId: request.supplierId,
        amount: request.amount,
        paymentType: request.paymentType,
        description: request.description,
        status: 'pending' as const,
        currency: 'EUR', // Default currency
        documents: [],
        requestedAt: new Date().toISOString(),
        processedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const paymentRequest = await this.repository.create(createData);
      
      console.log(`[SupplierPaymentService] Payment request created successfully: ${paymentRequest.id}`);
      return paymentRequest;
    } catch (error) {
      console.error('SupplierPaymentService.createPaymentRequest failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create payment request');
    }
  }

  /**
   * Update payment request status
   */
  async updatePaymentRequestStatus(request: UpdatePaymentRequestStatusRequestDto): Promise<SupplierPaymentRequestDTO> {
    try {
      if (!request.id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Payment request ID is required');
      }
      if (!request.status) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Status is required');
      }

      console.log(`[SupplierPaymentService] Updating payment request ${request.id} status to: ${request.status}`);
      
      // Validate status
      const validStatuses = ['pending', 'approved', 'rejected', 'paid'];
      if (!validStatuses.includes(request.status)) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, `Invalid status: ${request.status}. Must be one of: ${validStatuses.join(', ')}`);
      }
      
      // Check if payment request exists
      const existingRequest = await this.repository.findById(request.id);
      if (!existingRequest) {
        throw new AppError(ErrorCode.NOT_FOUND, `Payment request not found: ${request.id}`);
      }
      
      // Validate status transition
      if (existingRequest.status === 'approved' && request.status === 'pending') {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Cannot change status from approved back to pending');
      }
      
      if (existingRequest.status === 'paid' && request.status !== 'paid') {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Cannot change status from paid');
      }
      
      const updatedRequest = await this.repository.updateStatus(request.id, request.status, request.comments);
      
      console.log(`[SupplierPaymentService] Payment request ${request.id} updated successfully to status: ${request.status}`);
      return updatedRequest;
    } catch (error) {
      console.error('SupplierPaymentService.updatePaymentRequestStatus failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update payment request status');
    }
  }

  /**
   * Get payment request by ID
   */
  async getPaymentRequestById(request: GetPaymentRequestByIdRequestDto): Promise<SupplierPaymentRequestDTO | null> {
    try {
      if (!request.id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Payment request ID is required');
      }

      console.log(`[SupplierPaymentService] Getting payment request: ${request.id}`);
      
      const paymentRequest = await this.repository.findById(request.id);
      
      if (paymentRequest) {
        console.log(`[SupplierPaymentService] Found payment request: ${request.id}`);
      } else {
        console.log(`[SupplierPaymentService] Payment request not found: ${request.id}`);
      }
      
      return paymentRequest;
    } catch (error) {
      console.error('SupplierPaymentService.getPaymentRequestById failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get payment request by ID');
    }
  }

  /**
   * Get all payment requests for a supplier
   */
  async getPaymentRequestsBySupplierId(request: GetPaymentRequestsBySupplierIdRequestDto): Promise<SupplierPaymentRequestDTO[]> {
    try {
      if (!request.supplierId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Supplier ID is required');
      }

      console.log(`[SupplierPaymentService] Getting payment requests for supplier: ${request.supplierId}`);
      
      const paymentRequests = await this.repository.findBySupplierId(request.supplierId);
      
      console.log(`[SupplierPaymentService] Found ${paymentRequests.length} payment requests for supplier: ${request.supplierId}`);
      return paymentRequests;
    } catch (error) {
      console.error('SupplierPaymentService.getPaymentRequestsBySupplierId failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get payment requests by supplier ID');
    }
  }

  /**
   * Get all pending payment requests
   */
  async getPendingPaymentRequests(): Promise<SupplierPaymentRequestDTO[]> {
    try {
      console.log('[SupplierPaymentService] Getting all pending payment requests');
      
      const paymentRequests = await this.repository.findPending();
      
      console.log(`[SupplierPaymentService] Found ${paymentRequests.length} pending payment requests`);
      return paymentRequests;
    } catch (error) {
      console.error('SupplierPaymentService.getPendingPaymentRequests failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get pending payment requests');
    }
  }

  /**
   * Approve payment request
   */
  async approvePaymentRequest(request: ApprovePaymentRequestRequestDto): Promise<SupplierPaymentRequestDTO> {
    try {
      if (!request.id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Payment request ID is required');
      }
      if (!request.validatedBy) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Validated by is required');
      }

      console.log(`[SupplierPaymentService] Approving payment request: ${request.id} by: ${request.validatedBy}`);
      
      const updatedRequest = await this.repository.updateStatus(request.id, 'approved', 'Payment approved');
      
      console.log(`[SupplierPaymentService] Payment request ${request.id} approved successfully`);
      return updatedRequest;
    } catch (error) {
      console.error('SupplierPaymentService.approvePaymentRequest failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to approve payment request');
    }
  }

  /**
   * Reject payment request
   */
  async rejectPaymentRequest(request: RejectPaymentRequestRequestDto): Promise<SupplierPaymentRequestDTO> {
    try {
      if (!request.id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Payment request ID is required');
      }
      if (!request.rejectionReason || request.rejectionReason.trim().length === 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Rejection reason is required');
      }
      if (!request.validatedBy) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Validated by is required');
      }

      console.log(`[SupplierPaymentService] Rejecting payment request: ${request.id} reason: ${request.rejectionReason}`);
      
      const updatedRequest = await this.repository.updateStatus(request.id, 'rejected', request.rejectionReason);
      
      console.log(`[SupplierPaymentService] Payment request ${request.id} rejected successfully`);
      return updatedRequest;
    } catch (error) {
      console.error('SupplierPaymentService.rejectPaymentRequest failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to reject payment request');
    }
  }

  /**
   * Mark payment request as paid
   */
  async markAsPaid(request: MarkAsPaidRequestDto): Promise<SupplierPaymentRequestDTO> {
    try {
      if (!request.id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Payment request ID is required');
      }

      console.log(`[SupplierPaymentService] Marking payment request as paid: ${request.id}`);
      
      const updatedRequest = await this.repository.updateStatus(request.id, 'paid', 'Payment processed');
      
      console.log(`[SupplierPaymentService] Payment request ${request.id} marked as paid successfully`);
      return updatedRequest;
    } catch (error) {
      console.error('SupplierPaymentService.markAsPaid failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to mark payment request as paid');
    }
  }
}
