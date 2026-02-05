import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { ProjectService } from '@/application/services/ProjectService';
import { ProjectFormDTO, ProjectData, CreateProjectRequestDto, UpdateProjectRequestDto, LocationDTO } from '@/dtos/entities/ProjectDTO';
import { RepositoryFactory } from '@/infrastructure/repository/RepositoryFactory';

interface ProjectAnalytics {
  progress: number;
  budgetUsage: number;
  riskScore: number;
  issues: string[];
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

type ServiceCreateProjectDTO = Omit<CreateProjectRequestDto, 'status'> & { status?: string };
type ServiceUpdateProjectDTO = Omit<UpdateProjectRequestDto, 'status'> & { status?: string };

type ProjectStatus = 'en cours' | 'terminé' | 'en attente' | 'suspendu' | 'annulé';

type ConstructionPhase = 'preparation' | 'foundation' | 'structure' | 'finishing' | 'completed';

interface Location {
  latitude: number;
  longitude: number;
}

interface SafeCoordinates {
  latitude: number;
  longitude: number;
}

const safeCoordinates = (coords?: LocationDTO): SafeCoordinates | undefined => {
  if (!coords || coords.latitude === undefined || coords.longitude === undefined) 
    return undefined;
  return {
    latitude: coords.latitude,
    longitude: coords.longitude
  };
};

const safeLocation = (loc?: any): Location | undefined => {
  if (!loc || loc.latitude === undefined || loc.longitude === undefined) 
    return undefined;
  return {
    latitude: loc.latitude,
    longitude: loc.longitude
  };
};

const toConstructionPhase = (phase?: string): ConstructionPhase | undefined => {
  const validPhases: ConstructionPhase[] = ['preparation', 'foundation', 'structure', 'finishing', 'completed'];
  return phase && validPhases.includes(phase as ConstructionPhase) 
    ? phase as ConstructionPhase 
    : undefined;
};

// Use injectable service instead of direct Supabase dependency
const projectService = new ProjectService(RepositoryFactory.getProjectRepository());

const handleError = (error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  setError(message);
  toast({
    title: "Erreur",
    description: message,
    variant: "destructive",
  });
};

export const useProjects = () => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

const fetchProjects = async () => {
  setLoading(true);
  try {
    // Use service layer instead of direct Supabase calls
    const projectsList = await projectService.getAllProjects();
    
    // Map DTOs to ProjectData (ProjectListItemDTO has limited fields)
    const transformedData: ProjectData[] = projectsList.map((dto) => ({
      ...dto,
      coordinates: safeLocation(dto.coordinates),
      status: dto.status as ProjectStatus,
      currentPhase: toConstructionPhase(dto.currentPhase)
    }));

    setProjects(transformedData);
    setError(null);
  } catch (error: unknown) {
    handleError(error);
  } finally {
    setLoading(false);
  }
};

  const createProject = async (projectData: Omit<ProjectData, 'id'>) => {
    try {
      // Use service layer with DTO mapping
      const formDTO: ProjectFormDTO = {
        title: projectData.title,
        description: projectData.description,
        location: projectData.location,
        budget: projectData.budget,
        startDate: projectData.startDate,
        endDate: projectData.endDate,
        teamSize: projectData.teamSize,
        coordinates: projectData.coordinates,
        financingSource: projectData.financingSource,
        marketType: projectData.marketType,
        selectionMode: projectData.selectionMode,
        launchDate: projectData.launchDate,
        attributionDate: projectData.attributionDate,
        projectReference: projectData.projectReference,
        projectResponsableId: projectData.projectResponsableId,
        mainContractor: projectData.mainContractor,
        allowsInitialPayment: projectData.allowsInitialPayment,
        initialPaymentPercentage: projectData.initialPaymentPercentage
      };

      const createdDTO = await projectService.createProject(formDTO);

      // Map back to ProjectData
      const newProject: ProjectData = {
        id: createdDTO.id,
        title: createdDTO.title,
        description: createdDTO.description,
        location: createdDTO.location,
        status: createdDTO.status as ProjectStatus,
        progress: createdDTO.progress,
        budget: createdDTO.budget,
        startDate: createdDTO.startDate,
        endDate: createdDTO.endDate,
        thumbnail: createdDTO.thumbnail,
        teamSize: createdDTO.teamSize,
        coordinates: safeLocation(createdDTO.coordinates),
        financingSource: createdDTO.financingSource,
        marketType: createdDTO.marketType,
        selectionMode: createdDTO.selectionMode,
        launchDate: createdDTO.launchDate,
        attributionDate: createdDTO.attributionDate,
        projectReference: createdDTO.projectReference,
        projectResponsableId: createdDTO.projectResponsableId,
        mainContractor: createdDTO.mainContractor,
        allowsInitialPayment: createdDTO.allowsInitialPayment,
        initialPaymentPercentage: createdDTO.initialPaymentPercentage,
        currentPhase: toConstructionPhase(createdDTO.currentPhase),
        currentStage: createdDTO.currentStage
      };

      // Update the local state
      setProjects(prev => [newProject, ...prev]);

      toast({
        title: "Projet créé",
        description: `Le projet "${createdDTO.title}" a été créé avec succès.`,
      });

      return newProject;
    } catch (error: unknown) {
      handleError(error);
      throw error;
    }
  };

  const getProject = async (id: string): Promise<ProjectData | null> => {
    try {
      const dto = await projectService.getProjectById(id);
      
      if (!dto) return null;

      // Map DTO to ProjectData
      return {
        id: dto.id,
        title: dto.title,
        description: dto.description,
        location: dto.location,
        status: dto.status as ProjectStatus,
        progress: dto.progress,
        budget: dto.budget,
        startDate: dto.startDate,
        endDate: dto.endDate,
        thumbnail: dto.thumbnail,
        teamSize: dto.teamSize,
        coordinates: safeLocation(dto.coordinates),
        financingSource: dto.financingSource,
        marketType: dto.marketType,
        selectionMode: dto.selectionMode,
        launchDate: dto.launchDate,
        attributionDate: dto.attributionDate,
        projectReference: dto.projectReference,
        projectResponsableId: dto.projectResponsableId,
        mainContractor: dto.mainContractor,
        allowsInitialPayment: dto.allowsInitialPayment,
        initialPaymentPercentage: dto.initialPaymentPercentage,
        currentPhase: toConstructionPhase(dto.currentPhase),
        currentStage: dto.currentStage
      };
    } catch (err) {
      handleError(err);
      return null;
    }
  };

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    getProject
  };
};
