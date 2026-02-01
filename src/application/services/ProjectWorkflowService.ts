/**
 * Service: ProjectWorkflowService
 * Gère les workflows de création et modification de projets avec sauvegarde partielle par étapes
 * Architecture hexagonale pour les workflows multi-étapes avec DTOs spécialisés
 * SIMPLIFIED VERSION - Core functionality only
 */

import { Project } from '@/domain/entities/Project';
import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { IPhaseRepository } from '@/domain/repositories/IPhaseRepository';
import { IRiskRepository } from '@/domain/repositories/IRiskRepository';
import { IProjectStakeholderRepository } from '@/domain/repositories/IProjectStakeholderRepository';
import { ProjectTransformer } from '@/dtos/transforms';
import { CreateProjectRequestDTO } from '@/dtos/entities/ProjectDTO';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export interface ProjectWorkflowStep {
  stepNumber: number;
  title: string;
  description: string;
  isRequired: boolean;
  validationRules: string[];
  relatedEntities: ('stakeholders' | 'phases' | 'risks' | 'materials' | 'documents' | 'inspections')[];
}

// Main workflow data interface
export interface ProjectWorkflowData {
  projectId?: string;
  currentStep: number;
  isDraft: boolean;
  isComplete: boolean;
  projectData: Partial<CreateProjectRequestDTO>;
  relatedData: {
    stakeholders?: unknown[];
    phases?: unknown[];
    risks?: unknown[];
    materials?: unknown[];
  };
  metadata: {
    lastSavedAt: string;
    totalSteps: number;
    completedSteps: number;
    progressPercentage: number;
    stepName?: string;
  };
}

export interface WorkflowSaveResult {
  success: boolean;
  projectId?: string;
  stepNumber: number;
  data?: ProjectWorkflowData;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface WorkflowValidationResult {
  isValid: boolean;
  errors: string[];
  fieldErrors?: Record<string, string[]>;
}

export class ProjectWorkflowService {
  private projectRepository: IProjectRepository;
  private phaseRepository: IPhaseRepository;
  private riskRepository: IRiskRepository;
  private stakeholderRepository: IProjectStakeholderRepository;

  constructor() {
    this.projectRepository = RepositoryFactory.getProjectRepository();
    this.phaseRepository = RepositoryFactory.getPhaseRepository();
    this.riskRepository = RepositoryFactory.getRiskRepository();
    this.stakeholderRepository = RepositoryFactory.getProjectStakeholderRepository();
  }

  /**
   * Get workflow steps configuration
   */
  getWorkflowSteps(): ProjectWorkflowStep[] {
    return [
      {
        stepNumber: 1,
        title: 'Informations du projet',
        description: 'Type, budget, dates, référence',
        isRequired: true,
        validationRules: ['title_required', 'budget_positive'],
        relatedEntities: []
      },
      {
        stepNumber: 2,
        title: 'Parties prenantes',
        description: 'Bailleurs, Ministères, Entreprises, Banques',
        isRequired: true,
        validationRules: ['manager_required'],
        relatedEntities: ['stakeholders']
      },
      {
        stepNumber: 3,
        title: 'Localisation',
        description: 'Géolocalisation interactive',
        isRequired: true,
        validationRules: ['address_required'],
        relatedEntities: []
      },
      {
        stepNumber: 4,
        title: 'Planification WBS',
        description: 'Phase → Step → Task',
        isRequired: true,
        validationRules: [],
        relatedEntities: ['phases', 'materials']
      },
      {
        stepNumber: 5,
        title: 'Risques',
        description: 'Analyse et gestion des risques',
        isRequired: false,
        validationRules: [],
        relatedEntities: ['risks']
      },
      {
        stepNumber: 6,
        title: 'Conformité',
        description: 'Standards SOMELEC et bailleurs',
        isRequired: false,
        validationRules: [],
        relatedEntities: ['documents']
      },
      {
        stepNumber: 7,
        title: 'Validation',
        description: 'Réception définitive et clôture',
        isRequired: true,
        validationRules: ['all_required_complete'],
        relatedEntities: []
      }
    ];
  }

  /**
   * Get a specific workflow step
   */
  getWorkflowStep(stepNumber: number): ProjectWorkflowStep | undefined {
    return this.getWorkflowSteps().find(s => s.stepNumber === stepNumber);
  }

  /**
   * Validate step data
   */
  validateStepData(stepNumber: number, data: Record<string, unknown>): WorkflowValidationResult {
    const step = this.getWorkflowStep(stepNumber);
    if (!step) {
      return { isValid: false, errors: [`Step ${stepNumber} not found`] };
    }

    const errors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    // Apply validation rules based on step
    for (const rule of step.validationRules) {
      switch (rule) {
        case 'title_required':
          if (!data.title) {
            errors.push('Le titre est requis');
            fieldErrors.title = ['Le titre est requis'];
          }
          break;
        case 'budget_positive':
          if (typeof data.budget === 'number' && data.budget < 0) {
            errors.push('Le budget doit être positif');
            fieldErrors.budget = ['Le budget doit être positif'];
          }
          break;
        case 'manager_required':
          if (!data.project_manager_id && !data.technical_manager_id) {
            errors.push('Un responsable projet ou technique est requis');
          }
          break;
        case 'address_required':
          if (!data.address && !data.location) {
            errors.push('L\'adresse est requise');
            fieldErrors.address = ['L\'adresse est requise'];
          }
          break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined
    };
  }

  /**
   * Save workflow step data
   */
  async saveStepData(
    workflowData: ProjectWorkflowData
  ): Promise<WorkflowSaveResult> {
    try {
      const { currentStep, projectData, projectId } = workflowData;

      // Validate step data
      const validation = this.validateStepData(currentStep, projectData as Record<string, unknown>);
      if (!validation.isValid) {
        return {
          success: false,
          stepNumber: currentStep,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.errors.join(', ')
          }
        };
      }

      let savedProjectId = projectId;

      // Create or update project based on step
      if (currentStep === 1 && !projectId) {
        // Create new project
        const newProject = await this.projectRepository.create({
          title: projectData.title as string,
          description: projectData.description as string || '',
          status: 'en attente',
          location: projectData.location as string || '',
          budget: (projectData as Record<string, unknown>).estimated_budget as number || projectData.budget as number || 0,
          progress: 0,
          startDate: new Date((projectData as Record<string, unknown>).start_date as string || new Date().toISOString()),
          endDate: new Date((projectData as Record<string, unknown>).end_date as string || new Date().toISOString()),
        });
        savedProjectId = newProject.id;
      } else if (projectId) {
        // Update existing project
        await this.projectRepository.update(projectId, {
          title: projectData.title,
          description: projectData.description,
          updatedAt: new Date()
        });
      }

      return {
        success: true,
        projectId: savedProjectId,
        stepNumber: currentStep,
        data: {
          ...workflowData,
          projectId: savedProjectId,
          metadata: {
            ...workflowData.metadata,
            lastSavedAt: new Date().toISOString()
          }
        }
      };
    } catch (error) {
      console.error('Error saving workflow step:', error);
      return {
        success: false,
        stepNumber: workflowData.currentStep,
        error: {
          code: 'SAVE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Complete the workflow and finalize project
   */
  async completeWorkflow(
    workflowData: ProjectWorkflowData
  ): Promise<WorkflowSaveResult> {
    try {
      if (!workflowData.projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required to complete workflow');
      }

      // Update project status to active
      await this.projectRepository.update(workflowData.projectId, {
        status: 'en cours',
        updatedAt: new Date()
      });

      return {
        success: true,
        projectId: workflowData.projectId,
        stepNumber: 7,
        data: {
          ...workflowData,
          isComplete: true,
          isDraft: false,
          metadata: {
            ...workflowData.metadata,
            lastSavedAt: new Date().toISOString(),
            completedSteps: 7,
            progressPercentage: 100
          }
        }
      };
    } catch (error) {
      console.error('Error completing workflow:', error);
      return {
        success: false,
        stepNumber: 7,
        error: {
          code: 'COMPLETION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
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

    const validation = this.validateStepData(currentStep, stepData);
    return validation.isValid;
  }
}

// Export singleton instance
export const projectWorkflowService = new ProjectWorkflowService();
