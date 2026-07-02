/**
 * MilestoneCheckpointActions - Actions disponibles sur les checkpoints des jalons
 * Permet de déclencher des inspections et paiements directement depuis les jalons
 * Utilise CheckpointActionContextService pour récupérer le contexte complet
 * 
 * Logique d'activation:
 * - Les boutons sont actifs tant qu'il n'y a pas d'inspection approuvée avec un seuil de progression atteint
 * - Déclenchement automatique de paiement après approbation d'une inspection
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Target,
  ClipboardCheck,
  DollarSign,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  ShieldCheck,
  Package,
  Flag,
  CheckSquare,
  ChevronRight,
  Play,
  Loader2,
  Info,
  Zap
} from 'lucide-react';
import { MilestoneSummaryDTO, MilestoneType, MILESTONE_TYPES } from '@/dtos/types/milestone-dto';
import { format, parseISO, isBefore, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { usePaymentActionContext, useInspectionActionContext, useProjectActionContext } from '@/hooks/useCheckpointActionContext';
import { Separator } from '@/components/ui/separator';
import { DEFAULT_COMPLETION_PROGRESS_THRESHOLD } from '@/utils/completionValidation';

// Seuil de progression minimum pour déclencher automatiquement un paiement après inspection approuvée
const AUTO_PAYMENT_PROGRESS_THRESHOLD = 25;

/**
 * Contexte enrichi pour les actions
 */
export interface MilestoneActionContext {
  milestoneId: string;
  milestoneTitle: string;
  milestoneType: MilestoneType;
  phaseId?: string;
  phaseName?: string;
  stepId?: string;
  stepName?: string;
  suggestedAmount?: number;
  maxAllowedAmount?: number;
  suggestedProgress?: number;
  contractorId?: string;
  contractorName?: string;
  contractorContact?: string;
  inspectionType?: 'technical' | 'quality' | 'safety' | 'regulatory';
  checklistItems?: string[];
}

interface MilestoneCheckpointActionsProps {
  milestones: MilestoneSummaryDTO[];
  projectId: string;
  phaseId?: string;
  progressThreshold?: number; // Seuil de progression pour activer les actions (défaut: 25%)
  onAddInspection?: (context: MilestoneActionContext) => void;
  onAddPayment?: (context: MilestoneActionContext) => void;
  onMilestoneComplete?: (milestoneId: string) => void;
  onAutoPaymentTriggered?: (context: MilestoneActionContext) => void; // Callback pour paiement automatique après inspection
}

const MilestoneCheckpointActions: React.FC<MilestoneCheckpointActionsProps> = ({
  milestones,
  projectId,
  phaseId,
  progressThreshold = AUTO_PAYMENT_PROGRESS_THRESHOLD,
  onAddInspection,
  onAddPayment,
  onMilestoneComplete,
  onAutoPaymentTriggered
}) => {
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneSummaryDTO | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [autoPaymentPending, setAutoPaymentPending] = useState(false);

  // Fetch project context to check inspection status
  const { data: projectContext } = useProjectActionContext(projectId);

  /**
   * Vérifie si une inspection approuvée avec le seuil de progression atteint existe
   */
  const hasApprovedInspectionWithProgress = (): boolean => {
    if (!projectContext?.latestInspection) return false;
    
    const { latestInspection, project } = projectContext;
    return (
      latestInspection.status === 'approved' &&
      latestInspection.progressAtInspection >= progressThreshold
    );
  };

  /**
   * Vérifie si les actions doivent être actives
   * Actif tant qu'il n'y a pas d'inspection approuvée avec le seuil atteint
   */
  const areActionsEnabled = (): boolean => {
    return !hasApprovedInspectionWithProgress();
  };

  /**
   * Détecte l'approbation d'une inspection et déclenche le paiement automatique
   */
  useEffect(() => {
    if (
      projectContext?.latestInspection?.status === 'approved' &&
      projectContext.latestInspection.progressAtInspection >= progressThreshold &&
      !autoPaymentPending &&
      onAutoPaymentTriggered &&
      projectContext.mainContractor
    ) {
      // Déclencher automatiquement une demande de paiement
      setAutoPaymentPending(true);
      
      const paymentContext: MilestoneActionContext = {
        milestoneId: '',
        milestoneTitle: `Paiement suite à inspection approuvée (${projectContext.latestInspection.progressAtInspection}%)`,
        milestoneType: 'checkpoint',
        phaseId: projectContext.latestInspection.phaseId,
        phaseName: projectContext.currentPhase?.name,
        suggestedProgress: projectContext.latestInspection.progressAtInspection,
        contractorId: projectContext.mainContractor.id,
        contractorName: projectContext.mainContractor.name,
        contractorContact: projectContext.mainContractor.contact
      };
      
      onAutoPaymentTriggered(paymentContext);
    }
  }, [projectContext?.latestInspection?.status, projectContext?.latestInspection?.progressAtInspection, progressThreshold, autoPaymentPending, onAutoPaymentTriggered]);

  const getStatusInfo = (milestone: MilestoneSummaryDTO) => {
    const today = new Date();
    const targetDate = parseISO(milestone.target_date);
    const actionsEnabled = areActionsEnabled();
    
    if (milestone.status === 'completed') {
      return { 
        icon: CheckCircle, 
        color: 'text-success', 
        bgColor: 'bg-success/10',
        borderColor: 'border-success',
        label: 'Terminé',
        canTrigger: false
      };
    }

    // Si inspection approuvée avec seuil atteint, désactiver les actions
    if (!actionsEnabled) {
      return { 
        icon: CheckCircle, 
        color: 'text-success', 
        bgColor: 'bg-success/10',
        borderColor: 'border-success',
        label: 'Inspection validée',
        canTrigger: false
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
        canTrigger: true
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
        canTrigger: true
      };
    }

    if (daysUntil <= 14) {
      return { 
        icon: Clock, 
        color: 'text-primary', 
        bgColor: 'bg-primary/10',
        borderColor: 'border-primary',
        label: 'Prochainement',
        canTrigger: true
      };
    }

    return { 
      icon: Clock, 
      color: 'text-muted-foreground', 
      bgColor: 'bg-muted',
      borderColor: 'border-muted-foreground/30',
      label: 'À venir',
      canTrigger: true // Actif tant qu'il n'y a pas d'inspection validée
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

  // Filter checkpoints that are actionable (gate, checkpoint types)
  const actionableMilestones = milestones.filter(m => 
    m.type === 'gate' || m.type === 'checkpoint'
  );

  // Fetch payment context when milestone is selected
  const { data: paymentContext, isLoading: paymentLoading } = usePaymentActionContext(
    dialogOpen && selectedMilestone ? projectId : undefined,
    selectedMilestone?.id,
    phaseId
  );

  // Fetch inspection context when milestone is selected
  const { data: inspectionContext, isLoading: inspectionLoading } = useInspectionActionContext(
    dialogOpen && selectedMilestone ? projectId : undefined,
    selectedMilestone?.id,
    phaseId
  );

  const handleOpenActions = (milestone: MilestoneSummaryDTO) => {
    setSelectedMilestone(milestone);
    setDialogOpen(true);
  };

  const handleTriggerInspection = () => {
    if (selectedMilestone && onAddInspection) {
      const context: MilestoneActionContext = {
        milestoneId: selectedMilestone.id,
        milestoneTitle: selectedMilestone.title,
        milestoneType: selectedMilestone.type,
        phaseId: inspectionContext?.linkedPhase?.id,
        phaseName: inspectionContext?.linkedPhase?.name,
        stepId: inspectionContext?.linkedStep?.id,
        stepName: inspectionContext?.linkedStep?.name,
        suggestedProgress: inspectionContext?.suggestedProgress,
        inspectionType: inspectionContext?.inspectionType,
        checklistItems: inspectionContext?.checklistItems
      };
      onAddInspection(context);
      setDialogOpen(false);
    }
  };

  const handleTriggerPayment = () => {
    if (selectedMilestone && onAddPayment) {
      const context: MilestoneActionContext = {
        milestoneId: selectedMilestone.id,
        milestoneTitle: selectedMilestone.title,
        milestoneType: selectedMilestone.type,
        phaseId: paymentContext?.linkedPhase?.id,
        phaseName: paymentContext?.linkedPhase?.name,
        suggestedAmount: paymentContext?.suggestedAmount,
        maxAllowedAmount: paymentContext?.maxAllowedAmount,
        contractorId: paymentContext?.mainContractor?.id,
        contractorName: paymentContext?.mainContractor?.name,
        contractorContact: paymentContext?.mainContractor?.contact
      };
      onAddPayment(context);
      setDialogOpen(false);
    }
  };

  const handleMarkComplete = () => {
    if (selectedMilestone && onMilestoneComplete) {
      onMilestoneComplete(selectedMilestone.id);
      setDialogOpen(false);
    }
  };

  if (actionableMilestones.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <Target className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground text-sm">
            Aucun point de contrôle (checkpoint/gate) disponible.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Les inspections et paiements sont déclenchés sur les jalons de type "Checkpoint" ou "Porte".
          </p>
        </CardContent>
      </Card>
    );
  }

  const isLoadingContext = paymentLoading || inspectionLoading;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Points de contrôle ({actionableMilestones.length})
          </CardTitle>
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
                  "flex items-center justify-between p-3 rounded-lg border-l-4 transition-all",
                  status.borderColor,
                  status.bgColor,
                  status.canTrigger && "hover:shadow-md cursor-pointer"
                )}
                onClick={() => status.canTrigger && handleOpenActions(milestone)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    "p-2 rounded-full",
                    milestone.status === 'completed' ? 'bg-success/20' : 'bg-background'
                  )}>
                    <StatusIcon className={cn("h-4 w-4", status.color)} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        "font-medium text-sm truncate",
                        milestone.status === 'completed' && "line-through text-muted-foreground"
                      )}>
                        {milestone.title}
                      </p>
                      <TypeIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{format(parseISO(milestone.target_date), 'd MMM yyyy', { locale: fr })}</span>
                      <Badge variant="outline" className="text-xs h-4">
                        {MILESTONE_TYPES[milestone.type]?.label}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={cn(status.bgColor, status.color, "border-0 text-xs")}>
                    {status.label}
                  </Badge>
                  {status.canTrigger && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Actions Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Actions sur le jalon
            </DialogTitle>
            <DialogDescription>
              {selectedMilestone?.title}
              <span className="block text-xs mt-1">
                Date cible: {selectedMilestone && format(parseISO(selectedMilestone.target_date), 'd MMMM yyyy', { locale: fr })}
              </span>
            </DialogDescription>
          </DialogHeader>

          {isLoadingContext ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Chargement du contexte...</span>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {/* Context Summary */}
              {(paymentContext || inspectionContext) && (
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Info className="h-4 w-4 text-primary" />
                    Contexte du projet
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Progression:</span>
                      <span className="ml-1 font-medium">{paymentContext?.project.progress || inspectionContext?.project.progress}%</span>
                    </div>
                    {paymentContext?.linkedPhase && (
                      <div>
                        <span className="text-muted-foreground">Phase:</span>
                        <span className="ml-1 font-medium">{paymentContext.linkedPhase.name}</span>
                      </div>
                    )}
                    {paymentContext?.mainContractor && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Contractant:</span>
                        <span className="ml-1 font-medium">{paymentContext.mainContractor.name}</span>
                      </div>
                    )}
                    {projectContext?.latestInspection && (
                      <div className="col-span-2 flex items-center gap-2">
                        <span className="text-muted-foreground">Dernière inspection:</span>
                        <Badge 
                          variant={projectContext.latestInspection.status === 'approved' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {projectContext.latestInspection.status === 'approved' ? 'Approuvée' : 
                           projectContext.latestInspection.status === 'rejected' ? 'Rejetée' : 'En attente'}
                        </Badge>
                        <span className="text-muted-foreground">
                          ({projectContext.latestInspection.progressAtInspection}%)
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Auto-payment indicator */}
                  {hasApprovedInspectionWithProgress() && (
                    <div className="mt-2 p-2 bg-success/10 rounded-md flex items-center gap-2 text-xs">
                      <Zap className="h-3 w-3 text-success" />
                      <span className="text-success font-medium">
                        Paiement automatique déclenché suite à l'inspection approuvée
                      </span>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* Trigger Inspection */}
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start gap-3 h-auto py-3",
                  hasApprovedInspectionWithProgress() && "opacity-50 cursor-not-allowed"
                )}
                onClick={handleTriggerInspection}
                disabled={hasApprovedInspectionWithProgress()}
              >
                <div className="p-2 bg-orange-100 rounded-lg">
                  <ClipboardCheck className="h-4 w-4 text-orange-600" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-medium">Déclencher une inspection</p>
                  <p className="text-xs text-muted-foreground">
                    {hasApprovedInspectionWithProgress() 
                      ? 'Inspection déjà approuvée avec seuil atteint'
                      : (inspectionContext?.inspectionType ? `Type: ${inspectionContext.inspectionType}` : 'Créer une inspection liée à ce jalon')
                    }
                  </p>
                  {!hasApprovedInspectionWithProgress() && inspectionContext?.suggestedProgress !== undefined && (
                    <p className="text-xs text-primary">
                      Progression suggérée: {inspectionContext.suggestedProgress}%
                    </p>
                  )}
                </div>
              </Button>

              {/* Trigger Payment */}
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start gap-3 h-auto py-3",
                  hasApprovedInspectionWithProgress() && "opacity-50 cursor-not-allowed"
                )}
                onClick={handleTriggerPayment}
                disabled={hasApprovedInspectionWithProgress()}
              >
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-medium">Effectuer un paiement</p>
                  <p className="text-xs text-muted-foreground">
                    {hasApprovedInspectionWithProgress()
                      ? 'Paiement automatique en cours'
                      : 'Enregistrer un paiement lié à ce jalon'
                    }
                  </p>
                  {!hasApprovedInspectionWithProgress() && paymentContext?.suggestedAmount !== undefined && paymentContext.suggestedAmount > 0 && (
                    <p className="text-xs text-green-600">
                      Montant suggéré: {paymentContext.suggestedAmount.toLocaleString()} MRU
                    </p>
                  )}
                </div>
              </Button>

              {/* Mark as Complete */}
              {selectedMilestone?.status !== 'completed' && (
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start gap-3 h-auto py-3 border-success/50 hover:bg-success/10",
                    !hasApprovedInspectionWithProgress() && "opacity-50"
                  )}
                  onClick={handleMarkComplete}
                  disabled={!hasApprovedInspectionWithProgress()}
                >
                  <div className="p-2 bg-success/20 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-success" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Marquer comme terminé</p>
                    <p className="text-xs text-muted-foreground">
                      {hasApprovedInspectionWithProgress()
                        ? 'Valider ce point de contrôle'
                        : 'Nécessite une inspection approuvée'
                      }
                    </p>
                  </div>
                </Button>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MilestoneCheckpointActions;
