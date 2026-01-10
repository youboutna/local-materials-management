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
import { KPICard } from "./KPICard";
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
    const end = new Date(project.endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `${Math.abs(diff)}j de retard`;
    if (diff === 0) return "Aujourd'hui";
    return `${diff}j restants`;
  };

  const getDelayColor = (): "success" | "warning" | "destructive" | "info" => {
    if (!project.endDate) return "muted" as any;
    const end = new Date(project.endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return "destructive";
    if (diff <= 7) return "warning";
    return "success";
  };

  const statusConfig = getStatusConfig(project.status);

  return (
    <div className="space-y-6">
      {/* Breadcrumb hiérarchique */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/projects")}
          className="h-auto p-0 hover:bg-transparent hover:text-foreground"
        >
          <Building className="h-4 w-4 mr-1" />
          <span>Projets</span>
        </Button>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground truncate max-w-[300px]">
          {project.title}
        </span>
      </div>

      {/* Header Principal */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-primary/10 shrink-0">
              <Building className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight truncate">
                {project.title}
              </h1>
              {project.description && (
                <p className="text-muted-foreground mt-1 line-clamp-2">
                  {project.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <Badge 
                  variant={statusConfig.variant}
                  className={cn("flex items-center gap-1.5", statusConfig.className)}
                >
                  {statusConfig.icon}
                  {project.status || "En cours"}
                </Badge>
                {project.location && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{project.location}</span>
                  </div>
                )}
                {project.teamSize !== undefined && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{project.teamSize} membres</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/projects")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              Modifier
            </Button>
          )}
          {onDelete && (
            <Button variant="destructive" size="sm" onClick={onDelete}>
              Supprimer
            </Button>
          )}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Progression"
          value={`${project.progress}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          color={project.progress >= 75 ? "success" : project.progress >= 50 ? "info" : "warning"}
          trend={project.progress >= 50 ? "positive" : "neutral"}
          subtitle="du projet complété"
        />
        
        <KPICard
          title="Budget"
          value={formatCurrency(project.budget, project.currency)}
          icon={<Wallet className="h-5 w-5" />}
          color="success"
          subtitle="budget alloué"
        />
        
        <KPICard
          title="Délai"
          value={getDaysRemaining()}
          icon={<Calendar className="h-5 w-5" />}
          color={getDelayColor()}
          subtitle={project.endDate ? new Date(project.endDate).toLocaleDateString("fr-FR") : "Non défini"}
        />
        
        <KPICard
          title="Phases"
          value={`${phasesStats.completed}/${phasesStats.total}`}
          icon={<Layers className="h-5 w-5" />}
          color="primary"
          subtitle={`${phasesStats.inProgress} en cours`}
        />
      </div>
    </div>
  );
};

export default ProjectHeader;
