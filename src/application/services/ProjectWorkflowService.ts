/**
 * Service: ProjectWorkflowService
 * Gère les workflows de création et modification de projets
 * Following hexagonal architecture and PROMPT.md rules
 * 
 * Hexagonal Flow:
 * UI Component → Transformer → DTO (camelCase) → Service → Domain ← API(call supabase)(snake_case) → DB
 */

import { Project } from '@/domain/entities/Project';
import type { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import type { IPhaseRepository } from '@/domain/repositories/IPhaseRepository';
import type { IRiskRepository } from '@/domain/repositories/IRiskRepository';
import type { IProjectStakeholderRepository } from '@/domain/repositories/IProjectStakeholderRepository';
import { WorkflowStep, WorkflowState, WorkflowTransition, ProjectWorkflowData, ValidationResult, SaveResult } from '@/dtos/workflows/ProjectWorkflowDTOs';
import { ProjectDTO, CreateProjectDTO, UpdateProjectDTO } from '@/dtos/entities/ProjectDTO';
import { PhaseDTO, PhaseStatus, PhaseType, PhasePriority } from '@/dtos/entities/PhaseDTO';
import { RiskStatus } from '@/dtos/entities/RiskDTO';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { ProjectTransformer } from '@/dtos/transforms/ProjectTransformer';
import { ReferentialService, ProjectPhaseDTO } from './ReferentialService';
import { ReferentialType } from '@/config/referentials';

export enum WorkflowMode {
  CREATE = 'create',
  EDIT = 'edit',
  COMPLETE = 'complete',
  CANCEL = 'cancel'
}

// Export types for hooks
export interface ProjectCreationWorkflowData extends ProjectWorkflowData {
  referentialCode?: ReferentialType;
}

export interface WorkflowResult {
  success: boolean;
  projectId?: string;
  data?: ProjectDTO;
  errors?: string[];
  warnings?: string[];
}

export class ProjectWorkflowService {
  private referentialService: ReferentialService;

  constructor(
    private projectRepository: IProjectRepository,
    private phaseRepository: IPhaseRepository,
    private riskRepository: IRiskRepository,
    private stakeholderRepository: IProjectStakeholderRepository
  ) {
    this.referentialService = ReferentialService.getInstance();
  }

  // =================== WORKFLOW INITIALIZATION ===================

  initializeWorkflow(mode: 'creation' | 'edit'): { mode: string; currentStep: number; totalSteps: number } {
    return {
      mode,
      currentStep: 1,
      totalSteps: 9
    };
  }

  getWorkflowSteps(): WorkflowStep[] {
    return [
      { id: 'project-info', name: 'project_info', title: 'Informations du projet', description: 'Type, budget, dates, référence', order: 1, isCompleted: false, isRequired: true, validation: { rules: ['title_required', 'budget_positive'], requiredFields: ['title', 'description', 'budget'] } },
      { id: 'stakeholders', name: 'stakeholders', title: 'Parties prenantes', description: 'Bailleurs, Ministères, Entreprises', order: 2, isCompleted: false, isRequired: true, validation: { rules: [], requiredFields: ['projectManagerId'] } },
      { id: 'location', name: 'location', title: 'Localisation', description: 'Géolocalisation interactive', order: 3, isCompleted: false, isRequired: true, validation: { rules: [], requiredFields: ['location'] } },
      { id: 'phases', name: 'phases', title: 'Planification WBS', description: 'Phase → Step → Task', order: 4, isCompleted: false, isRequired: true, validation: { rules: [], requiredFields: [] } },
      { id: 'risks', name: 'risks', title: 'Risques', description: 'Analyse et gestion des risques', order: 5, isCompleted: false, isRequired: false, validation: { rules: [], requiredFields: [] } },
      { id: 'compliance', name: 'compliance', title: 'Conformité', description: 'Standards SOMELEC et bailleurs', order: 6, isCompleted: false, isRequired: false, validation: { rules: [], requiredFields: [] } },
      { id: 'review', name: 'review', title: 'Validation', description: 'Réception définitive et clôture', order: 7, isCompleted: false, isRequired: true, validation: { rules: [], requiredFields: [] } }
    ];
  }

  getEditWorkflowSteps(): WorkflowStep[] {
    return this.getWorkflowSteps();
  }

  getWorkflowStep(order: number): WorkflowStep | undefined {
    return this.getWorkflowSteps().find(s => s.order === order);
  }

  // =================== WORKFLOW STATE MANAGEMENT ===================

  async initializeEditWorkflow(projectId: string): Promise<WorkflowState> {
    try {
      const project = await this.projectRepository.findById(projectId);
      if (!project) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
      }
      
      return {
        currentStep: 'project-info',
        completedSteps: [],
        availableTransitions: this.getAvailableTransitions('project-info'),
        validation: { isValid: true, errors: [] }
      };
    } catch (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to initialize workflow');
    }
  }

  // =================== STEP VALIDATION ===================

  async validateStep(stepNumber: number, data: Partial<ProjectWorkflowData>): Promise<ValidationResult & { warnings?: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const step = this.getWorkflowStep(stepNumber);

    if (!step) {
      return { isValid: false, errors: ['Invalid step number'], warnings: [] };
    }

    // Validate required fields
    const requiredFields = step.validation?.requiredFields || [];
    for (const field of requiredFields) {
      const value = this.getNestedValue(data, field);
      if (value === undefined || value === null || value === '') {
        errors.push(`Le champ "${field}" est obligatoire`);
      }
    }

    // Validate referential if specified
    if (data.projectData?.projectReference) {
      const referential = await this.referentialService.getReferential(
        data.projectData.projectReference as ReferentialType
      );
      if (!referential) {
        warnings.push(`Le référentiel "${data.projectData.projectReference}" n'existe pas. Utilisation des paramètres par défaut.`);
      }
    }

    // Step-specific validations
    switch (stepNumber) {
      case 1: // Project Info
        if (data.projectData?.budget && data.projectData.budget <= 0) {
          warnings.push('Le budget devrait être supérieur à 0');
        }
        if (data.projectData?.startDate && data.projectData?.endDate) {
          const start = new Date(data.projectData.startDate);
          const end = new Date(data.projectData.endDate);
          if (end < start) {
            errors.push('La date de fin doit être après la date de début');
          }
        }
        break;
      case 4: // Phases
        if (!data.relatedData?.phases || data.relatedData.phases.length === 0) {
          warnings.push('Aucune phase définie. Considérez d\'utiliser un référentiel pour générer les phases.');
        }
        break;
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }

  // =================== STEP SAVE ===================

  async saveStep(stepNumber: number, data: ProjectWorkflowData, context: any): Promise<SaveResult & { projectId?: string }> {
    try {
      // Validate step first
      const validation = await this.validateStep(stepNumber, data);
      if (!validation.isValid) {
        return { success: false, errors: validation.errors, warnings: validation.warnings };
      }

      const result = await this.saveWorkflowData(data);
      
      return {
        success: true,
        projectId: result.projectId,
        data: result,
        warnings: validation.warnings
      };
    } catch (error) {
      console.error('Step save error:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  // =================== WORKFLOW DATA PERSISTENCE ===================

  async saveWorkflowData(data: ProjectWorkflowData): Promise<ProjectWorkflowData> {
    try {
      const projectData = data.projectData;
      let savedProjectId = projectData?.id;

      if (!savedProjectId && projectData?.title) {
        // Create new project with all fields
        const createRequest: CreateProjectDTO = {
          title: projectData.title,
          description: projectData.description || '',
          location: projectData.location || '',
          budget: projectData.budget || 0,
          startDate: projectData.startDate || new Date().toISOString().split('T')[0],
          endDate: projectData.endDate,
          status: 'planifie' as const,
          thumbnail: projectData.thumbnail || '',
          teamSize: projectData.teamSize || 1,
          financingSource: projectData.financingSource,
          marketType: projectData.marketType,
          selectionMode: projectData.selectionMode,
          projectReference: projectData.projectReference,
          mainContractor: typeof projectData.mainContractor === 'string' 
            ? projectData.mainContractor 
            : (projectData.mainContractor as any)?.name || '',
          allowsInitialPayment: projectData.allowsInitialPayment as boolean | undefined,
          initialPaymentPercentage: projectData.initialPaymentPercentage as number | undefined,
          currentPhase: projectData.currentPhase,
          currentStage: projectData.currentStage,
          coordinates: projectData.coordinates
        };

        const projectEntity = ProjectTransformer.fromCreateDTOToEntity(createRequest);
        const createdProject = await this.projectRepository.create(projectEntity);
        savedProjectId = createdProject.id;

        // If referential is specified, generate phases from it
        if (projectData.projectReference) {
          await this.generatePhasesFromReferential(
            savedProjectId,
            projectData.projectReference as ReferentialType
          );
        }
      } else if (savedProjectId) {
        // Update existing project
        const updateRequest: UpdateProjectDTO = {
          id: savedProjectId,
          title: projectData.title,
          description: projectData.description,
          location: projectData.location,
          budget: projectData.budget,
          startDate: projectData.startDate,
          endDate: projectData.endDate,
          teamSize: projectData.teamSize,
          thumbnail: projectData.thumbnail,
        };

        const projectEntity = ProjectTransformer.fromUpdateDTOToEntity(updateRequest);
        await this.projectRepository.update(savedProjectId, projectEntity);
      }

      // Save related data
      if (savedProjectId && data.relatedData) {
        await this.saveRelatedData(savedProjectId, data.relatedData);
      }

      return {
        ...data,
        projectId: savedProjectId,
        metadata: {
          ...data.metadata,
          lastSavedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to save workflow data');
    }
  }

  private async saveRelatedData(projectId: string, relatedData: any): Promise<void> {
    // Save phases if provided
    if (relatedData.phases && relatedData.phases.length > 0) {
      for (const phase of relatedData.phases) {
        const phaseEntity = {
          ...phase,
          projectId,
          status: phase.status || PhaseStatus.PENDING
        };
        await this.phaseRepository.create(phaseEntity as any);
      }
    }

    // Save risks if provided - using repository save method
    if (relatedData.risks && relatedData.risks.length > 0) {
      for (const risk of relatedData.risks) {
        const riskEntity = {
          ...risk,
          projectId,
          status: risk.status || RiskStatus.IDENTIFIED
        };
        await this.riskRepository.save(riskEntity as any);
      }
    }
  }

  // =================== REFERENTIAL INTEGRATION ===================

  async generatePhasesFromReferential(projectId: string, referentialCode: ReferentialType): Promise<PhaseDTO[]> {
    try {
      const phases = await this.referentialService.convertToProjectPhases(referentialCode, projectId);
      
      const createdPhases: PhaseDTO[] = [];
      for (const phaseData of phases) {
        const phaseEntity = {
          projectId,
          name: phaseData.name,
          description: phaseData.description,
          orderIndex: phaseData.phase_number,
          status: PhaseStatus.PENDING,
          type: PhaseType.STRUCTURAL,
          priority: PhasePriority.MEDIUM,
          progress: 0
        };
        
        const created = await this.phaseRepository.create(phaseEntity as any);
        createdPhases.push({
          id: created.id,
          projectId,
          name: phaseData.name,
          description: phaseData.description,
          status: PhaseStatus.PENDING,
          type: PhaseType.STRUCTURAL,
          priority: PhasePriority.MEDIUM,
          progress: 0,
          startDate: phaseData.start_date || undefined,
          endDate: phaseData.end_date || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as PhaseDTO);
      }
      
      return createdPhases;
    } catch (error) {
      console.error('Failed to generate phases from referential:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to generate phases from referential: ${referentialCode}`);
    }
  }

  async getReferentialOptions(): Promise<{ value: string; label: string; description?: string }[]> {
    return this.referentialService.getReferentialOptions();
  }

  // =================== WORKFLOW COMPLETION ===================

  async completeWorkflow(data: any): Promise<any> {
    try {
      if (data.projectId || data.projectData?.id) {
        const projectId = data.projectId || data.projectData?.id;
        await this.projectRepository.update(projectId, { status: 'en_cours' } as any);
      }
      
      return { 
        ...data, 
        status: 'completed', 
        completedAt: new Date().toISOString() 
      };
    } catch (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to complete workflow');
    }
  }

  // =================== PROGRESS MANAGEMENT ===================

  calculateProgress(completedSteps: number, totalSteps: number = 7): number {
    return Math.round((completedSteps / totalSteps) * 100);
  }

  async calculateProjectProgress(projectId: string): Promise<number> {
    try {
      const phases = await this.phaseRepository.findByProjectId(projectId);
      if (!phases || phases.length === 0) return 0;
      
      const totalProgress = phases.reduce((sum, phase) => sum + (phase.progress || 0), 0);
      return Math.round(totalProgress / phases.length);
    } catch (error) {
      console.error('Failed to calculate project progress:', error);
      return 0;
    }
  }

  canProceedToNextStep(currentStep: number, stepData: ProjectWorkflowData): boolean {
    return true;
  }

  // =================== TRANSITIONS ===================

  private getAvailableTransitions(currentStepId: string): WorkflowTransition[] {
    const steps = this.getWorkflowSteps();
    const currentStep = steps.find(s => s.id === currentStepId);
    
    if (!currentStep) return [];
    
    const nextStep = steps.find(s => s.order === currentStep.order + 1);
    
    if (!nextStep) return [];
    
    return [{
      fromStep: currentStepId,
      toStep: nextStep.id,
      condition: 'step_completed',
      action: 'proceed_to_next'
    }];
  }

  // =================== PROJECT CREATION ===================

  async createProject(data: ProjectWorkflowData): Promise<ProjectDTO> {
    const projectData = data.projectData;
    
    const projectEntity: Partial<Project> = {
      title: projectData?.title || 'New Project',
      description: projectData?.description,
      status: 'planifie' as any,
      location: projectData?.location,
      budget: projectData?.budget || 0,
      progress: 0,
      startDate: projectData?.startDate ? new Date(projectData.startDate) : null,
      endDate: projectData?.endDate ? new Date(projectData.endDate) : null,
      teamSize: projectData?.teamSize || 1,
      thumbnail: projectData?.thumbnail,
      financingSource: projectData?.financingSource,
      mainContractor: typeof projectData?.mainContractor === 'string' 
        ? projectData.mainContractor 
        : (projectData?.mainContractor as any)?.name || '',
      allowsInitialPayment: projectData?.allowsInitialPayment as boolean | undefined,
      initialAdvancePercentage: projectData?.initialPaymentPercentage as number | undefined,
      currentPhase: projectData?.currentPhase,
      currentStage: projectData?.currentStage
    };

    const created = await this.projectRepository.create(projectEntity);
    return ProjectTransformer.toDTO(created);
  }
}

export function createProjectWorkflowService(
  projectRepo: IProjectRepository,
  phaseRepo: IPhaseRepository,
  riskRepo: IRiskRepository,
  stakeholderRepo: IProjectStakeholderRepository
) {
  return new ProjectWorkflowService(projectRepo, phaseRepo, riskRepo, stakeholderRepo);
}
