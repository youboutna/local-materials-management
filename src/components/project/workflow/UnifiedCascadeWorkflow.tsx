/**
 * UnifiedCascadeWorkflow - Vue centrée sur les ÉTAPES avec jalons intégrés
 * 
 * Flux: Phase → Étapes + Jalons (timeline unifiée) → Actions par étape
 * Les jalons sont positionnés par rapport aux activités (étapes)
 */

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  Target,
  Layers,
  Building,
  DollarSign,
  ClipboardCheck,
  Shield,
  Play,
  AlertTriangle,
  Plus,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PhaseDTO, PhaseStepDTO } from '@/types/phase-dto';
import StepDetailPanel from './StepDetailPanel';
import IntegratedWorkflowTimeline from './IntegratedWorkflowTimeline';

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

  const handleUpdateProgress = (stepId: string, progress: number) => {
    if (onUpdateProgress) {
      onUpdateProgress(stepId, progress);
    }
  };

  // If a step is selected, show full-width detail panel
  if (selectedStep) {
    return (
      <div className="space-y-4">
        {/* Breadcrumb / Back button */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSelectedStep(null)}>
            ← Retour aux étapes
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">{selectedStep.name}</span>
        </div>

        {/* Full-width Step Detail Panel */}
        <StepDetailPanel
          step={selectedStep}
          phaseId={phase.id}
          projectId={phase.project_id}
          onClose={() => setSelectedStep(null)}
          onUpdateProgress={handleUpdateProgress}
          onScheduleInspection={(stepId) => onScheduleInspection(stepId)}
          onGeneratePV={onGeneratePV}
          onRequestPayment={(stepId) => onRequestPayment(stepId)}
          formatCurrency={formatCurrency}
        />
      </div>
    );
  }

  // Default view: Integrated Timeline + Décompte summary
  return (
    <div className="space-y-6">
      {/* Résumé décompte Mauritanie - Compact */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="h-4 w-4" />
              Décompte Mauritanie
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/5">
                Seuil: {decompteInfo.payablePercentage}%
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Payé: {formatCurrency(totalPaid)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
            <div className="p-3 rounded-lg bg-muted/30 border text-center">
              <p className="text-xs text-muted-foreground">Progression validée</p>
              <p className="text-xl font-bold text-primary">{decompteInfo.validatedPercent}%</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border text-center">
              <p className="text-xs text-muted-foreground">Brut calculé</p>
              <p className="text-lg font-bold">{formatCurrency(decompteInfo.grossAmount)}</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 text-center">
              <p className="text-xs text-muted-foreground">Garantie (10%)</p>
              <p className="text-lg font-bold text-amber-600">{formatCurrency(decompteInfo.guaranteeRetention)}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
              <p className="text-xs text-muted-foreground">Net à payer</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(decompteInfo.netPayable)}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => onScheduleInspection()}>
              <ClipboardCheck className="h-3 w-3 mr-1" /> Inspection ({inspections.length})
            </Button>
            <Button size="sm" variant={workflowMetrics.canRequestPayment ? 'default' : 'outline'} onClick={() => onRequestPayment()} disabled={!workflowMetrics.canRequestPayment}>
              <DollarSign className="h-3 w-3 mr-1" /> Paiement ({payments.length})
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

          <div className="mt-3 p-2 rounded-lg bg-muted/20 border">
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

      {/* Timeline intégrée Étapes + Jalons */}
      <IntegratedWorkflowTimeline
        projectId={(phase as any).projectId || (phase as any).project_id}
        phaseId={phase.id}
        phaseName={(phase as any).name || (phase as any).title || ''}
        steps={phaseSteps}
        phaseStartDate={(phase as any).startDate || (phase as any).start_date}
        phaseEndDate={(phase as any).endDate || (phase as any).end_date}
        onStepClick={(step) => setSelectedStep(step)}
        onMilestoneClick={(id) => onMilestoneAction?.('edit', { id })}
      />

      {/* Quick add step button */}
      {phaseSteps.length === 0 && (
        <div className="flex justify-center">
          <Button onClick={() => onStepAction?.('add')}>
            <Plus className="h-4 w-4 mr-2" /> Ajouter la première étape
          </Button>
        </div>
      )}
    </div>
  );
};

export default UnifiedCascadeWorkflow;
