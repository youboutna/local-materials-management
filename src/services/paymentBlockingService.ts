import { supabase } from '@/integrations/supabase/client';
import { sendNotification } from './notificationService';
import { validateInsuranceCoverage } from './insuranceCertificateService';
import { detectProjectDelays } from './bankGuaranteeService';

export interface PaymentBlockReason {
  reason: 'expired_insurance' | 'expired_guarantee' | 'project_delay' | 'compliance_issue';
  description: string;
  severity: 'warning' | 'blocking';
  relatedId?: string;
  expiryDate?: string;
}

export interface PaymentValidationResult {
  canProceed: boolean;
  blockingReasons: PaymentBlockReason[];
  warningReasons: PaymentBlockReason[];
  totalAmount?: number;
  projectId: string;
  contractorId: string;
}

export const validatePaymentEligibility = async (
  projectId: string, 
  contractorId: string, 
  paymentAmount: number
): Promise<PaymentValidationResult> => {
  const blockingReasons: PaymentBlockReason[] = [];
  const warningReasons: PaymentBlockReason[] = [];
  
  try {
    // 1. Check insurance coverage
    const hasValidInsurance = await validateInsuranceCoverage(projectId);
    if (!hasValidInsurance) {
      blockingReasons.push({
        reason: 'expired_insurance',
        description: 'Attestations d\'assurance expirées ou manquantes',
        severity: 'blocking'
      });
    }

    // 2. Check for expired certificates specifically
    const currentDate = new Date().toISOString().split('T')[0];
    const { data: expiredCertificates } = await supabase
      .from('insurance_certificates')
      .select('*')
      .eq('project_id', projectId)
      .eq('contractor_id', contractorId)
      .lt('valid_until', currentDate)
      .eq('status', 'active');

    if (expiredCertificates && expiredCertificates.length > 0) {
      for (const cert of expiredCertificates) {
        blockingReasons.push({
          reason: 'expired_insurance',
          description: `Assurance ${cert.coverage_type} expirée le ${cert.valid_until}`,
          severity: 'blocking',
          relatedId: cert.id,
          expiryDate: cert.valid_until
        });
      }
    }

    // 3. Check project delays
    const projectDelays = await detectProjectDelays();
    const projectDelay = projectDelays.find(delay => delay.projectId === projectId);
    
    if (projectDelay && projectDelay.delayPercentage > 20) {
      blockingReasons.push({
        reason: 'project_delay',
        description: `Projet en retard de ${projectDelay.delayPercentage}% (${projectDelay.delayDays} jours)`,
        severity: 'blocking',
        relatedId: projectId
      });
    } else if (projectDelay && projectDelay.delayPercentage > 10) {
      warningReasons.push({
        reason: 'project_delay',
        description: `Attention: Projet en retard de ${projectDelay.delayPercentage}%`,
        severity: 'warning',
        relatedId: projectId
      });
    }

    // 4. Check bank guarantees
    const { data: guarantees } = await supabase
      .from('bank_guarantees')
      .select('*')
      .eq('project_id', projectId)
      .eq('contractor_id', contractorId)
      .lt('expiry_date', currentDate);

    if (guarantees && guarantees.length > 0) {
      blockingReasons.push({
        reason: 'expired_guarantee',
        description: 'Garantie bancaire expirée',
        severity: 'blocking'
      });
    }

    // 5. Check compliance issues
    const { data: complianceIssues } = await supabase
      .from('inspections')
      .select('*')
      .eq('project_id', projectId)
      .contains('documents', { compliance_issues: true });

    if (complianceIssues && complianceIssues.length > 0) {
      warningReasons.push({
        reason: 'compliance_issue',
        description: 'Problèmes de conformité détectés lors des inspections',
        severity: 'warning'
      });
    }

    return {
      canProceed: blockingReasons.length === 0,
      blockingReasons,
      warningReasons,
      totalAmount: paymentAmount,
      projectId,
      contractorId
    };

  } catch (error) {
    console.error('Error validating payment eligibility:', error);
    
    // If validation fails, block payment as a safety measure
    blockingReasons.push({
      reason: 'compliance_issue',
      description: 'Erreur lors de la validation des prérequis de paiement',
      severity: 'blocking'
    });

    return {
      canProceed: false,
      blockingReasons,
      warningReasons,
      projectId,
      contractorId
    };
  }
};

export const attemptPayment = async (
  projectId: string,
  contractorId: string,
  paymentAmount: number,
  paymentData: any
): Promise<{ success: boolean; paymentId?: string; blockingReasons?: PaymentBlockReason[] }> => {
  try {
    // First validate payment eligibility
    const validation = await validatePaymentEligibility(projectId, contractorId, paymentAmount);
    
    if (!validation.canProceed) {
      // Log blocked payment attempt
      await supabase
        .from('payment_blocks')
        .insert({
          project_id: projectId,
          contractor_id: paymentData.contractor_id,
          amount: paymentAmount,
          blocking_reasons: validation.blockingReasons,
          blocked_at: new Date().toISOString(),
          blocked_by: 'system'
        });

      // Notify stakeholders about blocked payment
      await sendPaymentBlockedNotification(validation);

      return {
        success: false,
        blockingReasons: validation.blockingReasons
      };
    }

    // If validation passes, proceed with payment
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        project_id: projectId,
        contractor_id: contractorId,
        amount: paymentAmount,
        ...paymentData,
        payment_date: new Date().toISOString(),
        transaction_id: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      })
      .select()
      .single();

    if (error) throw error;

    // Send success notification if there were warnings
    if (validation.warningReasons.length > 0) {
      await sendNotification({
        recipient_id: 'system',
        title: 'Paiement effectué avec avertissements',
        message: `Paiement de ${paymentAmount} effectué avec ${validation.warningReasons.length} avertissement(s).`,
        type: 'payment_warning',
        related_id: payment.id,
        metadata: {
          related_project_id: projectId,
          contractor_id: contractorId,
          amount: paymentAmount,
          warnings: validation.warningReasons,
          priority: 'medium'
        }
      });
    }

    return {
      success: true,
      paymentId: payment.id
    };

  } catch (error) {
    console.error('Error processing payment:', error);
    return {
      success: false,
      blockingReasons: [{
        reason: 'compliance_issue',
        description: 'Erreur technique lors du traitement du paiement',
        severity: 'blocking'
      }]
    };
  }
};

const sendPaymentBlockedNotification = async (validation: PaymentValidationResult) => {
  const blockingReasonsText = validation.blockingReasons
    .map(reason => reason.description)
    .join(', ');

  // Get stakeholders for notifications
  const { data: stakeholders } = await supabase
    .from('user_roles')
    .select(`
      user_id,
      role_name
    `)
    .in('role_name', ['project_manager', 'director', 'finance_manager']);

  for (const stakeholder of stakeholders || []) {
    await sendNotification({
      recipient_id: stakeholder.user_id,
      title: 'PAIEMENT BLOQUÉ - Action requise',
      message: `Paiement de ${validation.totalAmount}€ bloqué pour le projet. Raisons: ${blockingReasonsText}`,
      type: 'payment_blocked',
      related_id: validation.projectId,
      metadata: {
        related_project_id: validation.projectId,
        contractor_id: validation.contractorId,
        amount: validation.totalAmount,
        blocking_reasons: validation.blockingReasons,
        priority: 'urgent'
      }
    });
  }
};

export const getPaymentBlockHistory = async (projectId?: string) => {
  try {
    let query = supabase
      .from('payment_blocks')
      .select(`
        *,
        projects!inner(title),
        contractors(name)
      `)
      .order('blocked_at', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching payment block history:', error);
    return [];
  }
};