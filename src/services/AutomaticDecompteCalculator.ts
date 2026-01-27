/**
 * AutomaticDecompteCalculator
 * 
 * Calcul automatique des décomptes basés sur les jalons vérifiés
 * Règles Mauritanie:
 * - Paiements échelonnés selon avancement réel
 * - Garanties: 10% retenu jusqu'à réception définitive
 * - Inspections obligatoires à chaque étape clé
 */

import { supabase } from '@/integrations/supabase/client';
import {
  AutomaticDecompteDTO,
  DecompteLineDTO,
  DecompteStatus,
  PaymentType,
  DEFAULT_MAURITANIA_RULES,
  MauritaniaBusinessRulesDTO,
} from '@/types/checkpoint-dto';
import { MilestoneDTO } from '@/types/milestone-dto';
import { getCheckpointVerificationEngine } from './CheckpointVerificationEngine';

// ============= TYPES INTERNES =============

interface ProjectFinancials {
  budget: number;
  totalPaid: number;
  totalRetentionHeld: number;
  paymentCount: number;
  allowsInitialPayment: boolean;
  initialPaymentPercentage: number;
}

interface PhaseFinancials {
  phaseId: string;
  phaseName: string;
  estimatedCost: number;
  progress: number;
  totalPaid: number;
}

interface VerifiedMilestone {
  id: string;
  title: string;
  weight: number;
  completedDate: string;
  amount: number;
}

// ============= CALCULATOR =============

export class AutomaticDecompteCalculator {
  private projectId: string;
  private rules: MauritaniaBusinessRulesDTO;

  constructor(projectId: string, customRules?: Partial<MauritaniaBusinessRulesDTO>) {
    this.projectId = projectId;
    this.rules = { ...DEFAULT_MAURITANIA_RULES, ...customRules };
  }

  /**
   * Calcule un décompte automatique pour le projet
   */
  async calculateProjectDecompte(): Promise<AutomaticDecompteDTO> {
    const [projectFinancials, phases, verifiedMilestones, previousDecomptes] = await Promise.all([
      this.getProjectFinancials(),
      this.getPhaseFinancials(),
      this.getVerifiedMilestones(),
      this.getPreviousDecomptes(),
    ]);

    const decompteNumber = previousDecomptes.length + 1;
    const previousCumulative = previousDecomptes.reduce(
      (sum, d) => sum + d.current_period_amount,
      0
    );

    // Calculer le montant de la période courante basé sur les jalons vérifiés non décomptés
    const { currentPeriodAmount, lines } = this.calculateCurrentPeriodAmount(
      verifiedMilestones,
      previousDecomptes,
      phases
    );

    // Calculer les retenues
    const retentionAmount = currentPeriodAmount * this.rules.guarantee_retention_rate;
    
    // Calculer la libération de retenue si applicable
    const retentionToRelease = this.calculateRetentionRelease(
      projectFinancials.totalRetentionHeld,
      phases
    );

    // Calculer le montant net payable
    const netPayable = currentPeriodAmount - retentionAmount + retentionToRelease;

    // Déterminer le type de paiement
    const paymentType = this.determinePaymentType(
      decompteNumber,
      projectFinancials,
      phases
    );

    // Calculer la progression globale
    const overallProgress = phases.reduce(
      (sum, p) => sum + (p.progress * p.estimatedCost),
      0
    ) / projectFinancials.budget;

    return {
      id: `decompte-${Date.now()}`,
      project_id: this.projectId,
      decompte_number: decompteNumber,
      decompte_type: paymentType,

      // Montants
      contract_amount: projectFinancials.budget,
      previous_cumulative: previousCumulative,
      current_period_amount: currentPeriodAmount,
      cumulative_amount: previousCumulative + currentPeriodAmount,

      // Retenues
      retention_rate: this.rules.guarantee_retention_rate,
      retention_amount: retentionAmount,
      previous_retention_released: retentionToRelease,
      retention_to_release: retentionToRelease,

      // Net
      net_payable: netPayable,

      // Jalons
      verified_milestones: verifiedMilestones.map(m => ({
        milestone_id: m.id,
        title: m.title,
        weight: m.weight,
        amount: m.amount,
        verified_at: m.completedDate,
      })),

      // Lignes
      lines,

      // Justification
      progress_at_decompte: Math.round(overallProgress * 100),

      // État
      status: 'calculated',
      calculated_at: new Date().toISOString(),

      // Log
      calculation_log: [{
        timestamp: new Date().toISOString(),
        action: 'calculated',
        details: {
          phases_count: phases.length,
          milestones_count: verifiedMilestones.length,
          rules_applied: this.rules,
        },
      }],
    };
  }

  /**
   * Calcule un décompte pour une phase spécifique
   */
  async calculatePhaseDecompte(phaseId: string): Promise<AutomaticDecompteDTO> {
    const [projectFinancials, phaseData, phaseMilestones, previousDecomptes] = await Promise.all([
      this.getProjectFinancials(),
      this.getPhaseData(phaseId),
      this.getPhaseMilestones(phaseId),
      this.getPreviousDecomptes(phaseId),
    ]);

    if (!phaseData) {
      throw new Error('Phase non trouvée');
    }

    const decompteNumber = previousDecomptes.length + 1;
    const previousCumulative = previousDecomptes.reduce(
      (sum, d) => sum + d.current_period_amount,
      0
    );

    // Calculer le montant basé sur la progression de la phase
    const progressBasedAmount = (phaseData.estimatedCost * phaseData.progress) / 100;
    const currentPeriodAmount = Math.max(0, progressBasedAmount - previousCumulative);

    // Générer les lignes de décompte
    const lines = this.generateDecompteLines(phaseMilestones, phaseData);

    // Retenues
    const retentionAmount = currentPeriodAmount * this.rules.guarantee_retention_rate;
    const netPayable = currentPeriodAmount - retentionAmount;

    return {
      id: `decompte-phase-${phaseId}-${Date.now()}`,
      project_id: this.projectId,
      phase_id: phaseId,
      decompte_number: decompteNumber,
      decompte_type: 'progress',

      contract_amount: phaseData.estimatedCost,
      previous_cumulative: previousCumulative,
      current_period_amount: currentPeriodAmount,
      cumulative_amount: previousCumulative + currentPeriodAmount,

      retention_rate: this.rules.guarantee_retention_rate,
      retention_amount: retentionAmount,
      previous_retention_released: 0,
      retention_to_release: 0,

      net_payable: netPayable,

      verified_milestones: phaseMilestones
        .filter(m => m.status === 'completed')
        .map(m => ({
          milestone_id: m.id,
          title: m.title,
          weight: m.weight || 0.1,
          amount: (phaseData.estimatedCost * (m.weight || 0.1)),
          verified_at: m.completed_date || new Date().toISOString(),
        })),

      lines,

      progress_at_decompte: phaseData.progress,

      status: 'calculated',
      calculated_at: new Date().toISOString(),

      calculation_log: [{
        timestamp: new Date().toISOString(),
        action: 'phase_decompte_calculated',
        details: {
          phase_id: phaseId,
          phase_progress: phaseData.progress,
          milestones_verified: phaseMilestones.filter(m => m.status === 'completed').length,
        },
      }],
    };
  }

  /**
   * Vérifie si un décompte peut être généré
   */
  async canGenerateDecompte(): Promise<{
    allowed: boolean;
    reason: string;
    suggestedAmount: number;
    nextThreshold: number;
  }> {
    const projectFinancials = await this.getProjectFinancials();
    const phases = await this.getPhaseFinancials();

    // Calculer la progression globale
    const totalProgress = phases.reduce(
      (sum, p) => sum + (p.progress * p.estimatedCost),
      0
    ) / projectFinancials.budget;

    const progressPercent = Math.round(totalProgress * 100);

    // Trouver le prochain seuil de paiement
    const paidThresholds = await this.getPaidThresholds();
    const nextThreshold = this.rules.payment_thresholds.find(
      t => t > Math.max(...paidThresholds, 0) && progressPercent >= t
    );

    if (!nextThreshold) {
      const nextAvailable = this.rules.payment_thresholds.find(t => t > progressPercent);
      return {
        allowed: false,
        reason: nextAvailable 
          ? `Progression insuffisante. Prochain seuil: ${nextAvailable}% (actuel: ${progressPercent}%)`
          : 'Tous les seuils de paiement ont été atteints',
        suggestedAmount: 0,
        nextThreshold: nextAvailable || 100,
      };
    }

    // Vérifier les inspections
    const hasApprovedInspection = await this.hasApprovedInspectionForThreshold(nextThreshold);
    if (!hasApprovedInspection) {
      return {
        allowed: false,
        reason: `Inspection approuvée requise pour le seuil ${nextThreshold}%`,
        suggestedAmount: 0,
        nextThreshold,
      };
    }

    // Calculer le montant suggéré
    const thresholdAmount = (projectFinancials.budget * nextThreshold) / 100;
    const suggestedAmount = thresholdAmount - projectFinancials.totalPaid;
    const netAmount = suggestedAmount * (1 - this.rules.guarantee_retention_rate);

    return {
      allowed: true,
      reason: `Seuil ${nextThreshold}% atteint avec inspection approuvée`,
      suggestedAmount: netAmount,
      nextThreshold,
    };
  }

  /**
   * Recalcule le budget restant après les paiements
   */
  async recalculateBudget(): Promise<{
    originalBudget: number;
    totalPaid: number;
    totalRetentionHeld: number;
    remainingBudget: number;
    commitedAmount: number;
    availableAmount: number;
  }> {
    const financials = await this.getProjectFinancials();
    const phases = await this.getPhaseFinancials();

    // Calculer le montant engagé (basé sur la progression)
    const commitedAmount = phases.reduce(
      (sum, p) => sum + (p.estimatedCost * p.progress / 100),
      0
    );

    return {
      originalBudget: financials.budget,
      totalPaid: financials.totalPaid,
      totalRetentionHeld: financials.totalRetentionHeld,
      remainingBudget: financials.budget - financials.totalPaid,
      commitedAmount,
      availableAmount: financials.budget - commitedAmount,
    };
  }

  // ============= HELPERS PRIVÉS =============

  private async getProjectFinancials(): Promise<ProjectFinancials> {
    const { data: project } = await supabase
      .from('projects')
      .select('budget, allows_initial_payment, initial_payment_percentage')
      .eq('id', this.projectId)
      .single();

    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('project_id', this.projectId);

    const totalPaid = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    // retention_amount calculated from payments
    const totalRetentionHeld = totalPaid * this.rules.guarantee_retention_rate;

    return {
      budget: project?.budget || 0,
      totalPaid,
      totalRetentionHeld,
      paymentCount: payments?.length || 0,
      allowsInitialPayment: project?.allows_initial_payment || false,
      initialPaymentPercentage: project?.initial_payment_percentage || 0,
    };
  }

  private async getPhaseFinancials(): Promise<PhaseFinancials[]> {
    const { data: phases } = await supabase
      .from('project_phases')
      .select('id, phase_name, estimated_cost, progress')
      .eq('project_id', this.projectId);

    const { data: payments } = await supabase
      .from('payments')
      .select('phase_id, amount')
      .eq('project_id', this.projectId);

    return (phases || []).map(phase => {
      const phasePaid = (payments || [])
        .filter(p => p.phase_id === phase.id)
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      return {
        phaseId: phase.id,
        phaseName: phase.phase_name,
        estimatedCost: phase.estimated_cost || 0,
        progress: phase.progress || 0,
        totalPaid: phasePaid,
      };
    });
  }

  private async getVerifiedMilestones(): Promise<VerifiedMilestone[]> {
    const { data: milestones } = await supabase
      .from('enhanced_project_milestones')
      .select('id, title, weight, completed_date, phase_id')
      .eq('project_id', this.projectId)
      .eq('status', 'completed')
      .order('completed_date', { ascending: true });

    const { data: phases } = await supabase
      .from('project_phases')
      .select('id, estimated_cost')
      .eq('project_id', this.projectId);

    const phaseMap = new Map((phases || []).map(p => [p.id, p.estimated_cost || 0]));

    return (milestones || []).map(m => ({
      id: m.id,
      title: m.title,
      weight: m.weight || 0.1,
      completedDate: m.completed_date || new Date().toISOString(),
      amount: (phaseMap.get(m.phase_id || '') || 0) * (m.weight || 0.1),
    }));
  }

  private async getPreviousDecomptes(phaseId?: string): Promise<AutomaticDecompteDTO[]> {
    // Pour l'instant, on récupère les paiements comme proxy des décomptes
    let query = supabase
      .from('payments')
      .select('*')
      .eq('project_id', this.projectId)
      .order('payment_date', { ascending: true });

    if (phaseId) {
      query = query.eq('phase_id', phaseId);
    }

    const { data: payments } = await query;

    return (payments || []).map((p, index) => ({
      id: p.id,
      project_id: this.projectId,
      phase_id: p.phase_id || undefined,
      decompte_number: index + 1,
      decompte_type: 'progress' as PaymentType,
      contract_amount: 0,
      previous_cumulative: 0,
      current_period_amount: p.amount || 0,
      cumulative_amount: 0,
      retention_rate: this.rules.guarantee_retention_rate,
      retention_amount: (p.amount || 0) * this.rules.guarantee_retention_rate,
      previous_retention_released: 0,
      retention_to_release: 0,
      net_payable: p.amount || 0,
      verified_milestones: [],
      lines: [],
      progress_at_decompte: p.progress_at_payment || 0,
      status: 'paid' as DecompteStatus,
      calculated_at: p.created_at,
      paid_at: p.payment_date,
      calculation_log: [],
    }));
  }

  private async getPaidThresholds(): Promise<number[]> {
    const { data: payments } = await supabase
      .from('payments')
      .select('progress_at_payment')
      .eq('project_id', this.projectId);

    return (payments || []).map(p => p.progress_at_payment || 0);
  }

  private async hasApprovedInspectionForThreshold(threshold: number): Promise<boolean> {
    const { data: inspections } = await supabase
      .from('inspections')
      .select('id')
      .eq('project_id', this.projectId)
      .eq('status', 'approved')
      .gte('progress_at_inspection', threshold - 5)
      .limit(1);

    return inspections !== null && inspections.length > 0;
  }

  private async getPhaseData(phaseId: string): Promise<PhaseFinancials | null> {
    const { data: phase } = await supabase
      .from('project_phases')
      .select('id, phase_name, estimated_cost, progress')
      .eq('id', phaseId)
      .single();

    if (!phase) return null;

    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('phase_id', phaseId);

    return {
      phaseId: phase.id,
      phaseName: phase.phase_name,
      estimatedCost: phase.estimated_cost || 0,
      progress: phase.progress || 0,
      totalPaid: (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0),
    };
  }

  private async getPhaseMilestones(phaseId: string): Promise<MilestoneDTO[]> {
    const { data: milestones } = await supabase
      .from('enhanced_project_milestones')
      .select('*')
      .eq('phase_id', phaseId)
      .order('target_date', { ascending: true });

    return (milestones || []).map(m => ({
      id: m.id,
      project_id: m.project_id,
      phase_id: m.phase_id || undefined,
      title: m.title,
      description: m.description || undefined,
      target_date: m.target_date,
      completed_date: m.completed_date || undefined,
      status: (m.status || 'pending') as MilestoneDTO['status'],
      weight: m.weight || 0.1,
      type: 'checkpoint' as const,
      priority: 'normal' as const,
      is_on_critical_path: false,
      is_from_template: false,
      created_at: m.created_at || new Date().toISOString(),
      updated_at: m.updated_at || new Date().toISOString(),
    }));
  }

  private calculateCurrentPeriodAmount(
    verifiedMilestones: VerifiedMilestone[],
    previousDecomptes: AutomaticDecompteDTO[],
    phases: PhaseFinancials[]
  ): { currentPeriodAmount: number; lines: DecompteLineDTO[] } {
    const previousMilestoneIds = new Set(
      previousDecomptes.flatMap(d => d.verified_milestones.map(m => m.milestone_id))
    );

    const newMilestones = verifiedMilestones.filter(m => !previousMilestoneIds.has(m.id));
    const currentPeriodAmount = newMilestones.reduce((sum, m) => sum + m.amount, 0);

    const lines: DecompteLineDTO[] = newMilestones.map(m => ({
      id: `line-${m.id}`,
      description: m.title,
      quantity: 1,
      unit: 'forfait',
      unit_price: m.amount,
      total_amount: m.amount,
      category: 'works',
      milestone_id: m.id,
      verification_status: 'verified',
    }));

    return { currentPeriodAmount, lines };
  }

  private generateDecompteLines(
    milestones: MilestoneDTO[],
    phase: PhaseFinancials
  ): DecompteLineDTO[] {
    const completedMilestones = milestones.filter(m => m.status === 'completed');
    
    return completedMilestones.map(m => ({
      id: `line-${m.id}`,
      description: m.title,
      quantity: 1,
      unit: 'forfait',
      unit_price: phase.estimatedCost * (m.weight || 0.1),
      total_amount: phase.estimatedCost * (m.weight || 0.1),
      category: 'works' as const,
      milestone_id: m.id,
      verification_status: 'verified' as const,
    }));
  }

  private calculateRetentionRelease(
    totalRetentionHeld: number,
    phases: PhaseFinancials[]
  ): number {
    // Vérifier si toutes les phases sont terminées (réception provisoire)
    const allCompleted = phases.every(p => p.progress >= 100);
    
    if (allCompleted) {
      return totalRetentionHeld * this.rules.retention_release_at_provisional;
    }

    return 0;
  }

  private determinePaymentType(
    decompteNumber: number,
    projectFinancials: ProjectFinancials,
    phases: PhaseFinancials[]
  ): PaymentType {
    if (decompteNumber === 1 && projectFinancials.allowsInitialPayment) {
      return 'initial';
    }

    const allCompleted = phases.every(p => p.progress >= 100);
    if (allCompleted) {
      return 'final';
    }

    return 'progress';
  }
}

// ============= FACTORY =============

let calculatorInstance: AutomaticDecompteCalculator | null = null;

export function getAutomaticDecompteCalculator(
  projectId: string,
  customRules?: Partial<MauritaniaBusinessRulesDTO>
): AutomaticDecompteCalculator {
  if (!calculatorInstance || calculatorInstance['projectId'] !== projectId) {
    calculatorInstance = new AutomaticDecompteCalculator(projectId, customRules);
  }
  return calculatorInstance;
}
