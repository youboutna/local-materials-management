import { IPaymentInitiationRepository } from '@/domain/repositories/IPaymentInitiationRepository';
import { SupabasePaymentInitiationAdapter } from '@/infrastructure/supabase/SupabasePaymentInitiationAdapter';
import { ApprovalChainStep } from '@/dtos/entities/PhaseDTO';;

export class PaymentInitiationService {
  private static instance: PaymentInitiationService | null = null;

  constructor(private readonly repository: IPaymentInitiationRepository) {}

  /** Instance par défaut branchée sur l'adaptateur Supabase. */
  static getInstance(): PaymentInitiationService {
    if (!PaymentInitiationService.instance) {
      PaymentInitiationService.instance = new PaymentInitiationService(
        new SupabasePaymentInitiationAdapter()
      );
    }
    return PaymentInitiationService.instance;
  }

  async createInitiation(dto: CreatePaymentInitiationDTO, initiatorId: string): Promise<PaymentInitiationNotificationDTO> {
    // 1. Validation métier des limites par rôle
    const limit = ROLE_PAYMENT_LIMITS[dto.initiatorRole];
    if (limit === undefined || dto.estimatedAmount > limit) {
      throw new Error(`Le montant dépasse la limite autorisée pour votre rôle (${limit?.toLocaleString() || 0} MRU)`);
    }

    // 2. Validation de la justification pour les inspecteurs
    if (dto.initiatorRole === 'inspector' && dto.justification.length < 50) {
      throw new Error('La justification doit contenir au moins 50 caractères pour les inspecteurs');
    }

    // 3. Construction de la chaîne d'approbation
    const approvalChain = await this.buildApprovalChain(dto.initiatorRole);
    
    // 4. Détermination du statut initial
    const initialStatus = approvalChain.length === 0 ? 'ready_for_supplier' : 'pending_approval';
    const supplierDeadline = initialStatus === 'ready_for_supplier' 
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() 
      : undefined;

    // 5. Récupération des informations du fournisseur
    const supplier = await this.repository.getSupplier(dto.supplierId);

    // 6. Sauvegarde via le repository
    return await this.repository.save(
      dto, 
      initiatorId, 
      approvalChain, 
      initialStatus, 
      supplierDeadline, 
      supplier || undefined
    );
  }

  async processApproval(action: ApprovalActionDTO): Promise<void> {
    const notification = await this.repository.findById(action.notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }

    const approvalChain = notification.approvalChain;
    const currentStep = notification.currentApprovalLevel;

    if (action.action !== 'approved' && action.action !== 'rejected') {
      throw new Error('Invalid approval action');
    }

    const newStatus = action.action === 'approved' 
      ? this.getNextStatus(currentStep, approvalChain)
      : 'rejected';

    // Préparation des métadonnées mises à jour
    const updatedMetadata = {
      payment_initiation: {
        project_id: notification.projectId,
        phase_id: notification.phaseId,
        inspection_id: notification.inspectionId,
        initiator_id: notification.initiatedBy,
        initiator_role: notification.initiatorRole,
        supplier_id: notification.supplierId,
        estimated_amount: notification.estimatedAmount,
        justification: notification.justification,
        attached_documents: notification.attachedDocuments,
        approval_chain: approvalChain,
        current_step: currentStep + 1,
        status: newStatus,
        supplier_deadline: notification.supplierDeadline,
        supplier_info: notification.supplierInfo ? {
          user_id: notification.supplierInfo.userId,
          name: notification.supplierInfo.name,
          email: notification.supplierInfo.email
        } : null,
        approvals: [
          ...(notification.approvals || []),
          {
            step: currentStep,
            action: action.action,
            comments: action.comments,
            timestamp: new Date().toISOString()
          }
        ],
        supplier_completion: notification.supplierCompletion ? {
          completed_at: notification.supplierCompletion.completedAt,
          final_amount: notification.supplierCompletion.finalAmount,
          description: notification.supplierCompletion.description,
          payment_reason: notification.supplierCompletion.paymentReason,
          additional_documents: notification.supplierCompletion.additionalDocuments,
          notes: notification.supplierCompletion.notes
        } : undefined
      }
    };

    await this.repository.updateApproval(action, newStatus, updatedMetadata);
  }

  async handleSupplierCompletion(dto: SupplierCompletionDTO): Promise<void> {
    const notification = await this.repository.findById(dto.notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }

    const updatedMetadata = {
      payment_initiation: {
        project_id: notification.projectId,
        phase_id: notification.phaseId,
        inspection_id: notification.inspectionId,
        initiator_id: notification.initiatedBy,
        initiator_role: notification.initiatorRole,
        supplier_id: notification.supplierId,
        estimated_amount: notification.estimatedAmount,
        justification: notification.justification,
        attached_documents: notification.attachedDocuments,
        approval_chain: notification.approvalChain,
        current_step: notification.currentApprovalLevel,
        status: notification.status,
        supplier_deadline: notification.supplierDeadline,
        supplier_info: notification.supplierInfo ? {
          user_id: notification.supplierInfo.userId,
          name: notification.supplierInfo.name,
          email: notification.supplierInfo.email
        } : null,
        approvals: notification.approvals,
        supplier_completion: {
          completed_at: new Date().toISOString(),
          final_amount: dto.finalAmount,
          description: dto.description,
          payment_reason: dto.paymentReason,
          additional_documents: dto.additionalDocuments,
          notes: dto.notes
        }
      }
    };

    await this.repository.updateSupplierCompletion(dto, updatedMetadata);
  }

  async getPendingInitiations(userId: string): Promise<PaymentInitiationNotificationDTO[]> {
    return await this.repository.findByRecipientId(userId);
  }

  async getInitiationHistory(projectId?: string): Promise<PaymentInitiationNotificationDTO[]> {
    return await this.repository.findAll(projectId);
  }

  private async buildApprovalChain(initiatorRole: InitiatorRole): Promise<ApprovalChainStep[]> {
    const chain = ROLE_APPROVAL_CHAIN[initiatorRole] || [];
    
    return chain.map((role, index) => ({
      level: index + 1,
      role,
      status: 'pending' as const,
      deadline: new Date(Date.now() + (index + 1) * 3 * 24 * 60 * 60 * 1000).toISOString()
    }));
  }

  private getNextStatus(currentStep: number, approvalChain: ApprovalChainStep[]): string {
    if (currentStep >= approvalChain.length - 1) {
      return 'ready_for_supplier';
    }
    return 'pending_approval';
  }
}