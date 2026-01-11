/**
 * PhaseBreadcrumb - Navigation hiérarchique pour les pages phase
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Building, Flag, FolderKanban } from "lucide-react";

interface PhaseBreadcrumbProps {
  project?: {
    id: string;
    title?: string;
    name?: string;
  };
  phase?: {
    id: string;
    phase_name?: string;
    title?: string;
    name?: string;
  };
  step?: {
    id: string;
    name?: string;
    title?: string;
  };
  className?: string;
}

export const PhaseBreadcrumb: React.FC<PhaseBreadcrumbProps> = ({
  project,
  phase,
  step,
  className,
}) => {
  const navigate = useNavigate();
  
  const projectName = project?.title || project?.name || "Projet";
  const phaseName = phase?.phase_name || phase?.title || phase?.name || "Phase";
  const stepName = step?.name || step?.title || "Étape";

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {/* Niveau 0: Projets */}
        <BreadcrumbItem>
          <BreadcrumbLink
            className="flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors"
            onClick={() => navigate("/projects")}
          >
            <FolderKanban className="h-4 w-4" />
            <span className="hidden sm:inline">Projets</span>
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator />

        {/* Niveau 1: Projet */}
        {project && (
          <>
            <BreadcrumbItem>
              {phase ? (
                <BreadcrumbLink
                  className="flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <Building className="h-4 w-4" />
                  <span className="max-w-[150px] truncate">{projectName}</span>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="flex items-center gap-1.5 font-medium">
                  <Building className="h-4 w-4" />
                  <span className="max-w-[200px] truncate">{projectName}</span>
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </>
        )}

        {/* Niveau 2: Phase */}
        {phase && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {step ? (
                <BreadcrumbLink
                  className="flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => navigate(`/projects/${project?.id}/phases/${phase.id}`)}
                >
                  <Flag className="h-4 w-4" />
                  <span className="max-w-[150px] truncate">{phaseName}</span>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="flex items-center gap-1.5 font-medium text-primary">
                  <Flag className="h-4 w-4" />
                  <span className="max-w-[200px] truncate">{phaseName}</span>
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </>
        )}

        {/* Niveau 3: Étape (optionnel) */}
        {step && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-1.5 font-medium text-primary">
                <span className="max-w-[200px] truncate">{stepName}</span>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default PhaseBreadcrumb;
