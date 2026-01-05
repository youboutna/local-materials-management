/**
 * UnifiedPhaseMonitoring - Dashboard unifié fusionnant Suivi + Jalons
 * Navigation vers services /inspection-monitoring et /payment-control
 * Notifications pour programmer/exécuter inspections et paiements
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  CheckSquare, 
  ClipboardCheck, 
  DollarSign, 
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Eye,
  CheckCircle,
  Clock,
  Calendar,
  ExternalLink,
  Bell,
  Play,
  CalendarPlus,
  ArrowRight,
  Layers,
  GitBranch,
  List,
  BarChart3,
  ShieldCheck,
  Package,
  Flag
} from 'lucide-react';
import { MilestoneService } from '@/services/MilestoneService';
import { MilestoneSummaryDTO, MilestoneType, MILESTONE_TYPES, MilestoneProgressDTO } from '@/types/milestone-dto';
import { format, parseISO, isBefore, differenceInDays, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { getDefaultPhaseMilestones, getDefaultProjectMilestones } from '@/config/referentials/milestones.referential';

// Import existing components for detailed views
import PhaseTasks from '@/components/project/PhaseTasks';
import PhaseInspections from '@/components/project/PhaseInspections';
import PhasePayments from '@/components/project/PhasePayments';

interface UnifiedPhaseMonitoringProps {
  phaseId: string;
  projectId: string;
  phaseName?: string;
}

type ViewMode = 'dashboard' | 'timeline' | 'list';
type ActionType = 'inspection' | 'payment' | 'complete';

interface ActionDialogState {
  open: boolean;
  milestone: MilestoneSummaryDTO | null;
  action: ActionType | null;
}

const UnifiedPhaseMonitoring: React.FC<UnifiedPhaseMonitoringProps> = ({
  phaseId,
  projectId,
  phaseName
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<'overview' | 'tasks' | 'inspections' | 'payments'>('overview');
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [actionDialog, setActionDialog] = useState<ActionDialogState>({
    open: false,
    milestone: null,
    action: null
  });

  // Fetch milestones
  const { data: milestones = [], isLoading: milestonesLoading } = useQuery({
    queryKey: ['unified-milestones', projectId, phaseId],
    queryFn: () => MilestoneService.getPhaseMilestones(projectId, phaseId),
    enabled: !!projectId && !!phaseId,
  });

  // Fetch progress
  const { data: progress } = useQuery({
    queryKey: ['milestone-progress', projectId, phaseId],
    queryFn: () => MilestoneService.getMilestoneProgress(projectId, phaseId),
    enabled: !!projectId && !!phaseId,
  });

  // Fetch summaries
  const { data: tasksSummary } = useQuery({
    queryKey: ['phase-tasks-summary', phaseId],
    queryFn: async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase
        .from('task_assignments')
        .select('status')
        .eq('phase_id', phaseId);
      
      const total = data?.length || 0;
      const completed = data?.filter(t => t.status === 'completed').length || 0;
      const inProgress = data?.filter(t => t.status === 'in_progress').length || 0;
      const pending = data?.filter(t => t.status === 'pending').length || 0;
      
      return { total, completed, inProgress, pending };
    },
  });

  const { data: inspectionsSummary } = useQuery({
    queryKey: ['phase-inspections-summary', phaseId],
    queryFn: async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase
        .from('inspections')
        .select('status, progress_at_inspection')
        .eq('phase_id', phaseId);
      
      const total = data?.length || 0;
      const approved = data?.filter(i => i.status === 'approved').length || 0;
      const pending = data?.filter(i => i.status === 'pending' || i.status === 'scheduled').length || 0;
      const rejected = data?.filter(i => i.status === 'rejected').length || 0;
      const avgProgress = total > 0 
        ? Math.round(data!.reduce((sum, i) => sum + (i.progress_at_inspection || 0), 0) / total) 
        : 0;
      
      return { total, approved, pending, rejected, avgProgress };
    },
  });

  const { data: paymentsSummary } = useQuery({
    queryKey: ['phase-payments-summary', phaseId],
    queryFn: async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase
        .from('payments')
        .select('amount')
        .eq('phase_id', phaseId);
      
      const total = data?.length || 0;
      const totalAmount = data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      
      return { total, totalAmount };
    },
  });

  // Status helper
  const getStatusInfo = (milestone: MilestoneSummaryDTO) => {
    const today = new Date();
    const targetDate = parseISO(milestone.target_date);
    
    if (milestone.status === 'completed') {
      return { 
        icon: CheckCircle, 
        color: 'text-success', 
        bgColor: 'bg-success/10',
        borderColor: 'border-success',
        label: 'Terminé',
        canTrigger: false,
        urgency: 0
      };
    }
    
    if (isBefore(targetDate, today)) {
      const daysLate = differenceInDays(today, targetDate);
      return { 
        icon: AlertTriangle, 
        color: 'text-destructive', 
        bgColor: 'bg-destructive/10',
        borderColor: 'border-destructive',
        label: `En retard (${daysLate}j)`,
        canTrigger: true,
        urgency: 3
      };
    }

    const daysUntil = differenceInDays(targetDate, today);
    if (daysUntil <= 7) {
      return { 
        icon: Clock, 
        color: 'text-warning', 
        bgColor: 'bg-warning/10',
        borderColor: 'border-warning',
        label: `Dans ${daysUntil}j`,
        canTrigger: true,
        urgency: 2
      };
    }

    if (daysUntil <= 14) {
      return { 
        icon: Clock, 
        color: 'text-primary', 
        bgColor: 'bg-primary/10',
        borderColor: 'border-primary',
        label: 'Prochainement',
        canTrigger: true,
        urgency: 1
      };
    }

    return { 
      icon: Clock, 
      color: 'text-muted-foreground', 
      bgColor: 'bg-muted',
      borderColor: 'border-muted-foreground/30',
      label: 'À venir',
      canTrigger: false,
      urgency: 0
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

  // Action handlers
  const handleMilestoneAction = (milestone: MilestoneSummaryDTO, action: ActionType) => {
    setActionDialog({ open: true, milestone, action });
  };

  const handleNavigateToInspection = () => {
    navigate('/inspection-monitoring');
    setActionDialog({ open: false, milestone: null, action: null });
  };

  const handleNavigateToPayment = () => {
    navigate('/payment-control');
    setActionDialog({ open: false, milestone: null, action: null });
  };

  const handleScheduleInspection = () => {
    const milestone = actionDialog.milestone;
    if (milestone) {
      toast({
        title: "Programmation d'inspection",
        description: `Une notification sera envoyée pour programmer l'inspection du jalon "${milestone.title}".`,
      });
      // Navigate to inspections with pre-filled context
      navigate(`/inspection-monitoring?schedule=true&milestone=${milestone.id}&phase=${phaseId}`);
    }
    setActionDialog({ open: false, milestone: null, action: null });
  };

  const handleExecuteInspection = () => {
    const milestone = actionDialog.milestone;
    if (milestone) {
      toast({
        title: "Exécution d'inspection",
        description: `Redirection vers le service d'inspection pour exécuter l'inspection programmée.`,
      });
      navigate(`/inspection-monitoring?execute=true&phase=${phaseId}`);
    }
    setActionDialog({ open: false, milestone: null, action: null });
  };

  const handleSchedulePayment = () => {
    const milestone = actionDialog.milestone;
    if (milestone) {
      toast({
        title: "Programmation de paiement",
        description: `Une notification sera envoyée pour programmer le paiement du jalon "${milestone.title}".`,
      });
      navigate(`/payment-control?schedule=true&milestone=${milestone.id}&phase=${phaseId}`);
    }
    setActionDialog({ open: false, milestone: null, action: null });
  };

  const handleExecutePayment = () => {
    const milestone = actionDialog.milestone;
    if (milestone) {
      toast({
        title: "Traitement de paiement",
        description: `Redirection vers le contrôle des paiements.`,
      });
      navigate(`/payment-control?execute=true&phase=${phaseId}`);
    }
    setActionDialog({ open: false, milestone: null, action: null });
  };

  const handleMarkComplete = async () => {
    const milestone = actionDialog.milestone;
    if (milestone) {
      try {
        await MilestoneService.updateMilestone(milestone.id, { status: 'completed' });
        // Invalidate all related queries including validation cache
        queryClient.invalidateQueries({ queryKey: ['unified-milestones'] });
        queryClient.invalidateQueries({ queryKey: ['milestone-progress'] });
        queryClient.invalidateQueries({ queryKey: ['phase-milestones-validation'] });
        toast({
          title: "Jalon terminé",
          description: `Le jalon "${milestone.title}" a été marqué comme terminé.`,
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de marquer le jalon comme terminé.",
          variant: "destructive",
        });
      }
    }
    setActionDialog({ open: false, milestone: null, action: null });
  };

  // Generate default milestones
  const generateDefaultMilestones = async () => {
    try {
      const templates = getDefaultPhaseMilestones();
      const startDate = new Date();
      
      for (const template of templates) {
        const targetDate = addDays(startDate, template.relative_offset_days);
        await MilestoneService.createMilestone(projectId, {
          title: template.name,
          description: template.description,
          target_date: format(targetDate, 'yyyy-MM-dd'),
          type: template.type,
          priority: template.priority,
          weight: template.weight,
          deliverables: template.deliverables,
          phase_id: phaseId
        }, true, template.id);
      }
      
      toast({
        title: "Jalons créés",
        description: `${templates.length} jalons par défaut ont été créés.`
      });
      
      queryClient.invalidateQueries({ queryKey: ['unified-milestones'] });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer les jalons par défaut.",
        variant: "destructive"
      });
    }
  };

  // Actionable milestones (gates & checkpoints)
  const actionableMilestones = milestones
    .filter(m => m.type === 'gate' || m.type === 'checkpoint')
    .sort((a, b) => getStatusInfo(b).urgency - getStatusInfo(a).urgency);

  if (milestonesLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Unified Header */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className={cn(
          "p-6",
          progress?.critical_path_status === 'delayed' 
            ? "bg-gradient-to-br from-destructive/10 via-destructive/5 to-background" 
            : "bg-gradient-to-br from-primary/10 via-primary/5 to-background"
        )}>
          {/* Title Row */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-3 rounded-xl",
                progress?.critical_path_status === 'delayed' ? "bg-destructive/10" : "bg-primary/10"
              )}>
                <Layers className={cn(
                  "h-6 w-6",
                  progress?.critical_path_status === 'delayed' ? "text-destructive" : "text-primary"
                )} />
              </div>
              <div>
                <h2 className="font-bold text-xl">
                  Suivi & Jalons
                  {phaseName && <span className="text-muted-foreground font-normal ml-2">— {phaseName}</span>}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {progress?.completed_milestones || 0} sur {progress?.total_milestones || milestones.length} jalons terminés
                </p>
              </div>
            </div>

            {/* View Toggle & SPI */}
            <div className="flex items-center gap-3">
              {progress?.schedule_performance_index !== undefined && (
                <Badge 
                  variant={progress.schedule_performance_index >= 1 ? 'default' : 'destructive'}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5",
                    progress.schedule_performance_index >= 1 && "bg-success hover:bg-success/90"
                  )}
                >
                  {progress.schedule_performance_index >= 1 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  SPI: {progress.schedule_performance_index}
                </Badge>
              )}
              
              <div className="flex items-center bg-muted/80 rounded-lg p-1">
                <Button
                  variant={viewMode === 'dashboard' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => setViewMode('dashboard')}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'timeline' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => setViewMode('timeline')}
                >
                  <GitBranch className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-medium">Progression pondérée</span>
              <span className="font-bold text-lg">{progress?.weighted_progress || 0}%</span>
            </div>
            <Progress value={progress?.weighted_progress || 0} className="h-3" />
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tasks */}
            <button
              onClick={() => setActiveSection('tasks')}
              className={cn(
                "p-4 rounded-xl border-2 bg-card/80 backdrop-blur text-left transition-all hover:shadow-lg hover:scale-[1.02]",
                activeSection === 'tasks' ? "border-primary ring-2 ring-primary/20" : "border-transparent"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                </div>
                <span className="font-medium text-sm">Tâches</span>
              </div>
              <p className="text-3xl font-bold">{tasksSummary?.total || 0}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                  {tasksSummary?.completed || 0} ✓
                </Badge>
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                  {tasksSummary?.inProgress || 0} →
                </Badge>
              </div>
            </button>

            {/* Inspections */}
            <button
              onClick={() => setActiveSection('inspections')}
              className={cn(
                "p-4 rounded-xl border-2 bg-card/80 backdrop-blur text-left transition-all hover:shadow-lg hover:scale-[1.02]",
                activeSection === 'inspections' ? "border-primary ring-2 ring-primary/20" : "border-transparent"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <ClipboardCheck className="h-4 w-4 text-orange-600" />
                </div>
                <span className="font-medium text-sm">Inspections</span>
              </div>
              <p className="text-3xl font-bold">{inspectionsSummary?.total || 0}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                  {inspectionsSummary?.approved || 0} ✓
                </Badge>
                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700">
                  {inspectionsSummary?.pending || 0} ⏳
                </Badge>
              </div>
            </button>

            {/* Payments */}
            <button
              onClick={() => setActiveSection('payments')}
              className={cn(
                "p-4 rounded-xl border-2 bg-card/80 backdrop-blur text-left transition-all hover:shadow-lg hover:scale-[1.02]",
                activeSection === 'payments' ? "border-primary ring-2 ring-primary/20" : "border-transparent"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <span className="font-medium text-sm">Paiements</span>
              </div>
              <p className="text-3xl font-bold">{paymentsSummary?.total || 0}</p>
              <p className="text-xs text-muted-foreground mt-2 font-medium">
                {(paymentsSummary?.totalAmount || 0).toLocaleString()} MRU
              </p>
            </button>

            {/* Milestones */}
            <button
              onClick={() => setActiveSection('overview')}
              className={cn(
                "p-4 rounded-xl border-2 bg-card/80 backdrop-blur text-left transition-all hover:shadow-lg hover:scale-[1.02]",
                activeSection === 'overview' ? "border-primary ring-2 ring-primary/20" : "border-transparent"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Target className="h-4 w-4 text-purple-600" />
                </div>
                <span className="font-medium text-sm">Jalons</span>
              </div>
              <p className="text-3xl font-bold">{milestones.length}</p>
              <p className="text-xs text-muted-foreground mt-2 font-medium">
                {milestones.filter(m => m.status === 'completed').length} terminés
              </p>
            </button>
          </div>

          {/* Status Alerts */}
          {(progress?.overdue_milestones?.length || progress?.upcoming_milestones?.length) && (
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border/50">
              {progress?.overdue_milestones && progress.overdue_milestones.length > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1.5 px-3 py-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {progress.overdue_milestones.length} en retard
                </Badge>
              )}
              {progress?.upcoming_milestones && progress.upcoming_milestones.length > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1 bg-warning/10 text-warning-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {progress.upcoming_milestones.length} à venir (14j)
                </Badge>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Content based on view mode */}
      {viewMode === 'dashboard' && (
        <>
          {/* Action Points - Quick Actions on Milestones */}
          {actionableMilestones.length > 0 && (
            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Points de contrôle actionnables
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                      onClick={() => navigate('/inspection-monitoring')}
                    >
                      <ClipboardCheck className="h-4 w-4" />
                      Service Inspections
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                      onClick={() => navigate('/payment-control')}
                    >
                      <DollarSign className="h-4 w-4" />
                      Contrôle Paiements
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {actionableMilestones.map((milestone) => {
                  const status = getStatusInfo(milestone);
                  const StatusIcon = status.icon;
                  const TypeIcon = getTypeIcon(milestone.type);

                  return (
                    <div
                      key={milestone.id}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border-l-4 transition-all",
                        status.borderColor,
                        status.bgColor,
                        "hover:shadow-md"
                      )}
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className={cn(
                          "p-2.5 rounded-xl shrink-0",
                          milestone.status === 'completed' ? 'bg-success/20' : 'bg-background'
                        )}>
                          <StatusIcon className={cn("h-5 w-5", status.color)} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={cn(
                              "font-semibold",
                              milestone.status === 'completed' && "line-through text-muted-foreground"
                            )}>
                              {milestone.title}
                            </p>
                            <TypeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                            <Badge variant="outline" className="text-xs">
                              {MILESTONE_TYPES[milestone.type]?.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {format(parseISO(milestone.target_date), 'd MMM yyyy', { locale: fr })}
                            </span>
                            <Badge className={cn(status.bgColor, status.color, "border-0 text-xs font-medium")}>
                              {status.label}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {status.canTrigger && (
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 bg-orange-50 hover:bg-orange-100 border-orange-200"
                            onClick={() => handleMilestoneAction(milestone, 'inspection')}
                          >
                            <ClipboardCheck className="h-4 w-4 text-orange-600" />
                            <span className="hidden sm:inline">Inspection</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 bg-green-50 hover:bg-green-100 border-green-200"
                            onClick={() => handleMilestoneAction(milestone, 'payment')}
                          >
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="hidden sm:inline">Paiement</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => handleMilestoneAction(milestone, 'complete')}
                          >
                            <CheckCircle className="h-4 w-4 text-success" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Empty state for milestones */}
          {milestones.length === 0 && (
            <Card className="border-dashed border-2">
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
                <h3 className="text-lg font-semibold mb-2">Aucun jalon défini</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Créez des jalons par défaut (démarrage, point d'avancement, achèvement) pour cette phase.
                </p>
                <Button onClick={generateDefaultMilestones} className="gap-2">
                  <Target className="h-4 w-4" />
                  Créer les jalons par défaut
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Detailed Section Content */}
          {activeSection === 'tasks' && (
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-blue-600" />
                  Tâches de la phase
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PhaseTasks phaseId={phaseId} projectId={projectId} />
              </CardContent>
            </Card>
          )}

          {activeSection === 'inspections' && (
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-orange-600" />
                    Inspections de la phase
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => navigate('/inspection-monitoring')}
                  >
                    Voir le service complet
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <PhaseInspections phaseId={phaseId} projectId={projectId} />
              </CardContent>
            </Card>
          )}

          {activeSection === 'payments' && (
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Paiements de la phase
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => navigate('/payment-control')}
                  >
                    Voir le contrôle paiements
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <PhasePayments phaseId={phaseId} projectId={projectId} />
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && milestones.length > 0 && (
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
              
              <div className="space-y-4">
                {milestones.map((milestone) => {
                  const status = getStatusInfo(milestone);
                  const StatusIcon = status.icon;
                  const TypeIcon = getTypeIcon(milestone.type);

                  return (
                    <div 
                      key={milestone.id}
                      className={cn(
                        "relative pl-14 p-4 rounded-xl transition-all cursor-pointer",
                        "border-2 hover:shadow-lg",
                        status.borderColor,
                        status.bgColor
                      )}
                      onClick={() => status.canTrigger && handleMilestoneAction(milestone, 'inspection')}
                    >
                      <div className={cn(
                        "absolute left-3 top-5 w-7 h-7 rounded-full flex items-center justify-center border-2 bg-background",
                        status.borderColor
                      )}>
                        <StatusIcon className={cn("h-4 w-4", status.color)} />
                      </div>

                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={cn(
                              "font-semibold",
                              milestone.status === 'completed' && "line-through"
                            )}>
                              {milestone.title}
                            </p>
                            <TypeIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {format(parseISO(milestone.target_date), 'd MMMM yyyy', { locale: fr })}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {MILESTONE_TYPES[milestone.type]?.label}
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
          </CardContent>
        </Card>
      )}

      {/* List View */}
      {viewMode === 'list' && milestones.length > 0 && (
        <Card className="shadow-md">
          <CardContent className="pt-4">
            <div className="divide-y">
              {milestones.map((milestone) => {
                const status = getStatusInfo(milestone);
                const StatusIcon = status.icon;

                return (
                  <div 
                    key={milestone.id}
                    className="flex items-center justify-between py-3 hover:bg-muted/50 px-2 rounded transition-colors cursor-pointer"
                    onClick={() => status.canTrigger && handleMilestoneAction(milestone, 'inspection')}
                  >
                    <div className="flex items-center gap-3">
                      <StatusIcon className={cn("h-5 w-5", status.color)} />
                      <div>
                        <p className={cn("font-medium", milestone.status === 'completed' && "line-through text-muted-foreground")}>
                          {milestone.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(milestone.target_date), 'd MMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn(status.bgColor, status.color, "border-0 text-xs")}>
                        {status.label}
                      </Badge>
                      {status.canTrigger && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionDialog.action === 'inspection' && <ClipboardCheck className="h-5 w-5 text-orange-600" />}
              {actionDialog.action === 'payment' && <DollarSign className="h-5 w-5 text-green-600" />}
              {actionDialog.action === 'complete' && <CheckCircle className="h-5 w-5 text-success" />}
              {actionDialog.action === 'inspection' && "Actions d'inspection"}
              {actionDialog.action === 'payment' && "Actions de paiement"}
              {actionDialog.action === 'complete' && "Marquer comme terminé"}
            </DialogTitle>
            <DialogDescription className="space-y-1">
              <span className="block font-medium">{actionDialog.milestone?.title}</span>
              <span className="text-xs">
                Date cible: {actionDialog.milestone && format(parseISO(actionDialog.milestone.target_date), 'd MMMM yyyy', { locale: fr })}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {actionDialog.action === 'inspection' && (
              <>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-4"
                  onClick={handleScheduleInspection}
                >
                  <div className="p-2.5 bg-blue-100 rounded-xl">
                    <CalendarPlus className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Programmer une inspection</p>
                    <p className="text-xs text-muted-foreground">
                      Envoyer une notification pour planifier l'inspection
                    </p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-4"
                  onClick={handleExecuteInspection}
                >
                  <div className="p-2.5 bg-orange-100 rounded-xl">
                    <Play className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Exécuter une inspection programmée</p>
                    <p className="text-xs text-muted-foreground">
                      Aller au service inspection pour exécuter
                    </p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-4"
                  onClick={handleNavigateToInspection}
                >
                  <div className="p-2.5 bg-gray-100 rounded-xl">
                    <ExternalLink className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Accéder au service inspection</p>
                    <p className="text-xs text-muted-foreground">
                      Navigation vers /inspection-monitoring
                    </p>
                  </div>
                </Button>
              </>
            )}

            {actionDialog.action === 'payment' && (
              <>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-4"
                  onClick={handleSchedulePayment}
                >
                  <div className="p-2.5 bg-blue-100 rounded-xl">
                    <Bell className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Programmer un paiement</p>
                    <p className="text-xs text-muted-foreground">
                      Envoyer une notification pour planifier le paiement
                    </p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-4"
                  onClick={handleExecutePayment}
                >
                  <div className="p-2.5 bg-green-100 rounded-xl">
                    <Play className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Effectuer le paiement</p>
                    <p className="text-xs text-muted-foreground">
                      Aller au contrôle des paiements
                    </p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-4"
                  onClick={handleNavigateToPayment}
                >
                  <div className="p-2.5 bg-gray-100 rounded-xl">
                    <ExternalLink className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Accéder au contrôle paiements</p>
                    <p className="text-xs text-muted-foreground">
                      Navigation vers /payment-control
                    </p>
                  </div>
                </Button>
              </>
            )}

            {actionDialog.action === 'complete' && (
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-4 border-success/50 hover:bg-success/10"
                onClick={handleMarkComplete}
              >
                <div className="p-2.5 bg-success/20 rounded-xl">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Confirmer la complétion</p>
                  <p className="text-xs text-muted-foreground">
                    Marquer ce jalon comme terminé
                  </p>
                </div>
              </Button>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setActionDialog({ open: false, milestone: null, action: null })}>
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnifiedPhaseMonitoring;
