/**
 * UnifiedCascadeWorkflow - Vue centrée sur les ÉTAPES
 * 
 * Flux: Phase active → Étapes → Actions par étape
 * Chaque étape permet: Inspections, Tâches, RH, Matériaux, PV, Paiements
 */

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  ArrowRight,
  Target,
  Layers,
  Building,
  DollarSign,
  Package,
  ClipboardCheck,
  Shield,
  Play,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  Zap,
  FileText,
  Eye,
  X,
  Users,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PhaseDTO, PhaseStepDTO } from '@/types/phase-dto';
import StepDetailPanel from './StepDetailPanel';

interface UnifiedCascadeWorkflowProps {
  phase: PhaseDTO;
  projectProgress: number;
  workflowMetrics: {
    stepProgress: number;
    lastApprovedProgress: number;
    totalPaid: number;
    pendingInspections: number;
    canRequestPayment?: boolean;
    canScheduleInspection?: boolean;
  };
  milestones?: any[];
  steps?: PhaseStepDTO[];
  inspections?: any[];
  payments?: any[];
  materials?: any[];
  lowStockMaterials?: number;
  onScheduleInspection: (stepId?: string) => void;
  onRequestPayment: (stepId?: string) => void;
  onGeneratePV?: (stepId?: string) => void;
  onGenerateDecompte?: () => void;
  onUpdateProgress?: (stepId: string, progress: number) => void;
  onMilestoneAction?: (action: 'add' | 'edit' | 'delete', item?: any) => void;
  onStepAction?: (action: 'add' | 'edit' | 'delete', item?: any) => void;
  onInspectionAction?: (action: 'add' | 'edit' | 'delete', item?: any) => void;
  onPaymentAction?: (action: 'add' | 'edit' | 'delete', item?: any) => void;
  formatCurrency: (n: number) => string;
}

const UnifiedCascadeWorkflow: React.FC<UnifiedCascadeWorkflowProps> = ({
  phase,
  projectProgress,
  workflowMetrics,
  milestones = [],
  steps = [],
  inspections = [],
  payments = [],
  materials = [],
  lowStockMaterials = 0,
  onScheduleInspection,
  onRequestPayment,
  onGeneratePV,
  onGenerateDecompte,
  onUpdateProgress,
  onMilestoneAction,
  onStepAction,
  onInspectionAction,
  onPaymentAction,
  formatCurrency,
}) => {
  const [selectedStep, setSelectedStep] = useState<PhaseStepDTO | null>(null);
  
  const phaseSteps = steps.length > 0 ? steps : (phase.steps || []);
  const phaseProgress = phase.progress || 0;
  const contractAmount = phase.estimated_cost || 0;
  const { stepProgress, lastApprovedProgress, totalPaid, pendingInspections } = workflowMetrics;

  // Calcul décompte Mauritanie
  const decompteInfo = useMemo(() => {
    const validatedPercent = lastApprovedProgress;
    const payablePercentage = Math.floor(validatedPercent / 25) * 25;
    const grossAmount = contractAmount * (payablePercentage / 100);
    const guaranteeRetention = grossAmount * 0.10;
    const netPayable = Math.max(0, grossAmount - guaranteeRetention - totalPaid);
    return {
      validatedPercent,
      payablePercentage,
      grossAmount,
      guaranteeRetention,
      netPayable,
      remaining: contractAmount - totalPaid,
    };
  }, [contractAmount, lastApprovedProgress, totalPaid]);

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400';
      case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400';
      case 'delayed': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Play className="h-4 w-4 text-blue-600" />;
      case 'delayed': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Target className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Inspections pour l'étape sélectionnée
  const stepInspections = selectedStep
    ? inspections.filter((i: any) => i.step_id === selectedStep.id || !i.step_id)
    : [];

  const handleUpdateProgress = (stepId: string, progress: number) => {
    if (onUpdateProgress) {
      onUpdateProgress(stepId, progress);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Colonne gauche: Liste des étapes */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader className="py-4 bg-gradient-to-r from-primary/10 via-transparent to-transparent">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Étapes de la Phase
              </CardTitle>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-primary/5">
                  {phaseSteps.filter((s: any) => s.status === 'completed').length}/{phaseSteps.length} complétées
                </Badge>
                <Button size="sm" onClick={() => onStepAction?.('add')}>
                  <Plus className="h-3 w-3 mr-1" /> Étape
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4 space-y-3">
            {phaseSteps.length === 0 ? (
              <div className="text-center py-8">
                <Layers className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground mb-3">Aucune étape définie</p>
                <Button onClick={() => onStepAction?.('add')}>
                  <Plus className="h-4 w-4 mr-2" /> Ajouter la première étape
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {phaseSteps.map((step: PhaseStepDTO, idx: number) => (
                  <div
                    key={step.id}
                    onClick={() => setSelectedStep(step)}
                    className={cn(
                      "p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md",
                      selectedStep?.id === step.id
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-transparent bg-muted/30 hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {getStepIcon(step.status)}
                            <p className="font-medium truncate">{step.name}</p>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{step.start_date ? new Date(step.start_date).toLocaleDateString('fr-FR') : '—'}</span>
                            <span>→</span>
                            <span>{step.end_date ? new Date(step.end_date).toLocaleDateString('fr-FR') : '—'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Progress value={step.progress || 0} className="w-20 h-2" />
                            <span className="text-sm font-medium w-10">{step.progress || 0}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{formatCurrency((step as any).estimated_cost || (step as any).budget || 0)}</p>
                        </div>
                        <Badge className={cn("text-xs", getStepStatusColor(step.status))}>
                          {step.status}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Résumé décompte */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="h-4 w-4" />
              Décompte Mauritanie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-muted/30 border">
                <p className="text-xs text-muted-foreground">Progression validée</p>
                <p className="text-xl font-bold text-primary">{decompteInfo.validatedPercent}%</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border">
                <p className="text-xs text-muted-foreground">Seuil atteint</p>
                <p className="text-xl font-bold">{decompteInfo.payablePercentage}%</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200">
                <p className="text-xs text-muted-foreground">Déjà payé</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs text-muted-foreground">Net à payer</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(decompteInfo.netPayable)}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => onScheduleInspection()}>
                <ClipboardCheck className="h-3 w-3 mr-1" /> Inspection
              </Button>
              <Button size="sm" variant={workflowMetrics.canRequestPayment ? 'default' : 'outline'} onClick={() => onRequestPayment()} disabled={!workflowMetrics.canRequestPayment}>
                <DollarSign className="h-3 w-3 mr-1" /> Paiement
              </Button>
              {onGeneratePV && (
                <Button size="sm" variant="outline" onClick={() => onGeneratePV()}>
                  <FileText className="h-3 w-3 mr-1" /> PV
                </Button>
              )}
              {onGenerateDecompte && (
                <Button size="sm" variant="outline" onClick={onGenerateDecompte}>
                  <FileText className="h-3 w-3 mr-1" /> Décompte
                </Button>
              )}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-muted/20 border">
              <div className="flex items-center gap-4 text-xs text-muted-foreground overflow-x-auto">
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <DollarSign className="h-3 w-3" /> Seuils: 25%, 50%, 75%, 100%
                </span>
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <Shield className="h-3 w-3" /> Garantie: 10% retenu
                </span>
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <ClipboardCheck className="h-3 w-3" /> Inspection requise
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Colonne droite: Détail étape sélectionnée */}
      <div className="lg:col-span-1">
        {selectedStep ? (
          <StepDetailPanel
            step={selectedStep}
            phaseId={phase.id}
            projectId={phase.project_id}
            inspections={stepInspections}
            onClose={() => setSelectedStep(null)}
            onUpdateProgress={handleUpdateProgress}
            onScheduleInspection={(stepId) => onScheduleInspection(stepId)}
            onGeneratePV={onGeneratePV}
            onRequestPayment={(stepId) => onRequestPayment(stepId)}
            formatCurrency={formatCurrency}
          />
        ) : (
          <Card className="h-full">
            <CardContent className="flex flex-col items-center justify-center h-full py-12 text-center">
              <Layers className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground mb-2">Sélectionnez une étape</p>
              <p className="text-xs text-muted-foreground">
                Cliquez sur une étape pour voir les détails et effectuer des actions
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UnifiedCascadeWorkflow;

