
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
      
      // Handle new optional fields
      if (projectData.financingSource !== undefined) dbData.financing_source = projectData.financingSource;
      if (projectData.marketType !== undefined) dbData.market_type = projectData.marketType;
      if (projectData.selectionMode !== undefined) dbData.selection_mode = projectData.selectionMode;
      if (projectData.launchDate !== undefined) dbData.launch_date = projectData.launchDate;
      if (projectData.attributionDate !== undefined) dbData.attribution_date = projectData.attributionDate;
      if (projectData.projectReference !== undefined) dbData.project_reference = projectData.projectReference;
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
        id: (data as any).id,
        title: (data as any).title,
        description: (data as any).description,
        location: (data as any).location,
        status: (data as any).status as 'en cours' | 'terminé' | 'en attente' | 'suspendu' | 'annulé',
        progress: (data as any).progress,
        budget: (data as any).budget,
        startDate: (data as any).start_date,
        endDate: (data as any).end_date || undefined,
        thumbnail: (data as any).thumbnail,
        teamSize: (data as any).team_size,
        coordinates: (data as any).coordinates_latitude && (data as any).coordinates_longitude ? {
          latitude: (data as any).coordinates_latitude,
          longitude: (data as any).coordinates_longitude
        } : undefined,
        financingSource: (data as any).financing_source || undefined,
        marketType: (data as any).market_type || undefined,
        selectionMode: (data as any).selection_mode || undefined,
        launchDate: (data as any).launch_date || undefined,
        attributionDate: (data as any).attribution_date || undefined,
        projectReference: (data as any).project_reference || undefined
      };

      toast({
        title: "Projet mis à jour",
        description: `Le projet "${(data as any).title}" a été mis à jour avec succès.`,
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
