
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ProjectData } from '@/components/ProjectCard';

export const useProjects = () => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform database data to match ProjectData interface
      const transformedData = data.map(project => ({
        id: project.id,
        title: project.title,
        description: project.description,
        location: project.location,
        status: project.status as 'en cours' | 'terminé' | 'en attente' | 'suspendu' | 'annulé',
        progress: project.progress,
        budget: project.budget,
        startDate: project.start_date,
        endDate: project.end_date || undefined,
        thumbnail: project.thumbnail,
        teamSize: project.team_size,
        coordinates: project.coordinates_latitude && project.coordinates_longitude ? {
          latitude: project.coordinates_latitude,
          longitude: project.coordinates_longitude
        } : undefined
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
      // Transform the project data to match database schema
      const dbData = {
        title: projectData.title,
        description: projectData.description,
        location: projectData.location,
        status: projectData.status,
        progress: projectData.progress,
        budget: projectData.budget,
        start_date: projectData.startDate,
        end_date: projectData.endDate,
        thumbnail: projectData.thumbnail || '/img/project-placeholder.jpg',
        team_size: projectData.teamSize,
        coordinates_latitude: projectData.coordinates?.latitude,
        coordinates_longitude: projectData.coordinates?.longitude
      };

      const { data, error } = await supabase
        .from('projects')
        .insert(dbData)
        .select()
        .single();

      if (error) throw error;

      // Transform the returned data to match ProjectData interface
      const newProject: ProjectData = {
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

      // Update the local state
      setProjects(prev => [newProject, ...prev]);

      toast({
        title: "Projet créé",
        description: `Le projet "${data.title}" a été créé avec succès.`,
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
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Transform the database data to match ProjectData interface
      return {
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
