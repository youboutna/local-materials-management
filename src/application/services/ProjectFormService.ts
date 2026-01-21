/**
 * Project Form Application Service
 * Handles project form operations with in-memory storage
 */

// Define ProjectFormData interface for this service
export interface ProjectFormData {
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
  isDraft?: boolean;
  isComplete?: boolean;
  saveType?: string;
}

// In-memory storage for project form data
const projectFormStore = new Map<string, ProjectFormData>();

export class ProjectFormService {
  formatDateForInput = (dateString: unknown): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString as string);
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

  mapFieldsFromDB(dbData: Record<string, unknown>): ProjectFormData {
    return {
      title: (dbData.title as string) || '',
      description: (dbData.description as string) || '',
      location: (dbData.location as string) || '',
      status: this.mapStatusFromDB(dbData.status as string),
      progress: (dbData.progress as number) || 0,
      budget: (dbData.budget as number) || 0,
      start_date: this.formatDateForInput(dbData.start_date),
      end_date: this.formatDateForInput(dbData.end_date),
      team_size: (dbData.team_size as number) || 0,
    };
  }

  mapFieldsToDB(formData: ProjectFormData, step?: number): Record<string, unknown> {
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
    try {
      const id = projectId || crypto.randomUUID();
      projectFormStore.set(id, formData);
      return { success: true, projectId: id };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, projectId: null, error: message };
    }
  }

  async saveStepRelatedData(
    projectId: string,
    step: number,
    data: {
      phases?: unknown[];
      risks?: unknown[];
      materials?: unknown[];
      stakeholders?: unknown[];
    }
  ): Promise<{ success: boolean; error?: string }> {
    // Mock implementation - just return success
    return { success: true };
  }

  async loadProjectData(projectId: string): Promise<ProjectFormData | null> {
    return projectFormStore.get(projectId) || null;
  }

  async loadRelatedData(projectId: string): Promise<Partial<ProjectFormData>> {
    return {};
  }

  async loadBaseData(): Promise<unknown> {
    return {};
  }

  validateStep(stepId: number, formData: ProjectFormData): boolean {
    const result = this.validateStepData(formData, stepId);
    return result.valid;
  }

  processFormDataForSave(formData: ProjectFormData, context: SaveContext): Record<string, unknown> {
    return {
      ...formData,
      currentStep: context.currentStep,
      isDraft: context.isDraft ?? false,
      isComplete: context.isComplete ?? false,
      saveType: context.saveType ?? 'draft',
    };
  }
}
