
import { useProjects as useSupabaseProjects } from '@/hooks/useProjects';
import { useTypeOrmProjectOperations } from './useTypeOrmProjectOperations';
import { USE_TYPEORM } from './constants';
import { projectToasts } from './projectToasts';
import { ProjectData } from '@/components/ProjectCard';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

  // Update project with actual implementation for Supabase
  const updateProject = async (id: string, projectData: Partial<ProjectData>): Promise<ProjectData | null> => {
    if (USE_TYPEORM) {
      return typeOrmOperations.updateProject(id, projectData);
    }
    
    try {
      // Transform the project data to match database schema
      const dbData: any = {};
      
      if (projectData.title !== undefined) dbData.title = projectData.title;
      if (projectData.description !== undefined) dbData.description = projectData.description;
      if (projectData.location !== undefined) dbData.location = projectData.location;
      if (projectData.status !== undefined) dbData.status = projectData.status;
      if (projectData.progress !== undefined) dbData.progress = projectData.progress;
      if (projectData.budget !== undefined) dbData.budget = projectData.budget;
      if (projectData.startDate !== undefined) dbData.start_date = projectData.startDate;
      if (projectData.endDate !== undefined) dbData.end_date = projectData.endDate;
      if (projectData.teamSize !== undefined) dbData.team_size = projectData.teamSize;
      
      // Handle coordinates - properly handle null coordinates case
      if (projectData.coordinates) {
        dbData.coordinates_latitude = projectData.coordinates.latitude;
        dbData.coordinates_longitude = projectData.coordinates.longitude;
      } else if (projectData.coordinates === null) {
        // projectData.coordinates is explicitly null, set both to null
        dbData.coordinates_latitude = null;
        dbData.coordinates_longitude = null;
      }
      // If projectData.coordinates is undefined, we don't update the coordinates

      const { data, error } = await supabase
        .from('projects')
        .update(dbData)
        .eq('id' as any, id as any)
        .select()
        .single();

      if (error) throw error;

      if (!data) return null;

      // Transform the returned data to match ProjectData interface
      const updatedProject: ProjectData = {
        id: data.id,
        title: data.title,
        description: data.description,
        location: data.location,
        status: data.status as 'en cours' | 'terminé' | 'en attente' | 'suspendu' | 'annulé',
        progress: data.progress,
        budget: data.budget,
        startDate: data.start_date,
        endDate: data.end_date || undefined,
        thumbnail: data.thumbnail,
        teamSize: data.team_size,
        coordinates: data.coordinates_latitude && data.coordinates_longitude ? {
          latitude: data.coordinates_latitude,
          longitude: data.coordinates_longitude
        } : undefined
      };

      toast({
        title: "Projet mis à jour",
        description: `Le projet "${data.title}" a été mis à jour avec succès.`,
      });

      return updatedProject;
    } catch (err) {
      console.error('Error updating project:', err);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le projet. Veuillez réessayer plus tard.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Delete project with actual implementation for Supabase
  const deleteProject = async (id: string): Promise<boolean> => {
    if (USE_TYPEORM) {
      return typeOrmOperations.deleteProject(id);
    }
    
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id' as any, id as any);

      if (error) throw error;
      
      toast({
        title: "Projet supprimé",
        description: "Le projet a été supprimé avec succès.",
      });
      
      return true;
    } catch (err) {
      console.error('Error deleting project:', err);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le projet. Veuillez réessayer plus tard.",
        variant: "destructive",
      });
      return false;
    }
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
