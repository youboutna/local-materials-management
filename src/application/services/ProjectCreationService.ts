/**
 * Project Creation Service - Hexagonal Architecture
 * Handles project creation with proper domain entities and DTOs
 */

import { Project } from '@/domain/entities/Project';
import { IProjectRepository as ProjectRepository } from '@/domain/repositories/IProjectRepository';
import { ProjectDTO, CreateProjectRequestDTO } from '@/dtos/entities/ProjectDTO';
import { ProjectTransformer } from '@/dtos/transforms';
import { AppError, ErrorCode } from '@/utils/errorHandling'; 

// Types spécifiques pour les données de création
export interface StakeholderData {
  id: string;
  type: 'employee' | 'supplier' | 'subcontractor' | 'consultant' | 'contractor' | 'freelancer' | 'client' | 'partner';
  role: 'project_manager' | 'technical_manager' | 'site_manager' | 'quality_inspector' | 'safety_inspector' | 'engineer' | 'architect' | 'consultant' | 'supplier' | 'subcontractor' | 'contractor' | 'client' | 'partner' | 'observer';
  organizationId: string | null;
  employeeId: string | null;
  isPrimary: boolean;
  isInternal: boolean;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string;
  organization?: {
    id: string;
    name: string;
    type: string;
    category?: string;
    contact?: {
      email: string;
      phone?: string;
      address?: string;
    };
  };
}

export interface DelegationData {
  projectManager: string;
  technicalManager: string;
  supervisor: string;
  client: string;
}

export interface PhaseData {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'planned' | 'in_progress' | 'completed' | 'delayed';
  progress: number;
  budget: number;
  dependencies: string[];
  tasks: Array<{
    id: string;
    name: string;
    description: string;
    status: string;
    assigneeId?: string;
    dueDate?: string;
  }>;
}

export interface RiskData {
  id: string;
  title: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
  status: 'open' | 'mitigated' | 'closed';
  assigneeId?: string;
  dueDate?: string;
}

export interface ComplianceData {
  id: string;
  requirement: string;
  standard: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'non_compliant';
  documents: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    uploadDate: string;
  }>;
  dueDate?: string;
  assigneeId?: string;
}

export interface ShapeData {
  type: string;
  coordinates: Array<Array<[number, number]>>;
  area: number;
  perimeter: number;
  center?: [number, number];
}

export interface ProjectCreationData extends CreateProjectRequestDTO {
  stakeholders: StakeholderData[];
  delegation: DelegationData;
  phases: PhaseData[];
  materials: Array<{ materialId: string; quantity: number }>;
  risks: RiskData[];
  compliance: ComplianceData[];
  shapeData: ShapeData;
}

export interface ProjectCreationResult {
  project: ProjectDTO;
  success: boolean;
  message: string;
}

export class ProjectCreationService {
  constructor(private projectRepository: ProjectRepository) {}

  /**
   * Create a new project with all related data
   */
  async createProject(data: ProjectCreationData): Promise<ProjectCreationResult> {
    try {
      console.info('PROJECT_CREATION_SERVICE_001: Starting project creation', {
        code: 'PROJECT_CREATION_SERVICE_001',
        message: 'Début de la création de projet',
        projectTitle: data.title,
        stack: new Error().stack
      });

      // Validate required fields
      this.validateProjectData(data);

      // Transform DTO to Domain Entity
      const projectEntity = ProjectTransformer.fromCreateDTOToEntity(data);

      // Save project to repository
      const savedProject = await this.projectRepository.create(projectEntity);

      // Transform back to DTO for response
      const projectDTO = ProjectTransformer.toResponseDto(savedProject);

      console.info('PROJECT_CREATION_SERVICE_002: Project created successfully', {
        code: 'PROJECT_CREATION_SERVICE_002',
        message: 'Projet créé avec succès',
        projectId: projectDTO.id,
        projectTitle: projectDTO.title,
        stack: new Error().stack
      });

      return {
        project: projectDTO,
        success: true,
        message: 'Projet créé avec succès'
      };

    } catch (error) {
      console.error('PROJECT_CREATION_SERVICE_003: Failed to create project', {
        code: 'PROJECT_CREATION_SERVICE_003',
        message: 'Échec de la création de projet',
        projectTitle: data.title,
        technicalError: error,
        stack: new Error().stack
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Erreur lors de la création du projet',
        500,
        { originalError: error }
      );
    }
  }

  /**
   * Validate project data before creation
   */
  private validateProjectData(data: ProjectCreationData): void {
    const errors: string[] = [];

    // Basic validation
    if (!data.title || data.title.trim().length === 0) {
      errors.push('Le titre du projet est requis');
    }

    if (!data.description || data.description.trim().length === 0) {
      errors.push('La description du projet est requise');
    }

    if (!data.startDate) {
      errors.push('La date de début est requise');
    }

    if (!data.endDate) {
      errors.push('La date de fin est requise');
    }

    if (data.startDate && data.endDate && new Date(data.startDate) >= new Date(data.endDate)) {
      errors.push('La date de fin doit être postérieure à la date de début');
    }

    // Budget validation
    if (!data.budget || data.budget <= 0) {
      errors.push('Le budget doit être supérieur à 0');
    }

    // Location validation
    if (!data.address || data.address.trim().length === 0) {
      errors.push('L\'adresse du projet est requise');
    }

    // Stakeholders validation
    if (!data.stakeholders || data.stakeholders.length === 0) {
      errors.push('Au moins un stakeholder est requis');
    }

    // Phases validation
    if (!data.phases || data.phases.length === 0) {
      errors.push('Au moins une phase est requise');
    }

    if (errors.length > 0) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Données de projet invalides',
        400,
        { errors }
      );
    }

    console.info('PROJECT_CREATION_SERVICE_006: Project data validated', {
      code: 'PROJECT_CREATION_SERVICE_006',
      message: 'Données de projet validées',
      projectTitle: data.title,
      stack: new Error().stack
    });
  }

  /**
   * Calculate project progress based on phases
   */
  async calculateProjectProgress(phases: PhaseData[]): Promise<number> {
    try {
      console.info('PROJECT_CREATION_SERVICE_007: Calculating project progress', {
        code: 'PROJECT_CREATION_SERVICE_007',
        message: 'Calcul de la progression du projet',
        phasesCount: phases.length,
        stack: new Error().stack
      });

      // Simple progress calculation based on phases
      if (!phases || phases.length === 0) {
        return 0;
      }

      const totalPhases = phases.length;
      const completedPhases = phases.filter(phase => phase.status === 'completed').length;
      const progress = (completedPhases / totalPhases) * 100;

      console.info('PROJECT_CREATION_SERVICE_008: Progress calculated', {
        code: 'PROJECT_CREATION_SERVICE_008',
        message: 'Progression calculée',
        progress,
        completedPhases,
        totalPhases,
        stack: new Error().stack
      });

      return Math.round(progress);

    } catch (error) {
      console.error('PROJECT_CREATION_SERVICE_009: Failed to calculate progress', {
        code: 'PROJECT_CREATION_SERVICE_009',
        message: 'Échec du calcul de la progression',
        technicalError: error,
        stack: new Error().stack
      });

      return 0;
    }
  }

  /**
   * Get project creation template
   */
  getProjectTemplate(): CreateProjectRequestDTO {
    return {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      budget: 0,
      address: '',
      latitude: 0,
      longitude: 0,
      projectManagerId: '',
      clientId: '',
      status: 'planned',
      priority: 'medium',
      estimatedDuration: 0
    };
  }
}
