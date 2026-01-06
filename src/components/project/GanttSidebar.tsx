import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Target,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Users,
  DollarSign,
  Zap,
} from "lucide-react";

interface GanttSidebarProps {
  phases: any[];
  timelineMetrics: any;
  onAnalyzeCriticalPath?: () => void;
  onOptimizeSchedule?: () => void;
  onResourceLeveling?: () => void;
}

const GanttSidebar: React.FC<GanttSidebarProps> = ({
  phases,
  timelineMetrics,
  onAnalyzeCriticalPath,
  onOptimizeSchedule,
  onResourceLeveling,
}) => {
  // Calculate additional metrics
  const calculatePhaseStats = () => {
    const totalPhases = phases.length;
    const completedPhases = phases.filter(
      (p) => p.status === "completed"
    ).length;
    const inProgressPhases = phases.filter(
      (p) => p.status === "in_progress"
    ).length;
    const criticalPhases = phases.filter((p) => p.isCritical).length;

    return { totalPhases, completedPhases, inProgressPhases, criticalPhases };
  };

  const phaseStats = calculatePhaseStats();
  const progressPercentage = Math.round(
    (phaseStats.completedPhases / phaseStats.totalPhases) * 100
  );

  return (
    <div className="space-y-4">
      {/* Project Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4" />
            Progression du projet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Phases terminées</span>
              <span className="font-semibold">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} />
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Terminé: {phaseStats.completedPhases}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>En cours: {phaseStats.inProgressPhases}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Path Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-red-500" />
            Chemin critique
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Phases critiques</span>
              <Badge variant="destructive" className="text-xs">
                {phaseStats.criticalPhases}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Durée critique</span>
              <span className="text-sm font-semibold">
                {timelineMetrics.totalDuration} jours
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={onAnalyzeCriticalPath}
            >
              Analyser le chemin
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resource Allocation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-blue-500" />
            Allocation ressources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {phases.slice(0, 3).map((phase) => (
              <div key={phase.id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="truncate">{phase.name}</span>
                  <span>{phase.resourceAllocation || 0}%</span>
                </div>
                <Progress
                  value={phase.resourceAllocation || 0}
                  className="h-1"
                />
              </div>
            ))}
            {phases.length > 3 && (
              <p className="text-xs text-muted-foreground">
                +{phases.length - 3} autres phases
              </p>
            )}
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={onResourceLeveling}
            >
              <Zap className="h-3 w-3 mr-2" />
              Niveler les ressources
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-amber-500" />
            Insights planning
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {timelineMetrics.delayedPhases > 0 && (
            <div className="flex items-center gap-2 p-2 bg-red-50 rounded border border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-xs font-medium text-red-700">
                  {timelineMetrics.delayedPhases} phase(s) en retard
                </p>
                <p className="text-xs text-red-600">Action requise</p>
              </div>
            </div>
          )}

          {timelineMetrics.upcomingMilestones > 0 && (
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-200">
              <Target className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs font-medium text-blue-700">
                  {timelineMetrics.upcomingMilestones} jalon(s) proche(s)
                </p>
                <p className="text-xs text-blue-600">
                  Préparez les validations
                </p>
              </div>
            </div>
          )}

          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={onOptimizeSchedule}
          >
            <BarChart3 className="h-3 w-3 mr-2" />
            Optimiser le planning
          </Button>
        </CardContent>
      </Card>

      {/* Budget Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-green-500" />
            Vue budgétaire
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Budget total</span>
              <span className="font-semibold">
                {phases
                  .reduce((sum, phase) => sum + (phase.budget || 0), 0)
                  .toLocaleString()}{" "}
                MRU
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Coût réel</span>
              <span className="font-semibold">
                {phases
                  .reduce((sum, phase) => sum + (phase.actualCost || 0), 0)
                  .toLocaleString()}{" "}
                MRU
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Variance coût</span>
              <span className="font-semibold text-green-600">
                {(
                  phases.reduce((sum, phase) => sum + (phase.budget || 0), 0) -
                  phases.reduce(
                    (sum, phase) => sum + (phase.actualCost || 0),
                    0
                  )
                ).toLocaleString()}{" "}
                MRU
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GanttSidebar;
