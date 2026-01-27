/**
 * GanttChart - Interactive Gantt diagram with phases, milestones and dependencies
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart3,
  Diamond,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Calendar,
  Flag,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { format, addDays, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, parseISO, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { GanttPertDataService, UnifiedGanttData, getGanttPertService } from '@/services/GanttPertDataService';

type ZoomLevel = 'day' | 'week' | 'month';

interface GanttChartProps {
  projectId: string;
  projectData?: any;
  phaseId?: string; // Optional: filter to specific phase
  onPhaseClick?: (phaseId: string) => void;
  onMilestoneClick?: (milestoneId: string) => void;
  compact?: boolean;
}

const GanttChart: React.FC<GanttChartProps> = ({
  projectId,
  projectData,
  phaseId,
  onPhaseClick,
  onMilestoneClick,
  compact = false
}) => {
  const [data, setData] = useState<UnifiedGanttData | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('week');
  const [viewStart, setViewStart] = useState<Date>(new Date());

  useEffect(() => {
    if (projectId && projectData) {
      loadGanttData();
    }
  }, [projectId, projectData]);

  const loadGanttData = async () => {
    try {
      setLoading(true);
      const service = getGanttPertService();
      const ganttData = await service.getUnifiedGanttData(projectId, projectData);
      setData(ganttData);
      
      if (ganttData.projectPeriod.start) {
        setViewStart(startOfMonth(ganttData.projectPeriod.start));
      }
    } catch (error) {
      console.error('Error loading Gantt data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate time columns based on zoom level
  const timeColumns = useMemo(() => {
    if (!data) return [];
    
    const { start, end } = data.projectPeriod;
    const viewEnd = addDays(end, 30); // Add buffer
    
    switch (zoomLevel) {
      case 'day':
        return eachDayOfInterval({ start: viewStart, end: addDays(viewStart, 30) });
      case 'week':
        return eachWeekOfInterval({ start: viewStart, end: addDays(viewStart, 90) });
      case 'month':
        return eachMonthOfInterval({ start: viewStart, end: addDays(viewStart, 365) });
    }
  }, [data, zoomLevel, viewStart]);

  const columnWidth = zoomLevel === 'day' ? 30 : zoomLevel === 'week' ? 60 : 100;

  const getBarPosition = (startDate: Date, endDate: Date) => {
    const daysDiff = differenceInDays(startDate, viewStart);
    const duration = differenceInDays(endDate, startDate) + 1;
    
    const left = (daysDiff * columnWidth) / (zoomLevel === 'day' ? 1 : zoomLevel === 'week' ? 7 : 30);
    const width = (duration * columnWidth) / (zoomLevel === 'day' ? 1 : zoomLevel === 'week' ? 7 : 30);
    
    return { left: Math.max(0, left), width: Math.max(20, width) };
  };

  const getMilestonePosition = (date: Date) => {
    const daysDiff = differenceInDays(date, viewStart);
    const left = (daysDiff * columnWidth) / (zoomLevel === 'day' ? 1 : zoomLevel === 'week' ? 7 : 30);
    return Math.max(0, left);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success';
      case 'in_progress': return 'bg-primary';
      case 'delayed': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const getMilestoneColor = (status: string, isKey: boolean) => {
    if (status === 'completed') return 'text-success fill-success';
    if (isKey) return 'text-destructive fill-destructive';
    if (status === 'current') return 'text-warning fill-warning';
    return 'text-primary fill-primary';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/4" />
            <div className="h-40 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">Aucune donnée de planification disponible</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(compact && "border-0 shadow-none")}>
      <CardHeader className={cn("pb-3", compact && "px-0")}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            Diagramme de Gantt
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* SPI Badge */}
            <Badge 
              variant={data.spi >= 1 ? 'default' : 'destructive'}
              className={cn(data.spi >= 1 && "bg-success")}
            >
              SPI: {data.spi.toFixed(2)}
            </Badge>

            {/* Navigation */}
            <div className="flex items-center border rounded-md">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewStart(addDays(viewStart, zoomLevel === 'day' ? -7 : -30))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewStart(addDays(viewStart, zoomLevel === 'day' ? 7 : 30))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Zoom */}
            <Select value={zoomLevel} onValueChange={(v) => setZoomLevel(v as ZoomLevel)}>
              <SelectTrigger className="w-[100px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Jour</SelectItem>
                <SelectItem value="week">Semaine</SelectItem>
                <SelectItem value="month">Mois</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("p-0", compact && "px-0")}>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Timeline Header */}
            <div className="flex border-b bg-muted/30">
              <div className="w-48 flex-shrink-0 p-2 border-r font-medium text-sm">
                Phase / Jalon
              </div>
              <div className="flex-1 flex">
                {timeColumns.map((col, idx) => (
                  <div
                    key={idx}
                    className="text-center text-xs py-2 border-r"
                    style={{ width: columnWidth }}
                  >
                    {zoomLevel === 'day' && format(col, 'd', { locale: fr })}
                    {zoomLevel === 'week' && `S${format(col, 'w')}`}
                    {zoomLevel === 'month' && format(col, 'MMM yy', { locale: fr })}
                  </div>
                ))}
              </div>
            </div>

            {/* Today Line Position */}
            <div className="relative">
              {/* Phases */}
              {data.phases.map((phase) => {
                const { left, width } = getBarPosition(phase.startDate, phase.endDate);
                const isCritical = data.criticalPath.some(id => id === phase.id);
                
                return (
                  <div key={phase.id} className="flex border-b hover:bg-muted/30 transition-colors">
                    <div 
                      className="w-48 flex-shrink-0 p-2 border-r flex items-center gap-2 cursor-pointer"
                      onClick={() => onPhaseClick?.(phase.id)}
                    >
                      <span className="text-sm truncate">{phase.name}</span>
                      {isCritical && (
                        <Badge variant="destructive" className="text-xs h-4">
                          Critique
                        </Badge>
                      )}
                    </div>
                    <div className="flex-1 relative h-10">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "absolute top-2 h-6 rounded-md cursor-pointer transition-all",
                                getStatusColor(phase.status),
                                "hover:ring-2 hover:ring-offset-1"
                              )}
                              style={{ left, width }}
                              onClick={() => onPhaseClick?.(phase.id)}
                            >
                              {/* Progress overlay */}
                              <div 
                                className="h-full bg-white/30 rounded-md transition-all"
                                style={{ width: `${100 - phase.progress}%`, marginLeft: 'auto' }}
                              />
                              {/* Progress text */}
                              <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                                {phase.progress}%
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <p className="font-medium">{phase.name}</p>
                              <p className="text-xs">
                                {format(phase.startDate, 'd MMM', { locale: fr })} - {format(phase.endDate, 'd MMM yyyy', { locale: fr })}
                              </p>
                              <p className="text-xs">Progression: {phase.progress}%</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                );
              })}

              {/* Milestones Section */}
              <div className="border-t-2 border-primary/20 mt-2">
                <div className="flex items-center gap-2 px-2 py-1 bg-muted/30">
                  <Diamond className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium">Jalons</span>
                </div>
                
                {data.milestones.map((milestone) => {
                  const left = getMilestonePosition(milestone.date);
                  
                  return (
                    <div key={milestone.id} className="flex border-b hover:bg-muted/30 transition-colors">
                      <div 
                        className="w-48 flex-shrink-0 p-2 border-r flex items-center gap-2 cursor-pointer"
                        onClick={() => onMilestoneClick?.(milestone.id)}
                      >
                        <Diamond className={cn("h-3 w-3", getMilestoneColor(milestone.status, milestone.isKey))} />
                        <span className="text-sm truncate">{milestone.name}</span>
                      </div>
                      <div className="flex-1 relative h-8">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="absolute top-1 cursor-pointer"
                                style={{ left }}
                                onClick={() => onMilestoneClick?.(milestone.id)}
                              >
                                <Diamond 
                                  className={cn(
                                    "h-6 w-6 transition-transform hover:scale-125",
                                    getMilestoneColor(milestone.status, milestone.isKey)
                                  )} 
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1">
                                <p className="font-medium">{milestone.name}</p>
                                <p className="text-xs">
                                  {format(milestone.date, 'd MMMM yyyy', { locale: fr })}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {milestone.status === 'completed' ? 'Terminé' : 
                                   milestone.status === 'current' ? 'En cours' : 'À venir'}
                                </Badge>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 p-3 border-t bg-muted/20 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-success" />
            <span>Terminé</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-primary" />
            <span>En cours</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-muted" />
            <span>Planifié</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Diamond className="h-3 w-3 text-destructive fill-destructive" />
            <span>Jalon critique</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Diamond className="h-3 w-3 text-primary fill-primary" />
            <span>Jalon</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GanttChart;
