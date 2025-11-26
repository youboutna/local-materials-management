import ProjectDocumentUpload from "@/components/project/ProjectDocumentUpload";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProjects } from "@/hooks/projects/useProjects";
import { toast } from "@/hooks/use-toast";
import { PhaseService } from "@/services/phaseService";
import { ProjectStakeholderService } from "@/services/ProjectStakeholderService";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import EnhancedProjectEditForm from "../components/project/EnhancedProjectEditForm";

// Add interface for selected materials
interface SelectedMaterial {
  materialId: string;
  quantity: number;
}

const ProjectEdit = () => {
  const { id } = useParams<{ id: string }>();
  const { getProject, updateProject } = useProjects();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<
    SelectedMaterial[]
  >([]);
  const [initialData, setInitialData] = useState<any>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Load project data using ProjectService
  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;

      try {
        const projectService = new (
          await import("@/services/ProjectService")
        ).ProjectService();
        const projectDetail = await projectService.getProjectDetail(id);

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

          // Materials will be loaded separately via Supabase since not in DTO
          const { supabase } = await import("@/integrations/supabase/client");
          const { data: materialsData } = await supabase
            .from("project_materials")
            .select("material_id, quantity")
            .eq("project_id", id);

          const materials =
            materialsData?.map((item) => ({
              materialId: item.material_id,
              quantity: item.quantity,
            })) || [];

          // Map phases from detail DTO
          const phases =
            projectDetail.plannedPhases?.map((phase: any) => ({
              id: phase.id,
              title: phase.phase_name || phase.phase,
              description: phase.description || "",
              startDate: phase.start_date || phase.startDate,
              endDate: phase.end_date || phase.endDate,
              estimatedDuration: phase.estimated_duration || 30,
              status: phase.status,
              budget: phase.estimated_cost || phase.budget || 0,
              actualCost: phase.actual_cost || 0,
              progress: phase.progress || 0,
              materials: Array.isArray(phase.materials) ? phase.materials : [],
              humanResources: Array.isArray(phase.human_resources)
                ? phase.human_resources
                : [],
              suppliers: Array.isArray(phase.suppliers) ? phase.suppliers : [],
              location: phase.location || "",
              notes: phase.notes || "",
            })) || [];

          // Load stakeholders from database
          const { ProjectStakeholderService } = await import(
            "@/services/ProjectStakeholderService"
          );
          const stakeholdersData =
            await ProjectStakeholderService.getProjectStakeholders(id);

          // Map stakeholders to form format
          const delegation: any = {};
          const externalStakeholders: any[] = [];

          stakeholdersData?.forEach((sh: any) => {
            if (sh.stakeholder_entity_type === "employee" && sh.employee_id) {
              // Map employees to delegation
              if (sh.stakeholder_type === "project_manager") {
                delegation.projectManager = sh.employee_id;
              } else if (sh.stakeholder_type === "technical_manager") {
                delegation.technicalManager = sh.employee_id;
              } else if (sh.stakeholder_type === "supervisor") {
                delegation.supervisor = sh.employee_id;
              } else if (sh.stakeholder_type === "client") {
                delegation.client = sh.employee_id;
              }
            } else if (
              sh.stakeholder_entity_type === "supplier" &&
              sh.supplier_id
            ) {
              // Map suppliers to external stakeholders
              externalStakeholders.push({
                id: sh.id,
                type: "external",
                entityId: sh.supplier_id,
                role: sh.stakeholder_type,
                isPrimary: sh.is_primary || false,
              });
            }
          });

          // Prepare initial data for the form including phases and materials
          const formInitialData = {
            title: projectDetail.title,
            description: projectDetail.description,
            location: projectDetail.location,
            status: projectDetail.status || "en cours",
            budget: projectDetail.budget,
            progress: projectDetail.progress || 0,
            has_utilities: projectDetail.hasUtilities,
            geographic_zone: projectDetail.geographicZone,
            terrain_type: projectDetail.terrainType,
            environmental_constraints: projectDetail.environmentalConstraints,
            requires_permits: projectDetail.requiresPermits,
            startDate: formatDateForInput(projectDetail.startDate),
            endDate: formatDateForInput(projectDetail.endDate),
            start_date: formatDateForInput(projectDetail.startDate),
            end_date: formatDateForInput(projectDetail.endDate),
            team_size: projectDetail.teamSize || 1,
            financing_source: projectDetail.financingSource || "",
            market_type: projectDetail.marketType || "",
            selection_mode: projectDetail.selectionMode || "",
            project_responsable_id: projectDetail.projectResponsableId || "",
            project_manager_id:
              delegation.projectManager ||
              projectDetail.projectResponsableId ||
              "",
            technical_manager_id: delegation.technicalManager || "",
            supervisor_id: delegation.supervisor || "",
            main_contractor: projectDetail.mainContractor || "",
            engineering_consultant:
              (projectDetail as any).engineeringConsultant || "",
            project_reference: projectDetail.projectReference || "",
            allows_initial_payment: projectDetail.allowsInitialPayment || false,
            initial_payment_percentage:
              projectDetail.initialPaymentPercentage || 0,
            current_phase: projectDetail.currentPhase || "",
            current_stage: projectDetail.currentStage || "",
            phases: phases,
            delegation: delegation,
            stakeholders: externalStakeholders,
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
                  polygon: Array.isArray((projectDetail as any).localisation)
                    ? (projectDetail as any).localisation
                    : [],
                  warehouseShape: Array.isArray(
                    (projectDetail as any).localisation
                  )
                    ? (projectDetail as any).localisation
                    : [],
                  address:
                    typeof (projectDetail as any).adresse === "string"
                      ? (projectDetail as any).adresse
                      : (projectDetail as any).adresse?.address || "",
                  shapeType: (projectDetail as any).forme || undefined,
                }
              : {
                  polygon: Array.isArray((projectDetail as any).localisation)
                    ? (projectDetail as any).localisation
                    : [],
                  warehouseShape: Array.isArray(
                    (projectDetail as any).localisation
                  )
                    ? (projectDetail as any).localisation
                    : [],
                  address:
                    typeof (projectDetail as any).adresse === "string"
                      ? (projectDetail as any).adresse
                      : (projectDetail as any).adresse?.address || "",
                  shapeType: (projectDetail as any).forme || undefined,
                },
          };

          setInitialData(formInitialData);
          setSelectedMaterials(materials);
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

  // Materials and phases now loaded via ProjectService in useEffect above

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

      // Prepare localization data
      const localizationData = {
        coordinates:
          data.facilitiesLocation?.coordinates ||
          data.facilitiesLocation?.center
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
            : undefined,
        localisation:
          data.facilitiesLocation?.polygon ||
          data.facilitiesLocation?.warehouseShape ||
          [],
        forme: data.facilitiesLocation?.shapeType,
        adresse: data.facilitiesLocation?.address || data.location || "",
      };
      const addressData = data.facilitiesLocation?.address;
      // Map the status from form to database value
      const mappedStatus =
        statusMapping[data.status as keyof typeof statusMapping] ||
        "en attente";

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
        status: data.status,
        budget: data.budget,
        startDate: data.start_date || null,
        endDate: data.end_date || null,
        teamSize: data.team_size || 1,
        progress: data.progress || 0,
        environmental_constraints: data.environmental_constraints,
        geographic_zone: data.geographic_zone,
        terrain_type: data.terrain_type,
        has_utilities: data.has_utilities,
        requires_permits: data.requires_permits,
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
        // Localization fields
        coordinates: projectCoordinates,
        forme: data.facilitiesLocation?.shapeType || null,
        localisation:
          data.facilitiesLocation?.polygon ||
          data.facilitiesLocation?.warehouseShape ||
          null,
        adresse: addressData,
      };

      const updatedProject = await updateProject(id, projectDataToUpdate);
      if (updatedProject) {
        // Update materials
        await updateProjectMaterials(id, selectedMaterials);

        // Save project stakeholders
        if (
          data.stakeholders ||
          data.delegation ||
          data.principals ||
          data.internalStakeholders ||
          data.externalStakeholders ||
          data.teamMembers
        ) {
          try {
            // Combine all stakeholder data
            const allStakeholders = [
              ...(data.stakeholders || []),
              ...(data.internalStakeholders || []),
              ...(data.externalStakeholders || []),
            ];

            // Combine all delegation data (principals + other roles)
            const allDelegation = {
              ...(data.delegation || {}),
              ...(data.principals || {}),
            };

            await ProjectStakeholderService.updateProjectStakeholders(
              id,
              allStakeholders,
              allDelegation
            );
            toast({
              title: "Parties prenantes sauvegardées",
              description:
                "Les parties prenantes du projet ont été mises à jour.",
            });
          } catch (stakeholderError) {
            console.error("Error saving stakeholders:", stakeholderError);
            toast({
              title: "Avertissement",
              description:
                "Erreur lors de la sauvegarde des parties prenantes.",
              variant: "destructive",
            });
          }
        }

        // Save construction phases if any are defined
        if (data.phases && data.phases.length > 0) {
          try {
            await PhaseService.saveProjectPhases(id, data.phases);
            toast({
              title: "Phases sauvegardées",
              description: `${data.phases.length} phase(s) de construction mise(s) à jour.`,
            });
          } catch (phaseError) {
            console.error("Error saving phases:", phaseError);
            toast({
              title: "Avertissement",
              description: `Erreur lors de la sauvegarde des phases: ${
                phaseError instanceof Error
                  ? phaseError.message
                  : "Erreur inconnue"
              }`,
              variant: "destructive",
            });
          }
        }

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
      } else {
        throw new Error("Failed to update project");
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

  // This function is now handled by PhaseService

  // Update materials in database with lazy Supabase import
  const updateProjectMaterials = async (
    projectId: string,
    materials: SelectedMaterial[]
  ) => {
    try {
      const { supabase } = await import("@/integrations/supabase/client");

      // Delete existing materials
      await supabase
        .from("project_materials")
        .delete()
        .eq("project_id", projectId);

      // Insert new materials
      if (materials.length > 0) {
        const materialsToInsert = materials.map((material) => ({
          project_id: projectId,
          material_id: material.materialId,
          quantity: material.quantity,
        }));

        const { error } = await supabase
          .from("project_materials")
          .insert(materialsToInsert);

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error updating project materials:", error);
      throw error;
    }
  };

  if (loading || !initialData) {
    return (
      <div className="layout-main bg-gray-50">
        {/* Navbar removed - already in App.tsx */}
        <main className="layout-content">
          <div className="container-responsive">
            <div className="flex justify-center items-center h-64 sm:h-96">
              <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </main>
        {/* Footer removed - already in App.tsx */}
      </div>
    );
  }

  return (
    <div className="layout-main bg-gray-50">
      {/* Navbar removed - already in App.tsx */}

      <main className="layout-content">
        <div className="container-responsive">
          {/* Back button */}
          <Link to={`/projects/${id}`}>
            <Button variant="ghost" className="mb-6">
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
                initialData={{
                  ...initialData,
                  materials: selectedMaterials,
                }}
                onSubmit={handleFormSubmit}
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

      {/* Footer removed - already in App.tsx */}
    </div>
  );
};

export default ProjectEdit;
