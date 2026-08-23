/**
 * QuickActionsPanel - Panneau d'actions rapides contextuelles
 * Affiche les actions disponibles et le statut du workflow en temps réel
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ClipboardCheck,
  FileText,
  DollarSign,
  Shield,
  CheckCircle,
  Clock,
  AlertTriangle,
  Zap,
  Play,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkflowMetrics, PendingAction, WorkflowStage } from '@/hooks/usePhaseWorkflow';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { T } from '@/components/i18n/T';

interface QuickActionsPanelProps {
  phaseName: string;
  phaseProgress: number;
  workflowMetrics: WorkflowMetrics;
  lastInspectionDate?: string;
  lastValidatedPV?: string;
  pendingPaymentAmount?: number;
  onScheduleInspection: () => void;
  onInputProgress: () => void;
  onGeneratePV: () => void;
  onRequestDecompte: () => void;
  onUpdateGuarantee: () => void;
  formatCurrency: (amount: number) => string;
  compact?: boolean;
}

const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
  phaseName,
  phaseProgress,
  workflowMetrics,
  lastInspectionDate,
  lastValidatedPV,
  pendingPaymentAmount = 0,
  onScheduleInspection,
  onInputProgress,
  onGeneratePV,
  onRequestDecompte,
  onUpdateGuarantee,
  formatCurrency,
  compact = false,
}) => {
  if (compact) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2"><T k="auto.quickactionspanel.actions" fallback="Actions" /></CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-2">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1" onClick={onScheduleInspection} disabled={!workflowMetrics.canScheduleInspection}>
              <T k="auto.quickactionspanel.inspection" fallback="Inspection" />
            </Button>
            <Button size="sm" variant={workflowMetrics.canRequestPayment ? 'default' : 'outline'} className="flex-1" onClick={onRequestDecompte} disabled={!workflowMetrics.canRequestPayment}>
              <T k="auto.quickactionspanel.paiement" fallback="Paiement" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">{workflowMetrics.pendingActions.length} actions requises</div>
        </CardContent>
      </Card>
    );
  }
  const getStageIcon = (stage: WorkflowStage) => {
    switch (stage) {
      case 'payment_available':
        return <Zap className="h-4 w-4 text-success" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'validation_pending':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'inspection_scheduled':
        return <Calendar className="h-4 w-4 text-primary" />;
      case 'in_progress':
        return <Play className="h-4 w-4 text-primary" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStageLabel = (stage: WorkflowStage) => {
    const labels: Record<WorkflowStage, string> = {
      not_started: 'Non démarré',
      in_progress: 'En cours',
      inspection_scheduled: 'Inspection programmée',
      inspection_pending: 'Inspection en cours',
      validation_pending: 'Validation en attente',
      approved: 'Approuvé',
      payment_available: 'Paiement disponible',
      paid: 'Payé',
    };
    return labels[stage];
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-destructive bg-destructive/10 border-destructive/30';
      case 'medium':
        return 'text-warning bg-warning/10 border-warning/30';
      default:
        return 'text-primary bg-primary/10 border-primary/30';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'inspection':
        return <ClipboardCheck className="h-4 w-4" />;
      case 'validation':
        return <CheckCircle className="h-4 w-4" />;
      case 'payment':
        return <DollarSign className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-4 bg-gradient-to-r from-primary/5 to-transparent">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <T k="auto.quickactionspanel.actions_rapides" fallback="Actions Rapides" />
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Quick Action Buttons */}
        <div className="space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start gap-2"
            onClick={onScheduleInspection}
            disabled={!workflowMetrics.canScheduleInspection}
          >
            <ClipboardCheck className="h-4 w-4" />
            Programmer inspection
            {!workflowMetrics.canScheduleInspection && (
              <Badge variant="outline" className="ml-auto text-xs"><T k="auto.quickactionspanel.en_attente" fallback="En attente" /></Badge>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start gap-2"
            onClick={onInputProgress}
          >
            <TrendingUp className="h-4 w-4" />
            <T k="auto.quickactionspanel.saisir_rapport_d_avancement" fallback="Saisir rapport d'avancement" />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start gap-2"
            onClick={onGeneratePV}
          >
            <FileText className="h-4 w-4" />
            <T k="auto.quickactionspanel.generer_pv_de_reception" fallback="Générer PV de réception" />
          </Button>
          
          <Button 
            variant={workflowMetrics.canRequestPayment ? "default" : "outline"}
            size="sm" 
            className={cn(
              "w-full justify-start gap-2",
              workflowMetrics.canRequestPayment && "bg-primary"
            )}
            onClick={onRequestDecompte}
            disabled={!workflowMetrics.canRequestPayment}
          >
            <DollarSign className="h-4 w-4" />
            Demander décompte
            {workflowMetrics.canRequestPayment && (
              <Badge className="ml-auto bg-white/20 text-xs"><T k="auto.quickactionspanel.disponible" fallback="Disponible" /></Badge>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start gap-2"
            onClick={onUpdateGuarantee}
          >
            <Shield className="h-4 w-4" />
            <T k="auto.quickactionspanel.mettre_a_jour_garantie" fallback="Mettre à jour garantie" />
          </Button>
        </div>

        <Separator />

        {/* Workflow Status */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground"><T k="auto.quickactionspanel.statut_workflow" fallback="Statut Workflow" /></h4>
          
          <div className="space-y-2 text-sm">
            {/* Current Phase */}
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground"><T k="auto.quickactionspanel.phase" fallback="Phase:" /></span>
              <span className="font-medium truncate flex-1">{phaseName}</span>
              <Badge variant="outline">{phaseProgress}%</Badge>
            </div>

            {/* Scheduled Inspection */}
            {workflowMetrics.scheduledInspections > 0 && lastInspectionDate && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />
                <span className="text-muted-foreground"><T k="auto.quickactionspanel.inspection_prevue" fallback="Inspection prévue:" /></span>
                <span className="font-medium">
                  {format(new Date(lastInspectionDate), 'd MMM yyyy', { locale: fr })}
                </span>
              </div>
            )}

            {/* Last Validated PV */}
            {lastValidatedPV && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-muted-foreground"><T k="auto.quickactionspanel.dernier_pv_valide" fallback="Dernier PV validé:" /></span>
                <span className="font-medium">{lastValidatedPV}</span>
              </div>
            )}

            {/* Pending Payment */}
            {pendingPaymentAmount > 0 && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground"><T k="auto.quickactionspanel.paiement_en_attente" fallback="Paiement en attente:" /></span>
                <span className="font-bold text-primary">
                  {formatCurrency(pendingPaymentAmount)}
                </span>
              </div>
            )}

            {/* Workflow Stage */}
            <div className="flex items-center gap-2 pt-1">
              {getStageIcon(workflowMetrics.currentStage)}
              <span className="text-muted-foreground"><T k="auto.quickactionspanel.etat" fallback="État:" /></span>
              <Badge 
                variant="outline" 
                className={cn(
                  workflowMetrics.currentStage === 'payment_available' && "bg-success-soft text-success border-success/30",
                  workflowMetrics.currentStage === 'approved' && "bg-primary/10 text-primary border-primary/30",
                  workflowMetrics.currentStage === 'validation_pending' && "bg-warning/10 text-warning border-warning/30"
                )}
              >
                {getStageLabel(workflowMetrics.currentStage)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Pending Actions */}
        {workflowMetrics.pendingActions.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Actions requises ({workflowMetrics.pendingActions.length})
              </h4>
              
              <div className="space-y-2">
                {workflowMetrics.pendingActions.slice(0, 3).map((action) => (
                  <div 
                    key={action.id}
                    className={cn(
                      "p-2 rounded-lg border text-sm",
                      getPriorityColor(action.priority)
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {getActionIcon(action.type)}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{action.title}</p>
                        <p className="text-xs opacity-80 truncate">{action.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Release Indicators */}
        {(workflowMetrics.guaranteeReleaseTriggered || workflowMetrics.insuranceReleaseTriggered) && (
          <>
            <Separator />
            <div className="space-y-2">
              {workflowMetrics.guaranteeReleaseTriggered && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-success-soft text-success text-sm">
                  <Shield className="h-4 w-4" />
                  <span><T k="auto.quickactionspanel.mainlevee_garanties_declenchee" fallback="Mainlevée garanties déclenchée" /></span>
                </div>
              )}
              {workflowMetrics.insuranceReleaseTriggered && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 text-primary text-sm">
                  <Shield className="h-4 w-4" />
                  <span><T k="auto.quickactionspanel.mainlevee_assurances_declenchee" fallback="Mainlevée assurances déclenchée" /></span>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickActionsPanel;
