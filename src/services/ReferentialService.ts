/**
 * Referential Service
 * Service layer for working with project referentials
 */

import { 
  getReferential, 
  getAllReferentials, 
  getPhasesForReferential, 
  getReferentialOptions,
  getLabel,
  ReferentialType,
  ProjectReferential,
  MultiLanguageLabel
} from '@/config/referentials';

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
   * Set the current language for label retrieval
   */
  setLanguage(language: 'fr' | 'ar' | 'en') {
    this.currentLanguage = language;
  }

  /**
   * Get current language
   */
  getLanguage(): 'fr' | 'ar' | 'en' {
    return this.currentLanguage;
  }

  /**
   * Get a referential by code
   */
  getReferential(code: ReferentialType): ProjectReferential | undefined {
    return getReferential(code);
  }

  /**
   * Get all referentials
   */
  getAllReferentials(): ProjectReferential[] {
    return getAllReferentials();
  }

  /**
   * Get referential options for dropdown
   */
  getReferentialOptions() {
    return getReferentialOptions(this.currentLanguage);
  }

  /**
   * Get phases for a referential
   */
  getPhasesForReferential(referentialCode: ReferentialType) {
    return getPhasesForReferential(referentialCode, this.currentLanguage);
  }

  /**
   * Get a localized label
   */
  getLabel(label: MultiLanguageLabel): string {
    return getLabel(label, this.currentLanguage);
  }

  /**
   * Check if a referential requires engineering consultant
   */
  requiresEngineeringConsultant(referentialCode: ReferentialType): boolean {
    const ref = this.getReferential(referentialCode);
    return ref?.requiresEngineeringConsultant || false;
  }

  /**
   * Check if a referential requires donor approval
   */
  requiresDonorApproval(referentialCode: ReferentialType): boolean {
    const ref = this.getReferential(referentialCode);
    return ref?.requiresDonorApproval || false;
  }

  /**
   * Check if a referential requires ministry approval
   */
  requiresMinistryApproval(referentialCode: ReferentialType): boolean {
    const ref = this.getReferential(referentialCode);
    return ref?.requiresMinistryApproval || false;
  }

  /**
   * Get payment workflow type for a referential
   */
  getPaymentWorkflow(referentialCode: ReferentialType): 'standard' | 'simplified' | 'custom' {
    const ref = this.getReferential(referentialCode);
    return ref?.paymentWorkflow || 'simplified';
  }

  /**
   * Convert referential phases to database-compatible format
   */
  convertToProjectPhases(referentialCode: ReferentialType, projectId: string) {
    const phases = this.getPhasesForReferential(referentialCode);
    
    return phases.map((phase, phaseIndex) => ({
      project_id: projectId,
      name: phase.label,
      description: phase.description || '',
      phase_number: phase.order,
      start_date: null,
      end_date: null,
      status: 'not_started' as const,
      budget: 0,
      progress: 0,
      // Store steps as JSON for now - can be normalized later
      steps: phase.steps.map((step, stepIndex) => ({
        code: step.code,
        name: step.label,
        order: step.order,
        tasks: step.tasks.map((task, taskIndex) => ({
          code: task.code,
          name: task.label,
          description: task.description || '',
          requiresInspection: task.requiresInspection,
          requiresEngineerApproval: task.requiresEngineerApproval,
          estimatedDurationDays: task.estimatedDurationDays
        }))
      }))
    }));
  }

  /**
   * Validate project data against referential requirements
   */
  validateProjectData(referentialCode: ReferentialType, projectData: any): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const ref = this.getReferential(referentialCode);

    if (!ref) {
      errors.push('Referential not found');
      return { isValid: false, errors, warnings };
    }

    // Check required fields based on referential
    if (ref.requiresEngineeringConsultant && !projectData.engineering_consultant) {
      errors.push('Engineering consultant is required for this project type');
    }

    if (ref.requiresDonorApproval && !projectData.donor_organization) {
      warnings.push('Donor organization should be specified for this project type');
    }

    if (ref.requiresMinistryApproval && !projectData.ministry_approval) {
      warnings.push('Ministry approval will be required for this project');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get default stakeholders required for a referential
   */
  getRequiredStakeholders(referentialCode: ReferentialType): string[] {
    const ref = this.getReferential(referentialCode);
    if (!ref) return [];

    const stakeholders: string[] = ['contractor', 'project_manager'];

    if (ref.requiresEngineeringConsultant) {
      stakeholders.push('engineering_consultant');
    }

    if (ref.requiresDonorApproval) {
      stakeholders.push('donor_representative');
    }

    if (ref.requiresMinistryApproval) {
      stakeholders.push('ministry_representative');
    }

    return stakeholders;
  }
}

// Export singleton instance
export const referentialService = ReferentialService.getInstance();
