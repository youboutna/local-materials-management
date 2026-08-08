import {
    ApprovalActionDTO,
    ApprovalChainStep,
    CreatePaymentInitiationDTO,
    PaymentInitiationNotificationDTO,
    SupplierCompletionDTO,
    SupplierInfoDTO
} from '@/dtos/entities/PaymentInitiationDTO';

export interface IPaymentInitiationRepository {
  findById(id: string): Promise<PaymentInitiationNotificationDTO | null>;
  findByRecipientId(userId: string): Promise<PaymentInitiationNotificationDTO[]>;
  findAll(projectId?: string): Promise<PaymentInitiationNotificationDTO[]>;
  getSupplier(supplierId: string): Promise<SupplierInfoDTO | null>;
  save(
    dto: CreatePaymentInitiationDTO, 
    initiatorId: string, 
    approvalChain: ApprovalChainStep[], 
    initialStatus: string, 
    supplierDeadline?: string, 
    supplierInfo?: SupplierInfoDTO
  ): Promise<PaymentInitiationNotificationDTO>;
  updateApproval(action: ApprovalActionDTO, newStatus: string, updatedMetadata: Record<string, unknown>): Promise<void>;
  updateSupplierCompletion(dto: SupplierCompletionDTO, updatedMetadata: Record<string, unknown>): Promise<void>;
}