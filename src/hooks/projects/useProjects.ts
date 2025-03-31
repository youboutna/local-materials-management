
import { useProjects as useSupabaseProjects } from '@/hooks/useProjects';
import { useTypeOrmProjectOperations } from './useTypeOrmProjectOperations';
import { USE_TYPEORM } from './constants';
import { projectToasts } from './projectToasts';
import { ProjectData } from '@/components/ProjectCard';

export const useProjects = () => {
  const typeOrmOperations = useTypeOrmProjectOperations();
  const supabaseProjects = useSupabaseProjects();

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
    projects: USE_TYPEORM ? typeOrmOperations.projects : supabaseProjects.projects,
    loading: USE_TYPEORM ? typeOrmOperations.loading : supabaseProjects.loading,
    error: USE_TYPEORM ? typeOrmOperations.error : supabaseProjects.error,
    fetchProjects: USE_TYPEORM ? typeOrmOperations.fetchProjects : supabaseProjects.fetchProjects,
    createProject: USE_TYPEORM ? typeOrmOperations.createProject : supabaseProjects.createProject,
    getProject: USE_TYPEORM ? typeOrmOperations.getProject : supabaseProjects.getProject,
    updateProject,
    deleteProject
  };
};
