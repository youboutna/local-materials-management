
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ProjectData } from '@/types/project';

export const useProjects = () => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

const fetchProjects = async () => {
  setLoading(true);
  try {
    // Get current user and roles
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes?.user?.id;
    let roles: string[] = [];
    if (userId) {
      const { data: rolesData } = await (supabase as any)
        .from('user_roles')
        .select('role_name')
        .eq('user_id', userId);
      roles = (rolesData || []).map((r: any) => r.role_name);
    }
    const isAdminOrDirector = roles.includes('admin') || roles.includes('director');
    const isProjectManager = roles.includes('project_manager');

    let query = supabase
      .from('projects')
      .select('*');

    // If project manager (not admin/director), restrict to assigned projects
    if (userId && isProjectManager && !isAdminOrDirector) {
      query = query.eq('project_responsable_id' as any, userId as any);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

      // Transform database data to match ProjectData interface
      const transformedData = (data || []).map((project: any) => ({
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
        } : undefined,
        financingSource: project.financing_source || undefined,
        marketType: project.market_type || undefined,
        selectionMode: project.selection_mode || undefined,
        launchDate: project.launch_date || undefined,
        attributionDate: project.attribution_date || undefined,
        projectReference: project.project_reference || undefined,
        projectResponsableId: project.project_responsable_id || undefined,
        mainContractor: project.main_contractor || undefined,
        allowsInitialPayment: project.allows_initial_payment || false,
        initialPaymentPercentage: project.initial_payment_percentage || 0,
        currentPhase: project.current_phase as any || undefined,
        currentStage: project.current_stage as any || undefined
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
        coordinates_longitude: projectData.coordinates?.longitude,
        financing_source: projectData.financingSource,
        market_type: projectData.marketType,
        selection_mode: projectData.selectionMode,
        launch_date: projectData.launchDate,
        attribution_date: projectData.attributionDate,
        project_reference: projectData.projectReference,
        project_responsable_id: projectData.projectResponsableId,
        main_contractor: projectData.mainContractor,
        allows_initial_payment: projectData.allowsInitialPayment,
        initial_payment_percentage: projectData.initialPaymentPercentage,
        current_phase: projectData.currentPhase,
        current_stage: projectData.currentStage
      };

      const { data, error } = await supabase
        .from('projects')
        .insert(dbData as any)
        .select()
        .single();

      if (error) throw error;

      // Transform the returned data to match ProjectData interface
      const newProject: ProjectData = {
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
        projectReference: (data as any).project_reference || undefined,
        projectResponsableId: (data as any).project_responsable_id || undefined,
        mainContractor: (data as any).main_contractor || undefined,
        allowsInitialPayment: (data as any).allows_initial_payment || false,
        initialPaymentPercentage: (data as any).initial_payment_percentage || 0,
        currentPhase: (data as any).current_phase as any || undefined,
        currentStage: (data as any).current_stage as any || undefined
      };

      // Update the local state
      setProjects(prev => [newProject, ...prev]);

      toast({
        title: "Projet créé",
        description: `Le projet "${(data as any).title}" a été créé avec succès.`,
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
        .eq('id' as any, id as any)
        .single();

      if (error) throw error;

      if (!data) return null;

      // Transform the database data to match ProjectData interface
      return {
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
        projectReference: (data as any).project_reference || undefined,
        projectResponsableId: (data as any).project_responsable_id || undefined,
        mainContractor: (data as any).main_contractor || undefined,
        allowsInitialPayment: (data as any).allows_initial_payment || false,
        initialPaymentPercentage: (data as any).initial_payment_percentage || 0,
        currentPhase: (data as any).current_phase as any || undefined,
        currentStage: (data as any).current_stage as any || undefined
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
