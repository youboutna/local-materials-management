// Validate Payment Use Case
import { supabase } from '@/integrations/supabase/client';

export interface ValidatePaymentInput {
  paymentId: string;
  action: 'approve' | 'reject' | 'request_changes';
  validatorRole: 'comptable' | 'director' | 'project_manager';
  notes?: string;
}

export interface ValidatePaymentResult {
  success: boolean;
  message: string;
  nextStep?: string;
}

export class ValidatePaymentUseCase {
  async execute(input: ValidatePaymentInput): Promise<ValidatePaymentResult> {
    try {
      // Get payment details
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*, projects(id, title, budget)')
        .eq('id', input.paymentId)
        .single();

      if (paymentError || !payment) {
        return {
          success: false,
          message: 'Paiement non trouvé'
        };
      }

      // Determine workflow based on role
      const workflowStatus = this.getWorkflowStatus(input.validatorRole, input.action);

      // For now, just log the validation action
      // In a real implementation, we'd have a payment_validations table
      console.log('Payment validation:', {
        paymentId: input.paymentId,
        action: input.action,
        role: input.validatorRole,
        notes: input.notes,
        timestamp: new Date().toISOString()
      });
      // Note: In production, validations should be stored in a separate table

      return {
        success: true,
        message: this.getSuccessMessage(input.action, input.validatorRole),
        nextStep: workflowStatus.nextStep
      };
    } catch (error) {
      console.error('ValidatePaymentUseCase error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  private getWorkflowStatus(role: string, action: string): { status: string; nextStep?: string } {
    if (action === 'reject') {
      return { status: 'rejected' };
    }

    if (action === 'request_changes') {
      return { status: 'changes_requested', nextStep: 'Correction par le demandeur' };
    }

    // Approval workflow
    switch (role) {
      case 'comptable':
        return { status: 'comptable_approved', nextStep: 'Validation par le directeur' };
      case 'director':
        return { status: 'approved', nextStep: 'Traitement du paiement' };
      case 'project_manager':
        return { status: 'pm_approved', nextStep: 'Validation comptable' };
      default:
        return { status: 'pending' };
    }
  }

  private getSuccessMessage(action: string, role: string): string {
    switch (action) {
      case 'approve':
        return `Paiement approuvé par ${this.getRoleLabel(role)}`;
      case 'reject':
        return 'Paiement rejeté';
      case 'request_changes':
        return 'Modifications demandées';
      default:
        return 'Action effectuée';
    }
  }

  private getRoleLabel(role: string): string {
    switch (role) {
      case 'comptable':
        return 'le comptable';
      case 'director':
        return 'le directeur';
      case 'project_manager':
        return 'le chef de projet';
      default:
        return role;
    }
  }
}
