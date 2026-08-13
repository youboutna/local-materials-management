/**
 * SupabaseDecompteAdapter
 * 
 * Implémentation de IDecompteRepository utilisant les repositories existants
 * Architecture : Service de compute/util utilisant plusieurs repositories
 */

import { DecompteCalculationContext, IDecompteRepository, PhaseFinancials, ProjectFinancials, VerifiedMilestone } from '@/domain/repositories/IDecompteRepository';
import { MilestoneDTO } from '@/dtos/entities/MilestoneDTO';
import {
    AutomaticDecompteDTO,
    DecompteLineDTO,
    DecompteStatus
} from '@/dtos/types/checkpoint-dto';
import { Payment } from '@/domain/entities/Payment';
import { InspectionStatus } from '@/domain/entities/Inspection';

// Import des repositories existants (via RepositoryFactory)
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';

export class SupabaseDecompteAdapter implements IDecompteRepository {
  constructor() {}

  // === DONNÉES PROJET ===
  async getProjectFinancials(projectId: string): Promise<ProjectFinancials> {
    // Utiliser le project repository existant
    const projectRepository = RepositoryFactory.getProjectRepository();
    const project = await projectRepository.findById(projectId);
    
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Utiliser le payment repository existant
    const paymentRepository = RepositoryFactory.getPaymentRepository();
    const payments = await paymentRepository.findByProjectId(projectId);

    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    // Le domaine Payment ne conserve pas de montant de retenue dédié :
    // la retenue est calculée à la demande via getNetAmount().
    const totalRetentionHeld = payments
      .reduce((sum, payment) => sum + (payment.amount - payment.getNetAmount()), 0);

    return {
      budget: project.budget || 0,
      totalPaid,
      totalRetentionHeld,
      paymentCount: payments.length,
      allowsInitialPayment: project.allowsInitialPayment || false,
      initialPaymentPercentage: project.initialPaymentPercentage || 10,
    };
  }

  // === DONNÉES PHASE ===
  async getPhaseFinancials(projectId: string): Promise<PhaseFinancials[]> {
    // Utiliser le phase repository existant
    const phaseRepository = RepositoryFactory.getPhaseRepository();
    const phases = await phaseRepository.findByProjectId(projectId);

    // Utiliser le payment repository existant
    const paymentRepository = RepositoryFactory.getPaymentRepository();
    const payments = await paymentRepository.findByProjectId(projectId);

    const phaseFinancials: PhaseFinancials[] = [];

    for (const phase of phases) {
      const phasePayments = payments.filter(payment => payment.phase?.id === phase.id);
      const totalPaid = phasePayments.reduce((sum, payment) => sum + payment.amount, 0);

      phaseFinancials.push({
        id: phase.id,
        phaseName: phase.phaseName || 'Phase sans nom',
        estimatedCost: phase.estimatedCost || 0,
        totalPaid,
        progress: phase.progress || 0,
        remainingBudget: (phase.estimatedCost || 0) - totalPaid,
      });
    }

    return phaseFinancials;
  }

  async getPhaseData(phaseId: string): Promise<PhaseFinancials | null> {
    // Utiliser le phase repository existant
    const phaseRepository = RepositoryFactory.getPhaseRepository();
    const phase = await phaseRepository.findById(phaseId);

    if (!phase) return null;

    // Utiliser le payment repository existant
    const paymentRepository = RepositoryFactory.getPaymentRepository();
    const payments = await paymentRepository.findByPhaseId(phaseId);

    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

    return {
      id: phase.id,
      phaseName: phase.phaseName || 'Phase sans nom',
      estimatedCost: phase.estimatedCost || 0,
      totalPaid,
      progress: phase.progress || 0,
      remainingBudget: (phase.estimatedCost || 0) - totalPaid,
    };
  }

  async getPhaseMilestones(phaseId: string): Promise<MilestoneDTO[]> {
    // Utiliser le milestone repository existant
    const milestoneRepository = RepositoryFactory.getMilestoneRepository();
    const milestones = await milestoneRepository.findByPhaseId(phaseId);

    // Le repository retourne déjà des MilestoneDTO
    return milestones;
  }

  // === DONNÉES JALON ===
  async getVerifiedMilestones(projectId: string): Promise<VerifiedMilestone[]> {
    // Utiliser le milestone repository existant
    const milestoneRepository = RepositoryFactory.getMilestoneRepository();
    const milestones = await milestoneRepository.findByProjectId(projectId);

    // Filtrer les jalons complétés
    const completedMilestones = milestones.filter(milestone => milestone.status === 'completed');

    // Utiliser le phase repository pour les coûts estimés
    const phaseRepository = RepositoryFactory.getPhaseRepository();

    const verifiedMilestones: VerifiedMilestone[] = [];

    for (const milestone of completedMilestones) {
      const phaseId = milestone.phaseId;
      if (phaseId) {
        const phase = await phaseRepository.findById(phaseId);
        
        verifiedMilestones.push({
          id: milestone.id,
          title: milestone.title || '',
          weight: milestone.weight || 0,
          completionDate: milestone.completionDate || new Date().toISOString(),
          phaseId,
          phaseEstimatedCost: phase?.estimatedCost || 0,
        });
      }
    }

    return verifiedMilestones.sort((a, b) => 
      new Date(a.completionDate).getTime() - new Date(b.completionDate).getTime()
    );
  }

  // === DONNÉES PAIEMENT ===
  async getPreviousDecomptes(projectId: string, phaseId?: string): Promise<AutomaticDecompteDTO[]> {
    // Pour l'instant, on utilise les paiements comme proxy des décomptes
    const paymentRepository = RepositoryFactory.getPaymentRepository();
    
    let payments;
    if (phaseId) {
      payments = await paymentRepository.findByPhaseId(phaseId);
    } else {
      payments = await paymentRepository.findByProjectId(projectId);
    }

    // Transformer les paiements en décomptes (adapter selon vos besoins)
    return payments.map(payment => {
      const retentionAmount = payment.amount - payment.getNetAmount();
      return {
        id: payment.id,
        project_id: payment.project?.id || projectId,
        phase_id: payment.phase?.id,
        decompte_number: 0,
        decompte_type: 'progress',
        contract_amount: 0,
        previous_cumulative: 0,
        current_period_amount: payment.amount,
        cumulative_amount: payment.amount,
        retention_rate: 0,
        retention_amount: retentionAmount,
        previous_retention_released: 0,
        retention_to_release: 0,
        net_payable: payment.getNetAmount(),
        verified_milestones: [],
        lines: [],
        progress_at_decompte: payment.progressAtPayment || 0,
        status: 'approved' as DecompteStatus,
        calculated_at: payment.createdAt || new Date().toISOString(),
        calculation_log: [],
      };
    });
  }

  async getPaidThresholds(projectId: string): Promise<number[]> {
    const paymentRepository = RepositoryFactory.getPaymentRepository();
    const payments = await paymentRepository.findByProjectId(projectId);

    return payments
      .filter(payment => payment.progressAtPayment)
      .map(payment => payment.progressAtPayment!)
      .sort((a, b) => a - b);
  }

  // === DONNÉES INSPECTION ===
  async hasApprovedInspectionForThreshold(projectId: string, threshold: number): Promise<boolean> {
    // Utiliser le inspection repository existant
    const inspectionRepository = RepositoryFactory.getInspectionRepository();
    const inspections = await inspectionRepository.findByProjectId(projectId);

    // Filtrer les inspections approuvées pour ce seuil
    const approvedInspections = inspections.filter(inspection => 
      inspection.status === InspectionStatus.Approved && 
      inspection.progressAtInspection === threshold
    );

    return approvedInspections.length > 0;
  }

  // === CALCUL DÉCOMPTE ===
  async calculateDecompte(context: DecompteCalculationContext): Promise<AutomaticDecompteDTO> {
    // Logique de calcul du décompte
    // Cette méthode implémente la logique métier complexe du calcul
    
    const lines: DecompteLineDTO[] = [];
    let totalAmount = 0;

    // Calcul basé sur les jalons vérifiés
    for (const milestone of context.verifiedMilestones) {
      const milestoneAmount = (milestone.phaseEstimatedCost * milestone.weight) / 100;
      
      lines.push({
        id: `line-${milestone.id}`,
        description: milestone.title,
        quantity: 1,
        unit: 'forfait',
        unit_price: milestoneAmount,
        total_amount: milestoneAmount,
        category: 'works',
        milestone_id: milestone.id,
        verification_status: 'verified',
      });

      totalAmount += milestoneAmount;
    }

    // Application des règles métier
    const retentionAmount = Math.floor(
      totalAmount * (context.businessRules.retentionRate / 100)
    );
    const netAmount = totalAmount - retentionAmount;
    const previousCumulative = context.projectFinancials.totalPaid;

    return {
      id: `decompte-${Date.now()}`,
      project_id: context.projectId,
      decompte_number: context.previousDecomptes.length + 1,
      decompte_type: 'progress',
      contract_amount: context.projectFinancials.budget,
      previous_cumulative: previousCumulative,
      current_period_amount: totalAmount,
      cumulative_amount: previousCumulative + totalAmount,
      retention_rate: context.businessRules.retentionRate,
      retention_amount: retentionAmount,
      previous_retention_released: 0,
      retention_to_release: 0,
      net_payable: netAmount,
      verified_milestones: context.verifiedMilestones.map(milestone => ({
        milestone_id: milestone.id,
        title: milestone.title,
        weight: milestone.weight,
        amount: (milestone.phaseEstimatedCost * milestone.weight) / 100,
        verified_at: milestone.completionDate,
      })),
      lines,
      progress_at_decompte: this.calculateProgress(context),
      status: 'draft',
      calculated_at: new Date().toISOString(),
      calculation_log: [],
    };
  }

  async validateDecompte(decompte: AutomaticDecompteDTO): Promise<boolean> {
    // Validation basique du décompte
    return (
      decompte.current_period_amount > 0 &&
      decompte.lines.length > 0 &&
      decompte.progress_at_decompte >= 0 &&
      decompte.progress_at_decompte <= 100
    );
  }

  async saveDecompte(decompte: AutomaticDecompteDTO): Promise<AutomaticDecompteDTO> {
    // Pour l'instant, on sauvegarde comme un paiement
    // Adapter selon votre logique métier
    
    const paymentRepository = RepositoryFactory.getPaymentRepository();
    const now = new Date().toISOString();
    const id = decompte.id || `decompte-${Date.now()}`;

    const payment = new Payment(
      id,
      decompte.project_id ? ({ id: decompte.project_id } as any) : null,
      decompte.phase_id ? ({ id: decompte.phase_id } as any) : null,
      null,
      decompte.net_payable,
      now,
      'bank_transfer',
      'pending',
      decompte.progress_at_decompte,
      null,
      '',
      '',
      null,
      null,
      null,
      null,
      null,
      null,
      [],
      now,
      now
    );

    await paymentRepository.save(payment);

    // Retourner le décompte avec l'ID du paiement
    return {
      ...decompte,
      id: payment.id,
      calculated_at: now,
    };
  }

  // === MÉTHODES PRIVÉES ===
  private calculateProgress(context: DecompteCalculationContext): number {
    // Calcul du progrès basé sur les jalons vérifiés
    if (context.verifiedMilestones.length === 0) return 0;

    const totalWeight = context.verifiedMilestones.reduce((sum, milestone) => sum + milestone.weight, 0);
    const averageWeight = totalWeight / context.verifiedMilestones.length;

    return Math.min(100, Math.floor(averageWeight));
  }
}
