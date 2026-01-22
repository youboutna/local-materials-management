/**
 * Project Form Repository Interface
 * Defines the contract for project form operations
 */
import { ProjectFormData } from '@/application/services/ProjectFormService';

export interface SaveContext {
  step: number;
  timestamp: string;
  isValid: boolean;
  errors?: string[];
}

export interface IProjectFormRepository {
  /**
   * Save partial project data at a specific step
   */
  saveStepData(
    projectId: string | null,
    formData: ProjectFormData,
    step: number
  ): Promise<{ success: boolean; projectId: string | null; error?: string }>;

  /**
   * Save related data for specific steps
   */
  saveStepRelatedData(
    projectId: string,
    step: number,
    data: {
      phases?: any[];
      risks?: any[];
      materials?: any[];
      stakeholders?: any[];
    }
  ): Promise<{ success: boolean; error?: string }>;

  /**
   * Load project data
   */
  loadProjectData(projectId: string): Promise<ProjectFormData | null>;

  /**
   * Load related data (stakeholders, phases, materials)
   */
  loadRelatedData(projectId: string): Promise<Partial<ProjectFormData>>;

  /**
   * Load base data for dropdowns and selectors
   */
  loadBaseData(): Promise<any>;

  /**
   * Validate step data
   */
  validateStep(stepId: number, formData: ProjectFormData): boolean;
}
