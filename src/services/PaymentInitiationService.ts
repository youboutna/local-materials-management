// @ts-nocheck
// Service for Payment Initiation Workflow
// Uses existing tables (notifications, supplier_payment_requests) until migration is run
import { supabase } from '@/integrations/supabase/client';
import { NotificationService } from './NotificationService';
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

    // Store as a special notification with all data in metadata
    // Serialize approval_chain to be JSON-compatible
    const serializedApprovalChain = approvalChain.map(step => ({
      level: step.level,
      role: step.role,
      approver_id: step.approver_id || null,
      approver_name: step.approver_name || null,
      status: step.status,
      action_at: step.action_at || null,
      comments: step.comments || null,
      deadline: step.deadline
    }));

    const notificationData = {
      recipient_id: supplier?.user_id || initiatorId,
      title: 'Initiation de paiement',
      message: `Demande de paiement de ${dto.estimated_amount.toLocaleString()} MRU initiée`,
      type: 'payment_initiation',
      related_id: dto.project_id,
      metadata: {
        project_id: dto.project_id,
        phase_id: dto.phase_id || null,
        inspection_id: dto.inspection_id || null,
        initiated_by: initiatorId,
        initiator_role: dto.initiator_role,
        supplier_id: dto.supplier_id,
        supplier_name: supplier?.name || null,
        estimated_amount: dto.estimated_amount,
        justification: dto.justification,
        attached_documents: dto.attached_documents || [],
        status: initialStatus,
        approval_chain: serializedApprovalChain,
        current_approval_level: 0,
        supplier_deadline: supplierDeadline
      } as Record<string, unknown>
    };

    const { data, error } = await supabase
      .from('notifications')
      .insert([notificationData as any])
      .select()
      .single();

    if (error) {
      console.error('Error creating payment initiation:', error);
      throw error;
    }

    // If direct to supplier, also create notification for supplier
    if (initialStatus === 'ready_for_supplier' && supplier?.user_id) {
      await NotificationService.createNotification({
        recipient_id: supplier.user_id,
        title: 'Nouvelle demande de paiement initiée',
        message: `Une demande de paiement de ${dto.estimated_amount.toLocaleString()} MRU vous a été adressée. Délai: 7 jours.`,
        type: 'payment_initiation_supplier',
        related_id: data.id,
        metadata: { 
          deadline_days: 7,
          estimated_amount: dto.estimated_amount,
          project_id: dto.project_id
        }
      });
    } else if (approvalChain.length > 0 && approvalChain[0].approver_id) {
      // Notify first approver
      await this.notifyApprover(data.id, approvalChain[0], dto.estimated_amount);
    }

    // Convert to expected format
    const result = this.notificationToInitiation(data);
    return result;
  }

  /**
   * Build approval chain based on initiator role
   */
  private static async buildApprovalChain(role: InitiatorRole, projectId: string): Promise<ApprovalChainStep[]> {
    const requiredApprovers = ROLE_APPROVAL_CHAIN[role];
    if (requiredApprovers.length === 0) return [];

    const chain: ApprovalChainStep[] = [];
    
    // Get project stakeholders to find approvers
    const { data: stakeholders } = await supabase
      .from('project_stakeholders')
      .select('*, suppliers(name, user_id)')
      .eq('project_id', projectId);

    for (let i = 0; i < requiredApprovers.length; i++) {
      const approverRole = requiredApprovers[i];
      const deadline = new Date(Date.now() + (approverRole === 'project_manager' ? 24 : 48) * 60 * 60 * 1000);
      
      // Try to find approver from stakeholders by stakeholder_type
      const roleMapping: Record<string, string> = {
        'project_manager': 'owner',
        'technical_manager': 'technical_responsible',
        'engineering_consultant': 'engineering_consultant'
      };
      
      const stakeholder = stakeholders?.find(s => s.stakeholder_type === roleMapping[approverRole]);
      
      chain.push({
        level: i + 1,
        role: approverRole,
        approver_id: stakeholder?.suppliers?.user_id || undefined,
        approver_name: stakeholder?.suppliers?.name || undefined,
        status: 'pending',
        deadline: deadline.toISOString()
      });
    }

    return chain;
  }

  /**
   * Get initiations for supplier (from notifications)
   */
  static async getSupplierInitiations(supplierId: string): Promise<PaymentInitiationNotification[]> {
    // Get supplier's user_id
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('user_id')
      .eq('id', supplierId)
      .single();

    if (!supplier?.user_id) return [];

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('type', 'payment_initiation_supplier')
      .eq('recipient_id', supplier.user_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching supplier initiations:', error);
      return [];
    }

    // Also get initiations where supplier is the target
    const { data: directData } = await supabase
      .from('notifications')
      .select('*')
      .eq('type', 'payment_initiation')
      .order('created_at', { ascending: false });

    const filtered = (directData || []).filter(n => {
      const meta = n.metadata as any;
      return meta?.supplier_id === supplierId && 
        ['ready_for_supplier', 'supplier_notified', 'supplier_completed', 'approved'].includes(meta?.status);
    });

    const allData = [...(data || []), ...filtered];
    
    // Get project titles
    const projectIds = [...new Set(allData.map(n => (n.metadata as any)?.project_id).filter(Boolean))];
    const { data: projects } = await supabase
      .from('projects')
      .select('id, title')
      .in('id', projectIds);

    const projectMap = new Map(projects?.map(p => [p.id, p.title]) || []);

    return allData.map(n => this.notificationToInitiation(n, projectMap));
  }

  /**
   * Supplier completes the payment request
   */
  static async supplierComplete(dto: SupplierCompletionDTO, supplierId: string): Promise<void> {
    // Get the notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', dto.notification_id)
      .single();

    if (error || !notification) {
      throw new Error('Notification non trouvée');
    }

    const meta = notification.metadata as any;
    
    // Validate supplier access
    if (meta?.supplier_id !== supplierId) {
      throw new Error('Accès non autorisé');
    }

    // Validate amount (max +10% of estimated)
    const maxAmount = (meta?.estimated_amount || 0) * 1.1;
    if (dto.final_amount > maxAmount) {
      throw new Error(`Le montant ne peut pas dépasser ${maxAmount.toLocaleString()} MRU (+10% de l'estimation)`);
    }

    // Create supplier payment request
    const { data: paymentRequest, error: createError } = await supabase
      .from('supplier_payment_requests')
      .insert({
        supplier_id: supplierId,
        project_id: meta?.project_id,
        amount: dto.final_amount,
        description: dto.description,
        payment_reason: dto.payment_reason,
        notes: dto.notes,
        status: 'pending',
        requested_date: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) throw createError;

    // Update notification metadata
    const updatedMeta = {
      ...meta,
      status: 'supplier_completed',
      final_amount: dto.final_amount,
      supplier_payment_request_id: paymentRequest.id
    };

    await supabase
      .from('notifications')
      .update({ 
        metadata: updatedMeta,
        updated_at: new Date().toISOString()
      })
      .eq('id', dto.notification_id);

    // Notify initiator
    if (meta?.initiated_by) {
      await NotificationService.createNotification({
        recipient_id: meta.initiated_by,
        title: 'Demande complétée par fournisseur',
        message: `Le fournisseur a complété la demande de paiement. Montant: ${dto.final_amount.toLocaleString()} MRU`,
        type: 'supplier_completed',
        related_id: paymentRequest.id
      });
    }
  }

  /**
   * Convert notification to PaymentInitiationNotification format
   */
  private static notificationToInitiation(
    notification: any, 
    projectMap?: Map<string, string>
  ): PaymentInitiationNotification {
    const meta = notification.metadata || {};
    return {
      id: notification.id,
      project_id: meta.project_id || notification.related_id,
      phase_id: meta.phase_id,
      inspection_id: meta.inspection_id,
      initiated_by: meta.initiated_by,
      initiator_role: meta.initiator_role || 'project_manager',
      initiator_name: meta.initiator_name,
      supplier_id: meta.supplier_id,
      supplier_name: meta.supplier_name,
      estimated_amount: meta.estimated_amount || 0,
      final_amount: meta.final_amount,
      justification: meta.justification || '',
      attached_documents: meta.attached_documents || [],
      status: meta.status || 'pending_approval',
      approval_chain: meta.approval_chain || [],
      current_approval_level: meta.current_approval_level || 0,
      supplier_deadline: meta.supplier_deadline,
      created_at: notification.created_at,
      updated_at: notification.updated_at,
      project_title: projectMap?.get(meta.project_id) || meta.project_title,
      phase_title: meta.phase_title,
      supplier_payment_request_id: meta.supplier_payment_request_id
    };
  }

  /**
   * Notify an approver
   */
  private static async notifyApprover(
    notificationId: string, 
    step: ApprovalChainStep, 
    amount: number
  ): Promise<void> {
    if (!step.approver_id) return;

    const roleLabel = ROLE_LABELS[step.role as InitiatorRole] || step.role;

    await NotificationService.createNotification({
      recipient_id: step.approver_id,
      title: 'Approbation de paiement requise',
      message: `Une demande de paiement de ${amount.toLocaleString()} MRU nécessite votre approbation en tant que ${roleLabel}`,
      type: 'payment_approval_required',
      related_id: notificationId,
      metadata: { 
        approval_level: step.level,
        deadline: step.deadline 
      }
    });
  }
}
