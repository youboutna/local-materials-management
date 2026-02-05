/**
 * Service: ProjectWorkflowService
 * Gère les workflows de création et modification de projets avec sauvegarde partielle par étapes
 * Architecture hexagonale pour les workflows multi-étapes avec DTOs spécialisés
 * SIMPLIFIED VERSION - Core functionality only
 */

import { Project } from '@/domain/entities/Project';
import { ProjectStatus } from '@/domain/entities/Project';
import type { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import type { IPhaseRepository } from '@/domain/repositories/IPhaseRepository';
import type { IRiskRepository } from '@/domain/repositories/IRiskRepository';
import type { IProjectStakeholderRepository } from '@/domain/repositories/IProjectStakeholderRepository';
import { ProjectTransformer } from '@/dtos/transforms';
import { ProjectWorkflowTransforms } from '@/dtos/transforms/ProjectWorkflowTransforms';

// Import workflow DTOs (following "similitude des voisins le plus proche")
import { 
  ProjectWorkflowData, 
  StepRelatedDataDTO, 
  WorkflowMetadataDTO,
  ComplianceDataDTO,
  SaveContextDTO,
  ValidationResult,
  SaveResult,
  WorkflowStep,
  WorkflowTransition,
  WorkflowState,
  ProjectCreationWorkflowDTO,
  WorkflowTemplateDTO,
  WorkflowSessionDTO,
  WorkflowAuditLogDTO,
  WorkflowMetricsDTO,
  ProjectValidationDTO,
  StepProgressDTO
} from '@/dtos/workflows/ProjectWorkflowDTOs';

// Import entity DTOs (following "similitude des voisins le plus proche")
import { ProjectDTO } from '@/dtos/entities/ProjectDTO';
import { PhaseDTO } from '@/dtos/entities/PhaseDTO';
import { MaterialDTO, MaterialCategory } from '@/dtos/entities/MaterialDTO';
import { RiskDTO } from '@/dtos/entities/RiskDTO';
import { TaskDTO } from '@/dtos/entities/TaskDTO';
import { EmployeeDTO } from '@/dtos/entities/EmployeeDTO';
import { InspectionDTO } from '@/dtos/entities/InspectionDTO';
import { DocumentDTO } from '@/dtos/entities/DocumentDTO';

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { v4 as uuidv4 } from 'uuid';
import { Risk } from '@/domain/entities/Risk';
import { RiskStatus } from '@/domain/entities/Risk';

export enum WorkflowMode {
  CREATE = 'create',
  EDIT = 'edit',
  COMPLETE = 'complete',
  CANCEL = 'cancel'
}

function isWorkflowMode(mode: string): mode is WorkflowMode {
  return Object.values(WorkflowMode).includes(mode as WorkflowMode);
}

export class ProjectWorkflowService {
  constructor(
    private projectRepository: IProjectRepository,
    private phaseRepository: IPhaseRepository,
    private riskRepository: IRiskRepository,
    private stakeholderRepository: IProjectStakeholderRepository
  ) {}

  /**
   * Get workflow steps configuration
   */
  getWorkflowSteps(): WorkflowStep[] {
    return [
      {
        id: 'project-info',
        name: 'project_info',
        title: 'Informations du projet',
        description: 'Type, budget, dates, référence',
        isCompleted: false,
        isRequired: true,
        order: 1,
        validation: {
          rules: ['title_required', 'budget_positive'],
          requiredFields: ['title', 'budget']
        }
      },
      {
        id: 'stakeholders',
        name: 'stakeholders',
        title: 'Parties prenantes',
        description: 'Bailleurs, Ministères, Entreprises, Banques',
        isCompleted: false,
        isRequired: true,
        order: 2,
        validation: {
          rules: ['manager_required'],
          requiredFields: ['project_manager_id']
        }
      },
      {
        id: 'location',
        name: 'location',
        title: 'Localisation',
        description: 'Géolocalisation interactive',
        isCompleted: false,
        isRequired: true,
        order: 3,
        validation: {
          rules: ['address_required'],
          requiredFields: ['location']
        }
      },
      {
        id: 'planning',
        name: 'planning',
        title: 'Planification WBS',
        description: 'Phase → Step → Task',
        isCompleted: false,
        isRequired: true,
        order: 4,
        validation: {
          rules: [],
          requiredFields: []
        }
      },
      {
        id: 'risks',
        name: 'risks',
        title: 'Risques',
        description: 'Analyse et gestion des risques',
        isCompleted: false,
        isRequired: false,
        order: 5,
        validation: {
          rules: [],
          requiredFields: []
        }
      },
      {
        id: 'compliance',
        name: 'compliance',
        title: 'Conformité',
        description: 'Standards SOMELEC et bailleurs',
        isCompleted: false,
        isRequired: false,
        order: 6,
        validation: {
          rules: [],
          requiredFields: []
        }
      },
      {
        id: 'validation',
        name: 'validation',
        title: 'Validation',
        description: 'Réception définitive et clôture',
        isCompleted: false,
        isRequired: true,
        order: 7,
        validation: {
          rules: ['final_validation_required'],
          requiredFields: ['reception_status']
        }
      }
    ];
  }

  /**
   * Initialize edit workflow context
   */
  async initializeEditWorkflow(projectId: string): Promise<EditWorkflowContextDTO> {
    try {
      // Load current project data
      const project = await this.projectRepository.findById(projectId);
      if (!project) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
      }

      // Map project to form data
      const formData = this.mapProjectToFormData(project);

      return {
        projectId,
        currentStep: 1,
        totalSteps: this.getEditWorkflowSteps().length,
        isDraft: project.status === 'draft',
        isComplete: false,
        originalData: formData,
        modifiedFields: []
      };

    } catch (error) {
      console.error('ProjectEditWorkflowService.initializeEditWorkflow failed:', error);
      throw new AppError(
        `Failed to initialize edit workflow: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCode.DATABASE_ERROR
      );
    }
  }
  /**
   * Get a specific workflow step
   */
  getWorkflowStep(order: number): WorkflowStep | undefined {
    return this.getWorkflowSteps().find(s => s.order === order);
  }

  /**
   * Validate step data
   */
  private validateStepData(stepNumber: number, data: ProjectWorkflowDTO): ProjectWorkflowDTO['validationResult'] {
    const step = this.getWorkflowStep(stepNumber);
    if (!step) {
      return { success: false, error: { code: 'STEP_NOT_FOUND', message: `Step ${stepNumber} not found` } };
    }

    const errors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    // Apply validation rules based on step
    for (const rule of step.validationRules) {
      switch (rule) {
        case 'title_required':
          if (!data.project.title) {
            errors.push('Le titre est requis');
            fieldErrors.title = ['Le titre est requis'];
          }
          break;
        case 'budget_positive':
          if (typeof data.project.budget === 'number' && data.project.budget < 0) {
            errors.push('Le budget doit être positif');
            fieldErrors.budget = ['Le budget doit être positif'];
          }
          break;
        case 'manager_required':
          if (!data.project.project_manager_id && !data.project.technical_manager_id) {
            errors.push('Un responsable projet ou technique est requis');
          }
          break;
        case 'address_required':
          if (!data.project.address && !data.project.location) {
            errors.push('L\'adresse est requise');
            fieldErrors.address = ['L\'adresse est requise'];
          }
          break;
      }
    }

    return {
      success: errors.length === 0,
      projectId: data.project.id,
      nextStep: stepNumber + 1,
      error: errors.length > 0 ? { code: 'VALIDATION_ERROR', message: errors.join(', ') } : undefined,
      fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined
    };
  }

  /**
   * Save workflow step data using Transformer pattern
   * Flow: Service → Transformer.toSupabase → Repository → Adapter → Database
   */
  private async saveStepData(stepNumber: number, data: ProjectWorkflowDTO): Promise<ProjectWorkflowDTO> {
    try {
      // Step 3: Service validates step data
      const validation = this.validateStepData(stepNumber, data);
      if (!validation.success) {
        return { ...data, validationResult: validation };
      }

      let savedProjectId = data.project.id;

      // Step 4-6: Create or update project via Repository (Adapter handles Transformer.toSupabase)
      if (stepNumber === 1 && !data.project.id) {
        // Create new project - Transformer.fromCreateRequest is used in adapter
        const createData = {
          title: data.project.title,
          description: data.project.description,
          status: ProjectStatus.PENDING,
          location: data.project.location,
          budget: data.project.budget,
          progress: 0,
          startDate: data.project.start_date ? new Date(data.project.start_date) : null,
          endDate: data.project.end_date ? new Date(data.project.end_date) : null,
        };
        
        // Step 5: Repository calls Adapter which uses Transformer.toSupabase
        const newProject = await this.projectRepository.create(createData);
        
        // Step 7-8: Adapter returns Entity, Service converts to DTO
        savedProjectId = newProject.id;
      } else if (data.project.id) {
        // Update existing project
        await this.projectRepository.update(data.project.id, {
          title: data.project.title,
          description: data.project.description,
          updatedAt: new Date()
        });
      }

      // Step 8: Return DTO to Hook
      return {
        ...data,
        project: { ...data.project, id: savedProjectId },
        metadata: {
          ...data.metadata,
          lastSavedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('ProjectWorkflowService.saveStepData error:', error);
      return {
        ...data,
        validationResult: {
          success: false,
          projectId: data.project.id,
          nextStep: stepNumber,
          error: {
            code: 'SAVE_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      };
    }
  }

  /**
   * Save workflow data
   */
  async saveWorkflowData(data: ProjectWorkflowDTO): Promise<ProjectWorkflowDTO> {
    // Ensure required fields are present
    if (!data.project) {
      throw new Error('Project data is required');
    }

    // Set default workflow properties if not provided
    const workflowData: ProjectWorkflowDTO = {
      ...data,
      mode: data.mode || WorkflowMode.CREATE,
      currentStep: data.currentStep || 0,
      status: data.status || 'draft'
    };

    // Add type guard for workflow status
    function isWorkflowStatus(status: string): status is WorkflowMode {
      return Object.values(WorkflowMode).includes(status as WorkflowMode);
    }

    if (!isWorkflowStatus(workflowData.status)) {
      throw new Error(`Invalid workflow status: ${workflowData.status}`);
    }

    // Save workflow step data
    return this.saveStepData(workflowData.currentStep, workflowData);
  }

  /**
   * Complete the workflow and finalize project
   */
  async completeWorkflow(data: ProjectWorkflowDTO): Promise<ProjectWorkflowDTO> {
    try {
      // Validate workflow mode
      if (!isWorkflowMode(data.status)) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, `Invalid workflow status: ${data.status}`);
      }

      // Validate status transition
      if (!isValidStatusTransition(data.status as WorkflowMode, WorkflowMode.COMPLETE)) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          `Invalid status transition from ${data.status} to complete`
        );
      }

      // Validate all required steps are complete
      const requiredSteps = this.getWorkflowSteps().filter(step => step.isRequired);
      const completedSteps = data.completedSteps || [];
      const missingSteps = requiredSteps.filter(
        step => !completedSteps.includes(step.stepNumber)
      );

      if (missingSteps.length > 0) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          `Missing required steps: ${missingSteps.map(s => s.title).join(', ')}`
        );
      }

      return {
        ...data,
        status: 'completed',
        completedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('ProjectWorkflowService.completeWorkflow failed:', error);
      throw error instanceof AppError 
        ? error 
        : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to complete workflow');
    }
  }

  /**
   * Get workflow progress percentage
   */
  calculateProgress(completedSteps: number, totalSteps: number = 7): number {
    return Math.round((completedSteps / totalSteps) * 100);
  }

  /**
   * Check if step can proceed to next
   */
  canProceedToNextStep(currentStep: number, stepData: Record<string, unknown>): boolean {
    const step = this.getWorkflowStep(currentStep);
    if (!step) return false;

    const validation = this.validateStepData(currentStep, { project: stepData } as ProjectWorkflowDTO);
    return validation.success;
  }

  /**
   * Convert ProjectWorkflowDTO to ProjectDTO
   */
  private convertFormDataToProjectDTO(formData: ProjectWorkflowDTO): ProjectDTO {
    return {
      id: uuidv4(),
      title: formData.project.title,
      description: formData.project.description,
      location: formData.project.location || '',
      budget: formData.project.budget,
      startDate: formData.project.start_date || new Date().toISOString(),
      endDate: formData.project.end_date || '',
      status: ProjectStatus.DRAFT,
      thumbnail: '',
      progress: 0,
      teamSize: formData.project.team_size || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Create project from form data
   */
  async createProject(data: ProjectWorkflowDTO): Promise<ProjectDTO> {
    const projectDTO = this.convertFormDataToProjectDTO(data);
    return await this.projectRepository.create(projectDTO);
  }

  /**
   * Convert material data to MaterialDTO
   */
  private convertMaterialData(material: Partial<MaterialDTO>): MaterialDTO {
    return {
      id: material.id || uuidv4(),
      name: material.name || '',
      category: material.category || MaterialCategory.OTHER,
      quantity: material.quantity || 0,
      unit: material.unit || 'unit',
      unitPrice: material.unitPrice || 0,
      supplierId: material.supplierId || '',
      specifications: material.specifications || ''
    };
  }

  /**
   * Save edit step-related data using hexagonal services
   */
  private async saveEditStepRelatedData(
    stepNumber: number, 
    data: Partial<ProjectWorkflowDTO>, 
    projectId: string
  ): Promise<void> {
    switch (stepNumber) {
      case 2: // Stakeholders
        if (data.stakeholders?.length) {
          const existing = await this.stakeholderRepository.findByProjectId(projectId);
          await Promise.all(existing.map(s => this.stakeholderRepository.delete(s.id)));
          
          for (const s of data.stakeholders) {
            await this.stakeholderRepository.create({
              projectId,
              stakeholderType: s.stakeholderType,
              entityId: s.entityId,
              role: s.role,
              isPrimary: s.isPrimary || false,
              isInternal: s.isInternal || false,
              name: s.name,
              email: s.email,
              phone: s.phone,
              organizationId: s.organizationId,
              employeeId: s.employeeId
            });
          }
        }
        break;
        
      case 3: // Phases
        if (data.phases?.length) {
          const existing = await this.phaseRepository.getPhasesByProjectId(projectId);
          await Promise.all(existing.map(p => this.phaseRepository.delete(p.id)));
          
          for (const p of data.phases) {
            await this.phaseRepository.create({
              projectId,
              phaseName: p.name,
              description: p.description,
              status: 'pending',
              progress: p.progress || 0,
              startDate: p.startDate ? new Date(p.startDate) : null,
              endDate: p.endDate ? new Date(p.endDate) : null
            });
          }
        }
        break;
        
      case 4: // Risks
        if (data.risks?.length) {
          const existing = await this.riskRepository.findByProjectId(projectId);
          await Promise.all(existing.map(r => this.riskRepository.delete(r.id)));
          
          for (const r of data.risks) {
            // Load project entity first
            const project = await this.projectRepository.findById(projectId);
            if (!project) {
              throw new Error(`Project ${projectId} not found`);
            }

            const risk = new Risk(
              uuidv4(), // id
              project, // project reference
              r.title, // title
              r.description || '', // description
              r.probability || 0.5, // probability
              r.impact || 0.5, // impact
              RiskStatus.Open, // status
              [], // mitigations
              [], // documents
              [], // inspections
              new Date(), // createdAt
              new Date(), // updatedAt
              [], // relatedRisks
              [] // stakeholders
            );
            await this.riskRepository.save(risk);
          }
        }
        break;
    }
  }

  /**
   * Get changed fields between original and current data
   */
  private getChangedFields<T extends Record<string, unknown>>(
    originalData: T,
    currentData: T
  ): string[] {
    const changes: string[] = [];
    for (const key in currentData) {
      if (key in originalData && originalData[key] !== currentData[key]) {
        changes.push(key);
      }
    }
    return changes;
  }
}

// Export factory function instead of direct instance
export function createProjectWorkflowService(
  projectRepo: IProjectRepository,
  phaseRepo: IPhaseRepository,
  riskRepo: IRiskRepository,
  stakeholderRepo: IProjectStakeholderRepository
) {
  return new ProjectWorkflowService(
    projectRepo,
    phaseRepo,
    riskRepo,
    stakeholderRepo
  );
}
