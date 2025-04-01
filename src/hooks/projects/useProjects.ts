
import { useProjects as useSupabaseProjects } from '@/hooks/useProjects';
import { useTypeOrmProjectOperations } from './useTypeOrmProjectOperations';
import { USE_TYPEORM } from './constants';
import { projectToasts } from './projectToasts';
import { ProjectData } from '@/components/ProjectCard';

export const useProjects = () => {
  const typeOrmOperations = useTypeOrmProjectOperations();
  const supabaseProjects = useSupabaseProjects();

  // Get projects from the active data source
  const projects = USE_TYPEORM ? typeOrmOperations.projects : supabaseProjects.projects;
  
  // Get loading state from the active data source  
  const loading = USE_TYPEORM ? typeOrmOperations.loading : supabaseProjects.loading;
  
  // Get error state from the active data source
  const error = USE_TYPEORM ? typeOrmOperations.error : supabaseProjects.error;
  
  // Fetch projects from the active data source
  const fetchProjects = USE_TYPEORM ? typeOrmOperations.fetchProjects : supabaseProjects.fetchProjects;
  
  // Create project with the active data source
  const createProject = USE_TYPEORM ? typeOrmOperations.createProject : supabaseProjects.createProject;
  
  // Get project by ID from the active data source
  const getProject = USE_TYPEORM ? typeOrmOperations.getProject : supabaseProjects.getProject;

  // Update project (with Supabase fallback)
  const updateProject = async (id: string, projectData: Partial<ProjectData>): Promise<ProjectData | null> => {
    if (!USE_TYPEORM) {
      // Fallback to Supabase if implemented
      projectToasts.supabaseUpdateNotImplemented();
      return null;
    }
    
    return typeOrmOperations.updateProject(id, projectData);
  };

  // Delete project (with Supabase fallback)
  const deleteProject = async (id: string): Promise<boolean> => {
    if (!USE_TYPEORM) {
      // Fallback to Supabase if implemented
      projectToasts.supabaseDeleteNotImplemented();
      return false;
    }
    
    return typeOrmOperations.deleteProject(id);
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
