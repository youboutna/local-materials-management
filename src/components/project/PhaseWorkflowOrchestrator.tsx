import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import UnifiedPhaseWorkflow from './UnifiedPhaseWorkflow';
import normalizeSteps from '@/utils/dataNormalizer';

type StepAction = 'add' | 'update' | 'delete' | 'program_inspection' | 'validate';
type MilestoneAction = 'add' | 'validate' | 'program_inspection';

interface PhaseWorkflowOrchestratorProps {
  rawPhaseData: any;
  rawSteps?: any[] | null;
  rawMilestones?: any[];
  projectId: string;
  phaseId: string;
  onStepAction?: (action: StepAction, data?: any) => Promise<void> | void;
  onMilestoneAction?: (action: MilestoneAction, data?: any) => Promise<void> | void;
  onAddStep?: () => void;
  onRetry?: () => void;
  enableNormalization?: boolean;
  showEmptyState?: boolean;
  initialView?: 'workflow' | 'dashboard' | 'split';
  // pass-through handlers used by UnifiedPhaseWorkflow
  onScheduleInspection?: (stepId?: string) => void;
  onUpdateProgress?: (stepId?: string) => void;
  onRequestPayment?: (stepId?: string, canRequest?: boolean) => void;
  onGenerateDecompte?: () => void;
  onGeneratePV?: () => void;
  onReorderSteps?: (newOrder: string[]) => void;
  onActionComplete?: () => void;
  metrics?: any;
  workflowMetrics?: any;
  progressMetrics?: any;
  phaseCosts?: any;
  latestApprovedInspection?: any;
  auditEntries?: any[];
}

const PhaseWorkflowOrchestrator: React.FC<PhaseWorkflowOrchestratorProps> = ({
  rawPhaseData,
  rawSteps,
  rawMilestones = [],
  projectId,
  phaseId,
  onStepAction,
  onMilestoneAction,
  onAddStep,
  onRetry,
  enableNormalization = true,
  showEmptyState = true,
  onScheduleInspection,
  onUpdateProgress,
  onRequestPayment,
  onGenerateDecompte,
  onGeneratePV,
  onReorderSteps,
  onActionComplete,
  metrics,
  workflowMetrics,
  progressMetrics,
  phaseCosts,
  latestApprovedInspection,
  auditEntries,
}) => {
  const isLoading = !rawPhaseData;

  const normalizedSteps = useMemo(() => {
    if (!enableNormalization) return Array.isArray(rawSteps) ? rawSteps : [];
    return normalizeSteps(rawSteps);
  }, [rawSteps, enableNormalization]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chargement du workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Chargement des données de phase…</p>
        </CardContent>
      </Card>
    );
  }

  if (rawSteps === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workflow indisponible</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Impossible de charger les étapes pour cette phase.</p>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => onRetry && onRetry()}>Réessayer</Button>
            <Button variant="ghost" onClick={() => onRetry && onRetry()}>Forcer rafraîchissement</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (normalizedSteps.length === 0 && showEmptyState) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aucune étape planifiée</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Commencez par ajouter des étapes à votre workflow.</p>
          <div className="mt-4">
            <Button onClick={() => onAddStep && onAddStep()}>Ajouter une première étape</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // All good: render unified workflow with normalized steps
  const safePhase = { ...rawPhaseData, steps: normalizedSteps };

  return (
    <UnifiedPhaseWorkflow
      projectId={projectId}
      phaseId={phaseId}
      phase={safePhase}
      milestones={rawMilestones}
      metrics={metrics}
      workflowMetrics={workflowMetrics}
      progressMetrics={progressMetrics}
      phaseCosts={phaseCosts}
      latestApprovedInspection={latestApprovedInspection}
      auditEntries={auditEntries}
      onScheduleInspection={onScheduleInspection}
      onUpdateProgress={onUpdateProgress}
      onRequestPayment={onRequestPayment}
      onGenerateDecompte={onGenerateDecompte}
      onGeneratePV={onGeneratePV}
      onReorderSteps={onReorderSteps}
      onActionComplete={onActionComplete}
      formatCurrency={(n: number) => (typeof n === 'number' ? `${n.toLocaleString('fr-FR')} MRU` : '')}
    />
  );
};

export default PhaseWorkflowOrchestrator;
