import React from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import ProjectDetailByDTO from "@/components/project/ProjectDetailByDTO";
import InspectionPaymentValidation from "@/components/inspections/InspectionPaymentValidation";
import { AppLayout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssociatedPaymentsPanel } from "@/components/common/AssociatedPaymentsPanel";

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

  if (tab === 'inspections' && inspectionId) {
    return (
      <AppLayout pageTitle={t("nav.projects")}>
        <InspectionPaymentValidation />
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle={t("nav.projects")}>
      <Tabs defaultValue="info" className="mt-4">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 sm:grid sm:grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="info" className="flex items-center gap-2">
            Informations
          </TabsTrigger>
          <TabsTrigger value="finance" className="flex items-center gap-2">
            Finance &amp; Paiements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-6">
          <ProjectDetailByDTO projectId={id} onEdit={handleEdit} />
        </TabsContent>

        <TabsContent value="finance" className="mt-6">
          <AssociatedPaymentsPanel
            entityType="project"
            entityId={id}
            showActions
            onPaymentCreated={() => {
              // Invalider les caches si nécessaire
            }}
          />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default ProjectDetail;