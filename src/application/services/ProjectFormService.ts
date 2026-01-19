/**
 * Project Form Application Service
 * Orchestrates project form operations using hexagonal architecture
 */
import { IProjectFormRepository } from '@/domain/repositories/IProjectFormRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { ProjectFormData, SaveContext } from '@/services/ProjectFormService';
import { EntityToDTOMapper } from '@/dtos/transforms';

export class ProjectFormService {
  private projectFormRepository: IProjectFormRepository;

  constructor() {
    this.projectFormRepository = RepositoryFactory.getProjectFormRepository();
  }

  // Utility: Format date for input fields
  formatDateForInput = (dateString: any): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Utility: Map status from database
  mapStatusFromDB = (status: string): string => {
    const mapping: Record<string, string> = {
      'en attente': 'planning',
      'en cours': 'en cours',
      'suspendu': 'suspendu',
      'terminé': 'terminé',
      'annulé': 'annulé'
    };
    return mapping[status] || status || 'planning';
  };

  // Delegate to EntityToDTOMapper for consistent mapping
  mapFieldsFromDB(dbData: any): ProjectFormData {
    return EntityToDTOMapper.projectEntityToFormData(dbData) as ProjectFormData;
  }

  mapFieldsToDB(formData: ProjectFormData, step?: number): any {
    return EntityToDTOMapper.formDataToProjectEntity(formData, step);
  }

  // Validate step data using unified mapper
  validateStepData(formData: ProjectFormData, step: number): { valid: boolean; errors: string[] } {
    return EntityToDTOMapper.validateStepData(formData, step);
  }

  /**
   * Save partial project data at a specific step
   */
  async saveStepData(
    projectId: string | null,
    formData: ProjectFormData,
    step: number
  ): Promise<{ success: boolean; projectId: string | null; error?: string }> {
    return await this.projectFormRepository.saveStepData(projectId, formData, step);
  }

  /**
   * Save related data for specific steps
   */
  async saveStepRelatedData(
    projectId: string,
    step: number,
    data: {
      phases?: any[];
      risks?: any[];
      materials?: any[];
      stakeholders?: any[];
    }
  ): Promise<{ success: boolean; error?: string }> {
    return await this.projectFormRepository.saveStepRelatedData(projectId, step, data);
  }

  /**
   * Load project data
   */
  async loadProjectData(projectId: string): Promise<ProjectFormData | null> {
    return await this.projectFormRepository.loadProjectData(projectId);
  }

  /**
   * Load related data (stakeholders, phases, materials)
   */
  async loadRelatedData(projectId: string): Promise<Partial<ProjectFormData>> {
    return await this.projectFormRepository.loadRelatedData(projectId);
  }

  /**
   * Load base data for dropdowns and selectors
   */
  async loadBaseData(): Promise<any> {
    return await this.projectFormRepository.loadBaseData();
  }

  /**
   * Validate step data
   */
  validateStep(stepId: number, formData: ProjectFormData): boolean {
    return this.projectFormRepository.validateStep(stepId, formData);
  }

  /**
   * Process form data before saving
   */
  processFormDataForSave(formData: ProjectFormData, context: SaveContext): any {
    return {
      ...formData,
      currentStep: context.currentStep,
      isDraft: context.isDraft,
      isComplete: context.isComplete,
      saveType: context.saveType,
    };
  }
}
