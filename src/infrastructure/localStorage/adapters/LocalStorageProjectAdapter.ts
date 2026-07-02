/**
 * LocalStorage Project Adapter
 * Implements IProjectRepository using LocalStorage for DEV_MODE
 */

import { 
  IProjectRepository, 
  Project, 
  ProjectStatus, 
  ProjectType 
} from '@/domain/repositories/IProjectRepository';
import { allProjectsData, MockProject } from '@/data/mockData';

// Convert MockProject to Project format
const mockProjects: Project[] = allProjectsData.map((mock: MockProject) => {
  // Map mock status to domain status
  const statusMap: Record<string, ProjectStatus> = {
    'draft': 'planning',
    'published': 'active',
    'in_progress': 'in_progress',
    'completed': 'completed',
    'cancelled': 'cancelled',
    'on_hold': 'suspended'
  };

  // Map mock type to domain type
  const typeMap: Record<string, ProjectType> = {
    'Construction': 'construction',
    'Fourniture': 'procurement',
    'Service': 'service',
    'Consulting': 'consulting'
  };

  return new Project(
    mock.id,
    mock.title,
    mock.description,
    typeMap[mock.type] || 'construction',
    statusMap[mock.status] || 'planning',
    mock.budget,
    mock.startDate,
    mock.endDate,
    mock.createdBy,
    mock.createdAt, // created_at
    mock.updatedAt  // updated_at
  );
});

export class LocalStorageProjectAdapter implements IProjectRepository {
  
  async findById(id: string): Promise<Project | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const projects = this.getProjectsFromStorage();
    const project = projects.find(p => p.id === id);
    
    return project || null;
  }

  async findAll(): Promise<Project[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const projects = this.getProjectsFromStorage();
    return projects;
  }

  async save(project: Project): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const projects = this.getProjectsFromStorage();
    const existingIndex = projects.findIndex(p => p.id === project.id);
    
    if (existingIndex >= 0) {
      projects[existingIndex] = project;
    } else {
      projects.push(project);
    }
    
    this.saveProjectsToStorage(projects);
    
    console.log(`[DEV_MODE] Saved project ${project.id}`);
  }

  async update(id: string, data: Partial<Project>): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const projects = this.getProjectsFromStorage();
    const projectIndex = projects.findIndex(p => p.id === id);
    
    if (projectIndex === -1) {
      throw new Error(`Project with id ${id} not found`);
    }
    
    projects[projectIndex] = {
      ...projects[projectIndex],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    this.saveProjectsToStorage(projects);
    
    console.log(`[DEV_MODE] Updated project ${id}`);
  }

  async delete(id: string): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const projects = this.getProjectsFromStorage();
    const projectIndex = projects.findIndex(p => p.id === id);
    
    if (projectIndex === -1) {
      throw new Error(`Project with id ${id} not found`);
    }
    
    projects.splice(projectIndex, 1);
    this.saveProjectsToStorage(projects);
    
    console.log(`[DEV_MODE] Deleted project ${id}`);
  }

  async findByStatus(status: ProjectStatus): Promise<Project[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const projects = this.getProjectsFromStorage();
    return projects.filter(project => project.status === status);
  }

  async findByType(type: ProjectType): Promise<Project[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const projects = this.getProjectsFromStorage();
    return projects.filter(project => project.type === type);
  }

  async findByManager(managerId: string): Promise<Project[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const projects = this.getProjectsFromStorage();
    return projects.filter(project => project.createdBy === managerId);
  }

  async findByDateRange(startDate: string, endDate: string): Promise<Project[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const projects = this.getProjectsFromStorage();
    return projects.filter(project => 
      project.startDate >= startDate && project.startDate <= endDate
    );
  }

  async search(query: string): Promise<Project[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const projects = this.getProjectsFromStorage();
    const searchLower = query.toLowerCase();
    
    return projects.filter(project => 
      project.title.toLowerCase().includes(searchLower) ||
      project.description?.toLowerCase().includes(searchLower)
    );
  }

  async findActive(): Promise<Project[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const projects = this.getProjectsFromStorage();
    return projects.filter(project => project.status === 'active');
  }

  async findCompleted(): Promise<Project[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const projects = this.getProjectsFromStorage();
    return projects.filter(project => project.status === 'completed');
  }

  async findByBudgetRange(minBudget: number, maxBudget: number): Promise<Project[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const projects = this.getProjectsFromStorage();
    return projects.filter(project => 
      project.budget >= minBudget && project.budget <= maxBudget
    );
  }

  async findByClient(clientId: string): Promise<Project[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const projects = this.getProjectsFromStorage();
    return projects.filter(project => project.createdBy === clientId); // Simplified for DEV_MODE
  }

  // ============= Utility Methods =============

  private getProjectsFromStorage(): Project[] {
    if (typeof window === 'undefined') return mockProjects;
    
    const stored = localStorage.getItem('dev_projects');
    return stored ? JSON.parse(stored) : mockProjects;
  }

  private saveProjectsToStorage(projects: Project[]): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('dev_projects', JSON.stringify(projects));
  }

  /**
   * Initialize localStorage with mock data
   */
  initializeMockData(): void {
    if (typeof window === 'undefined') return;
    
    if (!localStorage.getItem('dev_projects')) {
      localStorage.setItem('dev_projects', JSON.stringify(mockProjects));
    }
    
    console.log('[DEV_MODE] LocalStorage projects initialized with mock data');
  }

  /**
   * Clear all mock data from localStorage
   */
  clearMockData(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('dev_projects');
    
    console.log('[DEV_MODE] LocalStorage projects cleared');
  }

  /**
   * Get current mock data from localStorage
   */
  getMockData(): Project[] {
    return this.getProjectsFromStorage();
  }
}
