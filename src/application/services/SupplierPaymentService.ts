/**
 * Supplier Payment Service
 * Handles supplier payment requests and validations
 * Following hexagonal architecture principles
 */

import { SupplierPaymentRequestDTO } from '@/dtos/entities/SupplierPaymentDTO';
import { ISupplierPaymentRepository } from '@/domain/repositories/ISupplierPaymentRepository';
import { SupplierPaymentRepository } from '@/infrastructure/repositories/SupplierPaymentRepository';

export class SupplierPaymentService {
  private static repository: ISupplierPaymentRepository = new SupplierPaymentRepository();

  /**
   * Get pending payment request for an inspection
   */
  static async getPendingPaymentRequestByInspectionId(inspectionId: string): Promise<SupplierPaymentRequestDTO | null> {
    try {
      console.log(`[SupplierPaymentService] Checking for pending payment request for inspection: ${inspectionId}`);
      
      const paymentRequest = await this.repository.findByInspectionId(inspectionId);
      
      if (paymentRequest) {
        console.log(`[SupplierPaymentService] Found pending payment request: ${paymentRequest.id}`);
      } else {
        console.log(`[SupplierPaymentService] No pending payment request found for inspection: ${inspectionId}`);
      }
      
      return paymentRequest;
    } catch (error) {
      console.error('[SupplierPaymentService] Error getting pending payment request:', error);
      throw error;
    }
  }

  /**
   * Create a new payment request
   */
  static async createPaymentRequest(data: Omit<SupplierPaymentRequestDTO, 'id' | 'createdAt' | 'updatedAt' | 'requestedAt' | 'processedAt'>): Promise<SupplierPaymentRequestDTO> {
    try {
      console.log('[SupplierPaymentService] Creating payment request:', {
        inspectionId: data.inspectionId,
        supplierId: data.supplierId,
        amount: data.amount,
        paymentType: data.paymentType,
      });
      
      // Validate required fields
      if (!data.inspectionId || !data.supplierId || !data.amount || !data.paymentType) {
        throw new Error('Missing required fields: inspectionId, supplierId, amount, paymentType');
      }
      
      // Validate amount
      if (data.amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      
      const paymentRequest = await this.repository.create(data);
      
      console.log(`[SupplierPaymentService] Payment request created successfully: ${paymentRequest.id}`);
      return paymentRequest;
    } catch (error) {
      console.error('[SupplierPaymentService] Error creating payment request:', error);
      throw error;
    }
  }

  /**
   * Update payment request status
   */
  static async updatePaymentRequestStatus(id: string, status: string, comments?: string): Promise<SupplierPaymentRequestDTO> {
    try {
      console.log(`[SupplierPaymentService] Updating payment request ${id} status to: ${status}`);
      
      // Validate status
      const validStatuses = ['pending', 'approved', 'rejected', 'paid'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
      }
      
      // Check if payment request exists
      const existingRequest = await this.repository.findById(id);
      if (!existingRequest) {
        throw new Error(`Payment request not found: ${id}`);
      }
      
      // Validate status transition
      if (existingRequest.status === 'approved' && status === 'pending') {
        throw new Error('Cannot change status from approved back to pending');
      }
      
      if (existingRequest.status === 'paid' && status !== 'paid') {
        throw new Error('Cannot change status from paid');
      }
      
      const updatedRequest = await this.repository.updateStatus(id, status, comments);
      
      console.log(`[SupplierPaymentService] Payment request ${id} updated successfully to status: ${status}`);
      return updatedRequest;
    } catch (error) {
      console.error('[SupplierPaymentService] Error updating payment request status:', error);
      throw error;
    }
  }

  /**
   * Get payment request by ID
   */
  static async getPaymentRequestById(id: string): Promise<SupplierPaymentRequestDTO | null> {
    try {
      console.log(`[SupplierPaymentService] Getting payment request: ${id}`);
      
      const paymentRequest = await this.repository.findById(id);
      
      if (paymentRequest) {
        console.log(`[SupplierPaymentService] Found payment request: ${id}`);
      } else {
        console.log(`[SupplierPaymentService] Payment request not found: ${id}`);
      }
      
      return paymentRequest;
    } catch (error) {
      console.error('[SupplierPaymentService] Error getting payment request by ID:', error);
      throw error;
    }
  }

  /**
   * Get all payment requests for a supplier
   */
  static async getPaymentRequestsBySupplierId(supplierId: string): Promise<SupplierPaymentRequestDTO[]> {
    try {
      console.log(`[SupplierPaymentService] Getting payment requests for supplier: ${supplierId}`);
      
      const paymentRequests = await this.repository.findBySupplierId(supplierId);
      
      console.log(`[SupplierPaymentService] Found ${paymentRequests.length} payment requests for supplier: ${supplierId}`);
      return paymentRequests;
    } catch (error) {
      console.error('[SupplierPaymentService] Error getting payment requests by supplier ID:', error);
      throw error;
    }
  }

  /**
   * Get all pending payment requests
   */
  static async getPendingPaymentRequests(): Promise<SupplierPaymentRequestDTO[]> {
    try {
      console.log('[SupplierPaymentService] Getting all pending payment requests');
      
      const paymentRequests = await this.repository.findPending();
      
      console.log(`[SupplierPaymentService] Found ${paymentRequests.length} pending payment requests`);
      return paymentRequests;
    } catch (error) {
      console.error('[SupplierPaymentService] Error getting pending payment requests:', error);
      throw error;
    }
  }

  /**
   * Approve payment request
   */
  static async approvePaymentRequest(id: string, validatedBy: string): Promise<SupplierPaymentRequestDTO> {
    try {
      console.log(`[SupplierPaymentService] Approving payment request: ${id} by: ${validatedBy}`);
      
      const updatedRequest = await this.repository.updateStatus(id, 'approved', 'Payment approved');
      
      console.log(`[SupplierPaymentService] Payment request ${id} approved successfully`);
      return updatedRequest;
    } catch (error) {
      console.error('[SupplierPaymentService] Error approving payment request:', error);
      throw error;
    }
  }

  /**
   * Reject payment request
   */
  static async rejectPaymentRequest(id: string, rejectionReason: string, validatedBy: string): Promise<SupplierPaymentRequestDTO> {
    try {
      console.log(`[SupplierPaymentService] Rejecting payment request: ${id} reason: ${rejectionReason}`);
      
      if (!rejectionReason || rejectionReason.trim().length === 0) {
        throw new Error('Rejection reason is required');
      }
      
      const updatedRequest = await this.repository.updateStatus(id, 'rejected', rejectionReason);
      
      console.log(`[SupplierPaymentService] Payment request ${id} rejected successfully`);
      return updatedRequest;
    } catch (error) {
      console.error('[SupplierPaymentService] Error rejecting payment request:', error);
      throw error;
    }
  }

  /**
   * Mark payment request as paid
   */
  static async markAsPaid(id: string): Promise<SupplierPaymentRequestDTO> {
    try {
      console.log(`[SupplierPaymentService] Marking payment request as paid: ${id}`);
      
      const updatedRequest = await this.repository.updateStatus(id, 'paid', 'Payment processed');
      
      console.log(`[SupplierPaymentService] Payment request ${id} marked as paid successfully`);
      return updatedRequest;
    } catch (error) {
      console.error('[SupplierPaymentService] Error marking payment request as paid:', error);
      throw error;
    }
  }
}
