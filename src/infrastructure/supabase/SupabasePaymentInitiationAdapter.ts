import { IPaymentInitiationRepository } from '@/domain/repositories/IPaymentInitiationRepository';
import {
    ApprovalActionDTO,
    ApprovalChainStep,
    CreatePaymentInitiationDTO,
    PaymentInitiationNotificationDTO,
    SupplierCompletionDTO,
    SupplierInfoDTO
} from '@/dtos/workflows/paymentInitiationDTO';
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';

export class SupabasePaymentInitiationAdapter implements IPaymentInitiationRepository {

  private mapDbRowToDto(row: any): PaymentInitiationNotificationDTO {
    const metadata = row.metadata as Record<string, any> | null;
    const pi = metadata?.payment_initiation || {};

    return {
      id: row.id,
      projectId: pi.project_id || pi.projectId,
      phaseId: pi.phase_id || pi.phaseId,
      inspectionId: pi.inspection_id || pi.inspectionId,
      initiatedBy: pi.initiator_id || pi.initiatedBy,
      initiatorRole: pi.initiator_role || pi.initiatorRole,
      supplierId: pi.supplier_id || pi.supplierId,
      estimatedAmount: pi.estimated_amount || pi.estimatedAmount,
      justification: pi.justification,
      attachedDocuments: pi.attached_documents || pi.attachedDocuments || [],
      approvalChain: pi.approval_chain || pi.approvalChain || [],
      currentApprovalLevel: pi.current_step ?? pi.currentApprovalLevel ?? 0,
      status: pi.status,
      supplierDeadline: pi.supplier_deadline || pi.supplierDeadline,
      projectTitle: row.title?.replace('Demande de paiement - ', '') || `Projet ${pi.project_id}`,
      supplierInfo: pi.supplier_info ? {
        userId: pi.supplier_info.user_id || pi.supplier_info.userId,
        name: pi.supplier_info.name,
        email: pi.supplier_info.email
      } : undefined,
      approvals: pi.approvals?.map((a: any) => ({
        step: a.step,
        action: a.action,
        comments: a.comments,
        timestamp: a.timestamp
      })),
      supplierCompletion: pi.supplier_completion ? {
        completedAt: pi.supplier_completion.completed_at || pi.supplier_completion.completedAt,
        finalAmount: pi.supplier_completion.final_amount || pi.supplier_completion.finalAmount,
        description: pi.supplier_completion.description,
        paymentReason: pi.supplier_completion.payment_reason || pi.supplier_completion.paymentReason,
        additionalDocuments: pi.supplier_completion.additional_documents || pi.supplier_completion.additionalDocuments,
        notes: pi.supplier_completion.notes
      } : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async findById(id: string): Promise<PaymentInitiationNotificationDTO | null> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapDbRowToDto(data);
  }

  async findByRecipientId(userId: string): Promise<PaymentInitiationNotificationDTO[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .eq('type', 'payment_initiation')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(row => this.mapDbRowToDto(row));
  }

  async findAll(projectId?: string): Promise<PaymentInitiationNotificationDTO[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('type', 'payment_initiation')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    let results = data.map(row => this.mapDbRowToDto(row));
    if (projectId) {
      results = results.filter(item => item.projectId === projectId);
    }
    return results;
  }

  async getSupplier(supplierId: string): Promise<SupplierInfoDTO | null> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('user_id, name, email')
      .eq('id', supplierId)
      .single();

    if (error || !data) return null;
    return {
      userId: data.user_id,
      name: data.name,
      email: data.email
    };
  }

  async save(
    dto: CreatePaymentInitiationDTO, 
    initiatorId: string, 
    approvalChain: ApprovalChainStep[], 
    initialStatus: string, 
    supplierDeadline?: string, 
    supplierInfo?: SupplierInfoDTO
  ): Promise<PaymentInitiationNotificationDTO> {
    const projectTitle = `Projet ${dto.projectId}`;

    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        recipient_id: supplierInfo?.userId || initiatorId,
        type: 'payment_initiation',
        title: `Demande de paiement - ${projectTitle}`,
        message: `Nouvelle demande de paiement pour le projet ${projectTitle}`,
        metadata: {
          payment_initiation: {
            project_id: dto.projectId,
            phase_id: dto.phaseId,
            inspection_id: dto.inspectionId,
            initiator_id: initiatorId,
            initiator_role: dto.initiatorRole,
            supplier_id: dto.supplierId,
            estimated_amount: dto.estimatedAmount,
            justification: dto.justification,
            attached_documents: dto.attachedDocuments || [],
            approval_chain: approvalChain,
            current_step: 0,
            status: initialStatus,
            supplier_deadline: supplierDeadline,
            supplier_info: supplierInfo ? {
              user_id: supplierInfo.userId,
              name: supplierInfo.name,
              email: supplierInfo.email
            } : null
          }
        }
      }])
      .select()
      .single();

    if (error || !data) {
      throw new Error('Failed to create payment initiation notification');
    }

    return this.mapDbRowToDto(data);
  }

  async updateApproval(action: ApprovalActionDTO, newStatus: string, updatedMetadata: Record<string, unknown>): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', action.notificationId);

    if (error) {
      throw new Error('Failed to process approval action');
    }
  }

  async updateSupplierCompletion(dto: SupplierCompletionDTO, updatedMetadata: Record<string, unknown>): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', dto.notificationId);

    if (error) {
      throw new Error('Failed to handle supplier completion');
    }
  }
}