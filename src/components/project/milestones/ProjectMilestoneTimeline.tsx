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
  Calendar,
  ShieldCheck,
  Package,
  Flag,
  CheckSquare,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { getMilestoneService, MilestoneService } from '@/application/services/MilestoneService';
import { 
  MilestoneSummaryDTO, 
  MilestoneProgressDTO,
  MilestoneType,
  MILESTONE_TYPES,
  MILESTONE_PRIORITIES
} from '@/types/milestone-dto';
import { format, parseISO, isBefore, differenceInDays } from 'date-fns';
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
      const service = getMilestoneService();
      const rawMilestones = await service.getProjectMilestones(projectId);
      const milestonesData: MilestoneSummaryDTO[] = rawMilestones.map((m: any) => ({
        id: m.id,
        title: m.title,
        target_date: m.target_date,
        status: m.status,
        type: m.type || 'checkpoint',
        priority: m.priority || 'medium',
        weight: m.weight || 0.2,
        phase_id: m.phase_id,
        phase_name: m.phase_name,
        completed_date: m.actual_completion_date || m.completed_date,
        is_critical: m.priority === 'critical',
        is_from_template: false,
      }));
      const progressData: MilestoneProgressDTO = {
        total_milestones: rawMilestones.length,
        completed_milestones: rawMilestones.filter((m: any) => m.status === 'completed').length,
        weighted_progress: Math.round(rawMilestones.filter((m: any) => m.status === 'completed').length / Math.max(1, rawMilestones.length) * 100),
        overdue_milestones: rawMilestones.filter((m: any) => m.status === 'delayed').map((m: any) => m.id),
        upcoming_milestones: [],
        schedule_performance_index: 1,
        critical_path_status: 'on_track',
      };
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

  const getTypeIcon = (type: MilestoneType) => {
    switch (type) {
      case 'gate': return ShieldCheck;
      case 'deliverable': return Package;
      case 'event': return Flag;
      case 'checkpoint':
      default: return CheckSquare;
    }
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
            Jalons du Projet (Timeline)
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

        {/* Progress bar with PM metrics */}
        {progress && (
          <div className="mt-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Progression des jalons</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{progress.weighted_progress}%</span>
                {progress.schedule_performance_index !== undefined && (
                  <Badge 
                    variant={progress.schedule_performance_index >= 1 ? 'default' : 'destructive'}
                    className="text-xs flex items-center gap-1"
                  >
                    {progress.schedule_performance_index >= 1 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    SPI: {progress.schedule_performance_index}
                  </Badge>
                )}
              </div>
            </div>
            <Progress value={progress.weighted_progress} className="h-2" />
            
            {/* Status indicators */}
            <div className="flex flex-wrap gap-4 text-sm">
              {progress.overdue_milestones && progress.overdue_milestones.length > 0 && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  {progress.overdue_milestones.length} jalon(s) en retard
                </div>
              )}
              {progress.upcoming_milestones && progress.upcoming_milestones.length > 0 && (
                <div className="flex items-center gap-2 text-orange-600">
                  <Clock className="h-4 w-4" />
                  {progress.upcoming_milestones.length} jalon(s) à venir (14j)
                </div>
              )}
              {progress.critical_path_status !== 'on_track' && (
                <div className={cn(
                  "flex items-center gap-2",
                  progress.critical_path_status === 'delayed' ? 'text-red-600' : 'text-orange-600'
                )}>
                  <ShieldCheck className="h-4 w-4" />
                  Chemin critique {progress.critical_path_status === 'delayed' ? 'en retard' : 'à risque'}
                </div>
              )}
            </div>
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
                    {phaseMilestones.map((milestone) => {
                      const status = getStatusInfo(milestone);
                      const StatusIcon = status.icon;
                      const TypeIcon = getTypeIcon(milestone.type);

                      return (
                        <div 
                          key={milestone.id}
                          className={cn(
                            "relative pl-10 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors",
                            milestone.status === 'completed' && "opacity-60",
                            milestone.is_critical && milestone.status !== 'completed' && "border-l-2 border-red-400"
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
                              <div className="flex items-center gap-2">
                                <p className={cn(
                                  "font-medium",
                                  milestone.status === 'completed' && "line-through"
                                )}>
                                  {milestone.title}
                                </p>
                                <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                {milestone.is_critical && (
                                  <Badge variant="destructive" className="text-xs">
                                    Critique
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
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
                                <Badge variant="outline" className="text-xs">
                                  {MILESTONE_TYPES[milestone.type]?.label || 'Checkpoint'}
                                </Badge>
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
