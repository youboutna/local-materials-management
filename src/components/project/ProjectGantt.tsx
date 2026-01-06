import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Download,
  Filter,
  ZoomIn,
  ZoomOut,
  RefreshCw,
} from "lucide-react";
import EnhancedGanttDiagram from "./GanttDiagram";
import { ProjectData } from "@/types/project";
import { ganttCalculations } from "@/types/ganttCalculations";

interface ProjectGanttProps {
  project: ProjectData;
  phases?: any[];
  compact?: boolean;
}
interface Milestone {
  id: string;
  name: string;
  date: Date;
  status: "completed" | "current" | "upcoming";
  isKey?: boolean;
  description?: string;
}

const ProjectGantt: React.FC<ProjectGanttProps> = ({
  project,
  phases,
  compact = false,
}) => {
  const [viewMode, setViewMode] = useState<"month" | "quarter" | "year">(
    "month"
  );
  const [showCriticalPath, setShowCriticalPath] = useState(true);
  const [showDependencies, setShowDependencies] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Generate realistic phases based on project data
  const generateRealisticPhases = () => {
    if (phases && phases.length > 0) {
      // Apply calculations to existing phases
      const criticalPath = ganttCalculations.calculateCriticalPath(phases);
      const dependencies = ganttCalculations.calculatePhaseDependencies(phases);
      const resourceAllocation =
        ganttCalculations.calculateResourceAllocation(phases);

      return phases.map((phase) => ({
        id: phase.id,
        name: phase.name || phase.phase_name || `Phase ${phase.id}`,
        startDate: new Date(phase.start_date || phase.startDate || new Date()),
        endDate: new Date(phase.end_date || phase.endDate || new Date()),
        progress: phase.progress || 0,
        status: phase.status || "planned",
        color: getPhaseColor(phase.status || "planned"),
        dependencies: dependencies[phase.id] || [],
        isCritical: criticalPath.includes(phase.id),
        budget: phase.budget || phase.estimated_cost || 0,
        actualCost: phase.actual_cost || 0,
        resourceAllocation: resourceAllocation[phase.id] || 0,
      }));
    }

    // Fallback to calculated phases if none provided
    const startDate = new Date(project.startDate || new Date());
    const endDate = new Date(
      project.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    );
    const durationDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const phaseTemplates = [
      {
        name: "Préparation et conception",
        durationPercent: 0.15,
        progressMultiplier: 1.5,
      },
      {
        name: "Appels d'offres",
        durationPercent: 0.1,
        progressMultiplier: 1.2,
      },
      {
        name: "Mobilisation chantier",
        durationPercent: 0.05,
        progressMultiplier: 1.0,
      },
      {
        name: "Travaux de gros œuvre",
        durationPercent: 0.3,
        progressMultiplier: 0.8,
      },
      {
        name: "Travaux secondaires",
        durationPercent: 0.25,
        progressMultiplier: 0.6,
      },
      {
        name: "Finitions et contrôle",
        durationPercent: 0.1,
        progressMultiplier: 0.4,
      },
      {
        name: "Réception et clôture",
        durationPercent: 0.05,
        progressMultiplier: 0.2,
      },
    ];

    let cumulativeDays = 0;
    return phaseTemplates.map((template, index) => {
      const phaseDuration = Math.round(durationDays * template.durationPercent);
      const phaseStart = new Date(startDate);
      phaseStart.setDate(startDate.getDate() + cumulativeDays);

      const phaseEnd = new Date(phaseStart);
      phaseEnd.setDate(phaseStart.getDate() + phaseDuration);

      cumulativeDays += phaseDuration;

      // Calculate realistic progress based on project progress and phase position
      const baseProgress = Math.min(
        100,
        Math.max(
          0,
          (project.progress - index * (100 / phaseTemplates.length)) *
            template.progressMultiplier
        )
      );

      let status: "planned" | "in_progress" | "completed" | "delayed" =
        "planned";
      if (baseProgress >= 95) status = "completed";
      else if (baseProgress > 5) status = "in_progress";
      if (index === 3 && project.progress < 40) status = "delayed"; // Example delay

      return {
        id: `phase-${index + 1}`,
        name: template.name,
        startDate: phaseStart,
        endDate: phaseEnd,
        progress: Math.round(baseProgress),
        status,
        color: getPhaseColor(status),
        dependencies: index > 0 ? [`phase-${index}`] : [],
        isCritical: index >= 2 && index <= 4,
        budget: Math.round(
          (project.budget || 1000000) * template.durationPercent
        ),
        actualCost: Math.round(
          (project.budget || 1000000) *
            template.durationPercent *
            (baseProgress / 100) *
            0.8
        ),
      };
    });
  };

  const getPhaseColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#10b981"; // green
      case "in_progress":
        return "#3b82f6"; // blue
      case "delayed":
        return "#ef4444"; // red
      case "on_hold":
        return "#f59e0b"; // amber
      default:
        return "#6b7280"; // gray
    }
  };
  const projectPhases = useMemo(
    () => generateRealisticPhases(),
    [project, phases]
  );
  const generateMilestones = (): Milestone[] => {
    const milestones = [
      {
        id: "milestone-1",
        name: "Signature contrat",
        date: new Date(project.startDate || new Date()),
        status: "completed" as const, // Use 'as const' to fix type
        isKey: true,
      },
      {
        id: "milestone-2",
        name: "Début travaux",
        date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        status: "completed" as const,
        isKey: true,
      },
      {
        id: "milestone-3",
        name: "Fin gros œuvre",
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "current" as const,
        isKey: true,
      },
      {
        id: "milestone-4",
        name: "Livraison partielle",
        date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        status: "upcoming" as const,
        isKey: false,
      },
      {
        id: "milestone-5",
        name: "Réception définitive",
        date: new Date(
          project.endDate || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
        ),
        status: "upcoming" as const,
        isKey: true,
      },
    ];

    // Adjust milestone status based on actual progress
    return milestones.map((milestone) => {
      const milestoneDate = new Date(milestone.date);
      const today = new Date();

      if (milestoneDate < today) {
        return { ...milestone, status: "completed" as const };
      } else if (
        milestoneDate.toDateString() === today.toDateString() ||
        (milestoneDate > today &&
          milestoneDate.getTime() - today.getTime() < 7 * 24 * 60 * 60 * 1000)
      ) {
        return { ...milestone, status: "current" as const };
      }
      return milestone;
    });
  };
  const milestones = useMemo(() => generateMilestones(), [project]);

  // Calculate timeline metrics
  const timelineMetrics = useMemo(() => {
    return ganttCalculations.calculateTimelineMetrics(projectPhases);
  }, [projectPhases]);
  // Generate milestones

  const handleExport = () => {
    // Export functionality
    console.log("Exporting Gantt chart...");
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 25, 50));
  };

  const handleRefresh = () => {
    // Refresh data
    console.log("Refreshing Gantt data...");
  };

  if (compact) {
    return (
      <div className="space-y-4 p-4 border rounded-lg bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Planning Gantt</h3>
          </div>
          <Badge variant="outline">
            {projectPhases.filter((p) => p.status === "completed").length}/
            {projectPhases.length} phases
          </Badge>
        </div>
        <EnhancedGanttDiagram
          projectTitle={project.title}
          projectPeriod={{
            start: new Date(project.startDate || new Date()),
            end: new Date(
              project.endDate ||
                new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            ),
          }}
          phases={projectPhases.slice(0, 3)} // Show only first 3 phases in compact mode
          milestones={milestones.filter((m) => m.isKey)}
          compact={true}
          showCriticalPath={false}
          showDependencies={false}
        />
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              Diagramme de Gantt - {project.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Planning détaillé avec jalons et chemin critique
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">Affichage:</span>
              </div>
              <Tabs
                value={viewMode}
                onValueChange={(v) => setViewMode(v as any)}
              >
                <TabsList>
                  <TabsTrigger value="month">Mensuel</TabsTrigger>
                  <TabsTrigger value="quarter">Trimestriel</TabsTrigger>
                  <TabsTrigger value="year">Annuel</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center border rounded-md">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomOut}
                    className="h-8 px-2"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="px-3 text-sm">{zoomLevel}%</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomIn}
                    className="h-8 px-2"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showCriticalPath}
                    onChange={(e) => setShowCriticalPath(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Chemin critique
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showDependencies}
                    onChange={(e) => setShowDependencies(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Dépendances
                </label>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg bg-background">
              <p className="text-sm text-muted-foreground">Durée totale</p>
              <p className="text-2xl font-bold">
                {timelineMetrics.totalDuration} jours
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-background">
              <p className="text-sm text-muted-foreground">Avancement réel</p>
              <p className="text-2xl font-bold text-blue-600">
                {timelineMetrics.totalDuration > 0
                  ? Math.round(
                      (timelineMetrics.completedDuration /
                        timelineMetrics.totalDuration) *
                        100
                    )
                  : 0}
                %
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-background">
              <p className="text-sm text-muted-foreground">Phases en retard</p>
              <p className="text-2xl font-bold text-red-600">
                {timelineMetrics.delayedPhases}
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-background">
              <p className="text-sm text-muted-foreground">Échéances proches</p>
              <p className="text-2xl font-bold text-amber-600">
                {timelineMetrics.upcomingMilestones}
              </p>
            </div>
          </div>

          {/* Main Gantt Chart */}
          <div
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: "top left",
            }}
          >
            <EnhancedGanttDiagram
              projectTitle={project.title}
              projectPeriod={{
                start: new Date(project.startDate || new Date()),
                end: new Date(
                  project.endDate ||
                    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                ),
              }}
              phases={projectPhases}
              milestones={milestones}
              compact={false}
              showCriticalPath={showCriticalPath}
              showDependencies={showDependencies}
              viewMode={viewMode}
            />
          </div>

          {/* Legend */}
          <div className="p-4 border rounded-lg bg-muted/30">
            <h4 className="font-medium mb-3">Légende</h4>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#10b981] rounded"></div>
                <span className="text-sm">Terminé</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#3b82f6] rounded"></div>
                <span className="text-sm">En cours</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#ef4444] rounded"></div>
                <span className="text-sm">En retard</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#f59e0b] rounded"></div>
                <span className="text-sm">En attente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#6b7280] rounded"></div>
                <span className="text-sm">Planifié</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-1 bg-red-500"></div>
                <span className="text-sm">Chemin critique</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectGantt;
