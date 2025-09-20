import { supabase } from '@/integrations/supabase/client';

export interface PaymentValidationResult {
  canProceed: boolean;
  blockingReasons: Array<{
    reason: string;
    description: string;
    severity: 'warning' | 'blocking';
    metadata?: any;
  }>;
  validationChecks: {
    insuranceValid: boolean;
    guaranteeValid: boolean;
    progressCompliant: boolean;
    documentsComplete: boolean;
    projectOnTime: boolean;
  };
  recommendations: string[];
}

export interface PaymentMetrics {
  totalPayments: number;
  blockedPayments: number;
  pendingPayments: number;
  averageProcessingTime: number;
  blockingReasons: Record<string, number>;
}

export const calculatePaymentEligibility = async (
  projectId: string,
  contractorId: string,
  amount: number,
  progressPercentage: number
): Promise<PaymentValidationResult> => {
  const blockingReasons: Array<{
    reason: string;
    description: string;
    severity: 'warning' | 'blocking';
    metadata?: any;
  }> = [];

  const validationChecks = {
    insuranceValid: false,
    guaranteeValid: false,
    progressCompliant: false,
    documentsComplete: false,
    projectOnTime: false
  };

  // Check insurance certificates
  const { data: insurance } = await supabase
    .from('insurance_certificates')
    .select('*')
    .eq('project_id', projectId)
    .eq('contractor_id', contractorId)
    .eq('status', 'active')
    .gte('valid_until', new Date().toISOString());

  if (!insurance || insurance.length === 0) {
    blockingReasons.push({
      reason: 'expired_insurance',
      description: 'Aucune assurance valide trouvée pour ce contractant',
      severity: 'blocking',
      metadata: { projectId, contractorId }
    });
  } else {
    validationChecks.insuranceValid = true;
  }

  // Check bank guarantees
  const { data: guarantee } = await supabase
    .from('bank_guarantees')
    .select('*')
    .eq('project_id', projectId)
    .eq('contractor_id', contractorId)
    .eq('status', 'active')
    .gte('expiry_date', new Date().toISOString());

  if (!guarantee || guarantee.length === 0) {
    blockingReasons.push({
      reason: 'expired_guarantee',
      description: 'Aucune garantie bancaire valide pour ce contractant',
      severity: 'blocking',
      metadata: { projectId, contractorId }
    });
  } else {
    validationChecks.guaranteeValid = true;
  }

  // Check project progress vs payment
  const { data: project } = await supabase
    .from('projects')
    .select('progress, start_date, end_date')
    .eq('id', projectId)
    .single();

  if (project) {
    const maxAllowedPayment = (project.progress || 0) + 10; // 10% tolerance
    if (progressPercentage > maxAllowedPayment) {
      blockingReasons.push({
        reason: 'progress_mismatch',
        description: `Paiement demandé pour ${progressPercentage}% mais progression projet: ${project.progress}%`,
        severity: 'warning',
        metadata: { requestedProgress: progressPercentage, actualProgress: project.progress }
      });
    } else {
      validationChecks.progressCompliant = true;
    }

    // Check project timeline
    if (project.end_date) {
      const endDate = new Date(project.end_date);
      const today = new Date();
      if (today > endDate) {
        blockingReasons.push({
          reason: 'project_delay',
          description: 'Le projet est en retard par rapport à la date prévue',
          severity: 'warning',
          metadata: { endDate: project.end_date, currentDate: today.toISOString() }
        });
      } else {
        validationChecks.projectOnTime = true;
      }
    }
  }

  // Check required documents
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('project_id', projectId)
    .in('document_type', ['contract'])
    .eq('status', 'approved');

  const requiredDocTypes = ['contract'];
  const availableDocTypes = documents?.map(d => d.document_type as string) || [];
  const missingDocs = requiredDocTypes.filter(type => !availableDocTypes.includes(type));

  if (missingDocs.length > 0) {
    blockingReasons.push({
      reason: 'missing_documents',
      description: `Documents manquants: ${missingDocs.join(', ')}`,
      severity: 'blocking',
      metadata: { missingDocuments: missingDocs }
    });
  } else {
    validationChecks.documentsComplete = true;
  }

  // Generate recommendations
  const recommendations: string[] = [];
  if (!validationChecks.insuranceValid) {
    recommendations.push('Demander au contractant de renouveler son assurance');
  }
  if (!validationChecks.guaranteeValid) {
    recommendations.push('Vérifier le statut de la garantie bancaire');
  }
  if (!validationChecks.documentsComplete) {
    recommendations.push('Collecter les documents manquants avant paiement');
  }
  if (!validationChecks.progressCompliant) {
    recommendations.push('Vérifier la progression réelle du projet');
  }

  const canProceed = blockingReasons.filter(r => r.severity === 'blocking').length === 0;

  return {
    canProceed,
    blockingReasons,
    validationChecks,
    recommendations
  };
};

export const calculatePaymentMetrics = async (
  startDate: Date,
  endDate: Date,
  projectId?: string
): Promise<PaymentMetrics> => {
  let query = supabase
    .from('payments')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data: payments } = await query;

  // Get blocked payments
  const { data: blockedPayments } = await supabase
    .from('payment_blocks')
    .select('*')
    .gte('blocked_at', startDate.toISOString())
    .lte('blocked_at', endDate.toISOString())
    .is('resolved_at', null);

  const totalPayments = payments?.length || 0;
  const blockedCount = blockedPayments?.length || 0;
  const pendingCount = payments?.filter(p => !p.transaction_id).length || 0;

  // Calculate average processing time
  const processedPayments = payments?.filter(p => p.transaction_id && p.created_at) || [];
  const avgProcessingTime = processedPayments.length > 0
    ? processedPayments.reduce((sum, p) => {
        const created = new Date(p.created_at);
        const processed = new Date(p.payment_date);
        return sum + (processed.getTime() - created.getTime());
      }, 0) / processedPayments.length / (1000 * 60 * 60 * 24) // Convert to days
    : 0;

  // Count blocking reasons
  const blockingReasons: Record<string, number> = {};
  blockedPayments?.forEach(block => {
    if (block.blocking_reasons && Array.isArray(block.blocking_reasons)) {
      block.blocking_reasons.forEach((reason: any) => {
        const reasonKey = reason.reason || 'unknown';
        blockingReasons[reasonKey] = (blockingReasons[reasonKey] || 0) + 1;
      });
    }
  });

  return {
    totalPayments,
    blockedPayments: blockedCount,
    pendingPayments: pendingCount,
    averageProcessingTime: Math.round(avgProcessingTime * 100) / 100,
    blockingReasons
  };
};

export const calculatePaymentRisk = (
  paymentAmount: number,
  projectBudget: number,
  contractorHistory: any[],
  projectProgress: number
): {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  riskScore: number;
} => {
  let riskScore = 0;
  const riskFactors: string[] = [];

  // Amount vs budget ratio
  const amountRatio = paymentAmount / projectBudget;
  if (amountRatio > 0.3) {
    riskScore += 25;
    riskFactors.push('Montant élevé par rapport au budget');
  }
  if (amountRatio > 0.5) {
    riskScore += 25;
    riskFactors.push('Montant très élevé (>50% du budget)');
  }

  // Contractor history
  const failedPayments = contractorHistory.filter(p => p.status === 'failed').length;
  const totalPayments = contractorHistory.length;
  if (totalPayments > 0) {
    const failureRate = failedPayments / totalPayments;
    if (failureRate > 0.1) {
      riskScore += 20;
      riskFactors.push('Historique de paiements échoués');
    }
  }

  // Progress vs payment ratio
  if (projectProgress < 50 && amountRatio > 0.4) {
    riskScore += 30;
    riskFactors.push('Paiement important alors que le projet est peu avancé');
  }

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  if (riskScore >= 80) riskLevel = 'critical';
  else if (riskScore >= 60) riskLevel = 'high';
  else if (riskScore >= 30) riskLevel = 'medium';
  else riskLevel = 'low';

  return { riskLevel, riskFactors, riskScore };
};