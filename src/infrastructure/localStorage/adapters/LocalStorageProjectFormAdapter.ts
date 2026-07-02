/**
 * LocalStorage Project Form Adapter
 * Implements IProjectFormRepository using LocalStorage for DEV_MODE
 */

import { 
  IProjectFormRepository, 
  ProjectForm, 
  FormStatus, 
  FormType 
} from '@/domain/repositories/IProjectFormRepository';
import { allProjectFormsData, MockProjectForm } from '@/data/mockData';

// Convert MockProjectForm to ProjectForm format
const mockProjectForms: ProjectForm[] = allProjectFormsData.map((mock: MockProjectForm) => {
  // Map mock status to domain status
  const statusMap: Record<string, FormStatus> = {
    'draft': 'draft',
    'published': 'published',
    'closed': 'closed',
    'archived': 'archived'
  };

  // Map mock type to domain type
  const typeMap: Record<string, FormType> = {
    'pre_qualification': 'pre_qualification',
    'technical': 'technical',
    'financial': 'financial',
    'legal': 'legal',
    'administrative': 'administrative'
  };

  return new ProjectForm(
    mock.id,
    mock.title,
    mock.description,
    typeMap[mock.type] || 'pre_qualification',
    statusMap[mock.status] || 'draft',
    mock.projectId,
    mock.deadline,
    mock.submissionDate,
    mock.evaluationCriteria,
    mock.requiredDocuments,
    mock.submittedBy,
    mock.evaluatedBy,
    mock.evaluationDate,
    mock.score,
    mock.decision,
    mock.decisionReason,
    mock.createdBy,
    mock.createdAt, // created_at
    mock.updatedAt  // updated_at
  );
});

export class LocalStorageProjectFormAdapter implements IProjectFormRepository {
  
  async findById(id: string): Promise<ProjectForm | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const projectForms = this.getProjectFormsFromStorage();
    const projectForm = projectForms.find(pf => pf.id === id);
    
    return projectForm || null;
  }

  async findAll(): Promise<ProjectForm[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const projectForms = this.getProjectFormsFromStorage();
    return projectForms;
  }

  async save(projectForm: ProjectForm): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const projectForms = this.getProjectFormsFromStorage();
    const existingIndex = projectForms.findIndex(pf => pf.id === projectForm.id);
    
    if (existingIndex >= 0) {
      projectForms[existingIndex] = projectForm;
    } else {
      projectForms.push(projectForm);
    }
    
    this.saveProjectFormsToStorage(projectForms);
    
    console.log(`[DEV_MODE] Saved project form ${projectForm.id}`);
  }

  async update(id: string, data: Partial<ProjectForm>): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const projectForms = this.getProjectFormsFromStorage();
    const projectFormIndex = projectForms.findIndex(pf => pf.id === id);
    
    if (projectFormIndex === -1) {
      throw new Error(`Project form with id ${id} not found`);
    }
    
    projectForms[projectFormIndex] = {
      ...projectForms[projectFormIndex],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    this.saveProjectFormsToStorage(projectForms);
    
    console.log(`[DEV_MODE] Updated project form ${id}`);
  }

  async delete(id: string): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const projectForms = this.getProjectFormsFromStorage();
    const projectFormIndex = projectForms.findIndex(pf => pf.id === id);
    
    if (projectFormIndex === -1) {
      throw new Error(`Project form with id ${id} not found`);
    }
    
    projectForms.splice(projectFormIndex, 1);
    this.saveProjectFormsToStorage(projectForms);
    
    console.log(`[DEV_MODE] Deleted project form ${id}`);
  }

  async findByProject(projectId: string): Promise<ProjectForm[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const projectForms = this.getProjectFormsFromStorage();
    return projectForms.filter(pf => pf.projectId === projectId);
  }

  async findByType(type: FormType): Promise<ProjectForm[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const projectForms = this.getProjectFormsFromStorage();
    return projectForms.filter(pf => pf.type === type);
  }

  async findByStatus(status: FormStatus): Promise<ProjectForm[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const projectForms = this.getProjectFormsFromStorage();
    return projectForms.filter(pf => pf.status === status);
  }

  async findByDeadlineRange(startDate: string, endDate: string): Promise<ProjectForm[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const projectForms = this.getProjectFormsFromStorage();
    return projectForms.filter(pf => 
      pf.deadline >= startDate && pf.deadline <= endDate
    );
  }

  async search(query: string): Promise<ProjectForm[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const projectForms = this.getProjectFormsFromStorage();
    const searchLower = query.toLowerCase();
    
    return projectForms.filter(pf => 
      pf.title.toLowerCase().includes(searchLower) ||
      pf.description?.toLowerCase().includes(searchLower)
    );
  }

  async findOpen(): Promise<ProjectForm[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const projectForms = this.getProjectFormsFromStorage();
    return projectForms.filter(pf => pf.status === 'published');
  }

  async findClosed(): Promise<ProjectForm[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const projectForms = this.getProjectFormsFromStorage();
    return projectForms.filter(pf => pf.status === 'closed' || pf.status === 'archived');
  }

  async findOverdue(): Promise<ProjectForm[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const projectForms = this.getProjectFormsFromStorage();
    const now = new Date().toISOString();
    return projectForms.filter(pf => pf.deadline < now && pf.status !== 'closed' && pf.status !== 'archived');
  }

  async findByScoreRange(minScore: number, maxScore: number): Promise<ProjectForm[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const projectForms = this.getProjectFormsFromStorage();
    return projectForms.filter(pf => 
      pf.score >= minScore && pf.score <= maxScore
    );
  }

  // ============= Utility Methods =============

  private getProjectFormsFromStorage(): ProjectForm[] {
    if (typeof window === 'undefined') return mockProjectForms;
    
    const stored = localStorage.getItem('dev_project_forms');
    return stored ? JSON.parse(stored) : mockProjectForms;
  }

  private saveProjectFormsToStorage(projectForms: ProjectForm[]): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('dev_project_forms', JSON.stringify(projectForms));
  }

  /**
   * Initialize localStorage with mock data
   */
  initializeMockData(): void {
    if (typeof window === 'undefined') return;
    
    if (!localStorage.getItem('dev_project_forms')) {
      localStorage.setItem('dev_project_forms', JSON.stringify(mockProjectForms));
    }
    
    console.log('[DEV_MODE] LocalStorage project forms initialized with mock data');
  }

  /**
   * Clear all mock data from localStorage
   */
  clearMockData(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('dev_project_forms');
    
    console.log('[DEV_MODE] LocalStorage project forms cleared');
  }

  /**
   * Get current mock data from localStorage
   */
  getMockData(): ProjectForm[] {
    return this.getProjectFormsFromStorage();
  }
}
