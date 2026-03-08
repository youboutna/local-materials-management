// Service for Payment Initiation Workflow
// Uses existing tables (notifications, supplier_payment_requests) until migration is run
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { supabase as publicClient } from '@/integrations/supabase/client';
import {
  PaymentInitiationNotification,
  CreatePaymentInitiationDTO,
  ApprovalActionDTO,
  SupplierCompletionDTO,
  InitiatorRole,
  ROLE_PAYMENT_LIMITS,
  ROLE_APPROVAL_CHAIN,
  ROLE_LABELS,
  ApprovalChainStep
} from '@/types/paymentInitiation';

export class PaymentInitiationService {
  
  /**
   * Create a payment initiation notification
   * Uses notifications table with special type and metadata
   */
  static async createInitiation(dto: CreatePaymentInitiationDTO, initiatorId: string): Promise<PaymentInitiationNotification> {
    // Validate amount against role limits
    const limit = ROLE_PAYMENT_LIMITS[dto.initiator_role];
    if (dto.estimated_amount > limit) {
      throw new Error(`Le montant dépasse la limite autorisée pour votre rôle (${limit.toLocaleString()} MRU)`);
    }

    // Validate justification length for inspectors
    if (dto.initiator_role === 'inspector' && dto.justification.length < 50) {
      throw new Error('La justification doit contenir au moins 50 caractères pour les inspecteurs');
    }

    // Build approval chain
    const approvalChain = await this.buildApprovalChain(dto.initiator_role, dto.project_id);
    
    // Determine initial status
    const initialStatus = approvalChain.length === 0 ? 'ready_for_supplier' : 'pending_approval';
    const supplierDeadline = initialStatus === 'ready_for_supplier' 
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() 
      : undefined;

    // Get supplier info
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('user_id, name, email')
      .eq('id', dto.supplier_id)
      .single();

    const projectTitle = `Projet ${dto.project_id}`;

    // Create notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert([{
        recipient_id: supplier?.user_id || initiatorId,
        type: 'payment_initiation',
        title: `Demande de paiement - ${projectTitle}`,
        message: `Nouvelle demande de paiement pour le projet ${projectTitle}`,
        metadata: JSON.parse(JSON.stringify({
          payment_initiation: {
            ...dto,
            initiator_id: initiatorId,
            approval_chain: approvalChain,
            current_step: 0,
            status: initialStatus,
            supplier_deadline: supplierDeadline,
            supplier_info: supplier
          }
        }))
      }])
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create payment initiation notification');
    }

    return {
      id: notification.id,
      project_id: dto.project_id,
      phase_id: dto.phase_id,
      inspection_id: dto.inspection_id,
      initiated_by: initiatorId,
      initiator_role: dto.initiator_role,
      supplier_id: dto.supplier_id,
      estimated_amount: dto.estimated_amount,
      justification: dto.justification,
      attached_documents: dto.attached_documents || [],
      approval_chain: approvalChain,
      current_approval_level: 0,
      status: initialStatus as any,
      supplier_deadline: supplierDeadline,
      project_title: projectTitle,
      supplier_info: supplier,
      created_at: notification.created_at,
      updated_at: notification.updated_at
    } as PaymentInitiationNotification;
  }

  /**
   * Process approval action
   */
  static async processApproval(action: ApprovalActionDTO): Promise<void> {
    // Get current notification
    const { data: notification } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', action.notification_id)
      .single();

    if (!notification) {
      throw new Error('Notification not found');
    }

    const metadata = notification.metadata as Record<string, any> | null;
    const initiationData = metadata?.payment_initiation;
    if (!initiationData) {
      throw new Error('Invalid notification metadata');
    }

    const approvalChain = initiationData.approval_chain;
    const currentStep = initiationData.current_step;

    // Validate approval action
    if (action.action !== 'approved' && action.action !== 'rejected') {
      throw new Error('Invalid approval action');
    }

    // Update notification status
    const newStatus = action.action === 'approved' 
      ? this.getNextStatus(currentStep, approvalChain)
      : 'rejected';

    const { error } = await supabase
      .from('notifications')
      .update({
        metadata: {
          ...(metadata || {}),
          payment_initiation: {
            ...initiationData,
            current_step: currentStep + 1,
            status: newStatus,
            approvals: [
              ...(initiationData.approvals || []),
              {
                step: currentStep,
                action: action.action,
                comments: action.comments,
                timestamp: new Date().toISOString()
              }
            ]
          }
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', action.notification_id);

    if (error) {
      throw new Error('Failed to process approval action');
    }
  }

  /**
   * Handle supplier completion
   */
  static async handleSupplierCompletion(dto: SupplierCompletionDTO): Promise<void> {
    // Get current notification
    const { data: notification } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', dto.notification_id)
      .single();

    if (!notification) {
      throw new Error('Notification not found');
    }

    const metadata = notification.metadata as Record<string, any> | null;
    const initiationData = metadata?.payment_initiation;

    // Update notification with supplier completion
    const { error } = await supabase
      .from('notifications')
      .update({
        metadata: {
          ...(metadata || {}),
          payment_initiation: {
            ...initiationData,
            supplier_completion: {
              completed_at: new Date().toISOString(),
              final_amount: dto.final_amount,
              description: dto.description,
              payment_reason: dto.payment_reason,
              additional_documents: dto.additional_documents,
              notes: dto.notes
            }
          }
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', dto.notification_id);

    if (error) {
      throw new Error('Failed to handle supplier completion');
    }
  }

  /**
   * Get pending initiations for a user
   */
  static async getPendingInitiations(userId: string): Promise<PaymentInitiationNotification[]> {
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .eq('type', 'payment_initiation')
      .order('created_at', { ascending: false });

    return (notifications || []).map(n => {
      const metadata = n.metadata as Record<string, any> | null;
      return {
        id: n.id,
        ...(metadata?.payment_initiation || {}),
        created_at: n.created_at,
        updated_at: n.updated_at
      } as PaymentInitiationNotification;
    });
  }

  /**
   * Get initiation history
   */
  static async getInitiationHistory(projectId?: string): Promise<PaymentInitiationNotification[]> {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('type', 'payment_initiation')
      .order('created_at', { ascending: false });

    const { data: notifications } = await query;

    return (notifications || [])
      .filter(n => {
        if (!projectId) return true;
        const metadata = n.metadata as Record<string, any> | null;
        return metadata?.payment_initiation?.project_id === projectId;
      })
      .map(n => {
        const metadata = n.metadata as Record<string, any> | null;
        return {
          id: n.id,
          ...(metadata?.payment_initiation || {}),
          created_at: n.created_at,
          updated_at: n.updated_at
        } as PaymentInitiationNotification;
      });
  }

  // Private helper methods
  private static async buildApprovalChain(initiatorRole: InitiatorRole, projectId: string): Promise<ApprovalChainStep[]> {
    const chain = ROLE_APPROVAL_CHAIN[initiatorRole] || [];
    
    // Build simplified approval steps
    const approvalSteps: ApprovalChainStep[] = chain.map((role, index) => ({
      level: index + 1,
      role,
      status: 'pending' as const,
      deadline: new Date(Date.now() + (index + 1) * 3 * 24 * 60 * 60 * 1000).toISOString()
    }));

    return approvalSteps;
  }

  private static getNextStatus(currentStep: number, approvalChain: ApprovalChainStep[]): string {
    if (currentStep >= approvalChain.length - 1) {
      return 'ready_for_supplier';
    }
    return 'pending_approval';
  }
}