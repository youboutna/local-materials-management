
import { supabase } from "@/integrations/supabase/client";
import { projectsData } from "@/data/projectsData";
import { toast } from '@/hooks/use-toast';

/**
 * Loads sample project data from the local data file to Supabase
 * This includes traditional construction projects from the Adrar region
 */
export const loadProjectsToSupabase = async () => {
  try {
    // Check if projects already exist to avoid duplicates
    const { data: existingProjects, error: fetchError } = await supabase
      .from('projects')
      .select('title');

    if (fetchError) {
      throw fetchError;
    }

    // If there are already projects in the database, don't add more
    if (existingProjects && existingProjects.length > 0) {
      toast({
        title: "Projets déjà chargés",
        description: `${existingProjects.length} projets existent déjà dans la base de données.`,
        variant: "default",
        className: "bg-adrar-100 border-adrar-300 text-adrar-800",
      });
      return existingProjects.length;
    }

    // Transform the project data to match the database schema
    const projectsToInsert = projectsData.map(project => ({
      title: project.title,
      description: project.description,
      location: project.location,
      status: project.status,
      progress: project.progress,
      budget: project.budget,
      start_date: project.startDate,
      end_date: project.endDate,
      thumbnail: project.thumbnail || '/img/project-placeholder.jpg',
      team_size: project.teamSize,
      coordinates_latitude: project.coordinates?.latitude,
      coordinates_longitude: project.coordinates?.longitude
    }));

    // Insert all projects
    const { data, error } = await supabase
      .from('projects')
      .insert(projectsToInsert)
      .select();

    if (error) {
      throw error;
    }

    toast({
      title: "Projets chargés avec succès",
      description: `${data.length} projets ont été ajoutés à la base de données.`,
      variant: "default",
      className: "bg-adrar-100 border-adrar-300 text-adrar-800",
    });

    return data.length;
  } catch (error) {
    console.error("Error loading projects to Supabase:", error);
    toast({
      title: "Erreur",
      description: "Impossible de charger les projets dans la base de données.",
      variant: "destructive",
    });
    return 0;
  }
};
