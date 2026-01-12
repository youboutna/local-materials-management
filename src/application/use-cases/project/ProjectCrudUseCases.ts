/**
 * Project CRUD Use Cases
 */

import { Project } from '@/domain/entities/Project';
import { IProjectRepository } from '@/domain/repositories';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

// Get Projects List
export interface GetProjectsListResult {
  success: boolean;
  projects: Project[];
  error?: string;
}

export class GetProjectsListUseCase {
  private projectRepository: IProjectRepository;

  constructor(projectRepository?: IProjectRepository) {
    this.projectRepository = projectRepository || RepositoryFactory.getProjectRepository();
  }

  async execute(): Promise<GetProjectsListResult> {
    try {
      const projects = await this.projectRepository.findAll();
      return { success: true, projects };
    } catch (error) {
      console.error('GetProjectsListUseCase error:', error);
      return {
        success: false,
        projects: [],
        error: error instanceof Error ? error.message : 'Failed to fetch projects'
      };
    }
  }
}

// Get Project By Id
export interface GetProjectByIdResult {
  success: boolean;
  project: Project | null;
  error?: string;
}

export class GetProjectByIdUseCase {
  private projectRepository: IProjectRepository;

  constructor(projectRepository?: IProjectRepository) {
    this.projectRepository = projectRepository || RepositoryFactory.getProjectRepository();
  }

  async execute(id: string): Promise<GetProjectByIdResult> {
    try {
      const project = await this.projectRepository.findById(id);
      return { success: true, project };
    } catch (error) {
      console.error('GetProjectByIdUseCase error:', error);
      return {
        success: false,
        project: null,
        error: error instanceof Error ? error.message : 'Failed to fetch project'
      };
    }
  }
}

// Create Project
export interface CreateProjectInput {
  title: string;
  description: string;
  status?: string;
  location: string;
  budget: number;
  teamSize?: number;
  startDate?: Date;
  endDate?: Date;
  coordinates?: { latitude: number; longitude: number };
}

export interface CreateProjectResult {
  success: boolean;
  project: Project | null;
  error?: string;
}

export class CreateProjectUseCase {
  private projectRepository: IProjectRepository;

  constructor(projectRepository?: IProjectRepository) {
    this.projectRepository = projectRepository || RepositoryFactory.getProjectRepository();
  }

  async execute(input: CreateProjectInput): Promise<CreateProjectResult> {
    try {
      const project = Project.create({
        title: input.title,
        description: input.description,
        status: (input.status as any) || 'en attente',
        location: input.location,
        budget: input.budget,
        teamSize: input.teamSize || 0,
        progress: 0,
        startDate: input.startDate || new Date(),
        endDate: input.endDate || new Date(),
        coordinates: input.coordinates,
      });

      const createdProject = await this.projectRepository.create(project);
      return { success: true, project: createdProject };
    } catch (error) {
      console.error('CreateProjectUseCase error:', error);
      return {
        success: false,
        project: null,
        error: error instanceof Error ? error.message : 'Failed to create project'
      };
    }
  }
}

// Update Project
export interface UpdateProjectInput {
  title?: string;
  description?: string;
  status?: string;
  location?: string;
  budget?: number;
  progress?: number;
  teamSize?: number;
  startDate?: Date;
  endDate?: Date;
  coordinates?: { latitude: number; longitude: number };
}

export interface UpdateProjectResult {
  success: boolean;
  project: Project | null;
  error?: string;
}

export class UpdateProjectUseCase {
  private projectRepository: IProjectRepository;

  constructor(projectRepository?: IProjectRepository) {
    this.projectRepository = projectRepository || RepositoryFactory.getProjectRepository();
  }

  async execute(id: string, input: UpdateProjectInput): Promise<UpdateProjectResult> {
    try {
      const existing = await this.projectRepository.findById(id);
      if (!existing) {
        return { success: false, project: null, error: 'Project not found' };
      }

      // Create updated project with new values
      const updatedProject = Project.create({
        id: existing.id,
        title: input.title ?? existing.title,
        description: input.description ?? existing.description,
        status: (input.status as any) ?? existing.status,
        location: input.location ?? existing.location,
        budget: input.budget ?? existing.budget,
        progress: input.progress ?? existing.progress,
        teamSize: input.teamSize ?? existing.teamSize,
        startDate: input.startDate ?? existing.startDate,
        endDate: input.endDate ?? existing.endDate,
        coordinates: input.coordinates ?? existing.coordinates,
      });

      const result = await this.projectRepository.update(id, updatedProject);
      return { success: true, project: result };
    } catch (error) {
      console.error('UpdateProjectUseCase error:', error);
      return {
        success: false,
        project: null,
        error: error instanceof Error ? error.message : 'Failed to update project'
      };
    }
  }
}

// Delete Project
export interface DeleteProjectResult {
  success: boolean;
  error?: string;
}

export class DeleteProjectUseCase {
  private projectRepository: IProjectRepository;

  constructor(projectRepository?: IProjectRepository) {
    this.projectRepository = projectRepository || RepositoryFactory.getProjectRepository();
  }

  async execute(id: string): Promise<DeleteProjectResult> {
    try {
      await this.projectRepository.delete(id);
      return { success: true };
    } catch (error) {
      console.error('DeleteProjectUseCase error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete project'
      };
    }
  }
}
