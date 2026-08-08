// @ts-nocheck
import { InsuranceService, getInsuranceService} from '@/application/services/InsuranceService';
import { BankGuaranteeService, getBankGuaranteeService} from '@/application/services/BankGuaranteeService';
import { ProjectService, getProjectService} from '@/application/services/ProjectService';
import { DocumentService, getDocumentService} from '@/application/services/DocumentService';
import { PaymentService, getPaymentService} from '@/application/services/PaymentService';
import { PaymentBlockingService, getPaymentBlockingService} from '@/application/services/PaymentBlockingService';

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

  // Check insurance certificates using InsuranceService
  const insuranceService = getInsuranceService();
  const insurance = await insuranceService.getInsuranceCertificates(projectId)
    .then(certificates => certificates.filter(cert => 
      cert.contractor_id === contractorId && 
      cert.status === 'active' && 
      new Date(cert.valid_until) >= new Date()
    ));

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

  // Check bank guarantees using BankGuaranteeService
  const bankGuaranteeService = getBankGuaranteeService();
  const guarantee = await bankGuaranteeService.getBankGuarantees(projectId)
    .then(guarantees => guarantees.filter(g => 
      g.contractor_id === contractorId && 
      g.status === 'active' && 
      new Date(g.expiry_date) >= new Date()
    ));

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

  // Check project progress vs payment using ProjectService
  const projectService = getProjectService();
  const project = await projectService.getProjectWithDetails(projectId);

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
    if (project.endDate) {
      const endDate = new Date(project.endDate);
      const today = new Date();
      if (today > endDate) {
        blockingReasons.push({
          reason: 'project_delay',
          description: 'Le projet est en retard par rapport à la date prévue',
          severity: 'warning',
          metadata: { endDate: project.endDate, currentDate: today.toISOString() }
        });
      } else {
        validationChecks.projectOnTime = true;
      }
    }
  }

  // Check required documents using DocumentService
  const documentService = getDocumentService();
  const documents = await documentService.getProjectDocuments(projectId)
    .then(docs => docs.filter(doc => 
      ['contract'].includes(doc.document_type) && 
      doc.status === 'approved'
    ));

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
  // Use hexagonal services instead of direct Supabase access
  const paymentService = getPaymentService();
  const paymentBlockingService = getPaymentBlockingService();

  // Get payments via service
  let payments = [];
  if (projectId) {
    payments = await paymentService.getPaymentsByProject(projectId);
  } else {
    payments = await paymentService.getAllPayments();
  }

  // Filter by date range
  const filteredPayments = payments.filter(p => {
    const createdAt = new Date(p.created_at || p.createdAt || '');
    return createdAt >= startDate && createdAt <= endDate;
  });

  // Get blocked payments via service
  const blockedPayments = await paymentBlockingService.getActiveBlocks();
  const filteredBlocked = blockedPayments.filter(block => {
    const blockedAt = new Date(block.blocked_at || '');
    return blockedAt >= startDate && blockedAt <= endDate && !block.resolved_at;
  });

  const totalPayments = filteredPayments.length;
  const blockedCount = filteredBlocked.length;
  const pendingCount = filteredPayments.filter(p => !p.transaction_id && !p.transactionId).length;

  // Calculate average processing time
  const processedPayments = filteredPayments.filter(p => 
    (p.transaction_id || p.transactionId) && (p.created_at || p.createdAt)
  );
  const avgProcessingTime = processedPayments.length > 0
    ? processedPayments.reduce((sum, p) => {
        const created = new Date(p.created_at || p.createdAt || '');
        const processed = new Date(p.payment_date || p.paymentDate || '');
        return sum + (processed.getTime() - created.getTime());
      }, 0) / processedPayments.length / (1000 * 60 * 60 * 24)
    : 0;

  // Count blocking reasons
  const blockingReasons: Record<string, number> = {};
  filteredBlocked.forEach(block => {
    const reasons = block.blocking_reasons || block.blockingReasons;
    if (reasons && Array.isArray(reasons)) {
      reasons.forEach((reason: any) => {
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