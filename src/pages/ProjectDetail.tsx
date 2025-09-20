import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import ProjectDetailByDTO from "@/components/project/ProjectDetailByDTO";

const ProjectDetail = () => {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate(`/projects/${id}/edit`);
  };

  if (!id || id === "create") {
    navigate("/projects/create");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <ProjectDetailByDTO 
          projectId={id}
          onEdit={handleEdit}
        />
      </div>
      <Footer />
    </div>
  );
};

export default ProjectDetail;