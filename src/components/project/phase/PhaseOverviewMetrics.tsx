/**
 * PhaseOverviewMetrics Component
 * Displays key metric cards for phase overview
 * Max 300 lines following SRP
 */

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Calendar,
  ChevronRight,
  DollarSign,
  Target,
  TrendingUp,
} from "lucide-react";
import { PhaseDTO } from "@/dtos/entities/PhaseDTO";
import {
  formatCurrency,
  formatDate,
  calculateRemainingDays,
  getStatusColor,
  getStatusLabel,
} from "@/utils/phaseDisplayHelpers";

interface ProgressMetrics {
  overallProgress: number;
  completedSteps: number;
  totalSteps: number;
  completedTasks: number;
  totalTasks: number;
}

interface PhaseCosts {
  costVariance: number;
  totalPayments: number;
  totalExpenses: number;
  totalSpent: number;
  isOverBudget?: boolean;
}

interface Metrics {
  completedSteps: number;
  stepsCount: number;
}

interface PhaseOverviewMetricsProps {
  phase: PhaseDTO;
  phaseCosts?: PhaseCosts | null;
  progressMetrics?: ProgressMetrics | null;
  metrics: Metrics;
  loadingCosts?: boolean;
  onWorkflowClick: () => void;
}

const PhaseOverviewMetrics: React.FC<PhaseOverviewMetricsProps> = ({
  phase,
  phaseCosts,
  progressMetrics,
  metrics,
  loadingCosts,
  onWorkflowClick,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Progress Card */}
      <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
        <div className="p-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <Badge variant="outline" className={getStatusColor(phase.status)}>
              {getStatusLabel(phase.status)}
            </Badge>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-bold">{progressMetrics?.overallProgress || phase.progress}%</p>
            <p className="text-sm text-muted-foreground">Progression globale</p>
          </div>
          <Progress value={progressMetrics?.overallProgress || phase.progress} className="h-1.5 mt-3" />
          {progressMetrics && (
            <p className="text-xs text-muted-foreground mt-2">
              {progressMetrics.completedSteps}/{progressMetrics.totalSteps} étapes • {progressMetrics.completedTasks}/{progressMetrics.totalTasks} tâches
            </p>
          )}
        </div>
      </Card>

      {/* Budget Card */}
      <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
        <div className="p-4 bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-green-500/10">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            {loadingCosts ? (
              <Skeleton className="h-5 w-16" />
            ) : phaseCosts?.costVariance !== undefined && phaseCosts.costVariance !== 0 && (
              <Badge variant={(phaseCosts.costVariance ?? 0) > 0 ? "destructive" : "default"}>
                {(phaseCosts.costVariance ?? 0) > 0 ? "+" : ""}
                {formatCurrency(phaseCosts.costVariance)}
              </Badge>
            )}
          </div>
          
          <div className="mt-3">
            <p className="text-2xl font-bold">{formatCurrency(phase.estimatedCost)}</p>
            <p className="text-sm text-muted-foreground">Budget estimé</p>
          </div>
          
          {loadingCosts ? (
            <div className="mt-3 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : phaseCosts ? (
            <div className="mt-3 pt-3 border-t border-green-200/30 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payé:</span>
                <span className="font-medium text-blue-600">
                  {formatCurrency(phaseCosts.totalPayments)}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Dépenses:</span>
                <span className="font-medium text-orange-600">
                  {formatCurrency(phaseCosts.totalExpenses)}
                </span>
              </div>
              
              <Separator className="my-1" />
              
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span className={cn(
                  "font-bold",
                  phaseCosts.totalSpent > (phase.estimated_cost || 0) 
                    ? "text-red-600" 
                    : "text-green-600"
                )}>
                  {formatCurrency(phaseCosts.totalSpent)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-3">Aucune donnée</p>
          )}
        </div>
      </Card>

      {/* Timeline Card */}
      <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
        <div className="p-4 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-blue-500/10">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold">{calculateRemainingDays(phase.end_date)}</p>
            <p className="text-sm text-muted-foreground">Jours restants</p>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            Fin: {formatDate(phase.end_date)}
          </p>
        </div>
      </Card>

      {/* Workflow Card */}
      <Card 
        className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
        onClick={onWorkflowClick}
      >
        <div className="p-4 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-purple-500/10">
              <Target className="h-5 w-5 text-purple-600" />
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold">{metrics.completedSteps}/{metrics.stepsCount}</p>
            <p className="text-sm text-muted-foreground">Workflow</p>
          </div>
          <Progress 
            value={metrics.stepsCount > 0 ? (metrics.completedSteps / metrics.stepsCount) * 100 : 0} 
            className="h-1.5 mt-3" 
          />
        </div>
      </Card>
    </div>
  );
};

export default PhaseOverviewMetrics;
