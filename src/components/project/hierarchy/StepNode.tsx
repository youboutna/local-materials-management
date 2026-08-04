/**
 * StepNode - Composant pour afficher une étape avec ses jalons et actions
 * Intègre les actions d'inspection et de paiement par jalon
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Target,
  Play,
  ListChecks,
  Eye,
} from "lucide-react";

interface Milestone {
  id: string;
  title?: string;
  name?: string;
  type?: string;
  status: string;
  due_date?: string;
  completion_date?: string;
}

interface StepNodeProps {
  step: {
    id: string;
    name: string;
    description?: string;
    status: string;
    progress?: number;
    order?: number;
    start_date?: string;
    end_date?: string;
    milestones?: Milestone[];
    tasks?: any[];
  };
  phaseId?: string;
  projectId?: string;
  expanded?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
  onScheduleInspection?: (stepId: string) => void;
  onRequestPayment?: (stepId: string) => void;
  onMilestoneAction?: (action: string, milestone: Milestone) => void;
  compact?: boolean;
}

export const StepNode: React.FC<StepNodeProps> = ({
  step,
  phaseId,
  projectId,
  expanded = false,
  onToggle,
  onClick,
  onScheduleInspection,
  onRequestPayment,
  onMilestoneAction,
  compact = false,
}) => {
  const milestones = step.milestones || [];
  const hasMilestones = milestones.length > 0;
  const tasks = step.tasks || [];

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
      case "pending":
      case "not_started":
      default:
        return {
          label: "En attente",
          className: "bg-muted text-muted-foreground",
          icon: <Target className="h-3 w-3" />,
        };
    }
  };

  const getMilestoneTypeIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case "inspection":
        return <ClipboardCheck className="h-3 w-3 text-blue-600" />;
      case "payment":
      case "paiement":
        return <DollarSign className="h-3 w-3 text-green-600" />;
      case "validation":
        return <CheckCircle className="h-3 w-3 text-purple-600" />;
      default:
        return <Target className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    });
  };

  const statusConfig = getStatusConfig(step.status);

  // Actions disponibles pour l'étape
  const canScheduleInspection = step.status === "in_progress" && onScheduleInspection;
  const canRequestPayment = step.status === "completed" && onRequestPayment;

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-2 rounded-md bg-background border hover:border-primary/30 transition-colors">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
          {step.order || 1}
        </div>
        <span className="flex-1 text-sm truncate font-medium">{step.name}</span>
        {step.progress !== undefined && (
          <div className="flex items-center gap-2">
            <Progress value={step.progress} className="w-16 h-1.5" />
            <span className="text-xs text-muted-foreground w-8">{step.progress}%</span>
          </div>
        )}
        <Badge variant="outline" className={cn("text-xs", statusConfig.className)}>
          {statusConfig.icon}
        </Badge>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border rounded-lg overflow-hidden transition-all duration-200",
        "hover:shadow-sm hover:border-primary/30",
        expanded && "ring-1 ring-primary/20"
      )}
    >
      {/* En-tête étape */}
      <div
        className={cn(
          "flex items-center gap-3 p-3 cursor-pointer transition-colors",
          "hover:bg-muted/50",
          expanded && "bg-muted/30"
        )}
        onClick={onClick}
      >
        {/* Numéro d'ordre */}
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold shrink-0">
          {step.order || 1}
        </div>

        {/* Contenu principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h5 className="font-medium truncate">{step.name}</h5>
            <div className="flex items-center gap-2 shrink-0">
              {step.progress !== undefined && (
                <div className="hidden sm:flex items-center gap-2">
                  <Progress value={step.progress} className="w-16 h-2" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {step.progress}%
                  </span>
                </div>
              )}
              <Badge variant="outline" className={cn("text-xs", statusConfig.className)}>
                {statusConfig.icon}
                <span className="ml-1 hidden sm:inline">{statusConfig.label}</span>
              </Badge>
            </div>
          </div>

          {/* Métadonnées */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
            {(step.start_date || step.end_date) && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(step.start_date)} → {formatDate(step.end_date)}</span>
              </div>
            )}
            {hasMilestones && (
              <div className="flex items-center gap-1">
                <ListChecks className="h-3 w-3" />
                <span>{milestones.length} jalon{milestones.length > 1 ? "s" : ""}</span>
              </div>
            )}
            {tasks.length > 0 && (
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                <span>{tasks.length} tâche{tasks.length > 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {canScheduleInspection && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onScheduleInspection(step.id);
              }}
            >
              <ClipboardCheck className="h-3 w-3 mr-1" />
              <span className="hidden md:inline">Inspection</span>
            </Button>
          )}
          {canRequestPayment && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-success"
              onClick={(e) => {
                e.stopPropagation();
                onRequestPayment(step.id);
              }}
            >
              <DollarSign className="h-3 w-3 mr-1" />
              <span className="hidden md:inline">Paiement</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {hasMilestones && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onToggle?.();
              }}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Jalons dépliés */}
      {expanded && hasMilestones && (
        <div className="border-t bg-muted/20 p-3">
          <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            Jalons de l'étape ({milestones.length})
          </div>
          <div className="space-y-2">
            {milestones.map((milestone, index) => {
              const milestoneStatus = getStatusConfig(milestone.status);
              const canAction = milestone.status === "pending" || milestone.status === "in_progress";
              
              return (
                <div
                  key={milestone.id || index}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-md bg-background border",
                    "hover:border-primary/30 transition-colors"
                  )}
                >
                  {getMilestoneTypeIcon(milestone.type)}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm truncate block">
                      {milestone.title || milestone.name}
                    </span>
                    {milestone.due_date && (
                      <span className="text-xs text-muted-foreground">
                        Échéance: {formatDate(milestone.due_date)}
                      </span>
                    )}
                  </div>
                  <Badge variant="outline" className={cn("text-xs shrink-0", milestoneStatus.className)}>
                    {milestoneStatus.label}
                  </Badge>
                  
                  {/* Actions par type de jalon */}
                  {canAction && milestone.type === "inspection" && onScheduleInspection && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => onScheduleInspection(step.id)}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Programmer
                    </Button>
                  )}
                  {canAction && (milestone.type === "payment" || milestone.type === "paiement") && onRequestPayment && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs text-success border-success/30"
                      onClick={() => onRequestPayment(step.id)}
                    >
                      <DollarSign className="h-3 w-3 mr-1" />
                      Initier
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StepNode;
