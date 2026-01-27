/**
 * MilestoneNode - Composant pour afficher un jalon avec ses actions
 * Intègre les actions contextuelles selon le type de jalon
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ClipboardCheck,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Target,
  Play,
  FileText,
  Truck,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type MilestoneType = "validation" | "inspection" | "payment" | "paiement" | "delivery" | "livraison" | "other";

interface MilestoneNodeProps {
  milestone: {
    id: string;
    title?: string;
    name?: string;
    description?: string;
    type?: MilestoneType | string;
    status: string;
    due_date?: string;
    completed_date?: string;
    step_id?: string;
    phase_id?: string;
    documents?: any[];
    inspections?: any[];
  };
  stepId?: string;
  phaseId?: string;
  projectId?: string;
  onScheduleInspection?: (milestoneId: string, stepId?: string) => void;
  onRequestPayment?: (milestoneId: string, stepId?: string) => void;
  onValidate?: (milestoneId: string) => void;
  onViewDetails?: (milestoneId: string) => void;
  compact?: boolean;
}

export const MilestoneNode: React.FC<MilestoneNodeProps> = ({
  milestone,
  stepId,
  phaseId,
  projectId,
  onScheduleInspection,
  onRequestPayment,
  onValidate,
  onViewDetails,
  compact = false,
}) => {
  const milestoneName = milestone.title || milestone.name || "Jalon";
  
  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return {
          label: "Complété",
          className: "bg-success/10 text-success border-success/20",
          icon: <CheckCircle className="h-3 w-3" />,
        };
      case "in_progress":
        return {
          label: "En cours",
          className: "bg-info/10 text-info border-info/20",
          icon: <Clock className="h-3 w-3" />,
        };
      case "blocked":
      case "delayed":
        return {
          label: status === "blocked" ? "Bloqué" : "En retard",
          className: "bg-destructive/10 text-destructive border-destructive/20",
          icon: <AlertTriangle className="h-3 w-3" />,
        };
      case "pending":
      default:
        return {
          label: "En attente",
          className: "bg-muted text-muted-foreground",
          icon: <Target className="h-3 w-3" />,
        };
    }
  };

  const getTypeConfig = (type?: string) => {
    switch (type?.toLowerCase()) {
      case "inspection":
        return {
          label: "Inspection",
          icon: <ClipboardCheck className="h-4 w-4" />,
          className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
          action: "Programmer inspection",
        };
      case "payment":
      case "paiement":
        return {
          label: "Paiement",
          icon: <DollarSign className="h-4 w-4" />,
          className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
          action: "Initier paiement",
        };
      case "validation":
        return {
          label: "Validation",
          icon: <CheckCircle className="h-4 w-4" />,
          className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
          action: "Valider",
        };
      case "delivery":
      case "livraison":
        return {
          label: "Livraison",
          icon: <Truck className="h-4 w-4" />,
          className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
          action: "Confirmer livraison",
        };
      default:
        return {
          label: "Jalon",
          icon: <Target className="h-4 w-4" />,
          className: "bg-muted text-muted-foreground",
          action: "Voir détails",
        };
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const statusConfig = getStatusConfig(milestone.status);
  const typeConfig = getTypeConfig(milestone.type);
  
  const canAction = milestone.status === "pending" || milestone.status === "in_progress";
  const isCompleted = milestone.status === "completed";

  const handlePrimaryAction = () => {
    const type = milestone.type?.toLowerCase();
    if (type === "inspection" && onScheduleInspection) {
      onScheduleInspection(milestone.id, stepId);
    } else if ((type === "payment" || type === "paiement") && onRequestPayment) {
      onRequestPayment(milestone.id, stepId);
    } else if (type === "validation" && onValidate) {
      onValidate(milestone.id);
    } else if (onViewDetails) {
      onViewDetails(milestone.id);
    }
  };

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-2 p-2 rounded-md border transition-colors",
        "hover:border-primary/30 hover:bg-muted/50"
      )}>
        <div className={cn("p-1 rounded", typeConfig.className)}>
          {typeConfig.icon}
        </div>
        <span className="flex-1 text-sm truncate">{milestoneName}</span>
        <Badge variant="outline" className={cn("text-xs", statusConfig.className)}>
          {statusConfig.icon}
        </Badge>
        {canAction && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handlePrimaryAction}
          >
            <Play className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border rounded-lg p-3 transition-all duration-200",
        "hover:shadow-sm hover:border-primary/30",
        isCompleted && "opacity-75"
      )}
    >
      {/* En-tête */}
      <div className="flex items-start gap-3">
        {/* Icône type */}
        <div className={cn("p-2 rounded-lg shrink-0", typeConfig.className)}>
          {typeConfig.icon}
        </div>

        {/* Contenu principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h5 className="font-medium truncate">{milestoneName}</h5>
            <Badge variant="outline" className={cn("text-xs shrink-0", statusConfig.className)}>
              {statusConfig.icon}
              <span className="ml-1">{statusConfig.label}</span>
            </Badge>
          </div>

          {milestone.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {milestone.description}
            </p>
          )}

          {/* Métadonnées */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="text-xs">
              {typeConfig.label}
            </Badge>
            {milestone.due_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Échéance: {formatDate(milestone.due_date)}</span>
              </div>
            )}
            {milestone.completed_date && (
              <div className="flex items-center gap-1 text-success">
                <CheckCircle className="h-3 w-3" />
                <span>Complété: {formatDate(milestone.completed_date)}</span>
              </div>
            )}
            {milestone.documents && milestone.documents.length > 0 && (
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span>{milestone.documents.length} doc(s)</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {canAction && (
            <Button
              variant="default"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handlePrimaryAction}
            >
              <Play className="h-3 w-3 mr-1" />
              {typeConfig.action}
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails?.(milestone.id)}>
                <Eye className="h-4 w-4 mr-2" />
                Voir détails
              </DropdownMenuItem>
              {milestone.type === "inspection" && !isCompleted && (
                <DropdownMenuItem onClick={() => onScheduleInspection?.(milestone.id, stepId)}>
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Programmer inspection
                </DropdownMenuItem>
              )}
              {(milestone.type === "payment" || milestone.type === "paiement") && !isCompleted && (
                <DropdownMenuItem onClick={() => onRequestPayment?.(milestone.id, stepId)}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Initier paiement
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default MilestoneNode;
