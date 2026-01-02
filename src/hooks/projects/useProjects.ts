import { useProjects as useSupabaseProjects } from "@/hooks/useProjects";
import { USE_TYPEORM } from "./constants";
import { projectToasts } from "./projectToasts";
import { ProjectData } from "@/types/project";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useProjects = () => {
  // TypeORM operations removed - using Supabase only
  const supabaseProjects = useSupabaseProjects();

  // Using Supabase for all operations
  const projects = supabaseProjects.projects;
  const loading = supabaseProjects.loading;
  const error = supabaseProjects.error;
  const fetchProjects = supabaseProjects.fetchProjects;
  const createProject = supabaseProjects.createProject;
  const getProject = supabaseProjects.getProject;

  // Update project with Supabase implementation
  const updateProject = async (
    id: string,
    projectData: Partial<ProjectData>
  ): Promise<ProjectData | null> => {
    try {
      console.log("🔄 [useProjects] Received projectData:", projectData);
      console.log(
        "🔄 [useProjects] Received coordinates:",
        projectData.coordinates
      );
      console.log(
        "🔄 [useProjects] Received adresse:",
        (projectData as any).adresse
      );
      console.log(
        "🔄 [useProjects] Received forme:",
        (projectData as any).forme
      );

      // Transform the project data to match database schema
      const dbData: any = {};

      if (projectData.title !== undefined) dbData.title = projectData.title;
      if (projectData.description !== undefined)
        dbData.description = projectData.description;
      if (projectData.location !== undefined)
        dbData.location = projectData.location;
      if (projectData.status !== undefined) dbData.status = projectData.status;

      const normalizeProgress = (value: unknown): number | undefined => {
        if (value === null || value === undefined) return undefined;
        const n = typeof value === "number" ? value : Number(value);
        if (!Number.isFinite(n)) return undefined;

        // Certaines parties de l'app envoient une fraction (0..1).
        // En base, `projects.progress` est un INTEGER (%).
        const percent = n > 0 && n <= 1 ? n * 100 : n;
        return Math.max(0, Math.min(100, Math.round(percent)));
      };

      if (projectData.progress !== undefined) {
        const normalized = normalizeProgress(projectData.progress);
        if (normalized !== undefined) dbData.progress = normalized;
      }

      if (projectData.budget !== undefined) dbData.budget = projectData.budget;
      if (projectData.startDate !== undefined)
        dbData.start_date = projectData.startDate;
      if (projectData.endDate !== undefined)
        dbData.end_date = projectData.endDate;
      if (projectData.teamSize !== undefined)
        dbData.team_size = projectData.teamSize;

      if (projectData.geographic_zone !== undefined)
        dbData.geographic_zone = projectData.geographic_zone;
      if (projectData.terrain_type !== undefined)
        dbData.terrain_type = projectData.terrain_type;
      if (projectData.environmental_constraints !== undefined)
        dbData.environmental_constraints =
          projectData.environmental_constraints;
      if (projectData.has_utilities !== undefined)
        dbData.has_utilities = projectData.has_utilities;
      if (projectData.requires_permits !== undefined)
        dbData.requires_permits = projectData.requires_permits;

      // Handle coordinates - properly handle null coordinates case
      if (projectData.coordinates) {
        console.log(
          "💾 [useProjects] Saving coordinates to DB:",
          projectData.coordinates
        );
        dbData.coordinates_latitude = projectData.coordinates.latitude;
        dbData.coordinates_longitude = projectData.coordinates.longitude;
      } else {
        console.log("❌ [useProjects] No coordinates found in projectData");
      }

      // Handle new optional fields
      if (projectData.financingSource !== undefined)
        dbData.financing_source = projectData.financingSource;
      if (projectData.marketType !== undefined)
        dbData.market_type = projectData.marketType;
      if (projectData.selectionMode !== undefined)
        dbData.selection_mode = projectData.selectionMode;
      if (projectData.launchDate !== undefined)
        dbData.launch_date = projectData.launchDate;
      if (projectData.attributionDate !== undefined)
        dbData.attribution_date = projectData.attributionDate;
      if (projectData.projectReference !== undefined)
        dbData.project_reference = projectData.projectReference;

      // Handle missing fields from edit form
      if (projectData.projectResponsableId !== undefined)
        dbData.project_responsable_id = projectData.projectResponsableId;
      if (projectData.mainContractor !== undefined)
        dbData.main_contractor = projectData.mainContractor;
      if (projectData.allowsInitialPayment !== undefined)
        dbData.allows_initial_payment = projectData.allowsInitialPayment;
      if (projectData.initialPaymentPercentage !== undefined)
        dbData.initial_payment_percentage =
          projectData.initialPaymentPercentage;
      if (projectData.currentPhase !== undefined)
        dbData.current_phase = projectData.currentPhase;
      if (projectData.currentStage !== undefined)
        dbData.current_stage = projectData.currentStage;

      // Handle localization fields
      if ((projectData as any).forme !== undefined) {
        console.log(
          "💾 [useProjects] Saving forme:",
          (projectData as any).forme
        );
        dbData.forme = (projectData as any).forme;
      }
      if ((projectData as any).localisation !== undefined)
        dbData.localisation = (projectData as any).localisation;
      if ((projectData as any).adresse !== undefined)
        dbData.adresse = (projectData as any).adresse;
      console.log("💾 [useProjects] Final dbData for update:", dbData);
      const { data, error } = await supabase
        .from("projects")
        .update(dbData)
        .eq("id" as any, id as any)
        .select()
        .single();

      if (error) throw error;

      if (error) {
        console.error("❌ [useProjects] Supabase error:", error);
        throw error;
      }

      console.log("✅ [useProjects] Save successful, returned data:", data);
      console.log(
        "📍 [useProjects] Saved coordinates_latitude:",
        (data as any).coordinates_latitude
      );
      console.log(
        "📍 [useProjects] Saved coordinates_longitude:",
        (data as any).coordinates_longitude
      );
      console.log("📍 [useProjects] Saved adresse:", (data as any).adresse);
      console.log("📍 [useProjects] Saved forme:", (data as any).forme);

      if (!data) return null;

      // Transform the returned data to match ProjectData interface
      const updatedProject: ProjectData = {
        id: (data as any).id,
        title: (data as any).title,
        description: (data as any).description,
        location: (data as any).location,
        status: (data as any).status as
          | "en cours"
          | "terminé"
          | "en attente"
          | "suspendu"
          | "annulé",
        progress: (data as any).progress,
        budget: (data as any).budget,
        startDate: (data as any).start_date,
        endDate: (data as any).end_date || undefined,
        thumbnail: (data as any).thumbnail,
        teamSize: (data as any).team_size,
        environmental_constraints: (data as any).environmental_constraints,
        geographic_zone: (data as any).geographic_zone,
        terrain_type: (data as any).terrain_type,
        has_utilities: (data as any).has_utilities,
        requires_permits: (data as any).requires_permits,
        coordinates:
          (data as any).coordinates_latitude &&
          (data as any).coordinates_longitude
            ? {
                latitude: (data as any).coordinates_latitude,
                longitude: (data as any).coordinates_longitude,
              }
            : undefined,
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
        currentPhase: (data as any).current_phase || undefined,
        currentStage: (data as any).current_stage || undefined,
      };

      toast({
        title: "Projet mis à jour",
        description: `Le projet "${
          (data as any).title
        }" a été mis à jour avec succès.`,
      });

      return updatedProject;
    } catch (err) {
      console.error("Error updating project:", err);
      toast({
        title: "Erreur",
        description:
          "Impossible de mettre à jour le projet. Veuillez réessayer plus tard.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Delete project with Supabase implementation
  const deleteProject = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id" as any, id as any);

      if (error) throw error;

      toast({
        title: "Projet supprimé",
        description: "Le projet a été supprimé avec succès.",
      });

      return true;
    } catch (err) {
      console.error("Error deleting project:", err);
      toast({
        title: "Erreur",
        description:
          "Impossible de supprimer le projet. Veuillez réessayer plus tard.",
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
    deleteProject,
  };
};
