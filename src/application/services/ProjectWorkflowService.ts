/**
 * Service: ProjectWorkflowService
 * Gère les workflows de création et modification de projets
 * Following hexagonal architecture and PROMPT.md rules
 */

import { Project } from '@/domain/entities/Project';
import type { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import type { IPhaseRepository } from '@/domain/repositories/IPhaseRepository';
import type { IRiskRepository } from '@/domain/repositories/IRiskRepository';
import type { IProjectStakeholderRepository } from '@/domain/repositories/IProjectStakeholderRepository';
import { WorkflowStep, WorkflowState, WorkflowTransition, ProjectWorkflowData } from '@/dtos/workflows/ProjectWorkflowDTOs';
import { ProjectDTO, CreateProjectDTO, UpdateProjectDTO } from '@/dtos/entities/ProjectDTO';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { v4 as uuidv4 } from 'uuid';
import { Risk, RiskStatus } from '@/domain/entities/Risk';
import { ProjectTransformer } from '@/dtos/transforms/ProjectTransformer';

export enum WorkflowMode {
  CREATE = 'create',
  EDIT = 'edit',
  COMPLETE = 'complete',
  CANCEL = 'cancel'
}

export class ProjectWorkflowService {
  constructor(
    private projectRepository: IProjectRepository,
    private phaseRepository: IPhaseRepository,
    private riskRepository: IRiskRepository,
    private stakeholderRepository: IProjectStakeholderRepository
  ) {}

  getWorkflowSteps(): WorkflowStep[] {
    return [
      { id: 'project-info', name: 'project_info', title: 'Informations du projet', description: '', order: 1, isCompleted: false, isRequired: true, validation: { rules: [], requiredFields: [] } },
      { id: 'stakeholders', name: 'stakeholders', title: 'Parties prenantes', description: '', order: 2, isCompleted: false, isRequired: true, validation: { rules: [], requiredFields: [] } },
      { id: 'phases', name: 'phases', title: 'Phases', description: '', order: 3, isCompleted: false, isRequired: true, validation: { rules: [], requiredFields: [] } },
      { id: 'risks', name: 'risks', title: 'Risques', description: '', order: 4, isCompleted: false, isRequired: false, validation: { rules: [], requiredFields: [] } },
      { id: 'location', name: 'location', title: 'Localisation', description: '', order: 5, isCompleted: false, isRequired: true, validation: { rules: [], requiredFields: [] } },
      { id: 'documents', name: 'documents', title: 'Documents', description: '', order: 6, isCompleted: false, isRequired: false, validation: { rules: [], requiredFields: [] } },
      { id: 'review', name: 'review', title: 'Révision', description: '', order: 7, isCompleted: false, isRequired: true, validation: { rules: [], requiredFields: [] } }
    ];
  }

  getEditWorkflowSteps(): WorkflowStep[] {
    return this.getWorkflowSteps();
  }

  getWorkflowStep(order: number): WorkflowStep | undefined {
    return this.getWorkflowSteps().find(s => s.order === order);
  }

  async initializeEditWorkflow(projectId: string): Promise<WorkflowState> {
    try {
      const project = await this.projectRepository.findById(projectId);
      if (!project) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
      }
      
      const projectDTO = ProjectTransformer.toDTO(project);
      
      return {
        currentStep: 'project-info',
        completedSteps: [],
        availableTransitions: this.getAvailableTransitions('project-info'),
        validation: {
          isValid: true,
          errors: []
        }
      };
    } catch (error) {
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to initialize workflow');
    }
  }

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
          status: "planifié" as const,
          thumbnail: projectData.thumbnail || '',
          progress: 0,
          teamSize: projectData.teamSize || 1,
          // Additional fields for complete database storage
          financingSource: projectData.financingSource,
          marketType: projectData.marketType,
          selectionMode: projectData.selectionMode,
          projectReference: projectData.projectReference,
          mainContractor: projectData.mainContractor,
          allowsInitialPayment: projectData.allowsInitialPayment,
          initialPaymentPercentage: projectData.initialPaymentPercentage,
          currentPhase: projectData.currentPhase,
          currentStage: projectData.currentStage,
          coordinates: projectData.coordinates
        };

        const projectEntity = ProjectTransformer.fromCreateDTOToEntity(createRequest);
        const createdProject = await this.projectRepository.create(projectEntity);
        savedProjectId = createdProject.id;
      } else if (savedProjectId) {
        // Update existing project with all fields
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
          // Additional fields for complete database storage
          financingSource: projectData.financingSource,
          marketType: projectData.marketType,
          selectionMode: projectData.selectionMode,
          projectReference: projectData.projectReference,
          mainContractor: projectData.mainContractor,
          allowsInitialPayment: projectData.allowsInitialPayment,
          initialPaymentPercentage: projectData.initialPaymentPercentage,
          currentPhase: projectData.currentPhase,
          currentStage: projectData.currentStage,
          coordinates: projectData.coordinates
        };

        const projectEntity = ProjectTransformer.fromUpdateDTOToEntity(updateRequest);
        await this.projectRepository.update(savedProjectId, projectEntity);
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

  async completeWorkflow(data: any): Promise<any> {
    return { ...data, status: 'completed', completedAt: new Date().toISOString() };
  }

  calculateProgress(completedSteps: number, totalSteps: number = 7): number {
    return Math.round((completedSteps / totalSteps) * 100);
  }

  canProceedToNextStep(currentStep: number, stepData: ProjectWorkflowData): boolean {
    return true;
  }

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

  async createProject(data: ProjectWorkflowData): Promise<ProjectDTO> {
    const projectData = data.projectData;
    
    // Create project entity with all fields for complete database storage
    const projectEntity: Partial<Project> = {
      title: projectData?.title || 'New Project',
      description: projectData?.description,
      status: 'planifié' as any,
      location: projectData?.location,
      budget: projectData?.budget || 0,
      progress: 0,
      startDate: projectData?.startDate ? new Date(projectData.startDate) : null,
      endDate: projectData?.endDate ? new Date(projectData.endDate) : null,
      teamSize: projectData?.teamSize || 1,
      thumbnail: projectData?.thumbnail,
      // Additional fields for complete database storage
      financingSource: projectData?.financingSource,
      marketType: projectData?.marketType,
      selectionMode: projectData?.selectionMode,
      projectReferenceNumber: projectData?.projectReference,
      mainContractor: typeof projectData?.mainContractor === 'string' 
        ? projectData.mainContractor 
        : projectData?.mainContractor?.name || '',
      allowsInitialPayment: projectData?.allowsInitialPayment,
      initialAdvancePercentage: projectData?.initialPaymentPercentage,
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
