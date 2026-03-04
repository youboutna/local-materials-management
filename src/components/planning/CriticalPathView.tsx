/**
 * CriticalPathView - Displays the critical path with float analysis
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Route,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Target,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMilestoneService, MilestoneService } from '@/application/services/MilestoneService';
import { CriticalPathDTO, MilestoneDTO } from '@/dtos/entities/MilestoneDTO';
import { differenceInDays, parseISO, format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CriticalPathViewProps {
  projectId: string;
  phaseId?: string; // Optional: filter to specific phase
  compact?: boolean;
}

const CriticalPathView: React.FC<CriticalPathViewProps> = ({
  projectId,
  phaseId,
  compact = false
}) => {
  const [criticalPath, setCriticalPath] = useState<CriticalPathDTO | null>(null);
  const [milestones, setMilestones] = useState<MilestoneDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCriticalPath = useCallback(async () => {
    try {
      setLoading(true);
      const [pathData, milestonesData] = await Promise.all([
        MilestoneService.calculateCriticalPath(projectId),
        MilestoneService.getProjectMilestones(projectId)
      ]);
      setCriticalPath(pathData);
      setMilestones(milestonesData);
    } catch (error) {
      console.error('Error loading critical path:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadCriticalPath();
  }, [loadCriticalPath]);

  const getCriticalMilestones = () => {
    if (!criticalPath) return [];
    return milestones.filter(m => (criticalPath.criticalPathMilestones || []).includes(m.id));
  };

  const getNearCriticalMilestones = () => {
    if (!criticalPath?.nearCriticalPaths) return [];
    const nearCriticalIds = criticalPath.nearCriticalPaths.flatMap(p => p.milestones);
    return milestones.filter(m => nearCriticalIds.includes(m.id));
  };

  const getStatusInfo = (milestone: MilestoneDTO) => {
    const today = new Date();
    const targetDate = parseISO(milestone.targetDate || '');
    
    if (milestone.status === 'completed') {
      return { color: 'bg-success', icon: CheckCircle, label: 'Terminé' };
    }
    
    const daysUntil = differenceInDays(targetDate, today);
    if (daysUntil < 0) {
      return { color: 'bg-destructive', icon: AlertTriangle, label: `En retard (${Math.abs(daysUntil)}j)` };
    }
    if (daysUntil <= 7) {
      return { color: 'bg-warning', icon: Clock, label: `Dans ${daysUntil}j` };
    }
    return { color: 'bg-primary', icon: Target, label: 'À venir' };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/4" />
            <div className="h-24 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const criticalMilestones = getCriticalMilestones();
  const nearCriticalMilestones = getNearCriticalMilestones();

  if (!criticalPath || criticalMilestones.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Route className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">Aucun chemin critique défini</p>
          <p className="text-xs text-muted-foreground mt-1">
            Le chemin critique est calculé automatiquement à partir des jalons marqués comme critiques
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(compact && "border-0 shadow-none")}>
      <CardHeader className={cn("pb-3", compact && "px-0")}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Route className="h-5 w-5 text-destructive" />
            Chemin Critique
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {criticalPath.totalDurationDays} jours
            </Badge>
            <Badge className="bg-destructive">
              {criticalMilestones.length} jalons critiques
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("space-y-6", compact && "px-0")}>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-destructive/10 rounded-lg p-4 border border-destructive/20">
            <div className="flex items-center gap-2 text-destructive mb-2">
              <Route className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Durée critique</span>
            </div>
            <p className="text-2xl font-bold">{criticalPath.totalDurationDays}j</p>
          </div>
          <div className="bg-amber-500/10 rounded-lg p-4 border border-amber-500/20">
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Proche critique</span>
            </div>
            <p className="text-2xl font-bold">{nearCriticalMilestones.length}</p>
          </div>
          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Target className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Fin estimée</span>
            </div>
            <p className="text-lg font-bold">
              {format(parseISO(criticalPath.estimatedEndDate), 'd MMM yyyy', { locale: fr })}
            </p>
          </div>
        </div>

        {/* Critical Path Visualization */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2 text-destructive">
            <Route className="h-4 w-4" />
            Séquence Critique
          </h4>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {criticalMilestones.map((milestone, idx) => {
              const status = getStatusInfo(milestone);
              const StatusIcon = status.icon;
              
              return (
                <React.Fragment key={milestone.id}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={cn(
                          "flex-shrink-0 p-3 rounded-lg border-2 cursor-pointer",
                          "min-w-[150px] transition-all hover:scale-105",
                          status.color === 'bg-destructive' && "border-destructive bg-destructive/10",
                          status.color === 'bg-warning' && "border-warning bg-warning/10",
                          status.color === 'bg-success' && "border-success bg-success/10",
                          status.color === 'bg-primary' && "border-primary bg-primary/10"
                        )}>
                          <div className="flex items-center gap-2 mb-1">
                            <StatusIcon className={cn("h-4 w-4", status.color.replace('bg-', 'text-'))} />
                            <Badge variant="outline" className="text-xs h-5">
                              {idx + 1}
                            </Badge>
                          </div>
                          <p className="font-medium text-sm line-clamp-2">{milestone.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(parseISO(milestone.targetDate || ''), 'd MMM', { locale: fr })}
                          </p>
                          <Badge variant="secondary" className="mt-2 text-xs">
                            {status.label}
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <p className="font-medium">{milestone.title}</p>
                          <p className="text-xs">Date cible: {format(parseISO(milestone.targetDate || ''), 'd MMMM yyyy', { locale: fr })}</p>
                          {milestone.floatDays !== undefined && (
                            <p className="text-xs">Marge: {milestone.floatDays} jours</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  {idx < criticalMilestones.length - 1 && (
                    <ArrowRight className="h-5 w-5 text-destructive flex-shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Near Critical Milestones */}
        {nearCriticalMilestones.length > 0 && (
          <div className="space-y-3 mt-6">
            <h4 className="font-medium text-sm flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              Jalons Proches du Critique
              <Badge variant="secondary" className="text-xs">
                Marge {"<"} 5 jours
              </Badge>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {nearCriticalMilestones.map(milestone => {
                const status = getStatusInfo(milestone);
                
                return (
                  <div
                    key={milestone.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5"
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      status.color
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{milestone.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(milestone.targetDate || ''), 'd MMM yyyy', { locale: fr })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {milestone.floatDays ?? 0}j marge
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 pt-4 border-t text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-destructive" />
            <span>En retard</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-warning" />
            <span>{"<"} 7 jours</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-success" />
            <span>Terminé</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-primary" />
            <span>À venir</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CriticalPathView;
