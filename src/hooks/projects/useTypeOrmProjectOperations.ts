
import { useState, useEffect } from 'react';
import { ProjectData } from '@/components/ProjectCard';
import { ProjectRepository } from '@/lib/typeorm/repositories/ProjectRepository';
import { projectToasts } from './projectToasts';

export const useTypeOrmProjectOperations = () => {
  const [projectRepository, setProjectRepository] = useState<ProjectRepository | null>(null);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(false);  // Start with loading false
  const [error, setError] = useState<string | null>(null);
  
  // Initialize the repository - but skip actual initialization in browser environments
  useEffect(() => {
    // We don't actually initialize TypeORM in browser environment
    // Just set loading to false immediately
    setLoading(false);
    setError('TypeORM is not supported in browser environments');
  }, []);

  // Fetch projects using TypeORM - stub method that will never be called
  const fetchProjects = async () => {
    projectToasts.connectionError();
    return;
  };

  // Create a new project - stub method that will never be called
  const createProject = async (projectData: Omit<ProjectData, 'id'>) => {
    projectToasts.connectionError();
    throw new Error("Database connection not initialized");
  };

  // Get a project by ID - stub method that will never be called
  const getProject = async (id: string): Promise<ProjectData | null> => {
    projectToasts.connectionError();
    return null;
  };

  // Update a project - stub method that will never be called
  const updateProject = async (id: string, projectData: Partial<ProjectData>): Promise<ProjectData | null> => {
    projectToasts.connectionError();
    return null;
  };

  // Delete a project - stub method that will never be called
  const deleteProject = async (id: string): Promise<boolean> => {
    projectToasts.connectionError();
    return false;
  };

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
