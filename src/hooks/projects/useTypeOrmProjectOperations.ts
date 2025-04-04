
import { useState, useEffect } from 'react';
import { ProjectData } from '@/components/ProjectCard';
import { ProjectRepository } from '@/lib/typeorm/repositories/ProjectRepository';
import { projectToasts } from './projectToasts';

export const useTypeOrmProjectOperations = () => {
  const [projectRepository, setProjectRepository] = useState<ProjectRepository | null>(null);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize the repository
  useEffect(() => {
    const initRepository = async () => {
      try {
        const repo = await ProjectRepository.create();
        if (repo) {
          setProjectRepository(repo);
        } else {
          throw new Error('Failed to initialize repository');
        }
      } catch (err) {
        console.error('Failed to initialize TypeORM repository:', err);
        setError('Failed to initialize database connection');
      } finally {
        // Set loading to false even if initialization fails
        setLoading(false);
      }
    };
    
    initRepository();
  }, []);

  // Fetch projects using TypeORM
  const fetchProjects = async () => {
    if (!projectRepository) {
      projectToasts.connectionError();
      return;
    }

    setLoading(true);
    try {
      const data = await projectRepository.findAll();
      setProjects(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to fetch projects');
      projectToasts.fetchError();
    } finally {
      setLoading(false);
    }
  };

  // Create a new project
  const createProject = async (projectData: Omit<ProjectData, 'id'>) => {
    if (!projectRepository) {
      projectToasts.connectionError();
      throw new Error("Database connection not initialized");
    }

    try {
      const newProject = await projectRepository.create(projectData);
      
      // Update the local state
      setProjects(prev => [newProject, ...prev]);
      projectToasts.createSuccess(newProject.title);

      return newProject;
    } catch (err) {
      console.error('Error creating project:', err);
      projectToasts.createError();
      throw err;
    }
  };

  // Get a project by ID
  const getProject = async (id: string): Promise<ProjectData | null> => {
    if (!projectRepository) {
      projectToasts.connectionError();
      return null;
    }

    try {
      return await projectRepository.findById(id);
    } catch (err) {
      console.error(`Error fetching project with id ${id}:`, err);
      projectToasts.fetchDetailError();
      return null;
    }
  };

  // Update a project
  const updateProject = async (id: string, projectData: Partial<ProjectData>): Promise<ProjectData | null> => {
    if (!projectRepository) {
      projectToasts.connectionError();
      return null;
    }

    try {
      const updatedProject = await projectRepository.update(id, projectData);
      
      // Update local state if the project was updated
      if (updatedProject) {
        setProjects(prev => prev.map(p => p.id === id ? updatedProject : p));
        projectToasts.updateSuccess(updatedProject.title);
      }
      
      return updatedProject;
    } catch (err) {
      console.error(`Error updating project with id ${id}:`, err);
      projectToasts.updateError();
      return null;
    }
  };

  // Delete a project
  const deleteProject = async (id: string): Promise<boolean> => {
    if (!projectRepository) {
      projectToasts.connectionError();
      return false;
    }

    try {
      const success = await projectRepository.delete(id);
      
      if (success) {
        // Update local state if the project was deleted
        setProjects(prev => prev.filter(p => p.id !== id));
        projectToasts.deleteSuccess();
      }
      
      return success;
    } catch (err) {
      console.error(`Error deleting project with id ${id}:`, err);
      projectToasts.deleteError();
      return false;
    }
  };

  // Fetch projects when repository is initialized
  useEffect(() => {
    if (projectRepository) {
      fetchProjects();
    }
  }, [projectRepository]);

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    getProject,
    updateProject,
    deleteProject
  };
};
