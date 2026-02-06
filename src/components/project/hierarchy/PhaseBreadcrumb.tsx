/**
 * PhaseBreadcrumb - Navigation hiérarchique pour les pages phase
 * Avec chargement dynamique du titre projet via architecture hexagonale
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
import { Building, Flag, FolderKanban, ChevronLeft, ChevronRight } from "lucide-react";
import { useProjectById } from "@/hooks/hexagonal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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
  /** Phases adjacentes pour navigation */
  adjacentPhases?: {
    previous?: { id: string; name: string };
    next?: { id: string; name: string };
  };
  className?: string;
  /** Afficher navigation entre phases */
  showPhaseNavigation?: boolean;
}

export const PhaseBreadcrumb: React.FC<PhaseBreadcrumbProps> = ({
  project,
  phase,
  step,
  adjacentPhases,
  className,
  showPhaseNavigation = false,
}) => {
  const navigate = useNavigate();
  
  // Charger le projet dynamiquement si le titre n'est pas fourni
  const needToLoadProject = project?.id && !project?.title && !project?.name;
  const { data: loadedProject, isLoading: projectLoading } = useProjectById(
    needToLoadProject ? project.id : ''
  );
  
  // Utiliser le titre chargé ou celui fourni
  const projectTitle = project?.title || project?.name || loadedProject?.title;
  const projectName = projectTitle || "Projet";
  const phaseName = phase?.phase_name || phase?.title || phase?.name || "Phase";
  const stepName = step?.name || step?.title || "Étape";

  const handleNavigateToPhase = (phaseId: string) => {
    if (project?.id) {
      navigate(`/projects/${project.id}/phases/${phaseId}`);
    }
  };

  return (
    <div className={`flex items-center justify-between ${className || ''}`}>
      <Breadcrumb>
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
                    {projectLoading ? (
                      <Skeleton className="h-4 w-24" />
                    ) : (
                      <span className="max-w-[150px] truncate">{projectName}</span>
                    )}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="flex items-center gap-1.5 font-medium">
                    <Building className="h-4 w-4" />
                    {projectLoading ? (
                      <Skeleton className="h-4 w-24" />
                    ) : (
                      <span className="max-w-[200px] truncate">{projectName}</span>
                    )}
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

      {/* Navigation entre phases adjacentes */}
      {showPhaseNavigation && adjacentPhases && (
        <div className="flex items-center gap-2">
          {adjacentPhases.previous && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleNavigateToPhase(adjacentPhases.previous!.id)}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden md:inline max-w-[100px] truncate">
                {adjacentPhases.previous.name}
              </span>
            </Button>
          )}
          {adjacentPhases.next && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleNavigateToPhase(adjacentPhases.next!.id)}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <span className="hidden md:inline max-w-[100px] truncate">
                {adjacentPhases.next.name}
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default PhaseBreadcrumb;
