/**
 * ProjectCreate
 * Page d'entrée pour la création projet.
 * Toute la persistance (project, phases, stakeholders, …) est déléguée à
 * `ProjectWorkflowService` via `ProjectCreationWorkflow` (saveCurrentStep par étape).
 * — Pas de double persistance, pas de mapping snake_case ici.
 */
import ProjectCreationWorkflow from "@/components/project/ProjectCreationWorkflow";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import type { ProjectWorkflowData } from "@/dtos/workflows/ProjectWorkflowDTOs";

interface SelectedMaterial {
  materialId: string;
  quantity: number;
}

const ProjectCreate = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([]);

  const handleFormSubmit = (data: ProjectWorkflowData) => {
    toast({
      title: t("project_create.toast.created") || "Projet créé",
      description: data.projectData?.title || "",
    });
    const id = data.projectId || data.projectData?.id;
    navigate(id ? `/projects/${id}` : "/projects");
  };

  return (
    <AppLayout
      pageTitle={t("project_create.title")}
      actions={
        <Button variant="ghost" asChild>
          <Link to="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("project_create.back_to_projects")}
          </Link>
        </Button>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-6">
          <ProjectCreationWorkflow
            mode="create"
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
