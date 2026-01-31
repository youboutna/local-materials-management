/**
 * Service: ProjectWorkflowService
 * Gère les workflows de création et modification de projets avec sauvegarde partielle par étapes
 * Architecture hexagonale pour les workflows multi-étapes avec DTOs spécialisés
 */

import { Project } from '@/domain/entities/Project';
import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { ProjectTransformer } from '@/dtos/transforms';
import { ProjectDTO, CreateProjectRequestDTO, UpdateProjectRequestDTO } from '@/dtos/transforms/ProjectDTO';
import { MaterialService } from './MaterialService';
import { PhaseService } from './PhaseService';
import { StakeholderService } from './StakeholderService';
import { 
  ProjectWorkflowData,
  WorkflowStateDTO,
  WorkflowValidationDTO,
  WorkflowSaveContextDTO,
  WorkflowTransitionDTO,
  WorkflowAuditLogDTO,
  WorkflowMetricsDTO,
  WorkflowTemplateDTO,
  WorkflowSessionDTO,
  ProjectCreationWorkflowDTO,
  ProjectBasicInfoDTO,
  ProjectStakeholdersDTO,
  ProjectLocationDTO,
  ProjectPlanningDTO,
  ProjectRisksDTO,
  ProjectComplianceDTO,
  ProjectValidationDTO,
  StepProgressDTO,
  ValidationResult,
  SaveResult
} from '@/dtos/transforms/ProjectWorkflowDTOs';
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

// Legacy interface for backward compatibility
export interface LegacyProjectWorkflowData {
  projectId?: string;
  currentStep: number;
  isDraft: boolean;
  isComplete: boolean;
  projectData: Partial<CreateProjectRequestDTO | UpdateProjectRequestDTO>;
  relatedData: {
    stakeholders?: any[];
    phases?: any[];
    risks?: any[];
    materials?: any[];
  };
  metadata: {
    lastSavedAt: string;
    totalSteps: number;
    completedSteps: number;
    progressPercentage: number;
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

export class ProjectWorkflowService {
  constructor(
    private projectRepository: IProjectRepository = RepositoryFactory.getProjectRepository(),
    private phaseRepository: IPhaseRepository = RepositoryFactory.getPhaseRepository(),
    private riskRepository: IRiskRepository = RepositoryFactory.getRiskRepository(),
    private stakeholderRepository: IProjectStakeholderRepository = RepositoryFactory.getProjectStakeholderRepository()
  ) {}

  // 🔄 Specialized Workflow Methods for Complex Multi-Step Processes
  // Following hexagonal architecture with proper object injection and flow

  /**
   * Initialize a new workflow session with specialized DTOs
   */
  async initializeWorkflowSession(
    templateId: string,
    userId?: string
  ): Promise<WorkflowSessionDTO> {
    const template = await this.getWorkflowTemplate(templateId);
    const sessionId = this.generateSessionId();
    const startTime = new Date().toISOString();

    const workflowState: WorkflowStateDTO = {
      currentStep: 1,
      totalSteps: template.steps.length,
      isDraft: true,
      isComplete: false,
      canProceed: false,
      canGoBack: false,
      progressPercentage: 0,
      lastSavedAt: startTime,
      estimatedCompletionTime: this.calculateEstimatedCompletionTime(template)
    };

    const session: WorkflowSessionDTO = {
      sessionId,
      workflowId: this.generateWorkflowId(),
      templateId,
      userId,
      startTime,
      lastActivityTime: startTime,
      currentState: workflowState,
      completedSteps: [],
      skippedSteps: [],
      auditLog: [],
      metrics: this.initializeMetrics(),
      isActive: true,
      expiresAt: this.calculateSessionExpiry(startTime)
    };

    return session;
  }

  /**
   * Validate current step with specialized validation DTO
   */
  async validateWorkflowStep(
    sessionId: string,
    stepNumber: number,
    stepData: Record<string, unknown>
  ): Promise<WorkflowValidationDTO> {
    const session = await this.getWorkflowSession(sessionId);
    const template = await this.getWorkflowTemplate(session.templateId);
    const step = template.steps.find(s => s.stepNumber === stepNumber);
    
    if (!step) {
      throw new AppError(
        `Step ${stepNumber} not found in template`,
        ErrorCode.NOT_FOUND
      );
    }

    const validation: WorkflowValidationDTO = {
      stepNumber,
      isValid: true,
      errors: [],
      warnings: [],
      missingFields: [],
      validationTimestamp: new Date().toISOString()
    };

    // Validate required fields
    for (const rule of step.validationRules) {
      const ruleResult = await this.applyValidationRule(rule, stepData);
      if (!ruleResult.isValid) {
        validation.isValid = false;
        validation.errors.push(...ruleResult.errors);
        validation.missingFields.push(...ruleResult.missingFields);
      }
      validation.warnings.push(...ruleResult.warnings);
    }

    // Log validation
    await this.logWorkflowAction(sessionId, {
      action: 'step_validated',
      stepNumber,
      details: {
        isValid: validation.isValid,
        errorsCount: validation.errors.length,
        warningsCount: validation.warnings.length
      }
    });

    return validation;
  }

  /**
   * Save workflow step with specialized context DTO
   */
  async saveWorkflowStep(
    sessionId: string,
    stepNumber: number,
    stepData: Record<string, unknown>,
    saveContext: WorkflowSaveContextDTO
  ): Promise<SaveResult> {
    try {
      const session = await this.getWorkflowSession(sessionId);
      const validation = await this.validateWorkflowStep(sessionId, stepNumber, stepData);
      
      if (!validation.isValid && saveContext.saveType !== 'save_all') {
        return {
          success: false,
          projectId: null,
          error: `Validation failed for step ${stepNumber}: ${validation.errors.join(', ')}`,
          warnings: validation.warnings
        };
      }

      // Save step data based on step type
      let projectId: string | null = null;
      
      if (stepNumber === 1) {
        projectId = await this.saveProjectBasicInfo(stepData as ProjectBasicInfoDTO);
      } else if (stepNumber === 2) {
        await this.saveProjectStakeholders(projectId!, stepData as ProjectStakeholdersDTO);
      } else if (stepNumber === 3) {
        await this.saveProjectLocation(projectId!, stepData as ProjectLocationDTO);
      } else if (stepNumber === 4) {
        await this.saveProjectPlanning(projectId!, stepData as ProjectPlanningDTO);
      } else if (stepNumber === 5) {
        await this.saveProjectRisks(projectId!, stepData as ProjectRisksDTO);
      } else if (stepNumber === 6) {
        await this.saveProjectCompliance(projectId!, stepData as ProjectComplianceDTO);
      } else if (stepNumber === 7) {
        await this.saveProjectValidation(projectId!, stepData as ProjectValidationDTO);
      }

      // Update session state
      await this.updateSessionProgress(sessionId, stepNumber, validation.isValid);
      
      // Log save action
      await this.logWorkflowAction(sessionId, {
        action: 'step_saved',
        stepNumber,
        details: {
          saveType: saveContext.saveType,
          isValid: validation.isValid,
          projectId
        }
      });

      return {
        success: true,
        projectId,
        warnings: validation.warnings
      };

    } catch (error) {
      await this.logWorkflowAction(sessionId, {
        action: 'error_occurred',
        stepNumber,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });

      return {
        success: false,
        projectId: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Execute workflow transition with specialized DTO
   */
  async executeWorkflowTransition(
    sessionId: string,
    fromStep: number,
    toStep: number,
    transitionType: 'forward' | 'backward' | 'jump',
    reason?: string
  ): Promise<WorkflowTransitionDTO> {
    const session = await this.getWorkflowSession(sessionId);
    const transition: WorkflowTransitionDTO = {
      fromStep,
      toStep,
      transitionType,
      reason,
      timestamp: new Date().toISOString(),
      userId: session.userId
    };

    // Validate transition
    await this.validateTransition(session, transition);
    
    // Update session state
    session.currentState.currentStep = toStep;
    session.currentState.canProceed = this.canProceedToStep(session, toStep);
    session.currentState.canGoBack = toStep > 1;
    session.currentState.progressPercentage = this.calculateProgress(session, toStep);
    session.lastActivityTime = new Date().toISOString();

    // Log transition
    await this.logWorkflowAction(sessionId, {
      action: 'step_completed',
      stepNumber: fromStep,
      details: { transition }
    });

    return transition;
  }

  /**
   * Get workflow metrics with specialized DTO
   */
  async getWorkflowMetrics(sessionId: string): Promise<WorkflowMetricsDTO> {
    const session = await this.getWorkflowSession(sessionId);
    const currentTime = new Date().getTime();
    const startTime = new Date(session.startTime).getTime();
    const totalElapsedTime = Math.floor((currentTime - startTime) / (1000 * 60)); // in minutes

    const metrics: WorkflowMetricsDTO = {
      totalSteps: session.currentState.totalSteps,
      completedSteps: session.completedSteps.length,
      averageTimePerStep: totalElapsedTime / Math.max(session.currentState.currentStep - 1, 1),
      totalElapsedTime,
      validationErrors: session.auditLog.filter(log => log.action === 'error_occurred').length,
      saveOperations: session.auditLog.filter(log => log.action === 'data_saved').length,
      userInteractions: session.auditLog.length,
      completionRate: (session.completedSteps.length / session.currentState.totalSteps) * 100,
      abandonmentRate: session.isActive ? 0 : this.calculateAbandonmentRate(session)
    };

    return metrics;
  }

  /**
   * Complete workflow with final validation
   */
  async completeWorkflow(
    sessionId: string,
    finalData: Record<string, unknown>
  ): Promise<SaveResult> {
    const session = await this.getWorkflowSession(sessionId);
    
    // Final validation
    const finalValidation = await this.validateWorkflowSession(session);
    if (!finalValidation.isValid) {
      return {
        success: false,
        projectId: null,
        error: 'Workflow validation failed',
        warnings: finalValidation.warnings
      };
    }

    // Save final data
    const saveResult = await this.saveWorkflowStep(sessionId, 7, finalData, {
      saveType: 'complete_workflow',
      currentStep: 7,
      totalSteps: 7,
      isDraft: false,
      isComplete: true,
      lastSavedAt: new Date().toISOString(),
      userId: session.userId,
      sessionId
    });

    if (saveResult.success) {
      // Mark session as completed
      session.currentState.isComplete = true;
      session.currentState.isDraft = false;
      session.isActive = false;
      session.completedAt = new Date().toISOString();
      
      // Log completion
      await this.logWorkflowAction(sessionId, {
        action: 'workflow_completed',
        details: {
          projectId: saveResult.projectId,
          totalSteps: session.currentState.totalSteps,
          totalTime: session.metrics.totalElapsedTime
        }
      });
    }

    return saveResult;
  }

  /**
   * Définit les étapes du workflow de projet
   */
  private getWorkflowSteps(): ProjectWorkflowStep[] {
    return [
      {
        stepNumber: 1,
        title: "Informations Générales",
        description: "Données de base du projet",
        isRequired: true,
        validationRules: ['title_required', 'description_required', 'dates_valid'],
        relatedEntities: []
      },
      {
        stepNumber: 2,
        title: "Parties Prenantes",
        description: "Équipe et organisations impliquées",
        isRequired: true,
        validationRules: ['at_least_one_stakeholder'],
        relatedEntities: ['stakeholders']
      },
      {
        stepNumber: 3,
        title: "Localisation",
        description: "Site et coordonnées géographiques",
        isRequired: true,
        validationRules: ['address_required', 'coordinates_valid'],
        relatedEntities: []
      },
      {
        stepNumber: 4,
        title: "Planification & Phases",
        description: "Phases de construction et étapes",
        isRequired: true,
        validationRules: ['at_least_one_phase', 'phases_sequential'],
        relatedEntities: ['phases']
      },
      {
        stepNumber: 5,
        title: "Analyse des Risques",
        description: "Identification et mitigation",
        isRequired: false,
        validationRules: [],
        relatedEntities: ['risks']
      },
      {
        stepNumber: 6,
        title: "Conformité",
        description: "Normes et réglementations",
        isRequired: false,
        validationRules: [],
        relatedEntities: []
      },
      {
        stepNumber: 7,
        title: "Validation & Clôture",
        description: "Réception et finalisation",
        isRequired: false,
        validationRules: ['closure_notes_if_complete'],
        relatedEntities: []
      }
    ];
  }

  /**
   * Sauvegarde les données d'une étape spécifique
   */
  async saveWorkflowStep(
    data: ProjectWorkflowData
  ): Promise<WorkflowSaveResult> {
    try {
      console.info('PROJECT_WORKFLOW_001: Saving workflow step', {
        code: 'PROJECT_WORKFLOW_001',
        message: 'Début de la sauvegarde de l\'étape de workflow',
        stepNumber: data.currentStep,
        projectId: data.projectId,
        isDraft: data.isDraft,
        stack: new Error().stack
      });

      // Validation de l'étape
      const stepValidation = this.validateStep(data);
      if (!stepValidation.isValid) {
        console.error('PROJECT_WORKFLOW_002: Step validation failed', {
          code: 'PROJECT_WORKFLOW_002',
          message: 'Échec de validation de l\'étape',
          stepNumber: data.currentStep,
          errors: stepValidation.errors,
          stack: new Error().stack
        });

        return {
          success: false,
          stepNumber: data.currentStep,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Données de l\'étape invalides',
            details: stepValidation.errors
          }
        };
      }

      let projectId = data.projectId;

      // Création ou mise à jour du projet principal
      if (data.projectData && Object.keys(data.projectData).length > 0) {
        if (projectId) {
          // Mise à jour du projet existant
          const updateResult = await this.updateProjectStep(projectId, data.projectData);
          if (!updateResult.success) {
            return updateResult;
          }
        } else {
          // Création du nouveau projet (uniquement à l'étape 1)
          if (data.currentStep === 1) {
            const createResult = await this.createProjectStep(data.projectData);
            if (!createResult.success) {
              return createResult;
            }
            projectId = createResult.projectId;
          } else {
            return {
              success: false,
              stepNumber: data.currentStep,
              error: {
                code: 'INVALID_SEQUENCE',
                message: 'Impossible de sauvegarder les étapes suivantes sans créer le projet'
              }
            };
          }
        }
      }

      // Sauvegarde des données associées selon l'étape
      if (projectId && data.relatedData) {
        const relatedDataResult = await this.saveRelatedData(projectId, data.currentStep, data.relatedData);
        if (!relatedDataResult.success) {
          return relatedDataResult;
        }
      }

      // Mise à jour des métadonnées
      const updatedData: ProjectWorkflowData = {
        ...data,
        projectId: projectId || data.projectId,
        metadata: {
          ...data.metadata,
          lastSavedAt: new Date().toISOString(),
          completedSteps: this.calculateCompletedSteps(data),
          progressPercentage: this.calculateProgressPercentage(data)
        }
      };

      console.info('PROJECT_WORKFLOW_003: Workflow step saved successfully', {
        code: 'PROJECT_WORKFLOW_003',
        message: 'Étape de workflow sauvegardée avec succès',
        stepNumber: data.currentStep,
        projectId,
        stack: new Error().stack
      });

      return {
        success: true,
        projectId,
        stepNumber: data.currentStep,
        data: updatedData
      };

    } catch (error) {
      console.error('PROJECT_WORKFLOW_004: Failed to save workflow step', {
        code: 'PROJECT_WORKFLOW_004',
        message: 'Échec de la sauvegarde de l\'étape de workflow',
        stepNumber: data.currentStep,
        technicalError: error,
        stack: new Error().stack
      });

      return {
        success: false,
        stepNumber: data.currentStep,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Erreur lors de la sauvegarde de l\'étape',
          details: error
        }
      };
    }
  }

  /**
   * Charge les données d'un workflow de projet
   */
  async loadWorkflowData(projectId: string): Promise<ProjectWorkflowData | null> {
    try {
      console.info('PROJECT_WORKFLOW_005: Loading workflow data', {
        code: 'PROJECT_WORKFLOW_005',
        message: 'Chargement des données de workflow',
        projectId,
        stack: new Error().stack
      });

      // Charger le projet principal
      const project = await this.projectRepository.findById(projectId);
      if (!project) {
        console.error('PROJECT_WORKFLOW_006: Project not found', {
          code: 'PROJECT_WORKFLOW_006',
          message: 'Projet non trouvé',
          projectId,
          stack: new Error().stack
        });
        return null;
      }

      const projectDTO = ProjectTransformer.toResponseDto(project);

      // Charger les données associées
      const relatedData = await this.loadRelatedData(projectId);

      const workflowData: ProjectWorkflowData = {
        projectId,
        currentStep: this.determineCurrentStep(projectDTO),
        isDraft: !this.isProjectComplete(projectDTO, relatedData),
        isComplete: this.isProjectComplete(projectDTO, relatedData),
        projectData: projectDTO,
        relatedData,
        metadata: {
          lastSavedAt: projectDTO.updatedAt,
          totalSteps: this.getWorkflowSteps().length,
          completedSteps: this.calculateCompletedStepsFromProject(projectDTO, relatedData),
          progressPercentage: this.calculateProgressPercentageFromProject(projectDTO, relatedData)
        }
      };

      console.info('PROJECT_WORKFLOW_007: Workflow data loaded successfully', {
        code: 'PROJECT_WORKFLOW_007',
        message: 'Données de workflow chargées avec succès',
        projectId,
        currentStep: workflowData.currentStep,
        progressPercentage: workflowData.metadata.progressPercentage,
        stack: new Error().stack
      });

      return workflowData;

    } catch (error) {
      console.error('PROJECT_WORKFLOW_008: Failed to load workflow data', {
        code: 'PROJECT_WORKFLOW_008',
        message: 'Échec du chargement des données de workflow',
        projectId,
        technicalError: error,
        stack: new Error().stack
      });

      return null;
    }
  }

  /**
   * Valide les données d'une étape
   */
  private validateStep(data: ProjectWorkflowData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const step = this.getWorkflowSteps().find(s => s.stepNumber === data.currentStep);
    
    if (!step) {
      errors.push(`Étape ${data.currentStep} invalide`);
      return { isValid: false, errors };
    }

    // Validation des règles de l'étape
    for (const rule of step.validationRules) {
      switch (rule) {
        case 'title_required':
          if (!data.projectData.title || data.projectData.title.trim() === '') {
            errors.push('Le titre du projet est requis');
          }
          break;
        
        case 'description_required':
          if (!data.projectData.description || data.projectData.description.trim() === '') {
            errors.push('La description du projet est requise');
          }
          break;
        
        case 'dates_valid':
          if (data.projectData.startDate && data.projectData.endDate) {
            const start = new Date(data.projectData.startDate);
            const end = new Date(data.projectData.endDate);
            if (start >= end) {
              errors.push('La date de fin doit être postérieure à la date de début');
            }
          }
          break;
        
        case 'at_least_one_stakeholder':
          if (!data.relatedData.stakeholders || data.relatedData.stakeholders.length === 0) {
            errors.push('Au moins une partie prenante est requise');
          }
          break;
        
        case 'address_required':
          if (!data.projectData.address || data.projectData.address.trim() === '') {
            errors.push('L\'adresse du projet est requise');
          }
          break;
        
        case 'coordinates_valid':
          if (data.projectData.latitude !== undefined && data.projectData.longitude !== undefined) {
            if (isNaN(data.projectData.latitude) || isNaN(data.projectData.longitude)) {
              errors.push('Les coordonnées géographiques sont invalides');
            }
          }
          break;
        
        case 'at_least_one_phase':
          if (!data.relatedData.phases || data.relatedData.phases.length === 0) {
            errors.push('Au moins une phase est requise');
          }
          break;
        
        case 'phases_sequential':
          if (data.relatedData.phases && data.relatedData.phases.length > 1) {
            const sortedPhases = [...data.relatedData.phases].sort((a, b) => 
              new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
            );
            
            for (let i = 1; i < sortedPhases.length; i++) {
              const prevEnd = new Date(sortedPhases[i - 1].endDate);
              const currStart = new Date(sortedPhases[i].startDate);
              if (currStart <= prevEnd) {
                errors.push('Les phases doivent être séquentielles');
                break;
              }
            }
          }
          break;
        
        case 'closure_notes_if_complete':
          if (data.isComplete && (!data.projectData.closureNotes || data.projectData.closureNotes.trim() === '')) {
            errors.push('Les notes de clôture sont requises pour un projet complet');
          }
          break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Crée un projet à l'étape 1
   */
  private async createProjectStep(projectData: Partial<CreateProjectRequestDTO>): Promise<WorkflowSaveResult> {
    try {
      const createData = projectData as CreateProjectRequestDTO;
      const project = ProjectTransformer.fromCreateDtoToEntity(createData);
      
      const savedProject = await this.projectRepository.save(project);
      
      return {
        success: true,
        projectId: savedProject.id,
        stepNumber: 1
      };
    } catch (error) {
      return {
        success: false,
        stepNumber: 1,
        error: {
          code: 'CREATION_ERROR',
          message: 'Erreur lors de la création du projet',
          details: error
        }
      };
    }
  }

  /**
   * Met à jour un projet existant
   */
  private async updateProjectStep(projectId: string, projectData: Partial<UpdateProjectRequestDTO>): Promise<WorkflowSaveResult> {
    try {
      const existingProject = await this.projectRepository.findById(projectId);
      if (!existingProject) {
        return {
          success: false,
          stepNumber: 1,
          error: {
            code: 'NOT_FOUND',
            message: 'Projet non trouvé'
          }
        };
      }

      // Mise à jour des champs
      Object.entries(projectData).forEach(([key, value]) => {
        if (value !== undefined) {
          (existingProject as any)[`_${key}`] = value;
        }
      });

      const updatedProject = await this.projectRepository.update(projectId, existingProject);
      
      return {
        success: true,
        projectId,
        stepNumber: 1
      };
    } catch (error) {
      return {
        success: false,
        stepNumber: 1,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Erreur lors de la mise à jour du projet',
          details: error
        }
      };
    }
  }

  /**
   * Sauvegarde les données associées selon l'étape
   */
  private async saveRelatedData(
    projectId: string,
    stepNumber: number,
    relatedData: {
      stakeholders?: any[];
      phases?: any[];
      risks?: any[];
      materials?: any[];
    }
  ): Promise<WorkflowSaveResult> {
    try {
      const step = this.getWorkflowSteps().find(s => s.stepNumber === stepNumber);
      if (!step) {
        return {
          success: false,
          stepNumber,
          error: {
            code: 'INVALID_STEP',
            message: 'Étape invalide'
          }
        };
      }

      // Sauvegarder uniquement les entités associées à l'étape
      for (const entityType of step.relatedEntities) {
        if (relatedData[entityType]) {
          switch (entityType) {
            case 'stakeholders':
              // TODO: Implémenter la sauvegarde des stakeholders
              break;
            
            case 'phases':
              // TODO: Implémenter la sauvegarde des phases
              break;
            
            case 'risks':
              // TODO: Implémenter la sauvegarde des risques
              break;
            
            case 'materials':
              // TODO: Implémenter la sauvegarde des matériaux
              break;
          }
        }
      }

      return {
        success: true,
        stepNumber
      };
    } catch (error) {
      return {
        success: false,
        stepNumber,
        error: {
          code: 'RELATED_DATA_ERROR',
          message: 'Erreur lors de la sauvegarde des données associées',
          details: error
        }
      };
    }
  }

  /**
   * Charge les données associées
   */
  private async loadRelatedData(projectId: string): Promise<{
    stakeholders?: any[];
    phases?: any[];
    risks?: any[];
    materials?: any[];
  }> {
    const relatedData: any = {};

    try {
      // TODO: Charger les données associées via les services appropriés
      // relatedData.stakeholders = await this.stakeholderService.getStakeholdersByProject(projectId);
      // relatedData.phases = await this.phaseService.getPhasesByProject(projectId);
      // relatedData.risks = await this.riskService.getRisksByProject(projectId);
      // relatedData.materials = await this.materialService.getMaterialsByProject(projectId);
    } catch (error) {
      console.error('Error loading related data:', error);
    }

    return relatedData;
  }

  /**
   * Détermine l'étape actuelle basée sur les données du projet
   */
  private determineCurrentStep(projectData: ProjectDTO): number {
    // Logique pour déterminer l'étape actuelle
    if (!projectData.title || !projectData.description) return 1;
    if (!projectData.address) return 3;
    // TODO: Ajouter la logique pour les autres étapes
    return 1;
  }

  /**
   * Calcule le nombre d'étapes complétées
   */
  private calculateCompletedSteps(data: ProjectWorkflowData): number {
    let completed = 0;
    
    // Étape 1: Informations générales
    if (data.projectData.title && data.projectData.description) completed++;
    
    // Étape 2: Parties prenantes
    if (data.relatedData.stakeholders && data.relatedData.stakeholders.length > 0) completed++;
    
    // Étape 3: Localisation
    if (data.projectData.address) completed++;
    
    // Étape 4: Phases
    if (data.relatedData.phases && data.relatedData.phases.length > 0) completed++;
    
    // TODO: Ajouter la logique pour les autres étapes
    
    return completed;
  }

  /**
   * Calcule le pourcentage de progression
   */
  private calculateProgressPercentage(data: ProjectWorkflowData): number {
    const totalSteps = this.getWorkflowSteps().length;
    const completedSteps = this.calculateCompletedSteps(data);
    return Math.round((completedSteps / totalSteps) * 100);
  }

  /**
   * Calcule les étapes complétées depuis les données du projet
   */
  private calculateCompletedStepsFromProject(projectData: ProjectDTO, relatedData: any): number {
    let completed = 0;
    
    if (projectData.title && projectData.description) completed++;
    if (relatedData.stakeholders && relatedData.stakeholders.length > 0) completed++;
    if (projectData.address) completed++;
    if (relatedData.phases && relatedData.phases.length > 0) completed++;
    
    return completed;
  }

  /**
   * Détermine si le projet est complet (toutes les étapes requises sont terminées)
   */
  private isProjectComplete(projectData: ProjectDTO, relatedData: any): boolean {
    const totalSteps = this.getWorkflowSteps().length;
    const completedSteps = this.calculateCompletedStepsFromProject(projectData, relatedData);
    return completedSteps >= totalSteps;
  }

  /**
   * Calcule le pourcentage de progression depuis les données du projet
   */
  private calculateProgressPercentageFromProject(projectData: ProjectDTO, relatedData: any): number {
    const totalSteps = this.getWorkflowSteps().length;
    const completedSteps = this.calculateCompletedStepsFromProject(projectData, relatedData);
    return Math.round((completedSteps / totalSteps) * 100);
  }

  /**
   * Obtient les informations sur les étapes du workflow
   */
  getWorkflowStepsInfo(): ProjectWorkflowStep[] {
    return this.getWorkflowSteps();
  }

  /**
   * Vérifie si une étape peut être accédée
   */
  canAccessStep(currentStep: number, targetStep: number): boolean {
    // On peut accéder aux étapes précédentes et à l'étape suivante
    return targetStep <= currentStep + 1;
  }

  /**
   * Obtient l'étape suivante
   */
  getNextStep(currentStep: number): number | null {
    const steps = this.getWorkflowSteps();
    const currentIndex = steps.findIndex(s => s.stepNumber === currentStep);
    
    if (currentIndex >= 0 && currentIndex < steps.length - 1) {
      return steps[currentIndex + 1].stepNumber;
    }
    
    return null;
  }

  /**
   * Obtient l'étape précédente
   */
  getPreviousStep(currentStep: number): number | null {
    const steps = this.getWorkflowSteps();
    const currentIndex = steps.findIndex(s => s.stepNumber === currentStep);
    
    if (currentIndex > 0) {
      return steps[currentIndex - 1].stepNumber;
    }
    
    return null;
  }

  /**
   * Get all workflow steps for a tender with calculated metadata
   * Legacy compatibility method from WorkflowStepService
   */
  async getTenderWorkflowSteps(tenderId: string): Promise<any[]> {
    try {
      // This would need to be implemented with proper tender workflow logic
      // For now, return empty array as this is project-focused service
      console.warn('getTenderWorkflowSteps not implemented in ProjectWorkflowService');
      return [];
    } catch (error) {
      console.error('Error getting tender workflow steps:', error);
      return [];
    }
  }

  /**
   * Get workflow step by ID
   * Legacy compatibility method from WorkflowStepService
   */
  async getWorkflowStep(stepId: string): Promise<any> {
    try {
      // This would need to be implemented with proper step retrieval logic
      console.warn('getWorkflowStep not implemented in ProjectWorkflowService');
      return null;
    } catch (error) {
      console.error('Error getting workflow step:', error);
      return null;
    }
  }

  /**
   * Create new workflow step
   * Legacy compatibility method from WorkflowStepService
   */
  async createWorkflowStep(stepData: any): Promise<any> {
    try {
      // This would need to be implemented with proper step creation logic
      console.warn('createWorkflowStep not implemented in ProjectWorkflowService');
      return null;
    } catch (error) {
      console.error('Error creating workflow step:', error);
      return null;
    }
  }

  /**
   * Update workflow step
   * Legacy compatibility method from WorkflowStepService
   */
  async updateWorkflowStep(stepId: string, updates: any): Promise<any> {
    try {
      // This would need to be implemented with proper step update logic
      console.warn('updateWorkflowStep not implemented in ProjectWorkflowService');
      return null;
    } catch (error) {
      console.error('Error updating workflow step:', error);
      return null;
    }
  }

  /**
   * Delete workflow step
   * Legacy compatibility method from WorkflowStepService
   */
  async deleteWorkflowStep(stepId: string): Promise<void> {
    try {
      // This would need to be implemented with proper step deletion logic
      console.warn('deleteWorkflowStep not implemented in ProjectWorkflowService');
    } catch (error) {
      console.error('Error deleting workflow step:', error);
    }
  }

  /**
   * Get workflow progress
   * Legacy compatibility method from WorkflowStepService
   */
  async getWorkflowProgress(tenderId: string): Promise<any> {
    try {
      // This would need to be implemented with proper progress calculation logic
      console.warn('getWorkflowProgress not implemented in ProjectWorkflowService');
      return null;
    } catch (error) {
      console.error('Error getting workflow progress:', error);
      return null;
    }
  }

  /**
   * Start workflow step
   * Legacy compatibility method from WorkflowStepService
   */
  async startWorkflowStep(stepId: string, assignedTo?: string): Promise<any> {
    try {
      // This would need to be implemented with proper step start logic
      console.warn('startWorkflowStep not implemented in ProjectWorkflowService');
      return null;
    } catch (error) {
      console.error('Error starting workflow step:', error);
      return null;
    }
  }

  /**
   * Complete workflow step
   * Legacy compatibility method from WorkflowStepService
   */
  async completeWorkflowStep(stepId: string, documents?: any[]): Promise<any> {
    try {
      // This would need to be implemented with proper step completion logic
      console.warn('completeWorkflowStep not implemented in ProjectWorkflowService');
      return null;
    } catch (error) {
      console.error('Error completing workflow step:', error);
      return null;
    }
  }

  /**
   * Upload step document
   * Legacy compatibility method from WorkflowStepService
   */
  async uploadStepDocument(stepId: string, documentData: any): Promise<any> {
    try {
      // This would need to be implemented with proper document upload logic
      console.warn('uploadStepDocument not implemented in ProjectWorkflowService');
      return null;
    } catch (error) {
      console.error('Error uploading step document:', error);
      return null;
    }
  }

  /**
   * Get step documents
   * Legacy compatibility method from WorkflowStepService
   */
  async getStepDocuments(stepId: string): Promise<any[]> {
    try {
      // This would need to be implemented with proper document retrieval logic
      console.warn('getStepDocuments not implemented in ProjectWorkflowService');
      return [];
    } catch (error) {
      console.error('Error getting step documents:', error);
      return [];
    }
  }

  /**
   * Validate step dependencies
   * Legacy compatibility method from WorkflowStepService
   */
  async validateStepDependencies(stepId: string): Promise<any> {
    try {
      // This would need to be implemented with proper dependency validation logic
      console.warn('validateStepDependencies not implemented in ProjectWorkflowService');
      return { canStart: false, missingDependencies: [] };
    } catch (error) {
      console.error('Error validating step dependencies:', error);
      return { canStart: false, missingDependencies: [] };
    }
  }
}
