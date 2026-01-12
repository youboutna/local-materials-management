/**
 * ProjectTimeline - Unified timeline view combining phases, milestones and tasks
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  BarChart3,
  GitBranch,
  LayoutGrid,
  Route,
  Target,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import GanttChart from './GanttChart';
import PERTDiagram from './PERTDiagram';
import KanbanBoard from './KanbanBoard';
import CriticalPathView from './CriticalPathView';

type ViewMode = 'gantt' | 'pert' | 'kanban' | 'critical';

interface ProjectTimelineProps {
  projectId: string;
  projectData?: any;
  defaultView?: ViewMode;
  onPhaseClick?: (phaseId: string) => void;
  onMilestoneClick?: (milestoneId: string) => void;
  onTaskClick?: (taskId: string) => void;
}

const ProjectTimeline: React.FC<ProjectTimelineProps> = ({
  projectId,
  projectData,
  defaultView = 'gantt',
  onPhaseClick,
  onMilestoneClick,
  onTaskClick
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);

  const viewOptions = [
    { id: 'gantt', label: 'Gantt', icon: BarChart3, description: 'Timeline interactive' },
    { id: 'pert', label: 'PERT', icon: GitBranch, description: 'Analyse probabiliste' },
    { id: 'kanban', label: 'Kanban', icon: LayoutGrid, description: 'Gestion visuelle' },
    { id: 'critical', label: 'Critique', icon: Route, description: 'Chemin critique' }
  ];

  return (
    <div className="space-y-4">
      {/* View Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Planification & Suivi</h2>
        </div>

        <div className="flex items-center bg-muted rounded-lg p-1">
          {viewOptions.map(option => {
            const Icon = option.icon;
            return (
              <Button
                key={option.id}
                variant={viewMode === option.id ? 'secondary' : 'ghost'}
                size="sm"
                className={cn(
                  "gap-2",
                  viewMode === option.id && "bg-background shadow-sm"
                )}
                onClick={() => setViewMode(option.id as ViewMode)}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{option.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Current View */}
      <div className="min-h-[400px]">
        {viewMode === 'gantt' && (
          <GanttChart
            projectId={projectId}
            projectData={projectData}
            onPhaseClick={onPhaseClick}
            onMilestoneClick={onMilestoneClick}
          />
        )}

        {viewMode === 'pert' && (
          <PERTDiagram
            projectId={projectId}
            projectData={projectData}
          />
        )}

        {viewMode === 'kanban' && (
          <KanbanBoard
            projectId={projectId}
            onTaskClick={onTaskClick}
          />
        )}

        {viewMode === 'critical' && (
          <CriticalPathView
            projectId={projectId}
          />
        )}
      </div>

      {/* Quick Stats */}
      <Card className="bg-muted/30">
        <CardContent className="py-3">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Gantt:</span>
              <span className="font-medium">Timeline projet</span>
            </div>
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-orange-500" />
              <span className="text-muted-foreground">PERT:</span>
              <span className="font-medium">Analyse risques</span>
            </div>
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-purple-500" />
              <span className="text-muted-foreground">Kanban:</span>
              <span className="font-medium">Gestion tâches</span>
            </div>
            <div className="flex items-center gap-2">
              <Route className="h-4 w-4 text-destructive" />
              <span className="text-muted-foreground">Critique:</span>
              <span className="font-medium">Délai incompressible</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectTimeline;
