// Create Payment Request Use Case
import { supabase } from '@/integrations/supabase/client';

export interface PaymentRequestInput {
  projectId: string;
  phaseId?: string;
  stepId?: string;
  inspectionId?: string;
  amount: number;
  description?: string;
  progressAtPayment: number;
  contractorName: string;
  contractorContact?: string;
  paymentMethod: 'bank_transfer' | 'check' | 'mobile_money' | 'cash';
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    iban?: string;
  };
  mobileDetails?: {
    operator: string;
    number: string;
  };
  documents?: string[];
}

export interface PaymentRequestResult {
  success: boolean;
  paymentId?: string;
  message: string;
  validationErrors?: string[];
}

export class CreatePaymentRequestUseCase {
  async execute(input: PaymentRequestInput): Promise<PaymentRequestResult> {
    try {
      // Validate project and budget
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, title, budget, progress, status')
        .eq('id', input.projectId)
        .single();

      if (projectError || !project) {
        return {
          success: false,
          message: 'Projet non trouvé'
        };
      }

      // Validate amount against budget
      const validationErrors: string[] = [];

      // Get total existing payments
      const { data: existingPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('project_id', input.projectId);

      const totalPaid = (existingPayments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
      const remainingBudget = project.budget - totalPaid;

      if (input.amount > remainingBudget) {
        validationErrors.push(`Le montant demandé (${input.amount}) dépasse le budget restant (${remainingBudget})`);
      }

      // Check if inspection is required
      if (input.progressAtPayment >= 25 && !input.inspectionId) {
        // Check for approved inspections
        const { data: approvedInspections } = await supabase
          .from('inspections')
          .select('id')
          .eq('project_id', input.projectId)
          .eq('status', 'approved')
          .order('date', { ascending: false })
          .limit(1);

        if (!approvedInspections || approvedInspections.length === 0) {
          validationErrors.push('Une inspection approuvée est requise pour un paiement à ce niveau d\'avancement');
        }
      }

      if (validationErrors.length > 0) {
        return {
          success: false,
          message: 'Validation échouée',
          validationErrors
        };
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Create payment request
      const paymentData = {
        project_id: input.projectId,
        phase_id: input.phaseId || null,
        amount: input.amount,
        payment_date: new Date().toISOString(),
        payment_method: input.paymentMethod,
        progress_at_payment: input.progressAtPayment,
        transaction_id: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        contractor_name: input.contractorName,
        contractor_contact: input.contractorContact || '',
        bank_name: input.bankDetails?.bankName || null,
        account_number: input.bankDetails?.accountNumber || null,
        mobile_number: input.mobileDetails?.number || null,
        mobile_operator: input.mobileDetails?.operator || null
      };

      const { data: payment, error: insertError } = await supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating payment request:', insertError);
        return {
          success: false,
          message: `Erreur lors de la création: ${insertError.message}`
        };
      }

      return {
        success: true,
        paymentId: payment.id,
        message: 'Demande de paiement créée avec succès'
      };
    } catch (error) {
      console.error('CreatePaymentRequestUseCase error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }
}
