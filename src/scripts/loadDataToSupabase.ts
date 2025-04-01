
import { supabase } from "@/integrations/supabase/client";
import { projectsData } from "@/data/projectsData";

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
      console.error("Error checking existing projects:", fetchError);
      throw fetchError;
    }

    // If there are already projects in the database, don't add more
    if (existingProjects && existingProjects.length > 0) {
      console.log(`${existingProjects.length} projects already exist in the database.`);
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
      console.error("Error inserting projects:", error);
      throw error;
    }

    console.log("Projects loaded successfully:", data);
    
    return data.length;
  } catch (error) {
    console.error("Error loading projects to Supabase:", error);
    throw error;
  }
};
