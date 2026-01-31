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
import { MilestoneDTO, MilestoneSummaryDTO, MilestoneType, MilestonePriority, MilestoneStatus } from '@/types/milestone-dto';
import { PhaseDTO, PhaseSummaryDTO, PhaseStepDTO, PhaseTaskDTO } from '@/types/phase-dto';
import { Milestone } from '@/domain/entities/Milestone';

// Type definitions for better type safety
interface ProjectData {
  id: string;
  title: string;
  description?: string;
  status: string;
  progress: number;
  budget: number;
  start_date: string;
  end_date?: string;
  main_contractor?: string;
  project_reference?: string;
  allows_initial_payment?: boolean;
  initial_payment_percentage?: number;
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
  progress_at_inspection: number;
  phase_id: string;
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
      const milestonesSummary = milestones.map((m: MilestoneDTO) => ({
        id: m.id,
        title: m.title,
        target_date: m.target_date || '',
        actual_completion_date: m.completed_date || undefined,
        status: m.status,
        type: m.type || 'checkpoint',
        priority: m.priority || 'normal',
        weight: m.weight || 0.5,
        is_critical: m.priority === 'critical',
        float_days: 0,
        completed_date: m.completed_date || undefined
      } as MilestoneSummaryDTO));

      const checkpoints = milestonesSummary.filter((m: MilestoneSummaryDTO) => m.type === 'checkpoint' || m.type === 'gate');
      const completedCheckpoints = checkpoints.filter((m: MilestoneSummaryDTO) => m.status === 'completed');

      // Latest inspection
      const latestInspection = inspections.length > 0 ? {
        id: (inspections[0] as InspectionData).id,
        date: (inspections[0] as InspectionData).date,
        status: (inspections[0] as InspectionData).status,
        inspector: (inspections[0] as InspectionData).inspector,
        progressAtInspection: (inspections[0] as InspectionData).progress_at_inspection,
        phaseId: (inspections[0] as InspectionData).phase_id
      } : undefined;

      return {
        project: {
          id: projectData.id,
          title: projectData.title,
          description: projectData.description || undefined,
          status: projectData.status,
          progress: projectData.progress,
          budget: projectData.budget,
          startDate: projectData.start_date,
          endDate: projectData.end_date || undefined,
          mainContractor: projectData.main_contractor || undefined,
          projectReference: projectData.project_reference || undefined,
          allowsInitialPayment: projectData.allows_initial_payment ?? undefined,
          initialPaymentPercentage: projectData.initial_payment_percentage ?? undefined
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
          progressAtInspection: (inspections[0] as InspectionData).progress_at_inspection,
          phaseId: (inspections[0] as InspectionData).phase_id || undefined
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
            target_date: milestone.targetDate || '',
            completed_date: milestone.completionDate || undefined,
            status: milestone.status,
            type: 'checkpoint',
            priority: milestone.priority,
            weight: milestone.weight || 0.1,
            is_critical: milestone.priority === 'critical',
            float_days: 0
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
            target_date: milestone.targetDate || '',
            completed_date: milestone.completionDate || undefined,
            status: milestone.status,
            type: 'checkpoint',
            priority: milestone.priority,
            weight: milestone.weight || 0.1,
            is_critical: milestone.priority === 'critical',
            float_days: 0
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

      return milestones
        .map(m => ({
          id: (m as { id: string }).id,
          title: (m as { title: string }).title,
          target_date: (m as { target_date: string }).target_date,
          completed_date: (m as { actual_completion_date?: string }).actual_completion_date,
          status: (m as { status: MilestoneStatus }).status as MilestoneStatus,
          type: 'checkpoint' as MilestoneType,
          priority: (m as { priority: MilestonePriority }).priority as MilestonePriority,
          weight: 0.1,
          is_critical: (m as { priority: MilestonePriority }).priority === 'critical',
          float_days: 0
        }));
    } catch (error) {
      console.error('CheckpointActionContextService.getActionableMilestones failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get actionable milestones');
    }
  }

  // ============= Private Helpers =============

  private async fetchProject(projectId: string): Promise<unknown> {
    try {
      // For now, return mock data as project repository is not available
      // TODO: Implement proper project retrieval when project repository is available
      console.warn('CheckpointActionContextService.fetchProject: Project repository not available');
      
      return {
        id: projectId,
        title: 'Projet Test',
        description: 'Description du projet',
        status: 'in_progress',
        progress: 75,
        budget: 1000000,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        main_contractor: 'Entreprise Test',
        project_reference: 'REF-001',
        allows_initial_payment: true,
        initial_payment_percentage: 10
      };
    } catch (error) {
      console.error('CheckpointActionContextService.fetchProject failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch project');
    }
  }

  private async fetchPhases(projectId: string): Promise<unknown[]> {
    try {
      // For now, return mock data as phase repository is not available
      // TODO: Implement proper phase retrieval when phase repository is available
      console.warn('CheckpointActionContextService.fetchPhases: Phase repository not available');
      
      return [
        {
          id: 'phase-1',
          title: 'Phase 1',
          status: 'completed',
          progress: 100,
          start_date: '2024-01-01',
          end_date: '2024-03-31',
          budget: 300000,
          actual_cost: 280000
        },
        {
          id: 'phase-2',
          title: 'Phase 2',
          status: 'in_progress',
          progress: 60,
          start_date: '2024-04-01',
          end_date: '2024-06-30',
          budget: 400000,
          actual_cost: 240000
        }
      ];
    } catch (error) {
      console.error('CheckpointActionContextService.fetchPhases failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch phases');
    }
  }

  private async fetchMilestones(projectId: string): Promise<MilestoneDTO[]> {
    try {
      // Use milestone repository with proper typing - returns MilestoneDTO[]
      const milestoneRepository = RepositoryFactory.getMilestoneRepository();
      const milestones = await milestoneRepository.findByProjectId(projectId);
      
      return milestones;
    } catch (error) {
      console.error('CheckpointActionContextService.fetchMilestones failed:', error);
      // Fallback to mock data with MilestoneDTO structure
      return [
        {
          id: 'milestone-1',
          project_id: projectId,
          title: 'Milestone 1',
          description: 'First project milestone',
          target_date: '2024-03-31T00:00:00.000Z',
          completed_date: '2024-03-30T00:00:00.000Z',
          status: 'completed' as MilestoneStatus,
          type: 'gate' as MilestoneType,
          priority: 'high' as MilestonePriority,
          weight: 0.3,
          notes: '',
          is_from_template: false,
          dependencies: [],
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-03-30T00:00:00.000Z'
        },
        {
          id: 'milestone-2',
          project_id: projectId,
          title: 'Milestone 2',
          description: 'Second project milestone',
          target_date: '2024-06-30T00:00:00.000Z',
          completed_date: undefined,
          status: 'pending' as MilestoneStatus,
          type: 'checkpoint' as MilestoneType,
          priority: 'critical' as MilestonePriority,
          weight: 0.4,
          notes: '',
          is_from_template: false,
          dependencies: ['milestone-1'],
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z'
        }
      ];
    }
  }

  private async fetchMilestoneById(milestoneId: string): Promise<MilestoneData> {
    try {
      if (!milestoneId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Milestone ID is required');
      }

      // Use milestone repository with proper typing - returns MilestoneDTO
      const milestoneRepository = RepositoryFactory.getMilestoneRepository();
      const milestoneDTO = await milestoneRepository.findById(milestoneId);
      
      if (milestoneDTO) {
        // Convert MilestoneDTO to internal MilestoneData
        return {
          id: milestoneDTO.id,
          title: milestoneDTO.title,
          targetDate: milestoneDTO.target_date || '',
          completionDate: milestoneDTO.completed_date || undefined,
          status: milestoneDTO.status,
          priority: milestoneDTO.priority || 'normal',
          progressPercentage: 0, // MilestoneDTO doesn't have direct progress
          weight: milestoneDTO.weight || 0.5,
          type: milestoneDTO.type || 'checkpoint',
          tags: []
        };
      }

      // Fallback to default data
      return {
        id: milestoneId,
        title: 'Milestone',
        targetDate: new Date().toISOString(),
        status: 'pending',
        priority: 'normal',
        progressPercentage: 0,
        weight: 0.5,
        type: 'checkpoint',
        tags: []
      };
    } catch (error) {
      console.error('CheckpointActionContextService.fetchMilestoneById failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch milestone by ID');
    }
  }

  private async fetchPayments(projectId: string): Promise<unknown[]> {
    try {
      // For now, return mock data as payment repository is not available
      // TODO: Implement proper payment retrieval when payment repository is available
      console.warn('CheckpointActionContextService.fetchPayments: Payment repository not available');
      
      return [
        {
          id: 'payment-1',
          amount: 100000,
          payment_date: '2024-03-15',
          contractor_id: 'contractor-1',
          contractor_name: 'Entreprise Test',
          contractor_contact: 'contact@test.com'
        }
      ];
    } catch (error) {
      console.error('CheckpointActionContextService.fetchPayments failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch payments');
    }
  }

  private async fetchInspections(projectId: string): Promise<unknown[]> {
    try {
      // For now, return mock data as inspection repository is not available
      // TODO: Implement proper inspection retrieval when inspection repository is available
      console.warn('CheckpointActionContextService.fetchInspections: Inspection repository not available');
      
      return [
        {
          id: 'inspection-1',
          date: '2024-03-10',
          status: 'approved',
          inspector: 'Inspecteur Principal',
          progress_at_inspection: 85,
          phase_id: 'phase-1'
        }
      ];
    } catch (error) {
      console.error('CheckpointActionContextService.fetchInspections failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch inspections');
    }
  }

  private async fetchMainContractor(projectId: string): Promise<ContractorInfo | undefined> {
    try {
      // For now, return mock data as supplier repository is not available
      // TODO: Implement proper contractor retrieval when supplier repository is available
      console.warn('CheckpointActionContextService.fetchMainContractor: Supplier repository not available');
      
      return {
        id: 'contractor-1',
        name: 'Entreprise Test',
        contact: 'contact@test.com',
        company: 'Entreprise Test SARL'
      };
    } catch (error) {
      console.error('CheckpointActionContextService.fetchMainContractor failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch main contractor');
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
