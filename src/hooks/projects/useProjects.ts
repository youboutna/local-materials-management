
import { useProjects as useSupabaseProjects } from '@/hooks/useProjects';
import { useTypeOrmProjectOperations } from './useTypeOrmProjectOperations';
import { USE_TYPEORM } from './constants';
import { projectToasts } from './projectToasts';
import { ProjectData } from '@/components/ProjectCard';

export const useProjects = () => {
  const typeOrmOperations = useTypeOrmProjectOperations();
  const supabaseProjects = useSupabaseProjects();

  // Always use Supabase since TypeORM has browser compatibility issues
  const projects = USE_TYPEORM ? typeOrmOperations.projects : supabaseProjects.projects;
  const loading = USE_TYPEORM ? typeOrmOperations.loading : supabaseProjects.loading;
  const error = USE_TYPEORM ? typeOrmOperations.error : supabaseProjects.error;
  const fetchProjects = USE_TYPEORM ? typeOrmOperations.fetchProjects : supabaseProjects.fetchProjects;
  const createProject = USE_TYPEORM ? typeOrmOperations.createProject : supabaseProjects.createProject;
  const getProject = USE_TYPEORM ? typeOrmOperations.getProject : supabaseProjects.getProject;

  // Update project (with better fallback messaging)
  const updateProject = async (id: string, projectData: Partial<ProjectData>): Promise<ProjectData | null> => {
    if (!USE_TYPEORM) {
      // With TypeORM disabled, show a clearer message
      projectToasts.supabaseUpdateNotImplemented();
      return null;
    }
    
    return typeOrmOperations.updateProject(id, projectData);
  };

  // Delete project (with better fallback messaging)
  const deleteProject = async (id: string): Promise<boolean> => {
    if (!USE_TYPEORM) {
      // With TypeORM disabled, show a clearer message
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
