/**
 * ReferentialService - Hexagonal Architecture
 * Service layer for working with project referentials
 * Following PROMPTS.md Rules:
 * - Rule #1: Arrow flow maintained (Presentation → Application → Domain ← Infrastructure)
 * - Rule #3: Service pattern applied
 * - Rule #4: DTOs only from centralized locations
 * - Rule #5: Clean separation of concerns
 */

import { 
  getReferential, 
  getAllReferentials, 
  getPhasesForReferential, 
  getReferentialOptions,
  getLabel,
  ReferentialType,
  ProjectReferential,
  MultiLanguageLabel,
  ReferentialDTO,
  ReferentialPhaseDTO,
  ReferentialStepDTO,
  ReferentialTaskDTO
} from '@/config/referentials';

import { AppError, ErrorCode } from '@/utils/errorHandling';

// Project Phase DTO for database operations
export interface ProjectPhaseDTO {
  project_id: string;
  name: string;
  description: string;
  phase_number: number;
  start_date: string | null;
  end_date: string | null;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  phases: {
    referential_code: string;
    phase_id: string;
    steps: Array<{
      step_id: string;
      name: string;
      description?: string;
      order_index: number;
      tasks: Array<{
        task_id: string;
        name: string;
        description?: string;
        order_index: number;
        estimated_duration_days?: number;
      }>;
    }>;
  };
}

export class ReferentialService {
  private static instance: ReferentialService;
  private currentLanguage: 'fr' | 'ar' | 'en' = 'fr';

  private constructor() {}

  static getInstance(): ReferentialService {
    if (!ReferentialService.instance) {
      ReferentialService.instance = new ReferentialService();
    }
    return ReferentialService.instance;
  }

  /**
   * Get all available referentials
   */
  async getAllReferentials(): Promise<ProjectReferential[]> {
    try {
      const referentials = getAllReferentials();
      
      return referentials.map(ref => ({
        code: ref.code,
        name: this.getLabel(ref.name),
        description: this.getLabel(ref.description),
        phases: ref.phases.map((phase: any) => ({
          id: phase.id || phase.code,
          label: this.getLabel(phase.label),
          description: this.getLabel(phase.description || ''),
          order: phase.order,
          steps: (phase.steps || []).map((step: any) => ({
            id: step.id || step.code,
            label: this.getLabel(step.label),
            description: this.getLabel(step.description || ''),
            order: step.order,
            tasks: (step.tasks || []).map((task: any) => ({
              id: task.id || task.code,
              label: this.getLabel(task.label),
              description: this.getLabel(task.description || ''),
              order: task.order || 0,
              estimated_duration_days: task.estimatedDurationDays || task.estimated_duration_days || 0
            }))
          }))
        })),
        requiresDonorApproval: ref.requiresDonorApproval || false,
        requiresMinistryApproval: ref.requiresMinistryApproval || false,
        requiresEngineeringConsultant: (ref as any).requiresEngineeringConsultant || false,
        paymentWorkflow: ref.paymentWorkflow || 'simplified'
      })) as any;
    } catch (error) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get all referentials');
    }
  }

  /**
   * Get a specific referential by code
   */
  async getReferential(referentialCode: ReferentialType): Promise<ReferentialDTO | null> {
    try {
      const ref = getReferential(referentialCode);
      
      if (!ref) {
        return null;
      }

      return {
        code: ref.code,
        name: this.getLabel(ref.name),
        description: this.getLabel(ref.description),
        phases: ref.phases.map((phase: any) => ({
          code: phase.code || phase.id || '',
          id: phase.id || phase.code,
          label: this.getLabel(phase.label),
          description: this.getLabel(phase.description || ''),
          order: phase.order,
          steps: (phase.steps || []).map((step: any) => ({
            code: step.code || step.id || '',
            id: step.id || step.code,
            label: this.getLabel(step.label),
            description: this.getLabel(step.description || ''),
            order: step.order,
            tasks: (step.tasks || []).map((task: any) => ({
              code: task.code || task.id || '',
              id: task.id || task.code,
              label: this.getLabel(task.label),
              description: this.getLabel(task.description || ''),
              order: task.order || 0,
              estimated_duration_days: task.estimatedDurationDays || task.estimated_duration_days || 0
            }))
          }))
        })),
        requiresDonorApproval: ref.requiresDonorApproval || false,
        requiresMinistryApproval: ref.requiresMinistryApproval || false,
        paymentWorkflow: ref.paymentWorkflow || 'simplified'
      } as any;
    } catch (error) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to get referential: ${referentialCode}`);
    }
  }

  /**
   * Get phases for a specific referential
   */
  async getPhasesForReferential(referentialCode: ReferentialType): Promise<ReferentialPhaseDTO[]> {
    try {
      const phases = getPhasesForReferential(referentialCode);
      
      return phases.map((phase: any) => ({
        code: phase.code || '',
        id: phase.id || phase.code,
        label: this.getLabel(phase.label),
        description: this.getLabel(phase.description || ''),
        order: phase.order,
        steps: (phase.steps || []).map((step: any) => ({
          code: step.code || '',
          id: step.id || step.code,
          label: this.getLabel(step.label),
          description: this.getLabel(step.description || ''),
          order: step.order,
          tasks: (step.tasks || []).map((task: any) => ({
            code: task.code || '',
            id: task.id || task.code,
            label: this.getLabel(task.label),
            description: this.getLabel(task.description || ''),
            order: task.order || 0,
            estimated_duration_days: task.estimatedDurationDays || task.estimated_duration_days || 0
          }))
        }))
      })) as any;
    } catch (error) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to get phases for referential: ${referentialCode}`);
    }
  }

  /**
   * Get referential options for dropdown/select components
   */
  async getReferentialOptions(): Promise<{ value: string; label: string; description?: string }[]> {
    try {
      const options = getReferentialOptions();
      
      return options.map(option => ({
        value: option.value,
        label: this.getLabel(option.label),
        description: this.getLabel(option.description)
      }));
    } catch (error) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get referential options');
    }
  }

  /**
   * Check if a referential requires donor approval
   */
  async requiresDonorApproval(referentialCode: ReferentialType): Promise<boolean> {
    try {
      const ref = await this.getReferential(referentialCode);
      return ref?.requiresDonorApproval || false;
    } catch (error) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to check donor approval requirement: ${referentialCode}`);
    }
  }

  /**
   * Check if a referential requires ministry approval
   */
  async requiresMinistryApproval(referentialCode: ReferentialType): Promise<boolean> {
    try {
      const ref = await this.getReferential(referentialCode);
      return ref?.requiresMinistryApproval || false;
    } catch (error) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to check ministry approval requirement: ${referentialCode}`);
    }
  }

  /**
   * Get payment workflow type for a referential
   */
  async getPaymentWorkflow(referentialCode: ReferentialType): Promise<'standard' | 'simplified' | 'custom'> {
    try {
      const ref = await this.getReferential(referentialCode);
      return ref?.paymentWorkflow || 'simplified';
    } catch (error) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to get payment workflow: ${referentialCode}`);
    }
  }

  /**
   * Convert referential phases to database-compatible format
   */
  async convertToProjectPhases(referentialCode: ReferentialType, projectId: string): Promise<ProjectPhaseDTO[]> {
    try {
      const phases = await this.getPhasesForReferential(referentialCode);
      
      return phases.map((phase: any, phaseIndex: number) => ({
        project_id: projectId,
        name: typeof phase.label === 'string' ? phase.label : (phase.label as any)?.fr || '',
        description: typeof phase.description === 'string' ? phase.description : (phase.description as any)?.fr || '',
        phase_number: phase.order,
        start_date: null,
        end_date: null,
        status: 'not_started' as const,
        phases: {
          referential_code: referentialCode,
          phase_id: phase.code || phase.id || '',
          steps: (phase.steps || []).map((step: any) => ({
            step_id: step.code || step.id || '',
            name: typeof step.label === 'string' ? step.label : (step.label as any)?.fr || '',
            description: typeof step.description === 'string' ? step.description : (step.description as any)?.fr || '',
            order_index: step.order,
            tasks: (step.tasks || []).map((task: any) => ({
              task_id: task.code || task.id || '',
              name: typeof task.label === 'string' ? task.label : (task.label as any)?.fr || '',
              description: typeof task.description === 'string' ? task.description : (task.description as any)?.fr || '',
              order_index: task.order || 0,
              estimated_duration_days: task.estimatedDurationDays || task.estimated_duration_days || 0
            }))
          }))
        }
      }));
    } catch (error) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to convert referential to project phases: ${referentialCode}`);
    }
  }

  /**
   * Set the current language for multilingual labels
   */
  setLanguage(language: 'fr' | 'ar' | 'en'): void {
    this.currentLanguage = language;
  }

  /**
   * Get the current language
   */
  getCurrentLanguage(): 'fr' | 'ar' | 'en' {
    return this.currentLanguage;
  }

  /**
   * Helper method to get localized label
   */
  private getLabel(label: MultiLanguageLabel | string | undefined): string {
    if (!label) {
      return '';
    }
    
    if (typeof label === 'string') {
      return label;
    }
    
    return label[this.currentLanguage] || label.fr || label.toString();
  }
}

// Export interfaces for external use
export type { ReferentialDTO, ReferentialPhaseDTO, ReferentialStepDTO, ReferentialTaskDTO };

// Export singleton instance
export const referentialService = ReferentialService.getInstance();
