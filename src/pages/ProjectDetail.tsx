import React from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import ProjectDetailByDTO from "@/components/project/ProjectDetailByDTO";
import InspectionPaymentValidation from "@/components/inspections/InspectionPaymentValidation";

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
      <div className="min-h-screen bg-background">
        <InspectionPaymentValidation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar removed - already in App.tsx */}
      <div className="container mx-auto px-4 py-8">
        <ProjectDetailByDTO projectId={id} onEdit={handleEdit} />
      </div>
      {/* Footer removed - already in App.tsx */}
    </div>
  );
};

export default ProjectDetail;