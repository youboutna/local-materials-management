// @ts-nocheck
// Simplified service for payment blocking
// This will be fully functional once Supabase types are regenerated

import { supabase } from '@/integrations/supabase/client';
import { NotificationService } from './NotificationService';
import { validateInsuranceCoverage } from '@/application/services/InsuranceService';
import { BankGuaranteeService, detectProjectDelays } from './BankGuaranteeService';

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
    console.log('Validating payment eligibility:', { projectId, contractorId, paymentAmount });
    
    // 1. Check insurance coverage
    const hasValidInsurance = await validateInsuranceCoverage(projectId);
    if (!hasValidInsurance) {
      blockingReasons.push({
        reason: 'expired_insurance',
        description: 'Attestations d\'assurance expirées ou manquantes',
        severity: 'blocking'
      });
    }

    // 2. Check project delays
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

    // Mock validation for demo - add some realistic scenarios
    if (contractorId === 'cont-sahel-btp') {
      blockingReasons.push({
        reason: 'expired_insurance',
        description: 'Assurance responsabilité civile expirée le 20/08/2025',
        severity: 'blocking'
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
      console.log('Payment blocked:', validation.blockingReasons);

      // Notify stakeholders about blocked payment
      await sendPaymentBlockedNotification(validation);

      return {
        success: false,
        blockingReasons: validation.blockingReasons
      };
    }

    // If validation passes, proceed with payment
    console.log('Processing payment:', { projectId, contractorId, paymentAmount });
    const mockPaymentId = `pay-${Date.now()}`;

    // Send success notification if there were warnings
    if (validation.warningReasons.length > 0) {
      await NotificationService.createNotification({
        recipient_id: 'system',
        title: 'Paiement effectué avec avertissements',
        message: `Paiement de ${paymentAmount} effectué avec ${validation.warningReasons.length} avertissement(s).`,
        type: 'project_update',
        related_id: mockPaymentId,
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
      paymentId: mockPaymentId
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

  await NotificationService.createNotification({
    recipient_id: 'system',
    title: 'PAIEMENT BLOQUÉ - Action requise',
    message: `Paiement de ${validation.totalAmount}€ bloqué pour le projet. Raisons: ${blockingReasonsText}`,
    type: 'compliance_alert',
    related_id: validation.projectId,
    metadata: {
      related_project_id: validation.projectId,
      contractor_id: validation.contractorId,
      amount: validation.totalAmount,
      blocking_reasons: validation.blockingReasons,
      priority: 'urgent'
    }
  });
};

export const getPaymentBlockHistory = async (projectId?: string) => {
  try {
    console.log('Fetching payment block history for project:', projectId);
    
    let query = supabase
      .from('payment_blocks')
      .select(`
        *,
        projects:project_id (
          title,
          contractors:contractor_id (
            name
          )
        )
      `)
      .order('blocked_at', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query.limit(50);
    
    if (error) {
      console.error('Error fetching payment block history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getPaymentBlockHistory:', error);
    return [];
  }
};