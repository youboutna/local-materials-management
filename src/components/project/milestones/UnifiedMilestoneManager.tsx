/**
 * UnifiedMilestoneManager - Composant unifié pour la gestion des jalons
 * Utilisé dans ProjectDetail et PhaseDetail avec une UI cohérente
 * Intègre Timeline, GANTT et PERT en vue unifiée
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Calendar,
  BarChart3,
  GitBranch,
  List,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Diamond,
  ShieldCheck,
  Package,
  Flag,
  CheckSquare,
  Plus
} from 'lucide-react';
import { getMilestoneService, MilestoneService } from '@/application/services/MilestoneService';
import { 
  MilestoneSummaryDTO, 
  MilestoneProgressDTO,
  MilestoneType,
  MILESTONE_TYPES
} from '@/types/milestone-dto';
import { getDefaultProjectMilestones, getDefaultPhaseMilestones } from '@/config/referentials/milestones.referential';
import { format, parseISO, isBefore, differenceInDays, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

// View modes for the component
type ViewMode = 'timeline' | 'list' | 'gantt';

interface UnifiedMilestoneManagerProps {
  projectId: string;
  phaseId?: string;
  phaseName?: string;
  compact?: boolean;
  defaultView?: ViewMode;
  onMilestoneClick?: (milestoneId: string, phaseId?: string) => void;
  showNavigation?: boolean;
}

const UnifiedMilestoneManager: React.FC<UnifiedMilestoneManagerProps> = ({
  projectId,
  phaseId,
  phaseName,
  compact = false,
  defaultView = 'timeline',
  onMilestoneClick,
  showNavigation = true
}) => {
  const [milestones, setMilestones] = useState<MilestoneSummaryDTO[]>([]);
  const [progress, setProgress] = useState<MilestoneProgressDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);
  const [isExpanded, setIsExpanded] = useState(!compact);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const service = getMilestoneService();
      const rawMilestones = await service.getProjectMilestones(projectId);
      const filtered = phaseId 
        ? rawMilestones.filter((m: any) => m.phase_id === phaseId)
        : rawMilestones;
      const milestonesData: MilestoneSummaryDTO[] = filtered.map((m: any) => ({
        id: m.id, title: m.title, target_date: m.target_date, status: m.status,
        type: m.type || 'checkpoint', priority: m.priority || 'medium',
        weight: m.weight || 0.2, phase_id: m.phase_id, phase_name: m.phase_name,
        completed_date: m.actual_completion_date, is_critical: m.priority === 'critical',
        is_from_template: false,
      }));
      const progressData: MilestoneProgressDTO = {
        total_milestones: filtered.length,
        completed_milestones: filtered.filter((m: any) => m.status === 'completed').length,
        delayed_milestones: filtered.filter((m: any) => m.status === 'delayed').length,
        weighted_progress: Math.round(filtered.filter((m: any) => m.status === 'completed').length / Math.max(1, filtered.length) * 100),
        overdue_milestones: [],
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
  }, [projectId, phaseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStatusInfo = (milestone: MilestoneSummaryDTO) => {
    const today = new Date();
    const targetDate = parseISO(milestone.target_date);
    
    if (milestone.status === 'completed') {
      return { 
        icon: CheckCircle, 
        color: 'text-success', 
        bgColor: 'bg-success/10',
        borderColor: 'border-success/30',
        label: 'Terminé' 
      };
    }
    
    if (isBefore(targetDate, today)) {
      const daysLate = differenceInDays(today, targetDate);
      return { 
        icon: AlertTriangle, 
        color: 'text-destructive', 
        bgColor: 'bg-destructive/10',
        borderColor: 'border-destructive/30',
        label: `En retard (${daysLate}j)` 
      };
    }

    const daysUntil = differenceInDays(targetDate, today);
    if (daysUntil <= 7) {
      return { 
        icon: Clock, 
        color: 'text-warning', 
        bgColor: 'bg-warning/10',
        borderColor: 'border-warning/30',
        label: `Dans ${daysUntil}j` 
      };
    }

    return { 
      icon: Clock, 
      color: 'text-primary', 
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/30',
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

  // Group milestones by phase for project view
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

  // Generate default milestones
  const generateDefaultMilestones = async () => {
    try {
      const templates = phaseId ? getDefaultPhaseMilestones() : getDefaultProjectMilestones();
      const startDate = new Date();
      
      for (const template of templates) {
        const targetDate = addDays(startDate, template.relative_offset_days);
        await getMilestoneService().createMilestone({
          project_id: projectId,
          title: template.name,
          description: template.description,
          target_date: format(targetDate, 'yyyy-MM-dd'),
          priority: template.priority as any,
        });
      }
      
      toast({
        title: "Jalons créés",
        description: `${templates.length} jalons par défaut ont été créés.`
      });
      
      loadData();
    } catch (error) {
      console.error('Error generating default milestones:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer les jalons par défaut.",
        variant: "destructive"
      });
    }
  };

  // Empty state with option to generate defaults
  if (milestones.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium mb-2">Aucun jalon défini</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {phaseId 
              ? "Créez des jalons par défaut (démarrage, point d'avancement, achèvement) pour cette phase."
              : "Créez des jalons par défaut (démarrage projet, réception provisoire, réception définitive) pour ce projet."
            }
          </p>
          <Button onClick={generateDefaultMilestones} className="gap-2">
            <Plus className="h-4 w-4" />
            Créer les jalons par défaut
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Card with Progress */}
      <Card className="overflow-hidden">
        <div className={cn(
          "p-4",
          progress?.critical_path_status === 'delayed' 
            ? "bg-gradient-to-r from-destructive/10 to-destructive/5" 
            : "bg-gradient-to-r from-primary/10 to-primary/5"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                progress?.critical_path_status === 'delayed' ? "bg-destructive/10" : "bg-primary/10"
              )}>
                <Target className={cn(
                  "h-5 w-5",
                  progress?.critical_path_status === 'delayed' ? "text-destructive" : "text-primary"
                )} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {phaseId ? `Jalons - ${phaseName || 'Phase'}` : 'Jalons du Projet'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {progress?.completed_milestones || 0} sur {progress?.total_milestones || milestones.length} terminés
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* SPI Badge */}
              {progress?.schedule_performance_index !== undefined && (
                <Badge 
                  variant={progress.schedule_performance_index >= 1 ? 'default' : 'destructive'}
                  className={cn(
                    "flex items-center gap-1",
                    progress.schedule_performance_index >= 1 && "bg-success hover:bg-success/90"
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

              {/* View Toggle */}
              {showNavigation && (
                <div className="flex items-center bg-muted rounded-md p-1">
                  <Button
                    variant={viewMode === 'timeline' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setViewMode('timeline')}
                  >
                    <GitBranch className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'gantt' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setViewMode('gantt')}
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {compact && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Progression pondérée</span>
              <span className="font-medium">{progress?.weighted_progress || 0}%</span>
            </div>
            <Progress value={progress?.weighted_progress || 0} className="h-2" />
          </div>

          {/* Status Indicators */}
          <div className="flex flex-wrap gap-3 mt-3 text-sm">
            {progress?.overdue_milestones && progress.overdue_milestones.length > 0 && (
              <div className="flex items-center gap-1.5 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span>{progress.overdue_milestones.length} en retard</span>
              </div>
            )}
            {progress?.upcoming_milestones && progress.upcoming_milestones.length > 0 && (
              <div className="flex items-center gap-1.5 text-warning">
                <Clock className="h-4 w-4" />
                <span>{progress.upcoming_milestones.length} à venir (14j)</span>
              </div>
            )}
            {progress?.critical_path_status && progress.critical_path_status !== 'on_track' && (
              <div className={cn(
                "flex items-center gap-1.5",
                progress.critical_path_status === 'delayed' ? 'text-destructive' : 'text-warning'
              )}>
                <ShieldCheck className="h-4 w-4" />
                <span>Chemin critique {progress.critical_path_status === 'delayed' ? 'en retard' : 'à risque'}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Content based on view mode */}
      {isExpanded && (
        <>
          {viewMode === 'timeline' && (
            <TimelineView 
              groupedMilestones={groupedMilestones}
              getStatusInfo={getStatusInfo}
              getTypeIcon={getTypeIcon}
              onMilestoneClick={onMilestoneClick}
              showPhaseHeaders={!phaseId}
            />
          )}

          {viewMode === 'list' && (
            <ListView 
              milestones={milestones}
              getStatusInfo={getStatusInfo}
              getTypeIcon={getTypeIcon}
              onMilestoneClick={onMilestoneClick}
            />
          )}

          {viewMode === 'gantt' && (
            <GanttView 
              milestones={milestones}
              onMilestoneClick={onMilestoneClick}
            />
          )}
        </>
      )}
    </div>
  );
};

// Timeline View Component
interface TimelineViewProps {
  groupedMilestones: Record<string, MilestoneSummaryDTO[]>;
  getStatusInfo: (m: MilestoneSummaryDTO) => {
    icon: React.ComponentType<any>;
    color: string;
    bgColor: string;
    borderColor: string;
    label: string;
  };
  getTypeIcon: (type: MilestoneType) => React.ComponentType<any>;
  onMilestoneClick?: (id: string, phaseId?: string) => void;
  showPhaseHeaders: boolean;
}

const TimelineView: React.FC<TimelineViewProps> = ({
  groupedMilestones,
  getStatusInfo,
  getTypeIcon,
  onMilestoneClick,
  showPhaseHeaders
}) => (
  <Card>
    <CardContent className="pt-4">
      <div className="space-y-6">
        {Object.entries(groupedMilestones).map(([phaseName, phaseMilestones]) => (
          <div key={phaseName} className="space-y-3">
            {showPhaseHeaders && (
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide border-b pb-2">
                {phaseName}
              </h4>
            )}
            
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
              
              <div className="space-y-3">
                {phaseMilestones.map((milestone) => {
                  const status = getStatusInfo(milestone);
                  const StatusIcon = status.icon;
                  const TypeIcon = getTypeIcon(milestone.type);

                  return (
                    <div 
                      key={milestone.id}
                      className={cn(
                        "relative pl-10 cursor-pointer hover:bg-muted/50 p-3 rounded-lg transition-all",
                        "border",
                        status.borderColor,
                        milestone.status === 'completed' && "opacity-70",
                        milestone.is_critical && milestone.status !== 'completed' && "ring-2 ring-destructive/20"
                      )}
                      onClick={() => onMilestoneClick?.(milestone.id, milestone.phase_id)}
                    >
                      {/* Timeline dot */}
                      <div className={cn(
                        "absolute left-2 top-4 w-5 h-5 rounded-full flex items-center justify-center border-2 bg-background",
                        status.borderColor
                      )}>
                        <StatusIcon className={cn("h-3 w-3", status.color)} />
                      </div>

                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={cn(
                              "font-medium",
                              milestone.status === 'completed' && "line-through"
                            )}>
                              {milestone.title}
                            </p>
                            <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            {milestone.is_critical && (
                              <Badge variant="destructive" className="text-xs h-5">
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
                                <span className="text-success">
                                  ✓ {format(parseISO(milestone.completed_date), 'd MMM', { locale: fr })}
                                </span>
                              </>
                            )}
                            <Badge variant="outline" className="text-xs h-5">
                              {MILESTONE_TYPES[milestone.type]?.label || 'Checkpoint'}
                            </Badge>
                          </div>
                        </div>
                        
                        <Badge className={cn(status.bgColor, status.color, "border-0 shrink-0")}>
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
  </Card>
);

// List View Component
interface ListViewProps {
  milestones: MilestoneSummaryDTO[];
  getStatusInfo: (m: MilestoneSummaryDTO) => {
    icon: React.ComponentType<any>;
    color: string;
    bgColor: string;
    borderColor: string;
    label: string;
  };
  getTypeIcon: (type: MilestoneType) => React.ComponentType<any>;
  onMilestoneClick?: (id: string, phaseId?: string) => void;
}

const ListView: React.FC<ListViewProps> = ({
  milestones,
  getStatusInfo,
  getTypeIcon,
  onMilestoneClick
}) => (
  <Card>
    <CardContent className="pt-4">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left">
              <th className="p-3 font-medium text-muted-foreground">Jalon</th>
              <th className="p-3 font-medium text-muted-foreground">Type</th>
              <th className="p-3 font-medium text-muted-foreground">Phase</th>
              <th className="p-3 font-medium text-muted-foreground">Date cible</th>
              <th className="p-3 font-medium text-muted-foreground">Poids</th>
              <th className="p-3 font-medium text-muted-foreground">Statut</th>
            </tr>
          </thead>
          <tbody>
            {milestones.map((milestone) => {
              const status = getStatusInfo(milestone);
              const StatusIcon = status.icon;
              const TypeIcon = getTypeIcon(milestone.type);

              return (
                <tr 
                  key={milestone.id} 
                  className={cn(
                    "border-b hover:bg-muted/50 cursor-pointer transition-colors",
                    milestone.is_critical && "bg-destructive/5"
                  )}
                  onClick={() => onMilestoneClick?.(milestone.id, milestone.phase_id)}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <StatusIcon className={cn("h-4 w-4", status.color)} />
                      <span className={cn(
                        "font-medium",
                        milestone.status === 'completed' && "line-through text-muted-foreground"
                      )}>
                        {milestone.title}
                      </span>
                      {milestone.is_critical && (
                        <Badge variant="destructive" className="text-xs">⚠</Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <TypeIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{MILESTONE_TYPES[milestone.type]?.label || 'Checkpoint'}</span>
                    </div>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {milestone.phase_name || '-'}
                  </td>
                  <td className="p-3 text-sm">
                    {format(parseISO(milestone.target_date), 'd MMM yyyy', { locale: fr })}
                  </td>
                  <td className="p-3 text-sm">
                    {Math.round((milestone.weight || 0.2) * 100)}%
                  </td>
                  <td className="p-3">
                    <Badge className={cn(status.bgColor, status.color, "border-0")}>
                      {status.label}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
);

// Mini Gantt View Component
interface GanttViewProps {
  milestones: MilestoneSummaryDTO[];
  onMilestoneClick?: (id: string, phaseId?: string) => void;
}

const GanttView: React.FC<GanttViewProps> = ({
  milestones,
  onMilestoneClick
}) => {
  if (milestones.length === 0) return null;

  // Calculate project period from milestones
  const dates = milestones.map(m => parseISO(m.target_date));
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
  
  // Add padding
  minDate.setDate(minDate.getDate() - 7);
  maxDate.setDate(maxDate.getDate() + 7);
  
  const totalDays = Math.max(1, differenceInDays(maxDate, minDate));

  const getMilestonePosition = (milestone: MilestoneSummaryDTO) => {
    const offset = differenceInDays(parseISO(milestone.target_date), minDate);
    return `${Math.min(100, Math.max(0, (offset / totalDays) * 100))}%`;
  };

  const getStatusColor = (milestone: MilestoneSummaryDTO) => {
    if (milestone.status === 'completed') return 'bg-success';
    const today = new Date();
    const targetDate = parseISO(milestone.target_date);
    if (isBefore(targetDate, today)) return 'bg-destructive';
    return 'bg-primary';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Vue Gantt des Jalons
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{format(minDate, 'd MMM', { locale: fr })}</span>
            <span>→</span>
            <span>{format(maxDate, 'd MMM yyyy', { locale: fr })}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {milestones.map((milestone) => (
            <div 
              key={milestone.id} 
              className="flex items-center gap-3 group cursor-pointer"
              onClick={() => onMilestoneClick?.(milestone.id, milestone.phase_id)}
            >
              <div className="w-32 text-sm font-medium truncate" title={milestone.title}>
                {milestone.title}
              </div>
              <div className="flex-1 relative h-8 bg-muted/30 rounded group-hover:bg-muted/50 transition-colors">
                <div
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full transform -translate-x-1/2 transition-transform group-hover:scale-125",
                    getStatusColor(milestone),
                    milestone.is_critical && "ring-2 ring-destructive ring-offset-2"
                  )}
                  style={{ left: getMilestonePosition(milestone) }}
                >
                  <Diamond className="h-4 w-4 text-white p-0.5" />
                </div>
              </div>
              <div className="w-20 text-xs text-muted-foreground text-right">
                {format(parseISO(milestone.target_date), 'dd/MM', { locale: fr })}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4 pt-4 border-t text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-success rounded-full" />
            <span>Terminé</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-primary rounded-full" />
            <span>À venir</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-destructive rounded-full" />
            <span>En retard</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-primary rounded-full ring-2 ring-destructive ring-offset-1" />
            <span>Critique</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UnifiedMilestoneManager;
