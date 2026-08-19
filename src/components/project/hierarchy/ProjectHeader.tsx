import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  ChevronRight, 
  TrendingUp, 
  Wallet, 
  Calendar, 
  Layers,
  MapPin,
  Users,
  Building,
  Clock,
  CheckCircle,
  AlertTriangle,
  Target
} from "lucide-react";

import { cn } from "@/lib/utils";

interface ProjectHeaderProps {
  project: {
    id: string;
    title: string;
    description?: string;
    status: string;
    progress: number;
    budget: number;
    currency?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    teamSize?: number;
  };
  phasesStats: {
    total: number;
    completed: number;
    inProgress: number;
  };
  onEdit?: () => void;
  onDelete?: () => void;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  project,
  phasesStats,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "terminé":
        return { 
          variant: "default" as const, 
          className: "bg-success/10 text-success border-success/20",
          icon: <CheckCircle className="h-3.5 w-3.5" />
        };
      case "in_progress":
      case "en cours":
        return { 
          variant: "secondary" as const, 
          className: "bg-info/10 text-info border-info/20",
          icon: <Clock className="h-3.5 w-3.5" />
        };
      case "delayed":
      case "en retard":
        return { 
          variant: "destructive" as const, 
          className: "bg-destructive/10 text-destructive border-destructive/20",
          icon: <AlertTriangle className="h-3.5 w-3.5" />
        };
      case "on_hold":
      case "suspendu":
        return { 
          variant: "outline" as const, 
          className: "bg-warning/10 text-warning border-warning/20",
          icon: <Target className="h-3.5 w-3.5" />
        };
      default:
        return { 
          variant: "secondary" as const, 
          className: "bg-muted text-muted-foreground",
          icon: <Clock className="h-3.5 w-3.5" />
        };
    }
  };

  const formatCurrency = (amount: number, currency = "MRU") => {
    return new Intl.NumberFormat("fr-FR", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + " " + currency;
  };

  const getDaysRemaining = () => {
    if (!project.endDate) return "N/A";
    // When project is nearly done, show closure state instead of raw delay
    if (project.progress >= 95) return "Clôture en cours";
    const end = new Date(project.endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `${Math.abs(diff)}j de retard`;
    if (diff === 0) return "Aujourd'hui";
    return `${diff}j restants`;
  };

  const getDelayColor = (): "success" | "warning" | "destructive" | "info" => {
    if (!project.endDate) return "muted" as any;
    if (project.progress >= 95) return "success";
    const end = new Date(project.endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return "destructive";
    if (diff <= 7) return "warning";
    return "success";
  };

  const statusConfig = getStatusConfig(project.status);

  return (
    <div className="space-y-3">
      {/* Breadcrumb hiérarchique */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/projects")}
          className="h-auto p-0 text-xs hover:bg-transparent hover:text-foreground"
        >
          <Building className="h-3.5 w-3.5 mr-1" />
          <span>Projets</span>
        </Button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground truncate max-w-[280px]">
          {project.title}
        </span>
      </div>

      {/* Header principal — une seule bande compacte */}
      <div className="rounded-lg border bg-card">
        <div className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-lg font-semibold tracking-tight lg:text-xl">
                {project.title}
              </h1>
              <Badge
                variant={statusConfig.variant}
                className={cn("flex shrink-0 items-center gap-1 text-[11px]", statusConfig.className)}
              >
                {statusConfig.icon}
                {project.status || "En cours"}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {project.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {project.location}
                </span>
              )}
              {project.teamSize !== undefined && (
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {project.teamSize} membres
                </span>
              )}
              {project.description && (
                <span className="truncate max-w-[420px]" title={project.description}>
                  {project.description}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => navigate("/projects")}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour
            </Button>
            {onEdit && (
              <Button variant="outline" size="sm" className="h-8" onClick={onEdit}>
                Modifier
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive" onClick={onDelete}>
                Supprimer
              </Button>
            )}
          </div>
        </div>

        {/* Indicateurs clés — bande d'une ligne (plus de grille de cartes) */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t px-3 py-2 text-xs">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground">Progression</span>
            <span className="font-semibold">{project.progress}%</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground">Budget</span>
            <span className="font-semibold">{formatCurrency(project.budget, project.currency)}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground">Délai</span>
            <span className="font-semibold">{getDaysRemaining()}</span>
            {project.endDate && (
              <span className="text-muted-foreground">
                ({new Date(project.endDate).toLocaleDateString("fr-FR")})
              </span>
            )}
          </span>
          <span className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground">Phases</span>
            <span className="font-semibold">
              {phasesStats.completed}/{phasesStats.total}
            </span>
            <span className="text-muted-foreground">({phasesStats.inProgress} en cours)</span>
          </span>
        </div>
      </div>
    </div>
  );
};


export default ProjectHeader;
