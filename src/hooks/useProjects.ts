
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { ProjectData } from '@/types/project';
import { ProjectService } from '@/application/services/ProjectService';
import { ProjectFormDTO } from '@/types/dto';

// Use injectable service instead of direct Supabase dependency
const projectService = new ProjectService();

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
      id: dto.id,
      title: dto.title,
      description: '', // Not available in list view
      location: dto.location,
      status: dto.status as 'en cours' | 'terminé' | 'en attente' | 'suspendu' | 'annulé',
      progress: dto.progress,
      budget: dto.budget,
      startDate: dto.startDate,
      endDate: dto.endDate,
      thumbnail: dto.thumbnail,
      teamSize: dto.teamSize,
      coordinates: dto.coordinates
    }));

    setProjects(transformedData);
    setError(null);
  } catch (err) {
    console.error('Error fetching projects:', err);
    setError('Failed to fetch projects');
    toast({
      title: "Erreur",
      description: "Impossible de récupérer les projets. Veuillez réessayer plus tard.",
      variant: "destructive",
    });
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
        status: createdDTO.status as 'en cours' | 'terminé' | 'en attente' | 'suspendu' | 'annulé',
        progress: createdDTO.progress,
        budget: createdDTO.budget,
        startDate: createdDTO.startDate,
        endDate: createdDTO.endDate,
        thumbnail: createdDTO.thumbnail,
        teamSize: createdDTO.teamSize,
        coordinates: createdDTO.coordinates,
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
        currentPhase: createdDTO.currentPhase,
        currentStage: createdDTO.currentStage
      };

      // Update the local state
      setProjects(prev => [newProject, ...prev]);

      toast({
        title: "Projet créé",
        description: `Le projet "${createdDTO.title}" a été créé avec succès.`,
      });

      return newProject;
    } catch (err) {
      console.error('Error creating project:', err);
      toast({
        title: "Erreur",
        description: "Impossible de créer le projet. Veuillez réessayer plus tard.",
        variant: "destructive",
      });
      throw err;
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
        status: dto.status as 'en cours' | 'terminé' | 'en attente' | 'suspendu' | 'annulé',
        progress: dto.progress,
        budget: dto.budget,
        startDate: dto.startDate,
        endDate: dto.endDate,
        thumbnail: dto.thumbnail,
        teamSize: dto.teamSize,
        coordinates: dto.coordinates,
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
        currentPhase: dto.currentPhase,
        currentStage: dto.currentStage
      };
    } catch (err) {
      console.error(`Error fetching project with id ${id}:`, err);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les détails du projet.",
        variant: "destructive",
      });
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
