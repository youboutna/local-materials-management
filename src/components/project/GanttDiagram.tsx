import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  PauseCircle,
  Target,
  ArrowRight,
  DollarSign,
  Users,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  eachWeekOfInterval,
  eachDayOfInterval,
  differenceInDays,
  addDays,
  isWithinInterval,
} from "date-fns";
import { fr } from "date-fns/locale";

interface GanttPhase {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  status: "planned" | "in_progress" | "completed" | "delayed" | "on_hold";
  color: string;
  dependencies?: string[];
  isCritical?: boolean;
  budget?: number;
  actualCost?: number;
}

interface Milestone {
  id: string;
  name: string;
  date: Date;
  status: "completed" | "current" | "upcoming";
  isKey?: boolean;
  description?: string;
}
type ViewMode = "month" | "quarter" | "year";

interface EnhancedGanttDiagramProps {
  projectTitle: string;
  projectPeriod: {
    start: Date;
    end: Date;
  };
  phases: GanttPhase[];
  milestones: Milestone[];
  compact?: boolean;
  showCriticalPath?: boolean;
  showDependencies?: boolean;
  viewMode?: ViewMode;
}

const EnhancedGanttDiagram: React.FC<EnhancedGanttDiagramProps> = ({
  projectTitle,
  projectPeriod,
  phases,
  milestones,
  compact = false,
  showCriticalPath = true,
  showDependencies = true,
  viewMode = "month",
}) => {
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);

  // Calculate timeline grid based on view mode
  const timelineGrid = useMemo<
    { date: Date; label: string; width: number }[]
  >(() => {
    const totalDays = differenceInDays(projectPeriod.end, projectPeriod.start);

    if (totalDays <= 0) {
      return [];
    }

    const gridData: { date: Date; label: string; width: number }[] = []; // Fixed line

    switch (viewMode) {
      case "month": {
        const months = eachMonthOfInterval({
          start: projectPeriod.start,
          end: projectPeriod.end,
        });
        for (const date of months) {
          gridData.push({
            date,
            label: format(date, "MMM yyyy", { locale: fr }),
            width:
              (differenceInDays(endOfMonth(date), startOfMonth(date)) /
                totalDays) *
              100,
          });
        }
        break;
      }
      case "quarter": {
        let currentDate = new Date(projectPeriod.start);
        while (currentDate < projectPeriod.end) {
          const quarterEnd = new Date(currentDate);
          quarterEnd.setMonth(currentDate.getMonth() + 3);
          gridData.push({
            date: new Date(currentDate),
            label: `T${
              Math.floor(currentDate.getMonth() / 3) + 1
            } ${currentDate.getFullYear()}`,
            width:
              (differenceInDays(
                quarterEnd < projectPeriod.end ? quarterEnd : projectPeriod.end,
                currentDate
              ) /
                totalDays) *
              100,
          });
          currentDate = quarterEnd;
        }
        break;
      }
      case "year": {
        let yearDate = new Date(projectPeriod.start);
        while (yearDate < projectPeriod.end) {
          const yearEnd = new Date(yearDate);
          yearEnd.setFullYear(yearDate.getFullYear() + 1);
          gridData.push({
            date: new Date(yearDate),
            label: yearDate.getFullYear().toString(),
            width:
              (differenceInDays(
                yearEnd < projectPeriod.end ? yearEnd : projectPeriod.end,
                yearDate
              ) /
                totalDays) *
              100,
          });
          yearDate = yearEnd;
        }
        break;
      }
    }

    return gridData;
  }, [projectPeriod, viewMode]);

  // Calculate phase positions
  const getPhasePosition = (phase: GanttPhase) => {
    const totalDays = differenceInDays(projectPeriod.end, projectPeriod.start);
    const startOffset = differenceInDays(phase.startDate, projectPeriod.start);
    const duration = differenceInDays(phase.endDate, phase.startDate);

    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`,
      progressWidth: `${
        (duration / totalDays) * (phase.progress / 100) * 100
      }%`,
    };
  };

  // Calculate milestone positions
  const getMilestonePosition = (milestone: Milestone) => {
    const totalDays = differenceInDays(projectPeriod.end, projectPeriod.start);
    const offset = differenceInDays(milestone.date, projectPeriod.start);
    return `${(offset / totalDays) * 100}%`;
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "delayed":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "on_hold":
        return <PauseCircle className="h-4 w-4 text-amber-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  // Get milestone icon
  const getMilestoneIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "current":
        return <Target className="h-5 w-5 text-blue-600 animate-pulse" />;
      case "upcoming":
        return <Target className="h-5 w-5 text-gray-400" />;
      default:
        return <Target className="h-5 w-5 text-gray-400" />;
    }
  };

  // Render dependencies
  const renderDependencies = () => {
    if (!showDependencies) return null;

    return phases.map((phase) => {
      if (!phase.dependencies || phase.dependencies.length === 0) return null;

      return phase.dependencies.map((depId) => {
        const dependency = phases.find((p) => p.id === depId);
        if (!dependency) return null;

        const depPos = getPhasePosition(dependency);
        const phasePos = getPhasePosition(phase);

        // Calculate line positions
        const startX = parseFloat(depPos.left) + parseFloat(depPos.width);
        const endX = parseFloat(phasePos.left);
        const midY = phases.indexOf(phase) * 60 + 30; // Approximate Y position

        return (
          <svg
            key={`${depId}-${phase.id}`}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{ zIndex: 1 }}
          >
            <path
              d={`M ${startX}% ${midY} L ${endX}% ${midY}`}
              stroke="#94a3b8"
              strokeWidth="1.5"
              strokeDasharray="5,5"
              fill="none"
              markerEnd="url(#arrowhead)"
            />
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
              </marker>
            </defs>
          </svg>
        );
      });
    });
  };

  // Calculate today's position
  const todayPosition = useMemo(() => {
    const totalDays = differenceInDays(projectPeriod.end, projectPeriod.start);
    const todayOffset = differenceInDays(new Date(), projectPeriod.start);
    return `${(todayOffset / totalDays) * 100}%`;
  }, [projectPeriod]);

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    if (phases.length === 0) return 0;
    return Math.round(
      phases.reduce((sum, phase) => sum + phase.progress, 0) / phases.length
    );
  }, [phases]);

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Timeline header */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>
            Début: {format(projectPeriod.start, "dd/MM/yy", { locale: fr })}
          </span>
          <span>
            Fin: {format(projectPeriod.end, "dd/MM/yy", { locale: fr })}
          </span>
        </div>

        {/* Timeline grid */}
        <div className="relative h-1 bg-gray-200 rounded-full mb-6">
          <div
            className="absolute top-0 h-full bg-primary rounded-full"
            style={{ width: `${overallProgress}%` }}
          />
          <div
            className="absolute top-1/2 transform -translate-y-1/2 w-2 h-4 bg-red-500"
            style={{ left: todayPosition }}
          />
        </div>

        {/* Phases list */}
        <div className="space-y-2">
          {phases.slice(0, 4).map((phase, index) => {
            const position = getPhasePosition(phase);
            return (
              <div key={phase.id} className="flex items-center gap-3">
                <div className="w-32 text-sm truncate">{phase.name}</div>
                <div className="flex-1 relative h-6">
                  <div
                    className="absolute top-0 h-full rounded-md opacity-80"
                    style={{
                      left: position.left,
                      width: position.width,
                      backgroundColor: phase.color,
                    }}
                  >
                    <div
                      className="h-full rounded-md bg-white/30"
                      style={{ width: `${phase.progress}%` }}
                    />
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {phase.progress}%
                </Badge>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Card className="overflow-hidden border-0 shadow-sm">
        <CardContent className="p-0">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background border-b p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{projectTitle}</h3>
                <p className="text-sm text-muted-foreground">
                  Progression globale:{" "}
                  <span className="font-semibold text-primary">
                    {overallProgress}%
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Aujourd'hui</p>
                  <p className="font-medium">
                    {format(new Date(), "dd MMM yyyy", { locale: fr })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline grid */}
          <div className="relative overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Timeline labels */}
              <div className="flex border-b bg-muted/50">
                <div className="w-64 p-3 font-medium text-sm">
                  Phases / Activités
                </div>
                <div className="flex flex-1">
                  {timelineGrid.map((period, index) => (
                    <div
                      key={index}
                      className="flex-1 p-3 text-center text-sm font-medium border-l"
                      style={{ minWidth: `${period.width}%` }}
                    >
                      {period.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Today marker */}
              <div
                className="absolute top-0 h-full w-0.5 bg-red-500 z-20"
                style={{ left: todayPosition }}
              >
                <div className="absolute -top-2 -left-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">A</span>
                </div>
                <div className="absolute top-6 -left-8 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  Aujourd'hui
                </div>
              </div>

              {/* Dependencies */}
              {renderDependencies()}

              {/* Phases */}
              <div className="relative">
                {phases.map((phase, index) => {
                  const position = getPhasePosition(phase);
                  const isSelected = selectedPhase === phase.id;
                  const isHovered = hoveredPhase === phase.id;

                  return (
                    <Tooltip key={phase.id}>
                      <TooltipTrigger asChild>
                        <div
                          className={`flex items-center border-b hover:bg-muted/50 transition-colors ${
                            isSelected ? "bg-primary/5" : ""
                          }`}
                          style={{ height: "60px" }}
                          onClick={() => setSelectedPhase(phase.id)}
                          onMouseEnter={() => setHoveredPhase(phase.id)}
                          onMouseLeave={() => setHoveredPhase(null)}
                        >
                          {/* Phase name */}
                          <div className="w-64 p-3">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(phase.status)}
                              <span className="font-medium text-sm truncate">
                                {phase.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {format(phase.startDate, "dd/MM")} -{" "}
                                {format(phase.endDate, "dd/MM/yy")}
                              </span>
                              {phase.isCritical && showCriticalPath && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  Critique
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Timeline area */}
                          <div className="flex-1 relative">
                            {/* Phase bar */}
                            <div
                              className={`absolute top-1/2 transform -translate-y-1/2 h-8 rounded-md border-2 transition-all ${
                                isHovered ? "shadow-md scale-105" : ""
                              } ${
                                phase.isCritical && showCriticalPath
                                  ? "border-red-500"
                                  : "border-transparent"
                              }`}
                              style={{
                                left: position.left,
                                width: position.width,
                                backgroundColor: phase.color,
                                opacity: isHovered ? 0.9 : 0.8,
                              }}
                            >
                              {/* Progress inside phase */}
                              <div
                                className="h-full rounded-md bg-white/30"
                                style={{ width: `${phase.progress}%` }}
                              />

                              {/* Progress label */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-bold text-white drop-shadow">
                                  {phase.progress}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-bold">{phase.name}</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Statut</p>
                              <p className="font-medium capitalize">
                                {phase.status}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                Progression
                              </p>
                              <p className="font-medium">{phase.progress}%</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Début</p>
                              <p className="font-medium">
                                {format(phase.startDate, "dd/MM/yyyy", {
                                  locale: fr,
                                })}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Fin</p>
                              <p className="font-medium">
                                {format(phase.endDate, "dd/MM/yyyy", {
                                  locale: fr,
                                })}
                              </p>
                            </div>
                          </div>
                          {phase.budget && (
                            <div className="pt-2 border-t">
                              <p className="text-sm text-muted-foreground">
                                Budget
                              </p>
                              <p className="font-medium">
                                {phase.budget.toLocaleString()} MRU
                              </p>
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>

              {/* Milestones row */}
              <div className="flex items-center border-b bg-muted/30">
                <div className="w-64 p-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span className="font-medium text-sm">Jalons</span>
                  </div>
                </div>
                <div className="flex-1 relative" style={{ height: "50px" }}>
                  {milestones.map((milestone, index) => {
                    const position = getMilestonePosition(milestone);

                    return (
                      <Tooltip key={milestone.id}>
                        <TooltipTrigger asChild>
                          <div
                            className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 cursor-pointer"
                            style={{ left: position }}
                          >
                            <div className="relative">
                              {getMilestoneIcon(milestone.status)}
                              {milestone.isKey && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-background" />
                              )}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            <h4 className="font-bold">{milestone.name}</h4>
                            <p className="text-sm">
                              {format(milestone.date, "dd MMMM yyyy", {
                                locale: fr,
                              })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {milestone.status === "completed"
                                ? "Terminé"
                                : milestone.status === "current"
                                ? "En cours"
                                : "À venir"}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Footer stats */}
          <div className="border-t p-4 bg-muted/30">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-600"></div>
                  <span>Terminé</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-600"></div>
                  <span>En cours</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-600"></div>
                  <span>En retard</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-gray-500" />
                  <span>Dépendances</span>
                </div>
              </div>
              <div className="text-muted-foreground">
                {phases.length} phases • {milestones.length} jalons
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default EnhancedGanttDiagram;
