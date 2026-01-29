import ProjectDocumentUpload from "@/components/project/ProjectDocumentUpload";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import EnhancedProjectEditForm from "../components/project/EnhancedProjectEditForm";
import { useState, useEffect } from "react";
import { RepositoryFactory } from "@/infrastructure/supabase/RepositoryFactory";
import { ProjectService } from "@/application/services/ProjectService";

const ProjectEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);

  // Load project data using hexagonal architecture
  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const projectService = new ProjectService(RepositoryFactory.getProjectRepository());
        const projectDetail = await projectService.getProjectWithDetails(id);

        if (projectDetail) {
          // Map status to form format
          const statusMapping = {
            "en attente": "Planning",
            "en cours": "InProgress",
            suspendu: "OnHold",
            terminé: "Completed",
            annulé: "Cancelled",
          } as const;

          // Safe date formatting helper
          const formatDateForInput = (dateString: any) => {
            if (!dateString) return "";
            try {
              const date = new Date(dateString);
              if (isNaN(date.getTime())) return "";
              return date.toISOString().split("T")[0];
            } catch (error) {
              console.warn("Date formatting error:", error);
              return "";
            }
          };

          // Map phases from detail DTO
          const phases = projectDetail.phases?.map((phase: any) => ({
            id: phase.id,
            title: phase.title || phase.phase_name || phase.phase,
            description: phase.description || "",
            startDate: phase.startDate || phase.start_date,
            endDate: phase.endDate || phase.end_date,
            estimatedDuration: phase.estimatedDuration || phase.estimated_duration || 30,
            status: phase.status,
            budget: phase.budget || phase.estimated_cost || 0,
            actualCost: phase.actualCost || phase.actual_cost || 0,
            progress: phase.progress || 0,
            materials: Array.isArray(phase.materials) ? phase.materials : [],
            humanResources: Array.isArray(phase.humanResources || phase.human_resources)
              ? phase.humanResources || phase.human_resources
              : [],
            suppliers: Array.isArray(phase.suppliers) ? phase.suppliers : [],
            location: phase.location || "",
            notes: phase.notes || "",
          })) || [];

          // Prepare initial data for the form
          const formInitialData = {
            title: projectDetail.title,
            description: projectDetail.description,
            location: projectDetail.location,
            status: statusMapping[projectDetail.status as keyof typeof statusMapping] || "InProgress",
            budget: projectDetail.budget,
            progress: projectDetail.progress || 0,
            startDate: formatDateForInput(projectDetail.startDate),
            endDate: formatDateForInput(projectDetail.endDate),
            start_date: formatDateForInput(projectDetail.startDate),
            end_date: formatDateForInput(projectDetail.endDate),
            team_size: projectDetail.teamSize || 1,
            financing_source: projectDetail.financingSource || "",
            market_type: projectDetail.marketType || "",
            selection_mode: projectDetail.selectionMode || "",
            project_responsable_id: projectDetail.projectResponsableId || "",
            project_manager_id: projectDetail.projectResponsableId || "",
            main_contractor: projectDetail.mainContractor || "",
            engineering_consultant: projectDetail.engineeringConsultant || "",
            project_reference: projectDetail.projectReference || "",
            allows_initial_payment: projectDetail.allowsInitialPayment || false,
            initial_payment_percentage: projectDetail.initialPaymentPercentage || 0,
            current_phase: projectDetail.currentPhase || "",
            current_stage: projectDetail.currentStage || "",
            phases: phases,
            facilitiesLocation: projectDetail.coordinates
              ? {
                  coordinates: {
                    lat: projectDetail.coordinates.latitude,
                    lng: projectDetail.coordinates.longitude,
                  },
                  center: {
                    lat: projectDetail.coordinates.latitude,
                    lng: projectDetail.coordinates.longitude,
                  },
                  polygon: Array.isArray(projectDetail.localisation)
                    ? projectDetail.localisation
                    : [],
                  warehouseShape: Array.isArray(projectDetail.localisation)
                    ? projectDetail.localisation
                    : [],
                  address: typeof projectDetail.adresse === "string"
                    ? projectDetail.adresse
                    : projectDetail.adresse?.address || "",
                  shapeType: projectDetail.forme || undefined,
                }
              : {
                  polygon: Array.isArray(projectDetail.localisation)
                    ? projectDetail.localisation
                    : [],
                  warehouseShape: Array.isArray(projectDetail.localisation)
                    ? projectDetail.localisation
                    : [],
                  address: typeof projectDetail.adresse === "string"
                    ? projectDetail.adresse
                    : projectDetail.adresse?.address || "",
                  shapeType: projectDetail.forme || undefined,
                },
          };

          setInitialData(formInitialData);
        } else {
          toast({
            title: t("projects.edit.error"),
            description: t("projects.edit.not_found"),
            variant: "destructive",
          });
          navigate("/projects");
        }
      } catch (error) {
        console.error("Error fetching project:", error);
        toast({
          title: t("projects.edit.error"),
          description: t("projects.edit.load_error"),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id, navigate, t]);

  // Handle form submission
  const handleFormSubmit = async (data: any) => {
    if (!id) return;

    setIsSubmitting(true);
    try {
      // Status mapping from form values to database values
      const statusMapping = {
        Planning: "en attente",
        InProgress: "en cours",
        Pending: "en attente",
        OnHold: "suspendu",
        Completed: "terminé",
        Cancelled: "annulé",
      } as const;

      const projectCoordinates =
        data.facilitiesLocation?.coordinates || data.facilitiesLocation?.center
          ? {
              latitude: (
                data.facilitiesLocation.coordinates ||
                data.facilitiesLocation.center
              ).lat,
              longitude: (
                data.facilitiesLocation.coordinates ||
                data.facilitiesLocation.center
              ).lng,
            }
          : undefined;

      // Helper to convert empty strings to null for UUIDs
      const nullIfEmpty = (value: any) => {
        if (value === "" || value === undefined) return null;
        return value;
      };

      // Update the project with all the form data
      const projectDataToUpdate = {
        title: data.title,
        description: data.description,
        location: data.location,
        status: statusMapping[data.status as keyof typeof statusMapping] || "en cours",
        budget: data.budget,
        startDate: data.start_date || null,
        endDate: data.end_date || null,
        teamSize: data.team_size || 1,
        progress: data.progress || 0,
        financingSource: nullIfEmpty(data.financing_source),
        marketType: nullIfEmpty(data.market_type),
        selectionMode: nullIfEmpty(data.selection_mode),
        projectResponsableId: nullIfEmpty(data.project_responsable_id),
        mainContractor: nullIfEmpty(data.main_contractor),
        engineeringConsultant: nullIfEmpty(data.engineering_consultant),
        projectReference: nullIfEmpty(data.project_reference),
        allowsInitialPayment: data.allows_initial_payment || false,
        initialPaymentPercentage: data.initial_payment_percentage || 0,
        currentPhase: nullIfEmpty(data.current_phase),
        currentStage: nullIfEmpty(data.current_stage),
        coordinates: projectCoordinates,
        forme: data.facilitiesLocation?.shapeType || null,
        localisation: data.facilitiesLocation?.polygon || data.facilitiesLocation?.warehouseShape || null,
        adresse: data.facilitiesLocation?.address || data.location || "",
      };

      // Use hexagonal service to update
      const projectService = new ProjectService(RepositoryFactory.getProjectRepository());
      await projectService.updateProject(id, projectDataToUpdate);

      // Context-aware toast
      if (data.saveType === "step_only") {
        toast({
          title: "Étape sauvegardée",
          description: "Les données de cette étape ont été enregistrées.",
        });
      } else if (data.saveType === "save_and_next") {
        toast({
          title: "Étape sauvegardée",
          description: "Poursuivez vers la prochaine étape.",
        });
      } else {
        toast({
          title: t("projects.edit.saved"),
          description: t("projects.edit.saved_desc"),
        });
      }

      // Navigate only when explicitly closing the workflow
      if (data.saveType === "global_and_close" || data.isComplete) {
        navigate(`/projects/${id}`);
      }
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: t("projects.edit.error"),
        description: t("projects.edit.save_error"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !initialData) {
    return (
      <div className="layout-main bg-gray-50">
        <main className="layout-content">
          <div className="container-responsive">
            <div className="flex justify-center items-center h-64 sm:h-96">
              <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="layout-main -mt-8 bg-gray-50">
      <main className="layout-content">
        <div className="container-responsive">
          {/* Back button */}
          <Link to={`/projects/${id}`}>
            <Button variant="ghost" className="mb-6" disabled={isSubmitting}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("projects.edit.back_to_detail")}
            </Button>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto card-stack"
          >
            {/* Project Edit Workflow */}
            <div className="bg-white rounded-xl shadow-mobile card-responsive">
              <h1 className="heading-responsive font-serif text-adrar-800 mb-4 sm:mb-6">
                {t("projects.edit.title")}
              </h1>

              <EnhancedProjectEditForm
                initialData={initialData}
                onSubmit={handleFormSubmit}
                isSubmitting={isSubmitting}
              />

              {/* Documents Section */}
              <div className="mt-8">
                <ProjectDocumentUpload
                  projectId={id!}
                  context="project"
                  contextLabel="Modification de projet"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ProjectEdit;
