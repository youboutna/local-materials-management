/**
 * Checkpoint Action Context Service - Hexagonal Architecture
 * Récupère le contexte complet pour les actions de paiement et d'inspection
 * liées aux points de contrôle (milestones)
 * 
 * Architecture: UI → Service → Repository (interface) → Adapter
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { IMilestoneRepository } from '@/domain/repositories/IMilestoneRepository';
import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { IPhaseRepository } from '@/domain/repositories/IPhaseRepository';
import { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import { IInspectionRepository } from '@/domain/repositories/IInspectionRepository';
import { ISupplierRepository } from '@/domain/repositories/ISupplierRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { MilestoneDTO, MilestoneSummaryDTO, MilestoneType, MilestonePriority, MilestoneStatus } from '@/dtos/entities/MilestoneDTO';
import { PhaseDTO, PhaseSummaryDTO, PhaseStepDTO, PhaseTaskDTO } from '@/dtos/types/phase-dto';
import { Milestone } from '@/domain/entities/Milestone';

// Type definitions for better type safety
interface ProjectData {
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

interface PhaseData {
  id: string;
  name: string;
  status: string;
  progress: number;
  budget?: number;
}

interface MilestoneData {
  id: string;
  title: string;
  targetDate: string;
  completionDate?: string;
  status: MilestoneStatus;
  priority: MilestonePriority;
  progressPercentage?: number;
  weight?: number;
  type?: string;
  tags?: string[];
}

interface PaymentData {
  id: string;
  amount: number;
  date: string;
  status: string;
}

interface InspectionData {
  id: string;
  date: string;
  status: string;
  inspector: string;
  progressAtInspection: number;
  phaseId: string;
}

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

export class CheckpointActionContextService {
  constructor(
    private projectRepository: IProjectRepository = RepositoryFactory.getProjectRepository(),
    private phaseRepository: IPhaseRepository = RepositoryFactory.getPhaseRepository(),
    private milestoneRepository: IPhaseRepository = RepositoryFactory.getPhaseRepository(), // Using phase repository as placeholder for milestone
    private paymentRepository: IPaymentRepository = RepositoryFactory.getPaymentRepository(),
    private inspectionRepository: IInspectionRepository = RepositoryFactory.getInspectionRepository(),
    private supplierRepository: ISupplierRepository = RepositoryFactory.getSupplierRepository()
  ) {}

  /**
   * Récupère le contexte complet d'un projet
   */
  async getProjectContext(projectId: string): Promise<ProjectActionContext> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      // Fetch all data in parallel
      const [project, phases, milestones, payments, inspections, supplier] = await Promise.all([
        this.fetchProject(projectId),
        this.fetchPhases(projectId),
        this.fetchMilestones(projectId),
        this.fetchPayments(projectId),
        this.fetchInspections(projectId),
        this.fetchMainContractor(projectId)
      ]);

      if (!project) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
      }

      const phaseSummaries = (phases as PhaseData[]).map((p: PhaseData) => this.mapPhaseToSummary(p));
      const currentPhase = phaseSummaries.find((p: PhaseSummary) => p.status === 'in_progress');
      const currentStep = currentPhase?.steps.find((s: StepSummary) => s.status === 'in_progress' || s.status === 'pending');
      
      // Calculate financial summary
      const totalPaid = (payments as PaymentData[]).reduce((sum: number, p: PaymentData) => sum + (p.amount || 0), 0);
      const projectData = project as ProjectData;
      const progressBasedAmount = (projectData.budget * projectData.progress) / 100;
      const maxAllowedWithTolerance = progressBasedAmount * 1.5;

      // Calculate milestone progress - milestones is now MilestoneDTO[]
      const milestonesSummary: MilestoneSummaryDTO[] = milestones.map((m: MilestoneDTO) => ({
        id: m.id,
        title: m.title,
        targetDate: m.targetDate || '',
        completedDate: m.completedDate || undefined,
        status: m.status,
        type: m.type || 'checkpoint',
        priority: m.priority || 'normal',
        weight: m.weight || 0.5,
        isCritical: m.priority === 'critical',
        floatDays: 0
      }));

      const checkpoints = milestonesSummary.filter((m: MilestoneSummaryDTO) => m.type === 'checkpoint' || m.type === 'gate');
      const completedCheckpoints = checkpoints.filter((m: MilestoneSummaryDTO) => m.status === 'completed');

      // Latest inspection
      const latestInspection = inspections.length > 0 ? {
        id: (inspections[0] as InspectionData).id,
        date: (inspections[0] as InspectionData).date,
        status: (inspections[0] as InspectionData).status,
        inspector: (inspections[0] as InspectionData).inspector,
        progressAtInspection: (inspections[0] as InspectionData).progressAtInspection,
        phaseId: (inspections[0] as InspectionData).phaseId
      } : undefined;

      return {
        project: {
          id: projectData.id,
          title: projectData.title,
          description: projectData.description || undefined,
          status: projectData.status,
          progress: projectData.progress,
          budget: projectData.budget,
          startDate: projectData.startDate,
          endDate: projectData.endDate || undefined,
          mainContractor: projectData.mainContractor || undefined,
          projectReference: projectData.projectReference || undefined,
          allowsInitialPayment: projectData.allowsInitialPayment ?? undefined,
          initialPaymentPercentage: projectData.initialPaymentPercentage ?? undefined
        },
        phases: phaseSummaries,
        currentPhase,
        currentStep,
        milestones: milestonesSummary,
        financialSummary: {
          totalBudget: projectData.budget,
          totalPaid,
          remainingBudget: projectData.budget - totalPaid,
          progressBasedAmount,
          maxAllowedWithTolerance,
          paymentCount: payments.length
        },
        progressSummary: {
          overallProgress: projectData.progress,
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
          id: (inspections[0] as InspectionData).id,
          date: (inspections[0] as InspectionData).date,
          status: (inspections[0] as InspectionData).status,
          inspector: (inspections[0] as InspectionData).inspector,
          progressAtInspection: (inspections[0] as InspectionData).progressAtInspection,
          phaseId: (inspections[0] as InspectionData).phaseId || undefined
        } : undefined
      };
    } catch (error) {
      console.error('CheckpointActionContextService.getProjectContext failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get project context');
    }
  }

  /**
   * Récupère le contexte pour une action de paiement
   */
  async getPaymentContext(
    projectId: string, 
    milestoneId?: string,
    phaseId?: string
  ): Promise<PaymentActionContext> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const context = await this.getProjectContext(projectId);
      
      // Get linked milestone if provided
      let linkedMilestone: MilestoneSummaryDTO | undefined;
      if (milestoneId) {
        const milestone = await this.fetchMilestoneById(milestoneId);
        if (milestone) {
          linkedMilestone = {
            id: milestone.id,
            title: milestone.title,
            targetDate: milestone.targetDate || '',
            completedDate: milestone.completionDate || undefined,
            status: milestone.status,
            type: 'checkpoint',
            priority: milestone.priority,
            weight: milestone.weight || 0.1,
            isCritical: milestone.priority === 'critical',
            floatDays: 0
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
    } catch (error) {
      console.error('CheckpointActionContextService.getPaymentContext failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get payment context');
    }
  }

  /**
   * Récupère le contexte pour une action d'inspection
   */
  async getInspectionContext(
    projectId: string,
    milestoneId?: string,
    phaseId?: string
  ): Promise<InspectionActionContext> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const context = await this.getProjectContext(projectId);

      // Get linked milestone if provided
      let linkedMilestone: MilestoneSummaryDTO | undefined;
      let isGateInspection = false;
      let inspectionType: 'technical' | 'quality' | 'safety' | 'regulatory' = 'technical';
      
      if (milestoneId) {
        const milestone = await this.fetchMilestoneById(milestoneId);
        if (milestone) {
          linkedMilestone = {
            id: milestone.id,
            title: milestone.title,
            targetDate: milestone.targetDate || '',
            completedDate: milestone.completionDate || undefined,
            status: milestone.status,
            type: 'checkpoint',
            priority: milestone.priority,
            weight: milestone.weight || 0.1,
            isCritical: milestone.priority === 'critical',
            floatDays: 0
          };
          
          isGateInspection = milestone.priority === 'critical';
          inspectionType = this.determineInspectionType(milestone);
        }
      }

      // Get linked phase
      const linkedPhase = phaseId 
        ? context.phases.find(p => p.id === phaseId)
        : context.currentPhase;

      // Get linked step (first pending or in-progress step of phase)
      const linkedStep = linkedPhase?.steps.find(s => 
        s.status === 'in_progress' || s.status === 'pending'
      );

      // Get pending tasks (all tasks that are not completed)
      const pendingTasks: TaskInfo[] = [];
      if (linkedPhase) {
        const phases = await this.fetchPhases(projectId) as PhaseData[];
        const fullPhase = phases.find((p: PhaseData) => p.id === linkedPhase.id);
        if (fullPhase) {
          // For now, we'll create placeholder tasks since PhaseData doesn't have steps
          pendingTasks.push({
            id: `task-${linkedPhase.id}`,
            name: `Tâches de la phase ${linkedPhase.name}`,
            status: 'in_progress',
            progress: linkedPhase.progress,
            phaseId: linkedPhase.id,
            stepId: 'step-1',
            requiresInspection: false
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
    } catch (error) {
      console.error('CheckpointActionContextService.getInspectionContext failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get inspection context');
    }
  }

  /**
   * Récupère les phases avec leurs étapes pour un projet
   */
  async getPhasesWithSteps(projectId: string): Promise<PhaseSummary[]> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const phases = await this.fetchPhases(projectId);
      return phases.map(p => this.mapPhaseToSummary(p));
    } catch (error) {
      console.error('CheckpointActionContextService.getPhasesWithSteps failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get phases with steps');
    }
  }

  /**
   * Récupère les milestones actionnables (checkpoints et gates)
   */
  async getActionableMilestones(projectId: string, phaseId?: string): Promise<MilestoneSummaryDTO[]> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      let milestones: unknown[];
      
      if (phaseId) {
        // For now, get all project milestones and filter by phase logic
        milestones = await this.fetchMilestones(projectId);
      } else {
        milestones = await this.fetchMilestones(projectId);
      }

      return (milestones as MilestoneDTO[])
        .map(m => ({
          id: m.id,
          title: m.title,
          targetDate: m.targetDate || '',
          completedDate: m.completedDate,
          status: m.status as MilestoneStatus,
          type: 'checkpoint' as MilestoneType,
          priority: m.priority as MilestonePriority,
          weight: 0.1,
          isCritical: m.priority === 'critical',
          floatDays: 0
        }));
    } catch (error) {
      console.error('CheckpointActionContextService.getActionableMilestones failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get actionable milestones');
    }
  }

  // ============= Private Helpers =============

  private async fetchProject(projectId: string): Promise<unknown> {
    try {
      const project = await RepositoryFactory.getProjectRepository().findById(projectId);
      if (!project) {
        throw new AppError(ErrorCode.NOT_FOUND, `Project ${projectId} not found`);
      }
      const p = project as unknown as Record<string, unknown>;
      return {
        id: p.id,
        title: p.title ?? p.name,
        description: p.description,
        status: p.status,
        progress: p.progress ?? 0,
        budget: p.budget,
        start_date: p.startDate ?? p.start_date,
        end_date: p.endDate ?? p.end_date,
        main_contractor: typeof p.mainContractor === 'string' ? p.mainContractor : (p.mainContractor as Record<string, unknown> | undefined)?.name,
        project_reference: p.projectReference ?? p.reference,
        allows_initial_payment: p.allowsInitialPayment ?? false,
        initial_payment_percentage: p.initialPaymentPercentage ?? 0,
      };
    } catch (error) {
      console.error('CheckpointActionContextService.fetchProject failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch project');
    }
  }

  private async fetchPhases(projectId: string): Promise<unknown[]> {
    try {
      const phases = await RepositoryFactory.getPhaseRepository().findByProjectId(projectId);
      return (phases || []).map(ph => {
        const p = ph as unknown as Record<string, unknown>;
        return {
          id: p.id,
          title: p.phaseName ?? p.name,
          status: p.status,
          progress: p.progress ?? 0,
          start_date: p.startDate ?? p.start_date,
          end_date: p.endDate ?? p.end_date,
          budget: p.estimatedCost ?? p.budget,
          actual_cost: p.actualCost ?? 0,
        };
      });
    } catch (error) {
      console.error('CheckpointActionContextService.fetchPhases failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch phases');
    }
  }

  private async fetchMilestones(projectId: string): Promise<MilestoneDTO[]> {
    try {
      const milestones = await RepositoryFactory.getMilestoneRepository().findByProjectId(projectId);
      return milestones;
    } catch (error) {
      console.error('CheckpointActionContextService.fetchMilestones failed:', error);
      return [];
    }
  }

  private async fetchMilestoneById(milestoneId: string): Promise<MilestoneData> {
    try {
      if (!milestoneId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Milestone ID is required');
      }
      const milestoneDTO = await RepositoryFactory.getMilestoneRepository().findById(milestoneId);
      if (milestoneDTO) {
        return {
          id: milestoneDTO.id,
          title: milestoneDTO.title,
          targetDate: milestoneDTO.targetDate || '',
          completionDate: milestoneDTO.completedDate || undefined,
          status: milestoneDTO.status,
          priority: milestoneDTO.priority || 'normal',
          progressPercentage: 0,
          weight: milestoneDTO.weight || 0.5,
          type: milestoneDTO.type || 'checkpoint',
          tags: [],
        };
      }
      throw new AppError(ErrorCode.NOT_FOUND, `Milestone ${milestoneId} not found`);
    } catch (error) {
      console.error('CheckpointActionContextService.fetchMilestoneById failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch milestone by ID');
    }
  }

  private async fetchPayments(projectId: string): Promise<unknown[]> {
    try {
      const payments = await RepositoryFactory.getPaymentRepository().findByProjectId(projectId);
      return (payments || []).map(p => {
        const pp = p as unknown as Record<string, unknown>;
        return {
          id: pp.id,
          amount: pp.amount,
          payment_date: pp.paymentDate ?? pp.payment_date,
          contractor_id: pp.contractorId ?? pp.supplierId ?? pp.contractor_id,
          contractor_name: pp.contractorName ?? pp.supplierName,
          contractor_contact: pp.contractorContact ?? pp.supplierContact,
        };
      });
    } catch (error) {
      console.error('CheckpointActionContextService.fetchPayments failed:', error);
      return [];
    }
  }

  private async fetchInspections(projectId: string): Promise<unknown[]> {
    try {
      const inspections = await RepositoryFactory.getInspectionRepository().findByProjectId(projectId);
      return (inspections || []).map(i => {
        const ii = i as unknown as Record<string, unknown>;
        return {
          id: ii.id,
          date: ii.scheduledDate ?? ii.executionDate ?? ii.date,
          status: ii.status,
          inspector: ii.inspectorName ?? ii.inspectorId,
          progress_at_inspection: ii.progressAtInspection ?? 0,
          phase_id: ii.phaseId,
        };
      });
    } catch (error) {
      console.error('CheckpointActionContextService.fetchInspections failed:', error);
      return [];
    }
  }

  private async fetchMainContractor(projectId: string): Promise<ContractorInfo | undefined> {
    try {
      const project = await RepositoryFactory.getProjectRepository().findById(projectId);
      if (!project) return undefined;
      const mc = (project as unknown as Record<string, unknown>).mainContractor;
      if (!mc) return undefined;
      if (typeof mc === 'string') {
        const supplier = await RepositoryFactory.getSupplierRepository().findById(mc).catch(() => null);
        if (supplier) {
          const s = supplier as unknown as Record<string, unknown>;
          return {
            id: String(s.id),
            name: String(s.name ?? s.companyName ?? ''),
            contact: String(s.email ?? s.contact ?? ''),
            company: String(s.companyName ?? s.name ?? ''),
          };
        }
        return { id: mc, name: mc, contact: '', company: mc };
      }
      const s = mc as Record<string, unknown>;
      return {
        id: String(s.id ?? ''),
        name: String(s.name ?? ''),
        contact: String(s.contact ?? s.email ?? ''),
        company: String(s.company ?? s.name ?? ''),
      };
    } catch (error) {
      console.error('CheckpointActionContextService.fetchMainContractor failed:', error);
      return undefined;
    }
  }


  private mapPhaseToSummary(phase: unknown): PhaseSummary {
    const phaseData = phase as Record<string, unknown>;
    return {
      id: phaseData.id as string,
      name: (phaseData.title as string) || (phaseData.phase_name as string) || (phaseData.name as string),
      status: phaseData.status as string,
      progress: phaseData.progress as number,
      startDate: (phaseData.startDate as string) || (phaseData.start_date as string),
      endDate: (phaseData.endDate as string) || (phaseData.end_date as string),
      estimatedCost: (phaseData.budget as number) || (phaseData.estimated_cost as number),
      actualCost: (phaseData.actualCost as number) || (phaseData.actual_cost as number),
      steps: [] // For now, empty steps since PhaseData doesn't have steps
    };
  }

  private determineInspectionType(milestone: unknown): 'technical' | 'quality' | 'safety' | 'regulatory' {
    const milestoneData = milestone as Record<string, unknown>;
    const titleLower = (milestoneData.title as string).toLowerCase();
    const descLower = ((milestoneData.description as string) || '').toLowerCase();
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

// Factory function to create a service instance
let serviceInstance: CheckpointActionContextService | null = null;

export function getCheckpointActionContextService(): CheckpointActionContextService {
  if (!serviceInstance) {
    serviceInstance = new CheckpointActionContextService();
  }
  return serviceInstance;
}
