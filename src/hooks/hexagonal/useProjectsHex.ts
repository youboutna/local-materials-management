/**
 * Hook hexagonal pour les projets
 * Encapsule les use cases de l'architecture hexagonale
 */
import { useState, useEffect, useCallback } from 'react';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { 
  GetProjectsListUseCase,
  GetProjectByIdUseCase,
  CreateProjectUseCase,
  UpdateProjectUseCase,
  type CreateProjectInput,
  type UpdateProjectInput
} from '@/application/use-cases';
import { Project } from '@/domain/entities/Project';

// Singleton instances des use cases
const projectRepository = RepositoryFactory.getProjectRepository();
const getProjectsListUseCase = new GetProjectsListUseCase(projectRepository);
const getProjectByIdUseCase = new GetProjectByIdUseCase(projectRepository);
const createProjectUseCase = new CreateProjectUseCase(projectRepository);
const updateProjectUseCase = new UpdateProjectUseCase(projectRepository);

export interface UseProjectsHexResult {
  projects: Project[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createProject: (data: CreateProjectInput) => Promise<Project | null>;
  updateProject: (id: string, data: UpdateProjectInput) => Promise<Project | null>;
}

export function useProjectsHex(): UseProjectsHexResult {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getProjectsListUseCase.execute();
      if (result.success) {
        setProjects(result.projects);
      } else {
        throw new Error(result.error || 'Failed to fetch projects');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch projects'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = useCallback(async (data: CreateProjectInput): Promise<Project | null> => {
    const result = await createProjectUseCase.execute(data);
    if (result.success && result.project) {
      await fetchProjects();
      return result.project;
    }
    throw new Error(result.error || 'Failed to create project');
  }, [fetchProjects]);

  const updateProject = useCallback(async (id: string, data: UpdateProjectInput): Promise<Project | null> => {
    const result = await updateProjectUseCase.execute(id, data);
    if (result.success && result.project) {
      await fetchProjects();
      return result.project;
    }
    throw new Error(result.error || 'Failed to update project');
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
    createProject,
    updateProject,
  };
}

export interface UseProjectHexResult {
  project: Project | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useProjectHex(projectId: string | undefined): UseProjectHexResult {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProject = useCallback(async () => {
    if (!projectId) {
      setProject(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await getProjectByIdUseCase.execute(projectId);
      if (result.success) {
        setProject(result.project);
      } else {
        throw new Error(result.error || 'Failed to fetch project');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch project'));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  return {
    project,
    loading,
    error,
    refetch: fetchProject,
  };
}
