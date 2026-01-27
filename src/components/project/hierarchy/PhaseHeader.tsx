/**
 * PhaseHeader - En-tête de phase avec KPIs et actions
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Calendar,
  DollarSign,
  Edit,
  CheckCircle,
  Clock,
  AlertTriangle,
  Target,
  Layers,
  ClipboardCheck,
  Banknote,
} from "lucide-react";
import { KPICard } from "./KPICard";

interface PhaseHeaderProps {
  phase: {
    id: string;
    phase_name?: string;
    title?: string;
    name?: string;
    description?: string;
    status: string;
    progress?: number;
    start_date?: string;
    end_date?: string;
    estimated_cost?: number;
    budget?: number;
    steps?: any[];
    milestones?: any[];
  };
  projectBudget?: number;
  metrics?: {
    stepsCount?: number;
    completedSteps?: number;
    milestonesCount?: number;
    completedMilestones?: number;
    inspectionsCount?: number;
    paymentsTotal?: number;
  };
  onEdit?: () => void;
  onScheduleInspection?: () => void;
  onRequestPayment?: () => void;
  canRequestPayment?: boolean;
  className?: string;
}

export const PhaseHeader: React.FC<PhaseHeaderProps> = ({
  phase,
  projectBudget,
  metrics = {},
  onEdit,
  onScheduleInspection,
  onRequestPayment,
  canRequestPayment = false,
  className,
}) => {
  const phaseName = phase.phase_name || phase.title || phase.name || "Phase";
  const budget = phase.estimated_cost || phase.budget || 0;
  const progress = phase.progress || 0;
  const hasSteps = (phase.steps?.length || 0) > 0;
  const stepsCount = metrics.stepsCount || phase.steps?.length || 0;
  const milestonesCount = metrics.milestonesCount || phase.milestones?.length || 0;

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return {
          label: "Terminée",
          className: "bg-success/10 text-success border-success/20",
          icon: <CheckCircle className="h-4 w-4" />,
        };
      case "in_progress":
        return {
          label: "En cours",
          className: "bg-info/10 text-info border-info/20",
          icon: <Clock className="h-4 w-4" />,
        };
      case "delayed":
        return {
          label: "En retard",
          className: "bg-destructive/10 text-destructive border-destructive/20",
          icon: <AlertTriangle className="h-4 w-4" />,
        };
      default:
        return {
          label: "Planifiée",
          className: "bg-muted text-muted-foreground",
          icon: <Target className="h-4 w-4" />,
        };
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "0 MRU";
    return new Intl.NumberFormat("fr-FR", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(amount) + " MRU";
  };

  const calculateDaysRemaining = () => {
    if (!phase.end_date) return null;
    const end = new Date(phase.end_date);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysRemaining = calculateDaysRemaining();
  const statusConfig = getStatusConfig(phase.status);
  const budgetPercentage = projectBudget ? Math.round((budget / projectBudget) * 100) : null;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Ligne titre + statut + actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Layers className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{phaseName}</h1>
            {phase.description && (
              <p className="text-sm text-muted-foreground line-clamp-1 max-w-md mt-0.5">
                {phase.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge 
            variant="outline" 
            className={cn("text-sm px-3 py-1", statusConfig.className)}
          >
            {statusConfig.icon}
            <span className="ml-1.5">{statusConfig.label}</span>
          </Badge>
          
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-1.5" />
              Modifier
            </Button>
          )}
          
          {onScheduleInspection && (
            <Button variant="outline" size="sm" onClick={onScheduleInspection}>
              <ClipboardCheck className="h-4 w-4 mr-1.5" />
              Inspection
            </Button>
          )}
          
          {canRequestPayment && onRequestPayment && (
            <Button 
              size="sm" 
              onClick={onRequestPayment}
              className="bg-success hover:bg-success/90 text-success-foreground"
            >
              <Banknote className="h-4 w-4 mr-1.5" />
              Paiement
            </Button>
          )}
        </div>
      </div>

      {/* Barre d'informations */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/30 rounded-lg border">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{formatDate(phase.start_date)} → {formatDate(phase.end_date)}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span>{formatCurrency(budget)}</span>
          {budgetPercentage && (
            <span className="text-muted-foreground">({budgetPercentage}% du projet)</span>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span>
            {hasSteps 
              ? `${stepsCount} étape${stepsCount > 1 ? "s" : ""}`
              : `${milestonesCount} jalon${milestonesCount > 1 ? "s" : ""} directs`
            }
          </span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm font-medium">{progress}%</span>
          <Progress value={progress} className="w-32 h-2" />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          title="Progression"
          value={`${progress}%`}
          icon={<Target className="h-5 w-5" />}
          color={progress >= 100 ? "success" : progress >= 50 ? "info" : "muted"}
          trend={progress >= 75 ? "positive" : undefined}
        />
        
        <KPICard
          title={hasSteps ? "Étapes" : "Jalons"}
          value={hasSteps 
            ? `${metrics.completedSteps || 0}/${stepsCount}`
            : `${metrics.completedMilestones || 0}/${milestonesCount}`
          }
          icon={<Layers className="h-5 w-5" />}
          color="primary"
        />
        
        <KPICard
          title="Inspections"
          value={`${metrics.inspectionsCount || 0}`}
          icon={<ClipboardCheck className="h-5 w-5" />}
          color="info"
        />
        
        <KPICard
          title="Délai"
          value={daysRemaining !== null 
            ? daysRemaining > 0 
              ? `${daysRemaining} j` 
              : daysRemaining === 0 
                ? "Aujourd'hui"
                : `${Math.abs(daysRemaining)} j retard`
            : "N/A"
          }
          icon={<Calendar className="h-5 w-5" />}
          color={daysRemaining !== null && daysRemaining < 0 ? "destructive" : daysRemaining !== null && daysRemaining < 7 ? "warning" : "muted"}
        />
      </div>
    </div>
  );
};

export default PhaseHeader;
