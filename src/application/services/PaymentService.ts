// src/application/services/PaymentService.ts

import { getAuthService } from '@/application/services/AuthService';
import { getDocumentService } from '@/application/services/DocumentService';
import { Payment } from '@/domain/entities/Payment';
import { IPaymentBlockRepository } from '@/domain/repositories/IPaymentBlockRepository';
import { IPaymentControlActionRepository } from '@/domain/repositories/IPaymentControlActionRepository';
import { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import { CreatePaymentBlockRequestDto, CreatePaymentControlActionRequestDto, CreatePaymentDTO, PaymentBlockDTO, PaymentControlActionDTO, PaymentDTO, PaymentEligibilityValidationDto, ResolvePaymentBlockRequestDto, UpdatePaymentDTO } from '@/dtos/entities/PaymentDTO';
import { PaymentTransformer } from '@/dtos/transforms/PaymentTransformer';
import { PaymentBlockingValidation } from '@/dtos/utils/PaymentBlockingValidation';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { ENUM_LABELS, type EnumLabel } from '@/config/referentials/i18n/enum-labels.referential';

export enum PaymentStatusEnum {
  PENDING = 'pending',
  APPROVED = 'approved',
  PROCESSED = 'processed',
  COMPLETED = 'completed',
  FAILED = 'failed',
  BLOCKED = 'blocked',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

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
    [PaymentStatusEnum.FAILED]: [],
  };
  return validTransitions[current]?.includes(next) ?? false;
}

export class PaymentService {
  constructor(
    private paymentRepository: IPaymentRepository,
    private paymentBlockRepository: IPaymentBlockRepository = RepositoryFactory.getPaymentBlockRepository(),
    private paymentControlActionRepository: IPaymentControlActionRepository = RepositoryFactory.getPaymentControlActionRepository(),
  ) {}

  // ============================================================
  // CRUD de base
  // ============================================================

  async getPaymentsByPhase(phaseId: string): Promise<{ data: PaymentDTO[] }> {
    try {
      const allPayments = await this.paymentRepository.findAll();
      const phasePayments = allPayments.filter(payment => payment.phaseRef?.id === phaseId);
      return {
        data: phasePayments.map(payment => PaymentTransformer.toDTO(payment)),
      };
    } catch (error) {
      console.error('PaymentService.getPaymentsByPhase failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get payments by phase');
    }
  }

  async getAllPayments(): Promise<PaymentDTO[]> {
    try {
      const payments = await this.paymentRepository.findAll();
      return payments.map(payment => PaymentTransformer.toDTO(payment));
    } catch (error) {
      console.error('[PaymentService] Error fetching all payments:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch payments');
    }
  }

  async getPaymentById(id: string): Promise<PaymentDTO | null> {
    try {
      const payment = await this.paymentRepository.findById(id);
      return payment ? PaymentTransformer.toDTO(payment) : null;
    } catch (error) {
      console.error('[PaymentService] Error fetching payment:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch payment');
    }
  }

  // ============================================================
  // ✅ CORRIGÉ : Création d'un paiement avec tous les champs
  // ============================================================

  async createPayment(data: CreatePaymentDTO): Promise<PaymentDTO> {
    console.log('[PaymentService] createPayment received:', data);

    if (!data.projectId) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required for payment creation');
    }

    // Récupérer l'utilisateur courant pour created_by (RLS)
    const authService = getAuthService();
    const user = await authService.getCurrentUser();
    const userId = user?.id;

    const dtoWithUser = { ...data, createdBy: userId };

    // ✅ Le transformer utilise projectRef, phaseRef, inspectionRef
    const paymentEntity = PaymentTransformer.fromCreateDTOToEntity(dtoWithUser);

    console.log('[PaymentService] entity created:', {
      projectId: paymentEntity.projectRef?.id,
      phaseId: paymentEntity.phaseRef?.id,
      inspectionId: paymentEntity.inspectionRef?.id,
      contractorId: paymentEntity.contractorId,
      receiverName: paymentEntity.receiverName,
      notes: paymentEntity.notes,
      bankName: paymentEntity.bankName,
      accountNumber: paymentEntity.accountNumber,
    });

    await this.paymentRepository.save(paymentEntity);

    // Lier les documents si présents
    if (data.documentIds?.length) {
      try {
        const documentService = getDocumentService();
        await documentService.linkDocumentsToPayment(paymentEntity.id, data.documentIds);
      } catch (linkError) {
        console.warn('[PaymentService] Erreur liaison documents:', linkError);
      }
    }

    return PaymentTransformer.toDTO(paymentEntity);
  }

  // ============================================================
  // ✅ CORRIGÉ : Mise à jour d'un paiement (tous les champs + documents)
  // ============================================================

  async updatePayment(id: string, data: UpdatePaymentDTO): Promise<void> {
    try {
      const existingPayment = await this.paymentRepository.findById(id);
      if (!existingPayment) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Payment not found');
      }

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
        contractorId: data.contractorId,
        notes: data.notes,
        status: data.status,
      } as Partial<Payment>;

      if (data.projectId !== undefined) {
        updateData.projectRef = data.projectId ? { id: data.projectId } : null;
      }
      if (data.phaseId !== undefined) {
        updateData.phaseRef = data.phaseId ? { id: data.phaseId } : null;
      }
      if (data.inspectionId !== undefined) {
        updateData.inspectionRef = data.inspectionId ? { id: data.inspectionId } : null;
      }

      await this.paymentRepository.update(id, updateData);

      // Mettre à jour les documents si nécessaire
      if (data.documentIds !== undefined) {
        try {
          const documentService = getDocumentService();
          await documentService.replacePaymentDocuments(id, data.documentIds);
        } catch (linkError) {
          console.warn('[PaymentService] Erreur mise à jour documents:', linkError);
        }
      }
    } catch (error) {
      console.error('[PaymentService] Error updating payment:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update payment');
    }
  }

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

  // ============================================================
  // Méthodes de requête
  // ============================================================

  async getPaymentsByProject(projectId: string): Promise<PaymentDTO[]> {
    try {
      const payments = await this.paymentRepository.findByProjectId(projectId);
      return payments.map(payment => PaymentTransformer.toDTO(payment));
    } catch (error) {
      console.error('[PaymentService] Error fetching project payments:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch project payments');
    }
  }

  async getPaymentsByStatus(status: PaymentStatusEnum | string): Promise<PaymentDTO[]> {
    try {
      const payments = await this.paymentRepository.findByStatus(status as unknown as import('@/domain/entities/Payment').PaymentStatus);
      return payments.map(payment => PaymentTransformer.toDTO(payment));
    } catch (error) {
      console.error('[PaymentService] Error fetching payments by status:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch payments by status');
    }
  }

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

  async getPaymentsByEntity(entityType: string, entityId: string): Promise<PaymentDTO[]> {
    try {
      let payments: Payment[] = [];
      switch (entityType) {
        case 'project': {
          payments = await this.paymentRepository.findByProjectId(entityId);
          break;
        }
        case 'inspection': {
          payments = await this.paymentRepository.findByInspectionId(entityId);
          break;
        }
        case 'supplier': {
          payments = await this.paymentRepository.findByContractor(entityId);
          break;
        }
        case 'validation': {
          const { getProjectService } = await import('@/application/services/ProjectService');
          const projectService = getProjectService();
          const projects = await projectService.getProjectsByConsultantId(entityId);
          const projectIds = projects.map(p => p.id);
          if (projectIds.length === 0) return [];
          const allPayments = await this.paymentRepository.findAll();
          payments = allPayments.filter(p => projectIds.includes(p.projectRef?.id ?? ''));
          break;
        }
        default: {
          throw new AppError(ErrorCode.VALIDATION_ERROR, `Unsupported entity type: ${entityType}`);
        }
      }
      return payments.map(payment => PaymentTransformer.toDTO(payment));
    } catch (error) {
      console.error('[PaymentService] getPaymentsByEntity failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch payments by entity');
    }
  }

  // ============================================================
  // Payment Blocking
  // ============================================================

  async blockPayment(request: CreatePaymentBlockRequestDto): Promise<PaymentBlockDTO> {
    PaymentBlockingValidation.validateCreatePaymentBlockRequest(request);
    const payment = await this.getPaymentById(request.payment_request_id);
    if (!payment) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Payment not found');
    }
    const contractorId = payment.contractorId || payment.contractorName || 'unknown';
    const record = await this.paymentBlockRepository.create({
      projectId: payment.projectRef?.id ?? '',
      contractorId,
      amount: request.blocked_amount,
      blockingReasons: [{ reason: request.block_reason, description: request.block_type, severity: 'blocking' }],
      blockedBy: 'system',
      notes: `payment_id:${request.payment_request_id}`,
    });
    const block: PaymentBlockDTO = {
      id: record.id,
      payment_request_id: request.payment_request_id,
      block_reason: request.block_reason,
      block_type: request.block_type,
      blocked_amount: record.amount,
      status: 'active',
      created_at: record.blockedAt,
      updated_at: record.blockedAt,
    };
    await this.updatePayment(request.payment_request_id, { status: 'blocked' });
    console.log(`Payment ${request.payment_request_id} blocked: ${request.block_reason}`);
    return block;
  }

  async resolvePaymentBlock(request: ResolvePaymentBlockRequestDto): Promise<void> {
    PaymentBlockingValidation.validateResolvePaymentBlockRequest(request);
    const block = await this.paymentBlockRepository.findById(request.block_id);
    if (!block) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Payment block not found');
    }
    await this.paymentBlockRepository.updateStatus(request.block_id, 'resolved', request.resolved_by, request.resolution_notes);
    const paymentId = block.paymentId;
    if (paymentId) {
      const payment = await this.getPaymentById(paymentId);
      if (payment) {
        await this.updatePayment(paymentId, { status: 'pending' });
      }
    }
    console.log(`Payment block ${request.block_id} resolved`);
  }

  async addControlAction(request: CreatePaymentControlActionRequestDto): Promise<PaymentControlActionDTO> {
    PaymentBlockingValidation.validateCreatePaymentControlActionRequest(request);
    const block = await this.paymentBlockRepository.findById(request.payment_block_id);
    if (!block) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Payment block not found');
    }
    const blockPaymentId = block.paymentId;
    if (!blockPaymentId) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Payment not found');
    }
    const payment = await this.getPaymentById(blockPaymentId);
    if (!payment) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Payment not found');
    }
    const contractorId = payment.contractorId || payment.contractorName || 'unknown';
    const blocks = await this.paymentBlockRepository.findActiveByProjectAndContractor(payment.projectRef?.id ?? '', contractorId);
    let blockId: string;
    if (blocks.length > 0) {
      blockId = blocks[0].id;
    } else {
      const anchorBlock = await this.paymentBlockRepository.create({
        projectId: payment.projectRef?.id ?? '',
        contractorId,
        amount: payment.amount,
        blockingReasons: [{ reason: 'control_tracking', description: 'Suivi des actions de contrôle', severity: 'warning' }],
        blockedBy: request.created_by || 'system',
        notes: `payment_id:${payment.id}`,
      });
      blockId = anchorBlock.id;
    }
    const actionRecord = await this.paymentControlActionRepository.create({
      paymentBlockId: blockId,
      actionType: request.action_type,
      description: request.description,
      createdBy: request.created_by || 'system',
      status: 'pending',
    });
    const controlAction: PaymentControlActionDTO = {
      id: actionRecord.id,
      payment_block_id: request.payment_block_id,
      action_type: request.action_type,
      description: request.description,
      assigned_to: request.assigned_to,
      due_date: request.due_date,
      status: 'pending',
      created_by: request.created_by || 'system',
      created_at: actionRecord.createdAt,
    };
    console.log(`Control action added to block ${request.payment_block_id}: ${request.action_type}`);
    return controlAction;
  }

  // ============================================================
  // Supplier Payments & Workflow
  // ============================================================

  async createSupplierPayment(request: CreatePaymentDTO, supplierId: string): Promise<PaymentDTO> {
    try {
      const supplierPaymentRequest: CreatePaymentDTO = {
        ...request,
        supplierId,
        contractorId: request.contractorId || supplierId,
      };
      const payment = await this.createPayment(supplierPaymentRequest);
      console.log(`Supplier payment created for supplier ${supplierId}`);
      return payment;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create supplier payment');
    }
  }

  async processPaymentWithControls(paymentId: string, performedBy: string): Promise<PaymentDTO> {
    try {
      await this.addControlAction({
        payment_block_id: paymentId,
        action_type: 'review',
        description: 'Payment verification before processing',
        created_by: performedBy,
      });
      await this.updatePayment(paymentId, { status: 'approved' });
      const updatedPayment = await this.getPaymentById(paymentId);
      if (!updatedPayment) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Payment not found after update');
      }
      await this.addControlAction({
        payment_block_id: paymentId,
        action_type: 'approve',
        description: 'Payment approved and processed',
        created_by: performedBy,
      });
      console.log(`Payment ${paymentId} processed successfully`);
      return updatedPayment;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to process payment');
    }
  }

  async getActiveBlockedPayments(): Promise<PaymentDTO[]> {
    return await this.getPaymentsByStatus(PaymentStatusEnum.BLOCKED);
  }

  async validatePaymentEligibility(projectId: string, paymentId?: string): Promise<PaymentEligibilityValidationDto> {
    const blocks = await this.paymentBlockRepository.findActiveByProject(projectId);
    const blockingReasons = blocks.map(b => ({
      type: b.blockingReasons[0]?.reason ?? 'blocked',
      description: b.blockingReasons[0]?.description ?? b.blockingReasons[0]?.reason ?? 'Payment blocked',
      severity: 'critical' as const,
      actionRequired: 'Resolve active block',
    }));
    return {
      canProceed: blocks.length === 0,
      blockingReasons: blockingReasons.length > 0 ? blockingReasons : undefined,
      warningReasons: undefined,
    };
  }
}

let paymentServiceInstance: PaymentService | null = null;
export function getPaymentService(): PaymentService {
  if (!paymentServiceInstance) {
    paymentServiceInstance = new PaymentService(RepositoryFactory.getPaymentRepository());
  }
  return paymentServiceInstance;
}

/** Libellés multilingues de PaymentStatusEnum (référentiel i18n — code technique inchangé). */
export const PAYMENT_STATUS_ENUM_LABELS: Readonly<Record<PaymentStatusEnum, EnumLabel>> =
    ENUM_LABELS.PaymentStatusEnum as Readonly<Record<PaymentStatusEnum, EnumLabel>>;
