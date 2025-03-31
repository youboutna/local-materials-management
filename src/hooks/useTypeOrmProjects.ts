
import { useState, useEffect } from 'react';
import { ProjectData } from '@/components/ProjectCard';
import { ProjectRepository } from '@/lib/typeorm/repositories/ProjectRepository';
import { toast } from '@/hooks/use-toast';
import { useProjects as useSupabaseProjects } from './useProjects';

// Flag to determine whether to use TypeORM or Supabase
// For development, we'll use Supabase by default
const USE_TYPEORM = import.meta.env.VITE_USE_TYPEORM === 'true';

export const useTypeOrmProjects = () => {
  const [projectRepository, setProjectRepository] = useState<ProjectRepository | null>(null);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use Supabase hook as fallback for development
  const supabaseProjects = useSupabaseProjects();

  // Initialize the repository
  useEffect(() => {
    if (!USE_TYPEORM) return;
    
    const initRepository = async () => {
      try {
        const repo = await ProjectRepository.create();
        setProjectRepository(repo);
      } catch (err) {
        console.error('Failed to initialize TypeORM repository:', err);
        setError('Failed to initialize database connection');
      }
    };
    
    initRepository();
  }, []);

  // Fetch projects using TypeORM
  const fetchProjects = async () => {
    if (!USE_TYPEORM) return supabaseProjects.fetchProjects();
    
    if (!projectRepository) {
      toast({
        title: "Erreur",
        description: "La connexion à la base de données n'est pas initialisée.",
        variant: "destructive",
      });
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
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les projets. Veuillez réessayer plus tard.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create a new project
  const createProject = async (projectData: Omit<ProjectData, 'id'>) => {
    if (!USE_TYPEORM) return supabaseProjects.createProject(projectData);
    
    if (!projectRepository) {
      toast({
        title: "Erreur",
        description: "La connexion à la base de données n'est pas initialisée.",
        variant: "destructive",
      });
      throw new Error("Database connection not initialized");
    }

    try {
      const newProject = await projectRepository.create(projectData);
      
      // Update the local state
      setProjects(prev => [newProject, ...prev]);

      toast({
        title: "Projet créé",
        description: `Le projet "${newProject.title}" a été créé avec succès.`,
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

  // Get a project by ID
  const getProject = async (id: string): Promise<ProjectData | null> => {
    if (!USE_TYPEORM) return supabaseProjects.getProject(id);
    
    if (!projectRepository) {
      toast({
        title: "Erreur",
        description: "La connexion à la base de données n'est pas initialisée.",
        variant: "destructive",
      });
      return null;
    }

    try {
      return await projectRepository.findById(id);
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

  // Update a project
  const updateProject = async (id: string, projectData: Partial<ProjectData>): Promise<ProjectData | null> => {
    if (!USE_TYPEORM) {
      // Fallback to Supabase if implemented
      toast({
        title: "Information",
        description: "La mise à jour via Supabase n'est pas encore implémentée.",
      });
      return null;
    }
    
    if (!projectRepository) {
      toast({
        title: "Erreur",
        description: "La connexion à la base de données n'est pas initialisée.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const updatedProject = await projectRepository.update(id, projectData);
      
      // Update local state if the project was updated
      if (updatedProject) {
        setProjects(prev => prev.map(p => p.id === id ? updatedProject : p));
        
        toast({
          title: "Projet mis à jour",
          description: `Le projet "${updatedProject.title}" a été mis à jour avec succès.`,
        });
      }
      
      return updatedProject;
    } catch (err) {
      console.error(`Error updating project with id ${id}:`, err);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le projet.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Delete a project
  const deleteProject = async (id: string): Promise<boolean> => {
    if (!USE_TYPEORM) {
      // Fallback to Supabase if implemented
      toast({
        title: "Information",
        description: "La suppression via Supabase n'est pas encore implémentée.",
      });
      return false;
    }
    
    if (!projectRepository) {
      toast({
        title: "Erreur",
        description: "La connexion à la base de données n'est pas initialisée.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const success = await projectRepository.delete(id);
      
      if (success) {
        // Update local state if the project was deleted
        setProjects(prev => prev.filter(p => p.id !== id));
        
        toast({
          title: "Projet supprimé",
          description: "Le projet a été supprimé avec succès.",
        });
      }
      
      return success;
    } catch (err) {
      console.error(`Error deleting project with id ${id}:`, err);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le projet.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Fetch projects on component mount
  useEffect(() => {
    // If using TypeORM, wait for repository to be initialized
    if (USE_TYPEORM) {
      if (projectRepository) {
        fetchProjects();
      }
    } else {
      // Using Supabase fallback, just return its results
      setProjects(supabaseProjects.projects);
      setLoading(supabaseProjects.loading);
      setError(supabaseProjects.error || null);
    }
  }, [projectRepository, USE_TYPEORM]);

  return {
    projects: USE_TYPEORM ? projects : supabaseProjects.projects,
    loading: USE_TYPEORM ? loading : supabaseProjects.loading,
    error: USE_TYPEORM ? error : supabaseProjects.error,
    fetchProjects: USE_TYPEORM ? fetchProjects : supabaseProjects.fetchProjects,
    createProject: USE_TYPEORM ? createProject : supabaseProjects.createProject,
    getProject: USE_TYPEORM ? getProject : supabaseProjects.getProject,
    updateProject,
    deleteProject
  };
};
