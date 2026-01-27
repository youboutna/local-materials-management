import ProjectDocumentUpload from "@/components/project/ProjectDocumentUpload";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { useProjectEditHex } from "@/hooks/hexagonal";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import EnhancedProjectEditForm from "../components/project/EnhancedProjectEditForm";

const ProjectEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Use hexagonal hook for all data loading
  const { 
    formData, 
    isLoading, 
    saveProject, 
    isSaving 
  } = useProjectEditHex(id);

  // Handle form submission
  const handleFormSubmit = async (data: any) => {
    if (!id) return;

    try {
      // Prepare coordinates from facilitiesLocation
      const coordinates =
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

      // Prepare update data
      const updateData = {
        title: data.title,
        description: data.description,
        location: data.location,
        status: data.status,
        budget: data.budget,
        progress: data.progress || 0,
        startDate: data.start_date || data.startDate,
        endDate: data.end_date || data.endDate,
        teamSize: data.team_size || 1,
        financing_source: data.financing_source,
        market_type: data.market_type,
        selection_mode: data.selection_mode,
        project_reference: data.project_reference,
        main_contractor: data.main_contractor,
        engineering_consultant: data.engineering_consultant,
        allows_initial_payment: data.allows_initial_payment,
        initial_payment_percentage: data.initial_payment_percentage,
        current_phase: data.current_phase,
        current_stage: data.current_stage,
        coordinates,
        localisation: data.facilitiesLocation?.polygon || data.facilitiesLocation?.warehouseShape,
        forme: data.facilitiesLocation?.shapeType,
        adresse: data.facilitiesLocation?.address || data.location,
        phases: data.phases,
        stakeholders: [
          ...(data.stakeholders || []),
          ...(data.internalStakeholders || []),
          ...(data.externalStakeholders || []),
        ],
        delegation: {
          ...(data.delegation || {}),
          ...(data.principals || {}),
        },
        materials: data.materials,
      };

      await saveProject(updateData);

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
    }
  };

  if (isLoading || !formData) {
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

  // Prepare initial data for form
  const initialData = {
    ...formData,
    start_date: formData.startDate,
    end_date: formData.endDate,
    team_size: formData.teamSize,
    facilitiesLocation: formData.coordinates
      ? {
          coordinates: {
            lat: formData.coordinates.latitude,
            lng: formData.coordinates.longitude,
          },
          center: {
            lat: formData.coordinates.latitude,
            lng: formData.coordinates.longitude,
          },
          polygon: formData.localisation || [],
          warehouseShape: formData.localisation || [],
          address: formData.adresse || formData.location,
          shapeType: formData.forme,
        }
      : undefined,
  };

  return (
    <div className="layout-main -mt-8 bg-gray-50">
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
                initialData={initialData}
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
    </div>
  );
};

export default ProjectEdit;
