/**
 * ActionableProjectMilestones - Points de contrôle actionnables au niveau projet
 * Actions: déclencher inspection, programmer paiement, naviguer vers services
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Target,
  ClipboardCheck, 
  DollarSign, 
  CheckCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  Play,
  CalendarPlus,
  ArrowRight,
  ShieldCheck,
  Package,
  Flag,
  Eye,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { MilestoneService } from '@/services/MilestoneService';
import { MilestoneSummaryDTO, MilestoneType } from '@/types/milestone-dto';
import { format, parseISO, isBefore, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface ActionableProjectMilestonesProps {
  projectId: string;
  maxItems?: number;
  showHeader?: boolean;
  onMilestoneClick?: (milestoneId: string, phaseId?: string) => void;
}

type ActionType = 'inspection' | 'payment' | 'complete' | 'view';

interface ActionDialogState {
  open: boolean;
  milestone: MilestoneSummaryDTO | null;
  action: ActionType | null;
}

const ActionableProjectMilestones: React.FC<ActionableProjectMilestonesProps> = ({
  projectId,
  maxItems = 6,
  showHeader = true,
  onMilestoneClick
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [actionDialog, setActionDialog] = useState<ActionDialogState>({
    open: false,
    milestone: null,
    action: null
  });

  // Fetch all project milestones
  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ['actionable-milestones', projectId],
    queryFn: () => MilestoneService.getProjectMilestones(projectId),
    enabled: !!projectId,
  });

  // Fetch progress
  const { data: progress } = useQuery({
    queryKey: ['project-milestone-progress', projectId],
    queryFn: () => MilestoneService.getMilestoneProgress(projectId),
    enabled: !!projectId,
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
        borderColor: 'border-success/40',
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
        borderColor: 'border-destructive/40',
        label: `Retard ${daysLate}j`,
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
        borderColor: 'border-warning/40',
        label: `${daysUntil}j`,
        canTrigger: true,
        urgency: 2
      };
    }

    if (daysUntil <= 14) {
      return { 
        icon: Clock, 
        color: 'text-primary', 
        bgColor: 'bg-primary/10',
        borderColor: 'border-primary/40',
        label: 'Bientôt',
        canTrigger: true,
        urgency: 1
      };
    }

    return { 
      icon: Clock, 
      color: 'text-muted-foreground', 
      bgColor: 'bg-muted',
      borderColor: 'border-muted-foreground/20',
      label: format(targetDate, 'dd MMM', { locale: fr }),
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
      default: return Target;
    }
  };

  const getTypeLabel = (type: MilestoneType) => {
    switch (type) {
      case 'gate': return 'Jalon critique';
      case 'deliverable': return 'Livrable';
      case 'event': return 'Événement';
      case 'checkpoint':
      default: return 'Point de contrôle';
    }
  };

  // Action handlers
  const handleMilestoneAction = (milestone: MilestoneSummaryDTO, action: ActionType) => {
    setActionDialog({ open: true, milestone, action });
  };

  const handleNavigateToInspection = () => {
    const milestone = actionDialog.milestone;
    navigate(`/inspection-monitoring${milestone?.phase_id ? `?phase=${milestone.phase_id}` : ''}`);
    setActionDialog({ open: false, milestone: null, action: null });
  };

  const handleNavigateToPayment = () => {
    const milestone = actionDialog.milestone;
    navigate(`/payment-control${milestone?.phase_id ? `?phase=${milestone.phase_id}` : ''}`);
    setActionDialog({ open: false, milestone: null, action: null });
  };

  const handleScheduleInspection = () => {
    const milestone = actionDialog.milestone;
    if (milestone) {
      toast({
        title: "Programmation d'inspection",
        description: `Notification envoyée pour programmer l'inspection du jalon "${milestone.title}".`,
      });
      navigate(`/inspection-monitoring?schedule=true&milestone=${milestone.id}${milestone.phase_id ? `&phase=${milestone.phase_id}` : ''}`);
    }
    setActionDialog({ open: false, milestone: null, action: null });
  };

  const handleExecuteInspection = () => {
    const milestone = actionDialog.milestone;
    if (milestone) {
      toast({
        title: "Exécution d'inspection",
        description: `Redirection vers le service d'inspection.`,
      });
      navigate(`/inspection-monitoring?execute=true${milestone.phase_id ? `&phase=${milestone.phase_id}` : ''}`);
    }
    setActionDialog({ open: false, milestone: null, action: null });
  };

  const handleSchedulePayment = () => {
    const milestone = actionDialog.milestone;
    if (milestone) {
      toast({
        title: "Programmation de paiement",
        description: `Notification envoyée pour programmer le paiement du jalon "${milestone.title}".`,
      });
      navigate(`/payment-control?schedule=true&milestone=${milestone.id}${milestone.phase_id ? `&phase=${milestone.phase_id}` : ''}`);
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
      navigate(`/payment-control?execute=true${milestone.phase_id ? `&phase=${milestone.phase_id}` : ''}`);
    }
    setActionDialog({ open: false, milestone: null, action: null });
  };

  const handleMarkComplete = async () => {
    const milestone = actionDialog.milestone;
    if (milestone) {
      try {
        await MilestoneService.updateMilestone(milestone.id, { status: 'completed' });
        queryClient.invalidateQueries({ queryKey: ['actionable-milestones'] });
        queryClient.invalidateQueries({ queryKey: ['project-milestone-progress'] });
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

  const handleViewPhase = () => {
    const milestone = actionDialog.milestone;
    if (milestone?.phase_id) {
      navigate(`/projects/${projectId}/phases/${milestone.phase_id}`);
    }
    setActionDialog({ open: false, milestone: null, action: null });
  };

  // Filter and sort actionable milestones
  const actionableMilestones = milestones
    .filter(m => m.status !== 'completed')
    .sort((a, b) => getStatusInfo(b).urgency - getStatusInfo(a).urgency)
    .slice(0, maxItems);

  // Completed milestones count
  const completedCount = milestones.filter(m => m.status === 'completed').length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden border-0 shadow-lg">
        {showHeader && (
          <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Points de Contrôle</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {completedCount}/{milestones.length} terminés
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
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
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-3">
              <Progress 
                value={progress?.weighted_progress || (completedCount / Math.max(1, milestones.length)) * 100} 
                className="h-2" 
              />
            </div>
          </CardHeader>
        )}
        
        <CardContent className={cn("p-4", !showHeader && "pt-6")}>
          {actionableMilestones.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-success/40" />
              <p>Tous les jalons sont terminés !</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-3">
                {actionableMilestones.map((milestone) => {
                  const status = getStatusInfo(milestone);
                  const TypeIcon = getTypeIcon(milestone.type);
                  const StatusIcon = status.icon;
                  
                  return (
                    <div
                      key={milestone.id}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all hover:shadow-md cursor-pointer group",
                        status.bgColor,
                        status.borderColor
                      )}
                      onClick={() => onMilestoneClick?.(milestone.id, milestone.phase_id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={cn(
                            "p-2 rounded-lg shrink-0",
                            status.bgColor
                          )}>
                            <TypeIcon className={cn("h-4 w-4", status.color)} />
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm truncate">{milestone.title}</h4>
                              <Badge variant="outline" className="text-xs shrink-0">
                                {getTypeLabel(milestone.type)}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <StatusIcon className={cn("h-3 w-3", status.color)} />
                              <span className={status.color}>{status.label}</span>
                              {(milestone as MilestoneSummaryDTO).phase_name && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">{(milestone as MilestoneSummaryDTO).phase_name}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Action buttons */}
                        {status.canTrigger && (
                          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMilestoneAction(milestone, 'inspection');
                              }}
                              title="Déclencher inspection"
                            >
                              <ClipboardCheck className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMilestoneAction(milestone, 'payment');
                              }}
                              title="Déclencher paiement"
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-success hover:text-success"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMilestoneAction(milestone, 'complete');
                              }}
                              title="Marquer terminé"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
          
          {milestones.length > maxItems && (
            <Button
              variant="ghost"
              className="w-full mt-3"
              onClick={() => onMilestoneClick?.('', undefined)}
            >
              Voir tous les jalons
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ open: false, milestone: null, action: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionDialog.action === 'inspection' && (
                <>
                  <ClipboardCheck className="h-5 w-5 text-blue-600" />
                  Déclencher une Inspection
                </>
              )}
              {actionDialog.action === 'payment' && (
                <>
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Déclencher un Paiement
                </>
              )}
              {actionDialog.action === 'complete' && (
                <>
                  <CheckCircle className="h-5 w-5 text-success" />
                  Terminer le Jalon
                </>
              )}
            </DialogTitle>
          <DialogDescription>
              {actionDialog.milestone?.title}
              {(actionDialog.milestone as MilestoneSummaryDTO)?.phase_name && (
                <span className="text-muted-foreground"> — {(actionDialog.milestone as MilestoneSummaryDTO).phase_name}</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {/* Inspection Actions */}
            {actionDialog.action === 'inspection' && (
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-3"
                  onClick={handleScheduleInspection}
                >
                  <CalendarPlus className="h-5 w-5 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium">Programmer une inspection</p>
                    <p className="text-xs text-muted-foreground">Créer une notification de programmation</p>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-3"
                  onClick={handleExecuteInspection}
                >
                  <Play className="h-5 w-5 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium">Exécuter une inspection</p>
                    <p className="text-xs text-muted-foreground">Lancer une inspection déjà programmée</p>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-3"
                  onClick={handleNavigateToInspection}
                >
                  <ExternalLink className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="font-medium">Ouvrir le service Inspections</p>
                    <p className="text-xs text-muted-foreground">Naviguer vers /inspection-monitoring</p>
                  </div>
                </Button>
              </div>
            )}

            {/* Payment Actions */}
            {actionDialog.action === 'payment' && (
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-3"
                  onClick={handleSchedulePayment}
                >
                  <CalendarPlus className="h-5 w-5 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium">Programmer un paiement</p>
                    <p className="text-xs text-muted-foreground">Créer une notification de programmation</p>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-3"
                  onClick={handleExecutePayment}
                >
                  <Play className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">Traiter un paiement</p>
                    <p className="text-xs text-muted-foreground">Exécuter un paiement programmé</p>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-3"
                  onClick={handleNavigateToPayment}
                >
                  <ExternalLink className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="font-medium">Ouvrir le contrôle Paiements</p>
                    <p className="text-xs text-muted-foreground">Naviguer vers /payment-control</p>
                  </div>
                </Button>
              </div>
            )}

            {/* Complete Action */}
            {actionDialog.action === 'complete' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Êtes-vous sûr de vouloir marquer ce jalon comme terminé ? 
                  Cette action confirmera l'achèvement du point de contrôle.
                </p>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setActionDialog({ open: false, milestone: null, action: null })}
                  >
                    Annuler
                  </Button>
                  <Button
                    className="flex-1 bg-success hover:bg-success/90"
                    onClick={handleMarkComplete}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmer
                  </Button>
                </div>
              </div>
            )}
          </div>

          {actionDialog.action !== 'complete' && (
            <DialogFooter>
              <Button 
                variant="ghost" 
                onClick={() => setActionDialog({ open: false, milestone: null, action: null })}
              >
                Fermer
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ActionableProjectMilestones;
