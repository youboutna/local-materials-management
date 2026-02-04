/**
 * AutomaticDecompteCalculator - Hexagonal Architecture
 * 
 * Calcul automatique des décomptes basés sur les jalons vérifiés
 * Règles Mauritanie:
 * - Paiements échelonnés selon avancement réel
 * - Garanties: 10% retenu jusqu'à réception définitive
 * - Inspections obligatoires à chaque étape clé
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { 
  IProjectRepository,
  IPaymentRepository,
  IPhaseRepository,
  IMilestoneRepository,
  IInspectionRepository,
  IDecompteRepository
} from '@/domain/repositories';
import { 
  AutomaticDecompteDTO,
  DecompteLineDTO,
  PaymentType,
  DEFAULT_MAURITANIA_RULES,
  MauritaniaBusinessRulesDTO,
} from '@/dtos/entities/DecompteDTO';
import { MilestoneDTO } from '@/dtos/entities/MilestoneDTO';

// Service DTOs for data exchange
export interface CalculateProjectDecompteRequestDto {
  projectId: string;
  customRules?: Partial<MauritaniaBusinessRulesDTO>;
}

export interface CalculatePhaseDecompteRequestDto {
  projectId: string;
  phaseId: string;
  customRules?: Partial<MauritaniaBusinessRulesDTO>;
}

export interface CanGenerateDecompteRequestDto {
  projectId: string;
  phaseId?: string;
}

export interface CanGenerateDecompteResponseDto {
  allowed: boolean;
  reason: string;
  suggestedAmount: number;
}

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
  id: string;
  name: string;
  estimatedCost: number;
  totalPaid: number;
  progress: number;
  remainingBudget: number;
}

interface VerifiedMilestone {
  id: string;
  title: string;
  weight: number;
  completedDate: string;
  phaseId: string;
  phaseEstimatedCost: number;
  amount: number;
}

// ============= CALCULATOR =============

export class AutomaticDecompteCalculator {
  private projectId: string;
  private rules: MauritaniaBusinessRulesDTO;
  private decompteRepository: IDecompteRepository;

  constructor(projectId: string, customRules?: Partial<MauritaniaBusinessRulesDTO>) {
    if (!projectId) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
    }
    
    this.projectId = projectId;
    this.rules = { ...DEFAULT_MAURITANIA_RULES, ...customRules };
    this.decompteRepository = RepositoryFactory.getDecompteRepository();
  }

  /**
   * Calcule un décompte automatique pour le projet
   */
  async calculateProjectDecompte(request?: CalculateProjectDecompteRequestDto): Promise<AutomaticDecompteDTO> {
    try {
      const projectId = request?.projectId || this.projectId;
      
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const [projectFinancials, phases, verifiedMilestones, previousDecomptes] = await Promise.all([
        this.getProjectFinancials(projectId),
        this.getPhaseFinancials(projectId),
        this.getVerifiedMilestones(projectId),
        this.getPreviousDecomptes(projectId),
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
        project_id: projectId,
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
    } catch (error) {
      console.error('AutomaticDecompteCalculator.calculateProjectDecompte failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to calculate project decompte');
    }
  }

  /**
   * Calcule un décompte pour une phase spécifique
   */
  async calculatePhaseDecompte(request: CalculatePhaseDecompteRequestDto): Promise<AutomaticDecompteDTO> {
    try {
      if (!request.phaseId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID is required');
      }

      const projectId = request.projectId || this.projectId;
      
      const [projectFinancials, phaseData, phaseMilestones, previousDecomptes] = await Promise.all([
        this.getProjectFinancials(projectId),
        this.getPhaseData(request.phaseId),
        this.getPhaseMilestones(request.phaseId),
        this.getPreviousDecomptes(projectId, request.phaseId),
      ]);

      if (!phaseData) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Phase non trouvée');
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
        id: `decompte-phase-${request.phaseId}-${Date.now()}`,
        project_id: projectId,
        phase_id: request.phaseId,
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
            phase_id: request.phaseId,
            phase_progress: phaseData.progress,
            milestones_verified: phaseMilestones.filter(m => m.status === 'completed').length,
          },
        }],
      };
    } catch (error) {
      console.error('AutomaticDecompteCalculator.calculatePhaseDecompte failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to calculate phase decompte');
    }
  }

  /**
   * Vérifie si un décompte peut être généré
   */
  async canGenerateDecompte(request?: CanGenerateDecompteRequestDto): Promise<CanGenerateDecompteResponseDto> {
    try {
      const projectId = request?.projectId || this.projectId;
      const phaseId = request?.phaseId;
      
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const [projectFinancials, verifiedMilestones] = await Promise.all([
        this.getProjectFinancials(projectId),
        this.getVerifiedMilestones(projectId)
      ]);

      // Check if there are new verified milestones not yet included in decomptes
      const previousDecomptes = await this.getPreviousDecomptes(projectId, phaseId);
      const previousMilestoneIds = new Set(
        previousDecomptes.flatMap(d => d.verified_milestones.map(m => m.milestone_id))
      );
      
      const hasNewMilestones = verifiedMilestones.some(m => !previousMilestoneIds.has(m.id));
      
      // Calculate suggested amount based on new milestones
      const suggestedAmount = hasNewMilestones 
        ? verifiedMilestones
            .filter(m => !previousMilestoneIds.has(m.id))
            .reduce((sum, m) => sum + m.amount, 0)
        : 0;

      return {
        allowed: hasNewMilestones,
        reason: hasNewMilestones 
          ? 'New verified milestones available for decompte' 
          : 'No new verified milestones since last decompte',
        suggestedAmount
      };
    } catch (error) {
      console.error('AutomaticDecompteCalculator.canGenerateDecompte failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to check decompte generation');
    }
  }

  // ============= HELPERS PRIVÉS =============

  private async getProjectFinancials(projectId: string): Promise<ProjectFinancials> {
    return this.decompteRepository.getProjectFinancials(projectId);
  }

  private async getPhaseFinancials(projectId: string): Promise<PhaseFinancials[]> {
    return this.decompteRepository.getPhaseFinancials(projectId);
  }

  private async getVerifiedMilestones(projectId: string): Promise<VerifiedMilestone[]> {
    return this.decompteRepository.getVerifiedMilestones(projectId);
  }

  private async getPreviousDecomptes(projectId: string, phaseId?: string): Promise<AutomaticDecompteDTO[]> {
    return this.decompteRepository.getPreviousDecomptes(projectId, phaseId);
  }

  private async getPhaseData(phaseId: string): Promise<PhaseFinancials | null> {
    return this.decompteRepository.getPhaseData(phaseId);
  }

  private async getPhaseMilestones(phaseId: string): Promise<MilestoneDTO[]> {
    return this.decompteRepository.getPhaseMilestones(phaseId);
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
