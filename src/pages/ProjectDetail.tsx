import React from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import ProjectDetailByDTO from "@/components/project/ProjectDetailByDTO";
import InspectionPaymentValidation from "@/components/inspections/InspectionPaymentValidation";
import { AppLayout } from "@/components/layout";

const ProjectDetail = () => {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tab = searchParams.get('tab');
  const inspectionId = searchParams.get('inspection');

  const handleEdit = () => {
    navigate(`/projects/${id}/edit`);
  };

  if (!id || id === "create") {
    navigate("/projects/create");
    return null;
  }

  // If tab is inspections and we have an inspection ID, show validation form
  if (tab === 'inspections' && inspectionId) {
    return (
      <AppLayout pageTitle={t("nav.projects")}>
        <InspectionPaymentValidation />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      pageTitle={t("nav.projects")}
      pageDescription="Détail du projet"
    >
      <ProjectDetailByDTO projectId={id} onEdit={handleEdit} />
    </AppLayout>
  );
};

export default ProjectDetail;