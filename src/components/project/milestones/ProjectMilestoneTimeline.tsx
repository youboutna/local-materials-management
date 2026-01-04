import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Calendar
} from 'lucide-react';
import { MilestoneService } from '@/services/MilestoneService';
import { MilestoneSummaryDTO, MilestoneProgressDTO } from '@/types/milestone-dto';
import { format, parseISO, isBefore, isAfter, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ProjectMilestoneTimelineProps {
  projectId: string;
  onMilestoneClick?: (milestoneId: string, phaseId?: string) => void;
}

const ProjectMilestoneTimeline: React.FC<ProjectMilestoneTimelineProps> = ({
  projectId,
  onMilestoneClick
}) => {
  const [milestones, setMilestones] = useState<MilestoneSummaryDTO[]>([]);
  const [progress, setProgress] = useState<MilestoneProgressDTO | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [milestonesData, progressData] = await Promise.all([
        MilestoneService.getProjectMilestonesSummary(projectId),
        MilestoneService.getMilestoneProgress(projectId)
      ]);
      setMilestones(milestonesData);
      setProgress(progressData);
    } catch (error) {
      console.error('Error loading milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (milestone: MilestoneSummaryDTO) => {
    const today = new Date();
    const targetDate = parseISO(milestone.target_date);
    
    if (milestone.status === 'completed') {
      return { 
        icon: CheckCircle, 
        color: 'text-green-500', 
        bgColor: 'bg-green-100',
        label: 'Terminé' 
      };
    }
    
    if (isBefore(targetDate, today)) {
      const daysLate = differenceInDays(today, targetDate);
      return { 
        icon: AlertTriangle, 
        color: 'text-red-500', 
        bgColor: 'bg-red-100',
        label: `En retard (${daysLate}j)` 
      };
    }

    const daysUntil = differenceInDays(targetDate, today);
    if (daysUntil <= 7) {
      return { 
        icon: Clock, 
        color: 'text-orange-500', 
        bgColor: 'bg-orange-100',
        label: `Dans ${daysUntil}j` 
      };
    }

    return { 
      icon: Clock, 
      color: 'text-blue-500', 
      bgColor: 'bg-blue-100',
      label: 'À venir' 
    };
  };

  // Group milestones by phase
  const groupedMilestones = milestones.reduce((acc, m) => {
    const key = m.phase_name || 'Projet global';
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {} as Record<string, MilestoneSummaryDTO[]>);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (milestones.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Jalons du Projet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Aucun jalon défini. Les jalons seront créés automatiquement lors de l'ajout de phases depuis les référentiels.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Jalons du Projet
            {progress && (
              <Badge variant="outline" className="ml-2">
                {progress.completed_milestones}/{progress.total_milestones}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* Progress bar */}
        {progress && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progression des jalons</span>
              <span className="font-medium">{progress.weighted_progress}%</span>
            </div>
            <Progress value={progress.weighted_progress} className="h-2" />
            
            {progress.overdue_milestones && progress.overdue_milestones.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4" />
                {progress.overdue_milestones.length} jalon(s) en retard
              </div>
            )}
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-4">
          <div className="space-y-6">
            {Object.entries(groupedMilestones).map(([phaseName, phaseMilestones]) => (
              <div key={phaseName} className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  {phaseName}
                </h4>
                
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                  
                  <div className="space-y-4">
                    {phaseMilestones.map((milestone, index) => {
                      const status = getStatusInfo(milestone);
                      const StatusIcon = status.icon;

                      return (
                        <div 
                          key={milestone.id}
                          className={cn(
                            "relative pl-10 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors",
                            milestone.status === 'completed' && "opacity-60"
                          )}
                          onClick={() => onMilestoneClick?.(milestone.id, milestone.phase_id)}
                        >
                          {/* Timeline dot */}
                          <div className={cn(
                            "absolute left-2 top-3 w-5 h-5 rounded-full flex items-center justify-center",
                            status.bgColor
                          )}>
                            <StatusIcon className={cn("h-3 w-3", status.color)} />
                          </div>

                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "font-medium",
                                milestone.status === 'completed' && "line-through"
                              )}>
                                {milestone.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {format(parseISO(milestone.target_date), 'd MMM yyyy', { locale: fr })}
                                </span>
                                {milestone.completed_date && (
                                  <>
                                    <span>•</span>
                                    <span className="text-green-600">
                                      Terminé le {format(parseISO(milestone.completed_date), 'd MMM', { locale: fr })}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <Badge className={cn(status.bgColor, status.color, "border-0")}>
                              {status.label}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ProjectMilestoneTimeline;
