import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Layers, 
  Building, 
  Plus, 
  FileText, 
  Settings,
  ChevronRight
} from "lucide-react";
import { PhaseNode } from "./PhaseNode";
import { cn } from "@/lib/utils";



import { Phase } from '@/dtos/entities/PhaseDTO';
interface ProjectHierarchyViewProps {
  project: {
    id: string;
    title: string;
    description?: string;
    status: string;
  };
  phases: Phase[];
  onAddPhase?: () => void;
  onPhaseClick?: (phaseId: string) => void;
  onGenerateReport?: () => void;
  onConfigure?: () => void;
}

export const ProjectHierarchyView: React.FC<ProjectHierarchyViewProps> = ({
  project,
  phases,
  onAddPhase,
  onPhaseClick,
  onGenerateReport,
  onConfigure,
}) => {
  const navigate = useNavigate();
  const [expandedPhases, setExpandedPhases] = useState<string[]>([]);

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) =>
      prev.includes(phaseId)
        ? prev.filter((id) => id !== phaseId)
        : [...prev, phaseId]
    );
  };

  const handlePhaseClick = (phaseId: string) => {
    if (onPhaseClick) {
      onPhaseClick(phaseId);
    } else {
      navigate(`/projects/${project.id}/phases/${phaseId}`);
    }
  };

  const getProjectStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "terminé":
        return "default";
      case "in_progress":
      case "en cours":
        return "secondary";
      case "delayed":
      case "en retard":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Layers className="h-5 w-5 text-primary" />
          Structure du Projet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Niveau 1 - Projet (root node) */}
        <div className="relative">
          <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10">
            <div className="p-3 bg-primary text-primary-foreground rounded-lg shrink-0">
              <Building className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{project.title}</h3>
                <Badge variant={getProjectStatusVariant(project.status)}>
                  {project.status}
                </Badge>
              </div>
              {project.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                  {project.description}
                </p>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
          </div>
          
          {/* Ligne de connexion verticale */}
          {phases.length > 0 && (
            <div className="absolute left-8 top-full w-0.5 h-4 bg-border" />
          )}
        </div>

        {/* Niveau 2 - Phases */}
        {phases.length > 0 ? (
          <div className="relative ml-6 space-y-3">
            {/* Ligne verticale continue */}
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />
            
            {phases.map((phase, index) => (
              <div key={phase.id} className="relative pl-6">
                {/* Ligne horizontale de connexion */}
                <div className="absolute left-0 top-6 w-6 h-0.5 bg-border" />
                
                {/* Point de connexion */}
                <div className="absolute left-1.5 top-5 w-2 h-2 rounded-full bg-primary border-2 border-background" />
                
                <PhaseNode
                  phase={phase}
                  expanded={expandedPhases.includes(phase.id)}
                  onToggle={() => togglePhase(phase.id)}
                  onClick={() => handlePhaseClick(phase.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="ml-6 p-6 border-2 border-dashed rounded-lg text-center">
            <p className="text-muted-foreground mb-3">Aucune phase définie</p>
            {onAddPhase && (
              <Button size="sm" variant="outline" onClick={onAddPhase}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une phase
              </Button>
            )}
          </div>
        )}

        {/* Actions projet */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {onAddPhase && (
            <Button variant="outline" size="sm" onClick={onAddPhase}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter phase
            </Button>
          )}
          {onGenerateReport && (
            <Button variant="outline" size="sm" onClick={onGenerateReport}>
              <FileText className="h-4 w-4 mr-2" />
              Rapport
            </Button>
          )}
          {onConfigure && (
            <Button variant="outline" size="sm" onClick={onConfigure}>
              <Settings className="h-4 w-4 mr-2" />
              Configurer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectHierarchyView;