import ProjectCreationWorkflow from "@/components/project/ProjectCreationWorkflow";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProjects } from "@/hooks/projects/useProjects";
import { toast } from "@/hooks/use-toast";
import { PhaseService } from "@/services/phaseService";
import { ProjectStakeholderService } from "@/services/ProjectStakeholderService";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout";

interface SelectedMaterial {
  materialId: string;
  quantity: number;
}

const ProjectCreate = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<
    SelectedMaterial[]
  >([]);
  const { createProject } = useProjects();

  // Status mapping from form values to database values
  const statusMapping = {
    Planning: "en attente",
    InProgress: "en cours",
    Pending: "en attente",
    OnHold: "suspendu",
    Completed: "terminé",
    Cancelled: "annulé",
  } as const;
  // Handle form submission from ProjectFormWithMap
  const handleFormSubmit = async (data: any) => {
    setIsSubmitting(true);

    try {
      // Prepare coordinates and localization data for the API
      const projectCoordinates = data.facilitiesLocation?.center
        ? {
            latitude: data.facilitiesLocation.center.lat,
            longitude: data.facilitiesLocation.center.lng,
          }
        : undefined;

      // Prepare localization data
      const localizationData =
        data.facilitiesLocation?.polygon ||
        data.facilitiesLocation?.warehouseShape ||
        [];
      const shapeType =
        data.facilitiesLocation?.shapeType ||
        (data.facilitiesLocation?.polygon?.length > 0 ? "polygon" : undefined);
      const addressData = data.facilitiesLocation?.address;

      // Map the status from form to database value
      const mappedStatus =
        statusMapping[data.status as keyof typeof statusMapping] ||
        "en attente";

      // Create the new project with all the form data
      const projectData = {
        title: data.title,
        description: data.description,
        location: data.shapeData?.address || data.location || "Non spécifié",
        status: data.status,
        progress: data.progress,
        budget: parseFloat(data.budget) || 0,
        estimated_days: parseInt(data.estimatedDays) || null,
        currency: data.currency || "MRU",
        payment_mode: data.paymentMode || "progressive",
        payment_frequency: data.paymentFrequency || "monthly",
        initial_advance_percentage: data.initialAdvance || 20,
        retention_percentage: data.retentionPercentage || 5,
        priority: data.priority || "medium",
        project_type: data.projectType || "construction",
        sector: data.sector,
        permit_number: data.permitNumber,
        startDate:
          data.startDate ||
          data.start_date ||
          new Date().toISOString().split("T")[0],
        endDate: data.endDate || data.end_date,
        thumbnail: "/img/project-placeholder.jpg",
        teamSize: data.team_size || 1,
        coordinates: projectCoordinates,
        financingSource: data.financing_source,
        marketType: data.market_type,
        selectionMode: data.selection_mode,
        projectResponsableId: data.delegation?.projectManager || null,
        mainContractor: data.main_contractor || null,
        engineeringConsultant: data.engineering_consultant || null,
        projectReference: data.reference,
        allowsInitialPayment: data.allows_initial_payment,
        initialPaymentPercentage: data.initial_payment_percentage,
        // Construction workflow fields - ensuring proper type casting
        currentPhase: data.current_phase,
        currentStage: data.current_stage,
        // Localization fields
        localisation: localizationData,
        forme: shapeType,
        adresse: data.shapeData?.address,
      };

      const projectResult = await createProject(projectData);

      if (projectResult?.id) {
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

            await ProjectStakeholderService.createProjectStakeholders(
              projectResult.id,
              allStakeholders,
              allDelegation
            );
            toast({
              title: "Parties prenantes sauvegardées",
              description:
                "Les parties prenantes du projet ont été configurées.",
            });
          } catch (stakeholderError) {
            console.error("Error saving stakeholders:", stakeholderError);
            toast({
              title: "Avertissement",
              description:
                "Projet créé mais erreur lors de la sauvegarde des parties prenantes.",
              variant: "destructive",
            });
          }
        }

        // Save construction phases if any are defined
        if (data.phases && data.phases.length > 0) {
          try {
            await PhaseService.saveProjectPhases(projectResult.id, data.phases);
            toast({
              title: "Phases sauvegardées",
              description: `${data.phases.length} phase(s) de construction sauvegardée(s).`,
            });
          } catch (phaseError) {
            console.error("Error saving phases:", phaseError);
            toast({
              title: "Avertissement",
              description: `Projet créé mais erreur lors de la sauvegarde des phases: ${
                phaseError instanceof Error
                  ? phaseError.message
                  : "Erreur inconnue"
              }`,
              variant: "destructive",
            });
          }
        }

        // Add materials to the project if any are selected
        if (selectedMaterials.length > 0) {
          await addMaterialsToProject(projectResult.id, selectedMaterials);
        }
      }

      // Show appropriate success message based on completion
      if (data.missingOptionalFields && data.missingOptionalFields.length > 0) {
        toast({
          title: "Projet créé avec succès",
          description: `${
            data.title
          } a été créé. N'oubliez pas de compléter : ${data.missingOptionalFields
            .slice(0, 2)
            .join(", ")}${
            data.missingOptionalFields.length > 2 ? "..." : ""
          } en éditant le projet.`,
          variant: "default",
        });
      } else {
        toast({
          title: t("project_create.toast.created"),
          description: t("project_create.toast.created_desc") + data.title,
        });
      }

      if (data.saveType === "global_and_close" || !data.saveType) {
        if (data.saveType === "global_and_close" || !data.saveType) {
          navigate("/projects");
        }
      }
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: t("project_create.toast.error"),
        description: t("project_create.toast.error_desc"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // This function is now handled by PhaseService

  // Add materials to project - isolated Supabase dependency
  const addMaterialsToProject = async (
    projectId: string,
    materials: SelectedMaterial[]
  ) => {
    try {
      // Import Supabase only when needed (lazy loading)
      const { supabase } = await import("@/integrations/supabase/client");

      const materialsToAdd = materials.map((material) => ({
        project_id: projectId,
        material_id: material.materialId,
        quantity: material.quantity,
      }));

      const { error: materialsError } = await supabase
        .from("project_materials")
        .insert(materialsToAdd);

      if (materialsError) throw materialsError;

      const takeoffsToCreate = materials.map((material) => ({
        project_id: projectId,
        material_id: material.materialId,
        element_type: "Standard Element",
        unit: "unité",
        length: material.quantity,
        width: null,
        height: null,
        note: "Auto-généré lors de la création du projet",
      }));

      const { error: takeoffsError } = await supabase
        .from("quantity_takeoffs")
        .insert(takeoffsToCreate);

      if (takeoffsError) throw takeoffsError;

      toast({
        title: "Matériaux ajoutés",
        description: `${materials.length} matériau(x) et métré(s) créé(s) automatiquement.`,
      });
    } catch (error) {
      console.error("Error adding materials to project:", error);
      toast({
        title: "Avertissement",
        description: "Projet créé mais erreur lors de l'ajout des matériaux.",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout
      pageTitle={t("project_create.title")}
      pageDescription="Suivez ce processus structuré pour créer votre projet de manière optimale"
      actions={
        <Link to="/projects">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("project_create.back_to_projects")}
          </Button>
        </Link>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        <div className="bg-white rounded-xl shadow-elegant p-6">
          <ProjectCreationWorkflow
            onSubmit={handleFormSubmit}
            selectedMaterials={selectedMaterials}
            onMaterialsChange={setSelectedMaterials}
          />
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default ProjectCreate;
