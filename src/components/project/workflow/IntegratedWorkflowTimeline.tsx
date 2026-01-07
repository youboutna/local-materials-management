/**
 * IntegratedWorkflowTimeline - Jalons positionnés par rapport aux étapes
 * 
 * Vue unifiée: Étapes et Jalons sur une timeline chronologique
 * Les jalons sont positionnés relativement aux activités de la phase
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Target,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Flag,
  ShieldCheck,
  Package,
  CheckSquare,
  Play,
  Layers,
  TrendingUp,
  TrendingDown,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { MilestoneService } from '@/services/MilestoneService';
import { MilestoneSummaryDTO, MilestoneProgressDTO, MilestoneType, MILESTONE_TYPES } from '@/types/milestone-dto';
import { PhaseStepDTO } from '@/types/phase-dto';
import { format, parseISO, isBefore, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface IntegratedWorkflowTimelineProps {
  projectId: string;
  phaseId: string;
  phaseName: string;
  steps: PhaseStepDTO[];
  phaseStartDate?: string;
  phaseEndDate?: string;
  onMilestoneClick?: (milestoneId: string) => void;
  onStepClick?: (step: PhaseStepDTO) => void;
  onAddMilestone?: () => void;
}

interface TimelineItem {
  type: 'step' | 'milestone';
  id: string;
  title: string;
  date: string;
  endDate?: string;
  status: string;
  data: PhaseStepDTO | MilestoneSummaryDTO;
  milestoneType?: MilestoneType;
  priority?: string;
  isCritical?: boolean;
  progress?: number;
}

const IntegratedWorkflowTimeline: React.FC<IntegratedWorkflowTimelineProps> = ({
  projectId,
  phaseId,
  phaseName,
  steps,
  phaseStartDate,
  phaseEndDate,
  onMilestoneClick,
  onStepClick,
  onAddMilestone,
}) => {
  const [milestones, setMilestones] = useState<MilestoneSummaryDTO[]>([]);
  const [progress, setProgress] = useState<MilestoneProgressDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMilestones();
  }, [projectId, phaseId]);

  const loadMilestones = async () => {
    try {
      setLoading(true);
      const [milestonesData, progressData] = await Promise.all([
        MilestoneService.getPhaseMilestones(projectId, phaseId),
        MilestoneService.getMilestoneProgress(projectId, phaseId)
      ]);
      setMilestones(milestonesData);
      setProgress(progressData);
    } catch (error) {
      console.error('Error loading milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  // Build unified timeline combining steps and milestones
  const timelineItems: TimelineItem[] = React.useMemo(() => {
    const items: TimelineItem[] = [];

    // Add steps
    steps.forEach(step => {
      items.push({
        type: 'step',
        id: step.id,
        title: step.name,
        date: step.start_date || phaseStartDate || '',
        endDate: step.end_date,
        status: step.status,
        progress: step.progress,
        data: step,
      });
    });

    // Add milestones
    milestones.forEach(m => {
      items.push({
        type: 'milestone',
        id: m.id,
        title: m.title,
        date: m.target_date,
        status: m.status,
        data: m,
        milestoneType: m.type,
        priority: m.priority,
        isCritical: m.is_critical,
      });
    });

    // Sort by date
    return items.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateA - dateB;
    });
  }, [steps, milestones, phaseStartDate]);

  const getStatusInfo = (item: TimelineItem) => {
    const today = new Date();
    
    if (item.type === 'milestone') {
      const targetDate = parseISO(item.date);
      
      if (item.status === 'completed') {
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Terminé' };
      }
      if (isBefore(targetDate, today)) {
        const daysLate = differenceInDays(today, targetDate);
        return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', label: `En retard (${daysLate}j)` };
      }
      return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'À venir' };
    }
    
    // Step status
    switch (item.status) {
      case 'completed': return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Terminée' };
      case 'in_progress': return { icon: Play, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'En cours' };
      case 'delayed': return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Retard' };
      default: return { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Planifiée' };
    }
  };

  const getTypeIcon = (type?: MilestoneType) => {
    switch (type) {
      case 'gate': return ShieldCheck;
      case 'deliverable': return Package;
      case 'event': return Flag;
      case 'checkpoint':
      default: return CheckSquare;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-24 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with progress */}
      <Card className="overflow-hidden">
        <div className={cn(
          "p-4",
          progress?.critical_path_status === 'delayed' 
            ? "bg-gradient-to-r from-destructive/10 to-transparent" 
            : "bg-gradient-to-r from-primary/10 to-transparent"
        )}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Planification & Jalons</h3>
                <p className="text-sm text-muted-foreground">
                  {steps.length} étapes • {milestones.length} jalons
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {progress?.schedule_performance_index !== undefined && (
                <Badge 
                  variant={progress.schedule_performance_index >= 1 ? 'default' : 'destructive'}
                  className={cn(
                    "flex items-center gap-1",
                    progress.schedule_performance_index >= 1 && "bg-green-600"
                  )}
                >
                  {progress.schedule_performance_index >= 1 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  SPI: {progress.schedule_performance_index}
                </Badge>
              )}
              {onAddMilestone && (
                <Button size="sm" variant="outline" onClick={onAddMilestone}>
                  <Plus className="h-3 w-3 mr-1" /> Jalon
                </Button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {progress && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progression pondérée</span>
                <span className="font-medium">{progress.weighted_progress}%</span>
              </div>
              <Progress value={progress.weighted_progress} className="h-2" />
            </div>
          )}

          {/* Status indicators */}
          <div className="flex flex-wrap gap-3 mt-3 text-sm">
            {progress?.overdue_milestones && progress.overdue_milestones.length > 0 && (
              <div className="flex items-center gap-1.5 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span>{progress.overdue_milestones.length} en retard</span>
              </div>
            )}
            {progress?.upcoming_milestones && progress.upcoming_milestones.length > 0 && (
              <div className="flex items-center gap-1.5 text-amber-600">
                <Clock className="h-4 w-4" />
                <span>{progress.upcoming_milestones.length} à venir (14j)</span>
              </div>
            )}
            {progress?.critical_path_status && progress.critical_path_status !== 'on_track' && (
              <div className={cn(
                "flex items-center gap-1.5",
                progress.critical_path_status === 'delayed' ? 'text-destructive' : 'text-amber-600'
              )}>
                <ShieldCheck className="h-4 w-4" />
                <span>Chemin critique {progress.critical_path_status === 'delayed' ? 'en retard' : 'à risque'}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Integrated Timeline */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Timeline Étapes & Jalons
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timelineItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucune étape ou jalon défini</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

              <div className="space-y-4">
                {timelineItems.map((item, idx) => {
                  const status = getStatusInfo(item);
                  const StatusIcon = status.icon;
                  const TypeIcon = item.type === 'milestone' ? getTypeIcon(item.milestoneType) : Layers;
                  const isStep = item.type === 'step';

                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      className={cn(
                        "relative pl-14 cursor-pointer transition-all rounded-lg p-3",
                        "hover:bg-muted/50",
                        isStep ? "border-2 border-primary/20 bg-primary/5" : "border border-border",
                        item.isCritical && item.status !== 'completed' && "ring-2 ring-destructive/30"
                      )}
                      onClick={() => {
                        if (isStep && onStepClick) {
                          onStepClick(item.data as PhaseStepDTO);
                        } else if (!isStep && onMilestoneClick) {
                          onMilestoneClick(item.id);
                        }
                      }}
                    >
                      {/* Timeline dot */}
                      <div className={cn(
                        "absolute left-3.5 top-4 w-6 h-6 rounded-full flex items-center justify-center border-2 bg-background",
                        isStep ? "border-primary" : status.color.replace('text-', 'border-')
                      )}>
                        {isStep ? (
                          <span className="text-xs font-bold text-primary">{idx + 1}</span>
                        ) : (
                          <StatusIcon className={cn("h-3 w-3", status.color)} />
                        )}
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={isStep ? 'default' : 'outline'} className="text-xs">
                              {isStep ? 'ÉTAPE' : MILESTONE_TYPES[item.milestoneType!]?.label || 'Jalon'}
                            </Badge>
                            <p className={cn(
                              "font-medium",
                              item.status === 'completed' && "line-through opacity-60"
                            )}>
                              {item.title}
                            </p>
                            {item.isCritical && (
                              <Badge variant="destructive" className="text-xs">Critique</Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {item.date ? format(parseISO(item.date), 'd MMM yyyy', { locale: fr }) : '—'}
                                {item.endDate && ` → ${format(parseISO(item.endDate), 'd MMM', { locale: fr })}`}
                              </span>
                            </div>
                            <Badge className={cn("text-xs", status.bg, status.color)}>
                              {status.label}
                            </Badge>
                          </div>

                          {/* Progress bar for steps */}
                          {isStep && item.progress !== undefined && (
                            <div className="flex items-center gap-2 mt-2">
                              <Progress value={item.progress} className="flex-1 h-1.5" />
                              <span className="text-xs font-medium">{item.progress}%</span>
                            </div>
                          )}
                        </div>

                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegratedWorkflowTimeline;
