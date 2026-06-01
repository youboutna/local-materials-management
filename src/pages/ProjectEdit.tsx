/**
 * ProjectEdit
 * Édition projet — même workflow référentiel que la création (mode="edit").
 * Le pré-remplissage des 8 étapes est géré par `useUnifiedProjectWorkflow('edit', id)`.
 */
import ProjectCreationWorkflow from "@/components/project/ProjectCreationWorkflow";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import type { ProjectWorkflowData } from "@/dtos/workflows/ProjectWorkflowDTOs";

interface SelectedMaterial {
  materialId: string;
  quantity: number;
}

const ProjectEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([]);

  const handleFormSubmit = (data: ProjectWorkflowData) => {
    toast({
      title: t("projects.edit.success") || "Projet mis à jour",
      description: data.projectData?.title || "",
    });
    navigate(`/projects/${id}`);
  };

  if (!id) {
    return (
      <AppLayout pageTitle={t("projects.edit.title") || "Édition projet"}>
        <p className="text-sm text-muted-foreground">Identifiant projet manquant.</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      pageTitle={t("projects.edit.title") || "Édition projet"}
      actions={
        <Button variant="ghost" asChild>
          <Link to={`/projects/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("project_create.back_to_projects") || "Retour"}
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
            mode="edit"
            projectId={id}
            onSubmit={handleFormSubmit}
            selectedMaterials={selectedMaterials}
            onMaterialsChange={setSelectedMaterials}
          />
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default ProjectEdit;
