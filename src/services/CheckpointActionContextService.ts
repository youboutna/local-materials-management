/**
 * Checkpoint Action Context Service
 * Récupère le contexte complet pour les actions de paiement et d'inspection
 * liées aux points de contrôle (milestones)
 * 
 * Architecture: UI → Service → Repository (interface) → Adapter
 */

import { supabase } from '@/integrations/supabase/client';
import { PhaseService } from './phaseService';
import { getMilestoneService } from './UnifiedMilestoneService';
import { MilestoneDTO, MilestoneSummaryDTO } from '@/types/milestone-dto';
import { PhaseDTO, PhaseSummaryDTO, PhaseStepDTO, PhaseTaskDTO } from '@/types/phase-dto';

/**
 * Contexte complet d'un projet pour les actions
 */
export interface ProjectActionContext {
  project: ProjectSummary;
  phases: PhaseSummary[];
  currentPhase?: PhaseSummary;
  currentStep?: StepSummary;
  milestones: MilestoneSummaryDTO[];
  financialSummary: FinancialSummary;
  progressSummary: ProgressSummary;
  mainContractor?: ContractorInfo;
  latestInspection?: InspectionInfo;
}

/**
 * Contexte spécifique pour les actions de paiement
 */
export interface PaymentActionContext extends ProjectActionContext {
  suggestedAmount: number;
  maxAllowedAmount: number;
  linkedMilestone?: MilestoneSummaryDTO;
  linkedPhase?: PhaseSummary;
  progressAtPayment: number;
  isInitialPaymentAllowed: boolean;
  initialPaymentAmount: number;
}

/**
 * Contexte spécifique pour les actions d'inspection
 */
export interface InspectionActionContext extends ProjectActionContext {
  linkedMilestone?: MilestoneSummaryDTO;
  linkedPhase?: PhaseSummary;
  linkedStep?: StepSummary;
  suggestedProgress: number;
  inspectionType: 'technical' | 'quality' | 'safety' | 'regulatory';
  isGateInspection: boolean;
  pendingTasks: TaskInfo[];
  checklistItems: string[];
}

export interface ProjectSummary {
  id: string;
  title: string;
  description?: string;
  status: string;
  progress: number;
  budget: number;
  startDate: string;
  endDate?: string;
  mainContractor?: string;
  projectReference?: string;
  allowsInitialPayment?: boolean;
  initialPaymentPercentage?: number;
}

export interface PhaseSummary {
  id: string;
  name: string;
  status: string;
  progress: number;
  startDate?: string;
  endDate?: string;
  estimatedCost?: number;
  actualCost?: number;
  steps: StepSummary[];
}

export interface StepSummary {
  id: string;
  name: string;
  status: string;
  progress: number;
  taskCount: number;
  completedTaskCount: number;
}

export interface TaskInfo {
  id: string;
  name: string;
  status: string;
  progress: number;
  phaseId: string;
  stepId: string;
  requiresInspection: boolean;
}

export interface FinancialSummary {
  totalBudget: number;
  totalPaid: number;
  remainingBudget: number;
  progressBasedAmount: number;
  maxAllowedWithTolerance: number;
  paymentCount: number;
}

export interface ProgressSummary {
  overallProgress: number;
  phaseProgress: number;
  milestoneProgress: {
    total: number;
    completed: number;
    percentage: number;
  };
  checkpointProgress: {
    total: number;
    completed: number;
    percentage: number;
  };
}

export interface ContractorInfo {
  id?: string;
  name: string;
  contact: string;
  company?: string;
}

export interface InspectionInfo {
  id: string;
  date: string;
  status: string;
  inspector: string;
  progressAtInspection: number;
  phaseId?: string;
}

/**
 * Service de contexte pour les actions de checkpoint
 */
export class CheckpointActionContextService {
  private milestoneService = getMilestoneService();

  /**
   * Récupère le contexte complet d'un projet
   */
  async getProjectContext(projectId: string): Promise<ProjectActionContext> {
    // Fetch all data in parallel
    const [project, phases, milestones, payments, inspections, supplier] = await Promise.all([
      this.fetchProject(projectId),
      PhaseService.getPhasesDTOByProject(projectId),
      this.milestoneService.getProjectMilestones(projectId),
      this.fetchPayments(projectId),
      this.fetchInspections(projectId),
      this.fetchMainContractor(projectId)
    ]);

    if (!project) {
      throw new Error('Project not found');
    }

    const phaseSummaries = phases.map(p => this.mapPhaseToSummary(p));
    const currentPhase = phaseSummaries.find(p => p.status === 'in_progress');
    const currentStep = currentPhase?.steps.find(s => s.status === 'in_progress' || s.status === 'pending');
    
    // Calculate financial summary
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const progressBasedAmount = (project.budget * project.progress) / 100;
    const maxAllowedWithTolerance = progressBasedAmount * 1.5;

    // Calculate milestone progress
    const milestonesSummary = milestones.map(m => ({
      id: m.id,
      title: m.title,
      target_date: m.target_date,
      completed_date: m.completed_date,
      status: m.status as any,
      type: m.type,
      priority: m.priority,
      weight: m.weight,
      is_critical: m.is_on_critical_path || false,
      float_days: m.float_days
    }));

    const checkpoints = milestonesSummary.filter(m => m.type === 'checkpoint' || m.type === 'gate');
    const completedCheckpoints = checkpoints.filter(m => m.status === 'completed');

    // Latest inspection
    const latestInspection = inspections.length > 0 ? {
      id: inspections[0].id,
      date: inspections[0].date,
      status: inspections[0].status,
      inspector: inspections[0].inspector,
      progressAtInspection: inspections[0].progress_at_inspection,
      phaseId: inspections[0].phase_id
    } : undefined;

    return {
      project: {
        id: project.id,
        title: project.title,
        description: project.description || undefined,
        status: project.status,
        progress: project.progress,
        budget: project.budget,
        startDate: project.start_date,
        endDate: project.end_date || undefined,
        mainContractor: project.main_contractor || undefined,
        projectReference: project.project_reference || undefined,
        allowsInitialPayment: project.allows_initial_payment ?? undefined,
        initialPaymentPercentage: project.initial_payment_percentage ?? undefined
      },
      phases: phaseSummaries,
      currentPhase,
      currentStep,
      milestones: milestonesSummary,
      financialSummary: {
        totalBudget: project.budget,
        totalPaid,
        remainingBudget: project.budget - totalPaid,
        progressBasedAmount,
        maxAllowedWithTolerance,
        paymentCount: payments.length
      },
      progressSummary: {
        overallProgress: project.progress,
        phaseProgress: currentPhase?.progress || 0,
        milestoneProgress: {
          total: milestones.length,
          completed: milestones.filter(m => m.status === 'completed').length,
          percentage: milestones.length > 0 
            ? Math.round((milestones.filter(m => m.status === 'completed').length / milestones.length) * 100)
            : 0
        },
        checkpointProgress: {
          total: checkpoints.length,
          completed: completedCheckpoints.length,
          percentage: checkpoints.length > 0 
            ? Math.round((completedCheckpoints.length / checkpoints.length) * 100)
            : 0
        }
      },
      mainContractor: supplier,
      latestInspection: inspections.length > 0 ? {
        id: inspections[0].id,
        date: inspections[0].date,
        status: inspections[0].status,
        inspector: inspections[0].inspector,
        progressAtInspection: inspections[0].progress_at_inspection,
        phaseId: inspections[0].phase_id || undefined
      } : undefined
    };
  }

  /**
   * Récupère le contexte pour une action de paiement
   */
  async getPaymentContext(
    projectId: string, 
    milestoneId?: string,
    phaseId?: string
  ): Promise<PaymentActionContext> {
    const context = await this.getProjectContext(projectId);
    
    // Get linked milestone if provided
    let linkedMilestone: MilestoneSummaryDTO | undefined;
    if (milestoneId) {
      const milestone = await this.milestoneService.getMilestoneById(milestoneId);
      if (milestone) {
        linkedMilestone = {
          id: milestone.id,
          title: milestone.title,
          target_date: milestone.target_date,
          completed_date: milestone.completed_date,
          status: milestone.status as any,
          type: milestone.type,
          priority: milestone.priority,
          weight: milestone.weight,
          is_critical: milestone.is_on_critical_path || false,
          float_days: milestone.float_days
        };
      }
    }

    // Get linked phase
    const linkedPhase = phaseId 
      ? context.phases.find(p => p.id === phaseId)
      : (linkedMilestone ? context.phases.find(p => 
          context.milestones.find(m => m.id === linkedMilestone?.id)
        ) : context.currentPhase);

    // Calculate payment amounts
    const isInitialPaymentPhase = 
      context.financialSummary.paymentCount === 0 && 
      context.project.progress < 25 && 
      (context.project.allowsInitialPayment === true);

    const initialPaymentAmount = (context.project.allowsInitialPayment === true) && context.project.initialPaymentPercentage
      ? (context.project.budget * context.project.initialPaymentPercentage) / 100
      : 0;

    // Calculate suggested amount based on progress and milestone weight
    let suggestedAmount = 0;
    if (isInitialPaymentPhase) {
      suggestedAmount = initialPaymentAmount;
    } else if (linkedMilestone && linkedMilestone.weight) {
      suggestedAmount = (context.project.budget * linkedMilestone.weight) / 100;
    } else {
      suggestedAmount = context.financialSummary.progressBasedAmount - context.financialSummary.totalPaid;
    }

    const maxAllowed = isInitialPaymentPhase 
      ? initialPaymentAmount 
      : context.financialSummary.maxAllowedWithTolerance - context.financialSummary.totalPaid;

    return {
      ...context,
      suggestedAmount: Math.max(0, Math.min(suggestedAmount, maxAllowed)),
      maxAllowedAmount: Math.max(0, maxAllowed),
      linkedMilestone,
      linkedPhase,
      progressAtPayment: context.project.progress,
      isInitialPaymentAllowed: isInitialPaymentPhase,
      initialPaymentAmount
    };
  }

  /**
   * Récupère le contexte pour une action d'inspection
   */
  async getInspectionContext(
    projectId: string,
    milestoneId?: string,
    phaseId?: string
  ): Promise<InspectionActionContext> {
    const context = await this.getProjectContext(projectId);

    // Get linked milestone if provided
    let linkedMilestone: MilestoneSummaryDTO | undefined;
    let isGateInspection = false;
    let inspectionType: 'technical' | 'quality' | 'safety' | 'regulatory' = 'technical';
    
    if (milestoneId) {
      const milestone = await this.milestoneService.getMilestoneById(milestoneId);
      if (milestone) {
        linkedMilestone = {
          id: milestone.id,
          title: milestone.title,
          target_date: milestone.target_date,
          completed_date: milestone.completed_date,
          status: milestone.status as any,
          type: milestone.type,
          priority: milestone.priority,
          weight: milestone.weight,
          is_critical: milestone.is_on_critical_path ?? false,
          float_days: milestone.float_days
        };
        
        isGateInspection = milestone.type === 'gate';
        inspectionType = this.determineInspectionType(milestone);
      }
    }

    // Get linked phase
    const linkedPhase = phaseId 
      ? context.phases.find(p => p.id === phaseId)
      : context.currentPhase;

    // Get linked step (first pending or in-progress step of the phase)
    const linkedStep = linkedPhase?.steps.find(s => 
      s.status === 'in_progress' || s.status === 'pending'
    );

    // Get pending tasks (all tasks that are not completed)
    const pendingTasks: TaskInfo[] = [];
    if (linkedPhase) {
      const fullPhase = await PhaseService.getPhaseDTOById(linkedPhase.id);
      if (fullPhase) {
        fullPhase.steps.forEach(step => {
          step.tasks
            .filter(task => task.status !== 'completed')
            .forEach(task => {
              pendingTasks.push({
                id: task.id,
                name: task.name,
                status: task.status,
                progress: task.progress,
                phaseId: linkedPhase.id,
                stepId: step.id,
                requiresInspection: false // Default, can be extended if field is added to PhaseTaskDTO
              });
            });
        });
      }
    }

    // Generate checklist items based on milestone and phase
    const checklistItems = this.generateChecklistItems(
      linkedMilestone,
      linkedPhase,
      inspectionType
    );

    // Calculate suggested progress
    let suggestedProgress = context.project.progress;
    if (linkedPhase) {
      suggestedProgress = linkedPhase.progress;
    }
    if (linkedStep) {
      suggestedProgress = Math.round((linkedPhase?.progress || 0 + linkedStep.progress) / 2);
    }

    return {
      ...context,
      linkedMilestone,
      linkedPhase,
      linkedStep,
      suggestedProgress,
      inspectionType,
      isGateInspection,
      pendingTasks,
      checklistItems
    };
  }

  /**
   * Récupère les phases avec leurs étapes pour un projet
   */
  async getPhasesWithSteps(projectId: string): Promise<PhaseSummary[]> {
    const phases = await PhaseService.getPhasesDTOByProject(projectId);
    return phases.map(p => this.mapPhaseToSummary(p));
  }

  /**
   * Récupère les milestones actionnables (checkpoints et gates)
   */
  async getActionableMilestones(projectId: string, phaseId?: string): Promise<MilestoneSummaryDTO[]> {
    let milestones: MilestoneDTO[];
    
    if (phaseId) {
      milestones = await this.milestoneService.getPhaseMilestones(projectId, phaseId);
    } else {
      milestones = await this.milestoneService.getProjectMilestones(projectId);
    }

    return milestones
      .filter(m => m.type === 'checkpoint' || m.type === 'gate')
      .map(m => ({
        id: m.id,
        title: m.title,
        target_date: m.target_date,
        completed_date: m.completed_date,
        status: m.status as any,
        type: m.type,
        priority: m.priority,
        weight: m.weight,
        is_critical: m.is_on_critical_path || false,
        float_days: m.float_days
      }));
  }

  // ============= Private Helpers =============

  private async fetchProject(projectId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) throw error;
    return data;
  }

  private async fetchPayments(projectId: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('project_id', projectId)
      .order('payment_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  private async fetchInspections(projectId: string) {
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  private async fetchMainContractor(projectId: string): Promise<ContractorInfo | undefined> {
    // Try to get from project's main_contractor or from latest payment
    const { data: project } = await supabase
      .from('projects')
      .select('main_contractor')
      .eq('id', projectId)
      .single();

    if (project?.main_contractor) {
      // Try to find supplier info
      const { data: supplier } = await supabase
        .from('suppliers')
        .select('id, name, contact_person, phone')
        .ilike('name', `%${project.main_contractor}%`)
        .limit(1)
        .single();

      if (supplier) {
        return {
          id: supplier.id,
          name: supplier.name,
          contact: supplier.phone || supplier.contact_person || '',
          company: supplier.name
        };
      }

      return {
        name: project.main_contractor,
        contact: ''
      };
    }

    // Fallback: get from latest payment
    const { data: payment } = await supabase
      .from('payments')
      .select('contractor_id, contractor_name, contractor_contact')
      .eq('project_id', projectId)
      .order('payment_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (payment) {
      return {
        id: payment.contractor_id || undefined,
        name: payment.contractor_name,
        contact: payment.contractor_contact
      };
    }

    return undefined;
  }

  private mapPhaseToSummary(phase: PhaseDTO): PhaseSummary {
    return {
      id: phase.id,
      name: phase.phase_name,
      status: phase.status,
      progress: phase.progress,
      startDate: phase.start_date,
      endDate: phase.end_date,
      estimatedCost: phase.estimated_cost,
      actualCost: phase.actual_cost,
      steps: phase.steps.map(step => ({
        id: step.id,
        name: step.name,
        status: step.status,
        progress: step.progress,
        taskCount: step.tasks.length,
        completedTaskCount: step.tasks.filter(t => t.status === 'completed').length
      }))
    };
  }

  private determineInspectionType(milestone: MilestoneDTO): 'technical' | 'quality' | 'safety' | 'regulatory' {
    const titleLower = milestone.title.toLowerCase();
    const descLower = (milestone.description || '').toLowerCase();
    const combined = titleLower + ' ' + descLower;

    if (combined.includes('sécurité') || combined.includes('hse') || combined.includes('safety')) {
      return 'safety';
    }
    if (combined.includes('qualité') || combined.includes('quality')) {
      return 'quality';
    }
    if (combined.includes('réglementaire') || combined.includes('conformité') || combined.includes('environnement')) {
      return 'regulatory';
    }
    
    return 'technical';
  }

  private generateChecklistItems(
    milestone?: MilestoneSummaryDTO,
    phase?: PhaseSummary,
    inspectionType?: string
  ): string[] {
    const items: string[] = [];

    // Base checklist items
    items.push('Vérification de la conformité aux spécifications');
    items.push('Contrôle des documents de suivi');
    items.push('Évaluation de la progression physique');

    // Type-specific items
    if (inspectionType === 'safety') {
      items.push('Vérification des équipements de sécurité');
      items.push('Contrôle du respect des normes HSE');
      items.push('Inspection des zones à risque');
    } else if (inspectionType === 'quality') {
      items.push('Contrôle qualité des matériaux');
      items.push('Vérification des finitions');
      items.push('Test de conformité aux normes');
    } else if (inspectionType === 'regulatory') {
      items.push('Vérification des permis et autorisations');
      items.push('Contrôle environnemental');
      items.push('Conformité réglementaire');
    }

    // Gate-specific items
    if (milestone?.type === 'gate') {
      items.push('Validation de fin de phase');
      items.push('Revue des livrables de la phase');
      items.push('Approbation pour passage à la phase suivante');
    }

    // Phase-specific items
    if (phase) {
      items.push(`Avancement de la phase "${phase.name}"`);
    }

    return items;
  }
}

// Singleton instance
let serviceInstance: CheckpointActionContextService | null = null;

export function getCheckpointActionContextService(): CheckpointActionContextService {
  if (!serviceInstance) {
    serviceInstance = new CheckpointActionContextService();
  }
  return serviceInstance;
}
