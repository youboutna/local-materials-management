import { ProjectService, getProjectService} from '@/application/services/ProjectService';
import { CreateProjectDTO, ProjectDTO, ProjectFormDTO } from '@/dtos/entities/ProjectDTO';
import { toast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useEffect, useState } from 'react';

type ConstructionPhase = 'preparation' | 'foundation' | 'structure' | 'finishing' | 'completed';

interface Location {
  latitude: number;
  longitude: number;
}

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

const projectService = getProjectService();

export const useProjects = () => {
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: unknown) => {
    const message = err instanceof Error ? err.message : 'Unknown error';
    setError(message);
    toast({
      title: "Erreur",
      description: message,
      variant: "destructive",
    });
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const projectsList = await projectService.getAllProjects();
      setProjects(projectsList as unknown as ProjectDTO[]);
      setError(null);
    } catch (err: unknown) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData: Omit<ProjectDTO, 'id'>) => {
    try {
      const formDTO: ProjectFormDTO = {
        ...projectData,
        id: '',
        status: projectData.status,
        progress: projectData.progress || 0,
        currency: projectData.currency || 'MRU',
        teamSize: projectData.teamSize || 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const createdDTO = await projectService.createProject(formDTO as unknown as CreateProjectDTO);
      const newProject = createdDTO as unknown as ProjectDTO;

      setProjects(prev => [newProject, ...prev]);

      toast({
        title: "Projet créé",
        description: `Le projet "${createdDTO.title}" a été créé avec succès.`,
      });

      return newProject;
    } catch (err: unknown) {
      handleError(err);
      throw err;
    }
  };

  const getProject = async (id: string): Promise<ProjectDTO | null> => {
    try {
      const dto = await projectService.getProjectById(id);
      if (!dto) return null;
      return dto as unknown as ProjectDTO;
    } catch (err) {
      handleError(err);
      return null;
    }
  };

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
