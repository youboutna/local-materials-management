import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { IPaymentBlockRepository } from '@/domain/repositories/IPaymentBlockRepository';
import { IPaymentControlActionRepository } from '@/domain/repositories/IPaymentControlActionRepository';
/**
 * Payment Service
 * Handles payment operations with hexagonal architecture
 * Following clean architecture principles
 */

import { Payment } from '@/domain/entities/Payment';
import { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import { PaymentTransformer } from '@/dtos/transforms/PaymentTransformer';
import { PaymentDTO, CreatePaymentDTO, UpdatePaymentDTO } from '@/dtos/entities/PaymentDTO';
import { AppError, ErrorCode } from '@/utils/errorHandling';

// Types pour les méthodes étendues
export interface PaymentBlockDTO {
  id: string;
  payment_id: string;
  block_reason: string;
  block_type: 'financial' | 'document' | 'compliance' | 'technical';
  blocked_amount: number;
  status: 'active' | 'resolved' | 'cancelled';
  created_by: string;
  created_at: string;
  resolved_at?: string;
}

export interface CreatePaymentBlockRequestDto {
  payment_id: string;
  block_reason: string;
  block_type: PaymentBlockDTO['block_type'];
  blocked_amount: number;
  created_by: string;
}

export interface PaymentControlActionDTO {
  id: string;
  payment_id: string;
  action_type: 'verify' | 'approve' | 'reject' | 'block' | 'unblock';
  description: string;
  performed_by: string;
  performed_at: string;
  result: 'success' | 'failure';
  notes?: string;
}

export enum PaymentStatusEnum {
  PENDING = 'pending',
  APPROVED = 'approved',
  PROCESSED = 'processed',
  COMPLETED = 'completed',
  FAILED = 'failed',
  BLOCKED = 'blocked',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

// Status transition validation (moved outside class)
function isValidPaymentStatusTransition(
  current: PaymentStatusEnum,
  next: PaymentStatusEnum
): boolean {
  const validTransitions: Record<PaymentStatusEnum, PaymentStatusEnum[]> = {
    [PaymentStatusEnum.PENDING]: [PaymentStatusEnum.APPROVED, PaymentStatusEnum.REJECTED, PaymentStatusEnum.BLOCKED],
    [PaymentStatusEnum.APPROVED]: [PaymentStatusEnum.PROCESSED, PaymentStatusEnum.CANCELLED],
    [PaymentStatusEnum.PROCESSED]: [PaymentStatusEnum.COMPLETED, PaymentStatusEnum.FAILED],
    [PaymentStatusEnum.BLOCKED]: [PaymentStatusEnum.PENDING, PaymentStatusEnum.CANCELLED],
    [PaymentStatusEnum.REJECTED]: [],
    [PaymentStatusEnum.CANCELLED]: [],
    [PaymentStatusEnum.COMPLETED]: [],
    [PaymentStatusEnum.FAILED]: []
  };
  return validTransitions[current]?.includes(next) ?? false;
}

export class PaymentService {
  constructor(
    private paymentRepository: IPaymentRepository,
    private paymentBlockRepository: IPaymentBlockRepository = RepositoryFactory.getPaymentBlockRepository(),
    private paymentControlActionRepository: IPaymentControlActionRepository = RepositoryFactory.getPaymentControlActionRepository()
  ) {}

  /**
   * Get payments by phase ID
   */
  async getPaymentsByPhase(phaseId: string): Promise<{ data: PaymentDTO[] }> {
    try {
      // Utiliser le repository pour filtrer les paiements par phase
      const allPayments = await this.paymentRepository.findAll();
      const phasePayments = allPayments.filter(payment => payment.phase?.id === phaseId);
      
      return {
        data: phasePayments.map(payment => PaymentTransformer.toDTO(payment))
      };
    } catch (error) {
      console.error('PaymentService.getPaymentsByPhase failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get payments by phase');
    }
  }

  /**
   * Get all payments
   */
  async getAllPayments(): Promise<PaymentDTO[]> {
    try {
      const payments = await this.paymentRepository.findAll();
      return payments.map(payment => PaymentTransformer.toDTO(payment));
    } catch (error) {
      console.error('[PaymentService] Error fetching all payments:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch payments');
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(id: string): Promise<PaymentDTO | null> {
    try {
      const payment = await this.paymentRepository.findById(id);
      return payment ? PaymentTransformer.toDTO(payment) : null;
    } catch (error) {
      console.error('[PaymentService] Error fetching payment:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch payment');
    }
  }

  /**
   * Create a new payment
   */
  async createPayment(data: CreatePaymentDTO): Promise<PaymentDTO> {
    try {
      // Validate required fields
      if (!data.projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required for payment creation');
      }
      
      const paymentEntity = PaymentTransformer.fromCreateDTOToEntity(data);
      
      // Save entity
      await this.paymentRepository.save(paymentEntity);
      
      // Transform back to DTO and add missing properties
      const paymentDTO = PaymentTransformer.toDTO(paymentEntity);
      return {
        ...paymentDTO,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        id: paymentEntity.id
      };
    } catch (error) {
      console.error('[PaymentService] Error creating payment:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create payment');
    }
  }

  /**
   * Update an existing payment
   */
  async updatePayment(id: string, data: UpdatePaymentDTO): Promise<void> {
    try {
      // Get existing payment
      const existingPayment = await this.paymentRepository.findById(id);
      if (!existingPayment) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Payment not found');
      }

      // Transform update data to partial entity - use 'as any' for compatibility
      const updateData = {
        contractorName: data.contractorName,
        contractorContact: data.contractorContact,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        paymentDate: data.paymentDate,
        transactionId: data.transactionId,
        progressAtPayment: data.progressAtPayment,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        checkNumber: data.checkNumber,
        mobileNumber: data.mobileNumber,
        mobileOperator: data.mobileOperator,
        receiverName: data.receiverName,
        ...(data.status ? { status: data.status } : {})
      } as Partial<Payment>;
      
      // Update entity
      await this.paymentRepository.update(id, updateData);
    } catch (error) {
      console.error('[PaymentService] Error updating payment:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update payment');
    }
  }

  /**
   * Delete a payment
   */
  async deletePayment(id: string): Promise<void> {
    try {
      const existingPayment = await this.paymentRepository.findById(id);
      if (!existingPayment) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Payment not found');
      }

      await this.paymentRepository.delete(id);
    } catch (error) {
      console.error('[PaymentService] Error deleting payment:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete payment');
    }
  }

  /**
   * Get payments by project
   */
  async getPaymentsByProject(projectId: string): Promise<PaymentDTO[]> {
    try {
      const payments = await this.paymentRepository.findByProjectId(projectId);
      return payments.map(payment => PaymentTransformer.toDTO(payment));
    } catch (error) {
      console.error('[PaymentService] Error fetching project payments:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch project payments');
    }
  }

  /**
   * Get payments by status
   */
   async getPaymentsByStatus(status: PaymentStatusEnum | string): Promise<PaymentDTO[]> {
    try {
      const payments = await this.paymentRepository.findByStatus(status as PaymentStatusEnum.PENDING);
      return payments.map(payment => PaymentTransformer.toDTO(payment));
    } catch (error) {
      console.error('[PaymentService] Error fetching payments by status:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch payments by status');
    }
  }

  /**
   * Get payment summary for project
   */
  async getPaymentSummary(projectId: string): Promise<{
    total: number;
    paid: number;
    pending: number;
    rejected: number;
  }> {
    try {
      return await this.paymentRepository.getPaymentSummary(projectId);
    } catch (error) {
      console.error('[PaymentService] Error fetching payment summary:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch payment summary');
    }
  }

  // ========================================
  // MÉTHODES ÉTENDUES - Remplacement des services spécialisés
  // ========================================

  /**
   * WORKFLOW BLOCKING (remplace PaymentBlockingService)
   * Bloquer un paiement
   */
  async blockPayment(request: CreatePaymentBlockRequestDto): Promise<PaymentBlockDTO> {
    try {
      // Vérifier que le paiement existe
      const payment = await this.getPaymentById(request.payment_id);
      if (!payment) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Payment not found');
      }

      const contractorId = payment.contractorId || payment.contractorName || 'unknown';
      const record = await this.paymentBlockRepository.create({
        projectId: payment.projectId,
        contractorId,
        amount: request.blocked_amount,
        blockingReasons: [{ reason: request.block_reason, description: request.block_type, severity: 'blocking' }],
        blockedBy: request.created_by,
        notes: `payment_id:${request.payment_id}`
      });

      const block: PaymentBlockDTO = {
        id: record.id,
        payment_id: request.payment_id,
        block_reason: request.block_reason,
        block_type: request.block_type,
        blocked_amount: record.amount,
        status: 'active',
        created_by: request.created_by,
        created_at: record.blockedAt
      };

      // Mettre à jour le statut du paiement
      await this.updatePayment(request.payment_id, { status: 'blocked' });

      console.log(`Payment ${request.payment_id} blocked: ${request.block_reason}`);
      return block;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to block payment');
    }
  }

  /**
   * WORKFLOW CONTROL ACTIONS (remplace PaymentControlActionsService)
   * Ajouter une action de contrôle sur un paiement
   */
  async addControlAction(paymentId: string, action: Omit<PaymentControlActionDTO, 'id' | 'payment_id' | 'performed_at'>): Promise<PaymentControlActionDTO> {
    try {
      // Vérifier que le paiement existe
      const payment = await this.getPaymentById(paymentId);
      if (!payment) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Payment not found');
      }

      const contractorId = payment.contractorId || payment.contractorName || 'unknown';
      let blocks = await this.paymentBlockRepository.findActiveByProjectAndContractor(payment.projectId, contractorId);
      let blockId: string;
      if (blocks.length > 0) {
        blockId = blocks[0].id;
      } else {
        // Ancrer l'action de contrôle sur un bloc de suivi (contrainte FK payment_control_actions -> payment_blocks)
        const anchorBlock = await this.paymentBlockRepository.create({
          projectId: payment.projectId,
          contractorId,
          amount: payment.amount,
          blockingReasons: [{ reason: 'control_tracking', description: 'Suivi des actions de contrôle', severity: 'warning' }],
          blockedBy: action.performed_by,
          notes: `payment_id:${paymentId}`
        });
        blockId = anchorBlock.id;
      }

      const actionRecord = await this.paymentControlActionRepository.create({
        paymentBlockId: blockId,
        actionType: action.action_type,
        description: action.description,
        createdBy: action.performed_by,
        status: action.result === 'success' ? 'completed' : 'pending'
      });

      const controlAction: PaymentControlActionDTO = {
        id: actionRecord.id,
        payment_id: paymentId,
        action_type: action.action_type,
        description: action.description,
        performed_by: action.performed_by,
        performed_at: actionRecord.createdAt,
        result: action.result,
        notes: action.notes
      };

      console.log(`Control action added to payment ${paymentId}: ${action.action_type}`);
      return controlAction;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to add control action');
    }
  }

  /**
   * WORKFLOW SUPPLIER PAYMENTS (remplace SupplierPaymentService)
   * Créer un paiement fournisseur
   */
  async createSupplierPayment(request: CreatePaymentDTO, supplierId: string): Promise<PaymentDTO> {
    try {
      // Ajouter le supplierId aux données du paiement
      const supplierPaymentRequest: CreatePaymentDTO = {
        ...request,
        supplierId,
        contractorId: request.contractorId || supplierId
      };

      // Créer le paiement
      const payment = await this.createPayment(supplierPaymentRequest);
      
      console.log(`Supplier payment created for supplier ${supplierId}`);
      return payment;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create supplier payment');
    }
  }

  /**
   * WORKFLOW COMPLET - Traitement de paiement avec contrôles
   */
  async processPaymentWithControls(paymentId: string, performedBy: string): Promise<PaymentDTO> {
    try {
      // 1. Ajouter l'action de contrôle
      await this.addControlAction(paymentId, {
        action_type: 'verify',
        description: 'Payment verification before processing',
        performed_by: performedBy,
        result: 'success'
      });

      // 2. Approuver le paiement
      await this.updatePayment(paymentId, { status: 'approved' });
      
      // Récupérer le paiement mis à jour
      const updatedPayment = await this.getPaymentById(paymentId);
      if (!updatedPayment) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Payment not found after update');
      }

      // 3. Ajouter l'action d'approbation
      await this.addControlAction(paymentId, {
        action_type: 'approve',
        description: 'Payment approved and processed',
        performed_by: performedBy,
        result: 'success'
      });

      console.log(`Payment ${paymentId} processed successfully`);
      return updatedPayment;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to process payment');
    }
  }

  /**
   * Obtenir les paiements bloqués actifs
   */
  async getActiveBlockedPayments(): Promise<PaymentDTO[]> {
    try {
      return await this.getPaymentsByStatus(PaymentStatusEnum.BLOCKED);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get active blocked payments');
    }
  }
}

let paymentServiceInstance: PaymentService | null = null;
export function getPaymentService(): PaymentService {
  if (!paymentServiceInstance) {
    paymentServiceInstance = new PaymentService(RepositoryFactory.getPaymentRepository());
  }
  return paymentServiceInstance;
}
