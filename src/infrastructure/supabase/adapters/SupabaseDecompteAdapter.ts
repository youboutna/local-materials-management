/**
 * SupabaseDecompteAdapter
 * 
 * Implémentation de IDecompteRepository utilisant les repositories existants
 * Architecture : Service de compute/util utilisant plusieurs repositories
 */

import { supabase } from '@/integrations/supabase/client';
import { IDecompteRepository, ProjectFinancials, PhaseFinancials, VerifiedMilestone, DecompteCalculationContext } from '@/domain/repositories/IDecompteRepository';
import {
  AutomaticDecompteDTO,
  DecompteLineDTO,
  DecompteStatus,
  PaymentType,
  DEFAULT_MAURITANIA_RULES,
  MauritaniaBusinessRulesDTO,
} from '@/types/checkpoint-dto';
import { MilestoneDTO } from '@/dtos/entities/MilestoneDTO';

// Import des repositories existants (via RepositoryFactory)
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

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
    const totalRetentionHeld = payments
      .filter(payment => payment.retentionAmount)
      .reduce((sum, payment) => sum + (payment.retentionAmount || 0), 0);

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
      const phasePayments = payments.filter(payment => payment.phaseId === phase.id);
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

    // Transformer en MilestoneDTO
    return milestones.map(milestone => ({
      id: milestone.id,
      title: milestone.title || '',
      description: milestone.description || '',
      weight: milestone.weight || 0,
      targetDate: milestone.targetDate || '',
      status: milestone.status || 'pending',
      completedDate: milestone.completedDate,
      phaseId: milestone.phaseId || '',
      progress: milestone.progress || 0,
    }));
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
      if (milestone.phaseId) {
        const phase = await phaseRepository.findById(milestone.phaseId);
        
        verifiedMilestones.push({
          id: milestone.id,
          title: milestone.title || '',
          weight: milestone.weight || 0,
          completedDate: milestone.completedDate || new Date().toISOString(),
          phaseId: milestone.phaseId,
          phaseEstimatedCost: phase?.estimatedCost || 0,
        });
      }
    }

    return verifiedMilestones.sort((a, b) => 
      new Date(a.completedDate).getTime() - new Date(b.completedDate).getTime()
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
    return payments.map(payment => ({
      id: payment.id,
      projectId: payment.projectId || '',
      phaseId: payment.phaseId,
      decompteNumber: `DEC-${payment.id}`,
      calculationDate: payment.createdAt || new Date().toISOString(),
      status: DecompteStatus.APPROVED,
      totalAmount: payment.amount,
      retentionAmount: payment.retentionAmount || 0,
      netAmount: payment.amount - (payment.retentionAmount || 0),
      progressAtPayment: payment.progressAtPayment || 0,
      lines: [], // À implémenter selon vos besoins
      businessRules: DEFAULT_MAURITANIA_RULES,
      approvedBy: payment.approvedBy,
      approvedAt: payment.approvedAt,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    }));
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
      inspection.status === 'approved' && 
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
        unitPrice: milestoneAmount,
        totalPrice: milestoneAmount,
        category: 'milestone',
        milestoneId: milestone.id,
        phaseId: milestone.phaseId,
      });

      totalAmount += milestoneAmount;
    }

    // Application des règles métier
    const retentionAmount = Math.floor(
      totalAmount * (context.businessRules.retentionPercentage / 100)
    );
    const netAmount = totalAmount - retentionAmount;

    return {
      id: `decompte-${Date.now()}`,
      projectId: context.projectId,
      decompteNumber: `DEC-${Date.now()}`,
      calculationDate: new Date().toISOString(),
      status: DecompteStatus.DRAFT,
      totalAmount,
      retentionAmount,
      netAmount,
      progressAtPayment: this.calculateProgress(context),
      lines,
      businessRules: context.businessRules,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async validateDecompte(decompte: AutomaticDecompteDTO): Promise<boolean> {
    // Validation basique du décompte
    return (
      decompte.totalAmount > 0 &&
      decompte.lines.length > 0 &&
      decompte.progressAtPayment >= 0 &&
      decompte.progressAtPayment <= 100
    );
  }

  async saveDecompte(decompte: AutomaticDecompteDTO): Promise<AutomaticDecompteDTO> {
    // Pour l'instant, on sauvegarde comme un paiement
    // Adapter selon votre logique métier
    
    const paymentRepository = RepositoryFactory.getPaymentRepository();
    
    // Créer un paiement à partir du décompte
    const payment = await paymentRepository.create({
      projectId: decompte.projectId,
      phaseId: decompte.phaseId,
      amount: decompte.netAmount,
      retentionAmount: decompte.retentionAmount,
      progressAtPayment: decompte.progressAtPayment,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Retourner le décompte avec l'ID du paiement
    return {
      ...decompte,
      id: payment.id,
      updatedAt: new Date().toISOString(),
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
