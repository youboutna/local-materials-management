/**
 * Project Form Application Service
 * Orchestrates project form operations using hexagonal architecture
 */

import { IProjectFormRepository } from '@/domain/repositories/IProjectFormRepository';
import { RepositoryFactory } from '@/application/services/RepositoryFactory';

// Define ProjectFormData interface for this service
interface ProjectFormData {
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

interface SaveContext {
  currentStep: number;
  totalSteps: number;
}

export class ProjectFormService {
  private projectFormRepository: IProjectFormRepository;

  constructor() {
    this.projectFormRepository = RepositoryFactory.getProjectFormRepository();
  }

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

  mapFieldsFromDB(dbData: any): ProjectFormData {
    return {
      title: dbData.title || '',
      description: dbData.description || '',
      location: dbData.location || '',
      status: this.mapStatusFromDB(dbData.status),
      progress: dbData.progress || 0,
      budget: dbData.budget || 0,
      start_date: this.formatDateForInput(dbData.start_date),
      end_date: this.formatDateForInput(dbData.end_date),
      team_size: dbData.team_size || 0,
    } as ProjectFormData;
  }

  mapFieldsToDB(formData: ProjectFormData, step?: number): any {
    return {
      title: formData.title,
      description: formData.description,
      location: formData.location,
      status: formData.status,
      progress: formData.progress,
      budget: formData.budget,
      start_date: (formData as any).start_date || (formData as any).startDate,
      end_date: (formData as any).end_date || (formData as any).endDate,
      team_size: (formData as any).team_size || (formData as any).teamSize,
      current_step: step
    };
  }

  validateStepData(formData: ProjectFormData, step: number): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (step === 1) {
      if (!formData.title || formData.title.trim() === '') {
        errors.push('Le titre du projet est requis');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  async saveStepData(
    projectId: string | null,
    formData: ProjectFormData,
    step: number
  ): Promise<{ success: boolean; projectId: string | null; error?: string }> {
    return await this.projectFormRepository.saveStepData(projectId, formData, step);
  }

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

  async loadProjectData(projectId: string): Promise<ProjectFormData | null> {
    return await this.projectFormRepository.loadProjectData(projectId);
  }

  async loadRelatedData(projectId: string): Promise<Partial<ProjectFormData>> {
    return await this.projectFormRepository.loadRelatedData(projectId);
  }

  async loadBaseData(): Promise<any> {
    return await this.projectFormRepository.loadBaseData();
  }

  validateStep(stepId: number, formData: ProjectFormData): boolean {
    return this.projectFormRepository.validateStep(stepId, formData);
  }

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
