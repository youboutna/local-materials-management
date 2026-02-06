/**
 * Unified Gantt Chart with Milestones
 * Integrates phases, tasks, and milestones in a single timeline view
 * Uses GanttPertDataService for data (clean architecture)
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Diamond, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Target,
  TrendingUp
} from 'lucide-react';
import { format, differenceInDays, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getGanttPertService, GanttPhaseData, GanttMilestoneData, UnifiedGanttData } from '@/services/GanttPertDataService';
import { ProjectDetailDTO } from '@/dtos/entities/ProjectDTO';
import { useQuery } from '@tanstack/react-query';

interface UnifiedGanttChartProps {
  projectId: string;
  projectDetail: ProjectDetailDTO;
  compact?: boolean;
  onMilestoneClick?: (milestoneId: string, phaseId?: string) => void;
}

const UnifiedGanttChart: React.FC<UnifiedGanttChartProps> = ({
  projectId,
  projectDetail,
  compact = false,
  onMilestoneClick
}) => {
  const [viewStart, setViewStart] = useState(new Date());

  const { data: ganttData, isLoading } = useQuery<UnifiedGanttData>({
    queryKey: ['unified-gantt', projectId],
    queryFn: async () => {
      const service = getGanttPertService();
      return service.getUnifiedGanttData(projectId, projectDetail);
    },
    enabled: !!projectId && !!projectDetail,
    staleTime: 30_000
  });

  // Set initial view to project start
  useEffect(() => {
    if (ganttData?.projectPeriod.start) {
      setViewStart(ganttData.projectPeriod.start);
    }
  }, [ganttData?.projectPeriod.start]);

  if (isLoading || !ganttData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const { projectTitle, projectPeriod, phases, milestones, criticalPath, spi } = ganttData;
  const totalDays = differenceInDays(projectPeriod.end, projectPeriod.start) || 1;

  const getPhasePosition = (phase: GanttPhaseData) => {
    const startOffset = Math.max(0, differenceInDays(phase.startDate, projectPeriod.start));
    const duration = Math.max(1, differenceInDays(phase.endDate, phase.startDate));
    
    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${Math.min(100, (duration / totalDays) * 100)}%`
    };
  };

  const getMilestonePosition = (milestone: GanttMilestoneData) => {
    const offset = differenceInDays(milestone.date, projectPeriod.start);
    return `${Math.min(100, Math.max(0, (offset / totalDays) * 100))}%`;
  };

  const getPhaseColor = (phase: GanttPhaseData) => {
    switch (phase.status) {
      case 'completed': return 'bg-success';
      case 'in_progress': return 'bg-primary';
      default: return 'bg-muted';
    }
  };

  const getMilestoneIcon = (milestone: GanttMilestoneData) => {
    const isCritical = criticalPath.includes(milestone.id);
    switch (milestone.status) {
      case 'completed':
        return <CheckCircle className={`h-4 w-4 ${isCritical ? 'text-success' : 'text-success/70'}`} />;
      case 'current':
        return <AlertTriangle className={`h-4 w-4 ${isCritical ? 'text-destructive' : 'text-warning'}`} />;
      default:
        return <Diamond className={`h-4 w-4 ${isCritical ? 'text-primary' : 'text-muted-foreground'}`} />;
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setViewStart(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  // Overall progress from phases
  const overallProgress = phases.length > 0
    ? Math.round(phases.reduce((sum, p) => sum + p.progress, 0) / phases.length)
    : 0;

  // SPI Status
  const spiStatus = spi >= 1 ? 'on_track' : spi >= 0.9 ? 'at_risk' : 'delayed';

  return (
    <div className={compact ? 'space-y-3' : 'space-y-6'}>
      {/* Header */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className={compact ? 'h-4 w-4' : 'h-6 w-6'} />
              <div>
                <h2 className={compact ? 'text-lg font-bold' : 'text-2xl font-bold'}>
                  Diagramme de Gantt Unifié
                </h2>
                {!compact && (
                  <p className="text-primary-foreground/90 mt-1">
                    Phases, tâches et jalons du projet
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* SPI Indicator */}
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">
                  SPI: {spi.toFixed(2)}
                </span>
                <Badge 
                  variant={spiStatus === 'on_track' ? 'default' : 'destructive'}
                  className={spiStatus === 'on_track' ? 'bg-success' : spiStatus === 'at_risk' ? 'bg-warning' : ''}
                >
                  {spiStatus === 'on_track' ? 'En avance' : spiStatus === 'at_risk' ? 'À risque' : 'En retard'}
                </Badge>
              </div>
            </div>
          </div>
          <div className={compact ? 'mt-2' : 'mt-4'}>
            <p className={compact ? 'text-sm' : 'text-base'}>
              Période: {format(projectPeriod.start, 'dd/MM/yyyy', { locale: fr })} - {format(projectPeriod.end, 'dd/MM/yyyy', { locale: fr })}
            </p>
          </div>
        </div>
      </Card>

      {/* Progress Overview */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Avancement global</span>
            <span className="text-xl font-bold text-primary">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{phases.filter(p => p.status === 'completed').length}/{phases.length} phases</span>
            <span>{milestones.filter(m => m.status === 'completed').length}/{milestones.length} jalons</span>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Chronologie</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {format(viewStart, 'MMMM yyyy', { locale: fr })}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Phases */}
          <div className="space-y-3">
            {phases.map(phase => {
              const position = getPhasePosition(phase);
              return (
                <div key={phase.id} className="relative">
                  <div className="flex items-center gap-4">
                    <div className="w-28 text-sm font-medium text-muted-foreground truncate" title={phase.name}>
                      {phase.name}
                    </div>
                    <div className="flex-1 relative h-8 bg-muted/30 rounded">
                      <div
                        className={`absolute top-0 h-full rounded ${getPhaseColor(phase)} transition-all`}
                        style={position}
                      >
                        <div 
                          className="absolute top-0 h-full bg-success/50 rounded"
                          style={{ width: `${phase.progress}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                          {phase.progress}%
                        </span>
                      </div>
                    </div>
                    <div className="w-20 text-xs text-muted-foreground text-right">
                      {format(phase.startDate, 'dd/MM')} - {format(phase.endDate, 'dd/MM')}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Milestones Row */}
            <div className="relative mt-4 pt-4 border-t">
              <div className="flex items-center gap-4">
                <div className="w-28 text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  Jalons
                </div>
                <div className="flex-1 relative h-8">
                  {milestones.map(milestone => (
                    <div
                      key={milestone.id}
                      className={`absolute transform -translate-x-1/2 cursor-pointer group z-10 ${criticalPath.includes(milestone.id) ? 'animate-pulse' : ''}`}
                      style={{ left: getMilestonePosition(milestone) }}
                      onClick={() => onMilestoneClick?.(milestone.id, milestone.phaseId)}
                    >
                      <div className={`p-1 bg-background border-2 rounded-full shadow-sm transition-transform hover:scale-110 ${
                        criticalPath.includes(milestone.id) ? 'border-destructive' : 'border-primary'
                      }`}>
                        {getMilestoneIcon(milestone)}
                      </div>
                      <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                        <div className="font-medium">{milestone.name}</div>
                        <div>{format(milestone.date, 'dd/MM/yyyy', { locale: fr })}</div>
                        {criticalPath.includes(milestone.id) && (
                          <div className="text-destructive">⚠ Chemin critique</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="w-20" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones Legend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Diamond className="h-5 w-5" />
            Jalons du Projet ({milestones.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {milestones.slice(0, 8).map(milestone => (
              <div 
                key={milestone.id} 
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors ${
                  criticalPath.includes(milestone.id) ? 'bg-destructive/10 border border-destructive/30' : 'bg-muted/50'
                }`}
                onClick={() => onMilestoneClick?.(milestone.id, milestone.phaseId)}
              >
                <div className="flex items-center gap-3">
                  {getMilestoneIcon(milestone)}
                  <div>
                    <h4 className="font-medium text-sm">{milestone.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {format(milestone.date, 'dd MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={milestone.status === 'completed' ? 'default' : 'secondary'}
                  className={milestone.status === 'completed' ? 'bg-success' : ''}
                >
                  {milestone.status === 'completed' ? 'Terminé' : 
                   milestone.status === 'current' ? 'En retard' : 'À venir'}
                </Badge>
              </div>
            ))}
          </div>
          {milestones.length > 8 && (
            <p className="text-sm text-muted-foreground mt-3 text-center">
              +{milestones.length - 8} autres jalons
            </p>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-success rounded" />
              <span>Terminé</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary rounded" />
              <span>En cours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-muted rounded" />
              <span>Planifié</span>
            </div>
            <div className="flex items-center gap-2">
              <Diamond className="h-4 w-4 text-primary" />
              <span>Jalon</span>
            </div>
            <div className="flex items-center gap-2">
              <Diamond className="h-4 w-4 text-destructive" />
              <span>Chemin critique</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedGanttChart;
