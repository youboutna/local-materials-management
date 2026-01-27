/**
 * Project Form Service - Hexagonal Architecture
 * Handles project form operations with repository pattern
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

// Service DTOs for data exchange
export interface ProjectFormDataDTO {
  title: string;
  description: string;
  location: string;
  status: string;
  progress: number;
  budget: number;
  start_date: string;
  end_date: string;
  team_size: number;
}

export interface SaveContextDTO {
  currentStep: number;
  totalSteps: number;
  isDraft?: boolean;
  isComplete?: boolean;
  saveType?: string;
}

export interface StepRelatedDataDTO {
  phases?: unknown[];
  risks?: unknown[];
  materials?: unknown[];
  stakeholders?: unknown[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface SaveResult {
  success: boolean;
  projectId: string | null;
  error?: string;
}

export interface OperationResult {
  success: boolean;
  error?: string;
}

export class ProjectFormService {
  constructor(
    private projectRepository: IProjectRepository = RepositoryFactory.getProjectRepository()
  ) {}
  /**
   * Format date for input field
   */
  formatDateForInput(dateString: string | Date | null | undefined): string {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }

  /**
   * Map status from database format
   */
  mapStatusFromDB(status: string): string {
    const mapping: Record<string, string> = {
      'en attente': 'planning',
      'en cours': 'en cours',
      'suspendu': 'suspendu',
      'terminé': 'terminé',
      'annulé': 'annulé'
    };
    return mapping[status] || status || 'planning';
  }

  /**
   * Map fields from database format
   */
  mapFieldsFromDB(dbData: Record<string, unknown>): ProjectFormDataDTO {
    return {
      title: (dbData.title as string) || '',
      description: (dbData.description as string) || '',
      location: (dbData.location as string) || '',
      status: this.mapStatusFromDB(dbData.status as string),
      progress: (dbData.progress as number) || 0,
      budget: (dbData.budget as number) || 0,
      start_date: this.formatDateForInput(dbData.start_date as string),
      end_date: this.formatDateForInput(dbData.end_date as string),
      team_size: (dbData.team_size as number) || 0,
    };
  }

  /**
   * Map fields to database format
   */
  mapFieldsToDB(formData: ProjectFormDataDTO, step?: number): Record<string, unknown> {
    const data = formData as unknown as Record<string, unknown>;
    return {
      title: formData.title,
      description: formData.description,
      location: formData.location,
      status: formData.status,
      progress: formData.progress,
      budget: formData.budget,
      start_date: data.start_date || data.startDate,
      end_date: data.end_date || data.endDate,
      team_size: data.team_size || data.teamSize,
      current_step: step
    };
  }

  /**
   * Validate step data
   */
  validateStepData(formData: ProjectFormDataDTO, step: number): ValidationResult {
    const errors: string[] = [];

    if (step === 1) {
      if (!formData.title || formData.title.trim() === '') {
        errors.push('Le titre du projet est requis');
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Save step data
   */
  async saveStepData(
    projectId: string | null,
    formData: ProjectFormDataDTO,
    step: number
  ): Promise<SaveResult> {
    try {
      // Validate form data
      const validation = this.validateStepData(formData, step);
      if (!validation.isValid) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, `Validation failed: ${validation.errors.join(', ')}`);
      }

      const id = projectId || `project-${Date.now()}`;
      
      // For now, simulate saving as project repository is not available
      // TODO: Implement proper project saving when project repository is available
      console.warn('ProjectFormService.saveStepData: Project repository not available');
      console.log(`Saving project form data for project: ${id}, step: ${step}`);
      
      return { success: true, projectId: id };
    } catch (error) {
      console.error('ProjectFormService.saveStepData failed:', error);
      if (error instanceof AppError) {
        return { success: false, projectId: null, error: error.message };
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, projectId: null, error: message };
    }
  }

  /**
   * Save step related data
   */
  async saveStepRelatedData(
    projectId: string,
    step: number,
    data: StepRelatedDataDTO
  ): Promise<OperationResult> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      // For now, simulate saving as related data repository is not available
      // TODO: Implement proper related data saving when repository is available
      console.warn('ProjectFormService.saveStepRelatedData: Related data repository not available');
      console.log(`Saving related data for project: ${projectId}, step: ${step}`);
      
      return { success: true };
    } catch (error) {
      console.error('ProjectFormService.saveStepRelatedData failed:', error);
      if (error instanceof AppError) {
        return { success: false, error: error.message };
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  /**
   * Load project data
   */
  async loadProjectData(projectId: string): Promise<ProjectFormDataDTO | null> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      // For now, return mock data as project repository is not available
      // TODO: Implement proper project data loading when project repository is available
      console.warn('ProjectFormService.loadProjectData: Project repository not available');
      
      return null;
    } catch (error) {
      console.error('ProjectFormService.loadProjectData failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to load project data');
    }
  }

  /**
   * Load related data
   */
  async loadRelatedData(projectId: string): Promise<Partial<ProjectFormDataDTO>> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      // For now, return empty object as related data repository is not available
      // TODO: Implement proper related data loading when repository is available
      console.warn('ProjectFormService.loadRelatedData: Related data repository not available');
      
      return {};
    } catch (error) {
      console.error('ProjectFormService.loadRelatedData failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to load related data');
    }
  }

  /**
   * Load base data
   */
  async loadBaseData(): Promise<Record<string, unknown>> {
    try {
      // For now, return empty object as base data repository is not available
      // TODO: Implement proper base data loading when repository is available
      console.warn('ProjectFormService.loadBaseData: Base data repository not available');
      
      return {};
    } catch (error) {
      console.error('ProjectFormService.loadBaseData failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to load base data');
    }
  }

  /**
   * Validate step
   */
  validateStep(stepId: number, formData: ProjectFormDataDTO): boolean {
    const result = this.validateStepData(formData, stepId);
    return result.isValid;
  }

  /**
   * Process form data for save
   */
  processFormDataForSave(formData: ProjectFormDataDTO, context: SaveContextDTO): Record<string, unknown> {
    return {
      ...formData,
      currentStep: context.currentStep,
      isDraft: context.isDraft ?? false,
      isComplete: context.isComplete ?? false,
      saveType: context.saveType ?? 'draft',
    };
  }
}
