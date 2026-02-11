// Service for Payment Initiation Workflow
// Uses existing tables (notifications, supplier_payment_requests) until migration is run
import { supabase } from '@/integrations/supabase/client';
import { NotificationService } from '@/application/services/NotificationService';
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
      : null;

    // Get supplier info
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('user_id, name, email')
      .eq('id', dto.supplier_id)
      .single();

    // Create notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: supplier?.user_id,
        type: 'payment_initiation',
        title: `Demande de paiement - ${dto.project_title}`,
        message: `Nouvelle demande de paiement pour le projet ${dto.project_title}`,
        metadata: {
          payment_initiation: {
            ...dto,
            initiator_id: initiatorId,
            approval_chain: approvalChain,
            current_step: 0,
            status: initialStatus,
            supplier_deadline: supplierDeadline,
            supplier_info: supplier
          }
        },
        status: 'unread',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create payment initiation notification');
    }

    // Send notification to supplier
    await NotificationService.sendNotification({
      userId: supplier?.user_id,
      type: 'payment_initiation',
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata
    });

    return {
      id: notification.id,
      ...dto,
      initiator_id: initiatorId,
      approval_chain: approvalChain,
      current_step: 0,
      status: initialStatus,
      supplier_deadline: supplierDeadline,
      supplier_info: supplier,
      created_at: notification.created_at
    };
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

    const initiationData = notification.metadata.payment_initiation;
    const approvalChain = initiationData.approval_chain;
    const currentStep = initiationData.current_step;

    // Validate approval action
    if (action.action !== 'approve' && action.action !== 'reject') {
      throw new Error('Invalid approval action');
    }

    // Update notification status
    const newStatus = action.action === 'approve' 
      ? this.getNextStatus(currentStep, approvalChain)
      : 'rejected';

    const { error } = await supabase
      .from('notifications')
      .update({
        metadata: {
          ...notification.metadata,
          payment_initiation: {
            ...initiationData,
            current_step: currentStep + 1,
            status: newStatus,
            approvals: [
              ...(initiationData.approvals || []),
              {
                step: currentStep,
                approver_id: action.approver_id,
                action: action.action,
                comment: action.comment,
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

    // Send notification to next approver or supplier
    if (action.action === 'approve' && newStatus !== 'completed') {
      await this.notifyNextApprover(initiationData, currentStep + 1);
    } else if (newStatus === 'ready_for_supplier') {
      await this.notifySupplier(initiationData);
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

    const initiationData = notification.metadata.payment_initiation;

    // Update notification with supplier completion
    const { error } = await supabase
      .from('notifications')
      .update({
        metadata: {
          ...notification.metadata,
          payment_initiation: {
            ...initiationData,
            supplier_completion: {
              completed_at: new Date().toISOString(),
              bank_details: dto.bank_details,
              confirmation: dto.confirmation,
              documents: dto.documents
            }
          }
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', dto.notification_id);

    if (error) {
      throw new Error('Failed to handle supplier completion');
    }

    // Notify finance team
    await this.notifyFinanceTeam(initiationData);
  }

  /**
   * Get pending initiations for a user
   */
  static async getPendingInitiations(userId: string): Promise<PaymentInitiationNotification[]> {
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'payment_initiation')
      .in('status', ['pending_approval', 'ready_for_supplier'])
      .order('created_at', { ascending: false });

    return notifications?.map(n => ({
      id: n.id,
      ...n.metadata.payment_initiation,
      created_at: n.created_at
    })) || [];
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

    if (projectId) {
      query = query.eq('metadata->payment_initiation->project_id', projectId);
    }

    const { data: notifications } = await query;

    return notifications?.map(n => ({
      id: n.id,
      ...n.metadata.payment_initiation,
      created_at: n.created_at
    })) || [];
  }

  // Private helper methods
  private static async buildApprovalChain(initiatorRole: InitiatorRole, projectId: string): Promise<ApprovalChainStep[]> {
    const chain = ROLE_APPROVAL_CHAIN[initiatorRole] || [];
    
    // Get actual users for each role in the chain
    const approvalSteps: ApprovalChainStep[] = [];
    
    for (const role of chain) {
      const { data: users } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('role', role)
        .eq('status', 'active');

      if (users && users.length > 0) {
        approvalSteps.push({
          role,
          users: users.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email
          }))
        });
      }
    }

    return approvalSteps;
  }

  private static getNextStatus(currentStep: number, approvalChain: ApprovalChainStep[]): string {
    if (currentStep >= approvalChain.length - 1) {
      return 'ready_for_supplier';
    }
    return 'pending_approval';
  }

  private static async notifyNextApprover(initiationData: any, nextStep: number): Promise<void> {
    const approvalChain = initiationData.approval_chain;
    const nextApprover = approvalChain[nextStep];

    if (nextApprover && nextApprover.users.length > 0) {
      for (const user of nextApprover.users) {
        await NotificationService.sendNotification({
          userId: user.id,
          type: 'payment_approval',
          title: 'Demande d\'approbation de paiement',
          message: `Nouvelle demande d'approbation pour le projet ${initiationData.project_title}`,
          metadata: {
            payment_approval: {
              initiation_id: initiationData.id,
              step: nextStep,
              role: nextApprover.role
            }
          }
        });
      }
    }
  }

  private static async notifySupplier(initiationData: any): Promise<void> {
    if (initiationData.supplier_info) {
      await NotificationService.sendNotification({
        userId: initiationData.supplier_info.user_id,
        type: 'payment_request',
        title: 'Demande de paiement',
        message: `Vous avez une nouvelle demande de paiement pour le projet ${initiationData.project_title}`,
        metadata: {
          payment_request: {
            initiation_id: initiationData.id,
            deadline: initiationData.supplier_deadline
          }
        }
      });
    }
  }

  private static async notifyFinanceTeam(initiationData: any): Promise<void> {
    // Get finance team users
    const { data: financeUsers } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('role', 'finance')
      .eq('status', 'active');

    if (financeUsers && financeUsers.length > 0) {
      for (const user of financeUsers) {
        await NotificationService.sendNotification({
          userId: user.id,
          type: 'payment_ready',
          title: 'P prêt pour traitement',
          message: `Le paiement pour le projet ${initiationData.project_title} est prêt pour traitement`,
          metadata: {
            payment_ready: {
              initiation_id: initiationData.id,
              amount: initiationData.estimated_amount
            }
          }
        });
      }
    }
  }
}
