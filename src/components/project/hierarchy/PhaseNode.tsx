import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Flag,
  Calendar,
  DollarSign,
  Milestone as MilestoneIcon,
  ListTodo,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  Target,
} from "lucide-react";

interface Step {
  id: string;
  name: string;
  status: string;
  progress?: number;
  order?: number;
}

interface PhaseNodeProps {
  phase: {
    id: string;
    title?: string;
    phase_name?: string;
    phase?: string;
    name?: string;
    description?: string;
    status: string;
    progress: number;
    startDate?: string;
    endDate?: string;
    start_date?: string;
    end_date?: string;
    budget?: number;
    estimated_cost?: number;
    steps?: Step[];
    stages?: Step[];
    milestones?: any[];
  };
  expanded?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
  level?: number;
}

export const PhaseNode: React.FC<PhaseNodeProps> = ({
  phase,
  expanded = false,
  onToggle,
  onClick,
  level = 0,
}) => {
  const phaseName = phase.title || phase.phase_name || phase.phase || phase.name || "Phase";
  const startDate = phase.startDate || phase.start_date;
  const endDate = phase.endDate || phase.end_date;
  const budget = phase.budget || phase.estimated_cost;
  const steps = phase.steps || phase.stages || [];
  const hasSteps = steps.length > 0;
  const directMilestones = phase.milestones && phase.milestones.length > 0;

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return {
          label: "Terminée",
          className: "bg-success/10 text-success border-success/20",
          icon: <CheckCircle className="h-3 w-3" />,
        };
      case "in_progress":
        return {
          label: "En cours",
          className: "bg-info/10 text-info border-info/20",
          icon: <Clock className="h-3 w-3" />,
        };
      case "delayed":
        return {
          label: "En retard",
          className: "bg-destructive/10 text-destructive border-destructive/20",
          icon: <AlertTriangle className="h-3 w-3" />,
        };
      case "not_started":
      case "planned":
      default:
        return {
          label: "Planifiée",
          className: "bg-muted text-muted-foreground",
          icon: <Target className="h-3 w-3" />,
        };
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    });
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return null;
    return new Intl.NumberFormat("fr-FR", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(amount) + " MRU";
  };

  const statusConfig = getStatusConfig(phase.status);

  return (
    <div 
      className={cn(
        "border rounded-lg overflow-hidden transition-all duration-200",
        "hover:shadow-sm hover:border-primary/30",
        expanded && "ring-1 ring-primary/20"
      )}
    >
      {/* En-tête phase */}
      <div
        className={cn(
          "flex items-center gap-3 p-4 cursor-pointer transition-colors",
          "hover:bg-muted/50",
          expanded && "bg-muted/30"
        )}
        onClick={onClick}
      >
        {/* Icône phase */}
        <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
          <Flag className="h-4 w-4" />
        </div>

        {/* Contenu principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium truncate">{phaseName}</h4>
            <div className="flex items-center gap-3 shrink-0">
              <div className="hidden sm:flex items-center gap-2">
                <Progress value={phase.progress} className="w-20 h-2" />
                <span className="text-sm font-medium text-muted-foreground w-10">
                  {phase.progress}%
                </span>
              </div>
              <Badge 
                variant="outline" 
                className={cn("text-xs shrink-0", statusConfig.className)}
              >
                {statusConfig.icon}
                <span className="ml-1 hidden sm:inline">{statusConfig.label}</span>
              </Badge>
            </div>
          </div>

          {/* Métadonnées */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
            {(startDate || endDate) && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(startDate)} → {formatDate(endDate)}</span>
              </div>
            )}
            {budget && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                <span>{formatCurrency(budget)}</span>
              </div>
            )}
            {hasSteps && (
              <div className="flex items-center gap-1">
                <ListTodo className="h-3 w-3" />
                <span>{steps.length} étape{steps.length > 1 ? "s" : ""}</span>
              </div>
            )}
            {directMilestones && !hasSteps && (
              <div className="flex items-center gap-1">
                <MilestoneIcon className="h-3 w-3" />
                <span>{phase.milestones!.length} jalon{phase.milestones!.length > 1 ? "s" : ""}</span>
              </div>
            )}
          </div>

          {/* Barre de progression mobile */}
          <div className="sm:hidden mt-2">
            <Progress value={phase.progress} className="h-1.5" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          {(hasSteps || directMilestones) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onToggle?.();
              }}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Contenu déplié */}
      {expanded && hasSteps && (
        <div className="border-t bg-muted/20 p-3">
          <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            Étapes ({steps.length})
          </div>
          <div className="space-y-2">
            {steps.map((step, index) => {
              const stepStatus = getStatusConfig(step.status);
              return (
                <div
                  key={step.id || index}
                  className="flex items-center gap-3 p-2 rounded-md bg-background border"
                >
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-muted text-xs font-medium">
                    {step.order || index + 1}
                  </div>
                  <span className="flex-1 text-sm truncate">{step.name}</span>
                  <Badge variant="outline" className={cn("text-xs", stepStatus.className)}>
                    {stepStatus.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {expanded && directMilestones && !hasSteps && (
        <div className="border-t bg-muted/20 p-3">
          <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            Jalons directs ({phase.milestones!.length})
          </div>
          <div className="space-y-2">
            {phase.milestones!.map((milestone, index) => {
              const milestoneStatus = getStatusConfig(milestone.status);
              return (
                <div
                  key={milestone.id || index}
                  className="flex items-center gap-3 p-2 rounded-md bg-background border"
                >
                  <MilestoneIcon className="h-4 w-4 text-primary shrink-0" />
                  <span className="flex-1 text-sm truncate">{milestone.title || milestone.name}</span>
                  <Badge variant="outline" className={cn("text-xs", milestoneStatus.className)}>
                    {milestoneStatus.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhaseNode;
