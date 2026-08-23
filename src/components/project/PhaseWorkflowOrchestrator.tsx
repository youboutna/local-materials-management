import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import UnifiedPhaseWorkflow from './UnifiedPhaseWorkflow';
import normalizeSteps from '@/utils/dataNormalizer';
import { T } from '@/components/i18n/T';

type StepAction = 'add' | 'update' | 'delete' | 'program_inspection' | 'validate';
type MilestoneAction = 'add' | 'validate' | 'program_inspection';

interface PhaseWorkflowOrchestratorProps {
  rawPhaseData: any;
  rawSteps?: any[] | null;
  rawMilestones?: any[];
  projectId: string;
  phaseId: string;
  onStepAction?: (action: StepAction, data?: any) => <T k="auto.phaseworkfloworchestrator.promise" fallback="Promise" /><void> | void;
  onMilestoneAction?: (action: MilestoneAction, data?: any) => <T k="auto.phaseworkfloworchestrator.promise" fallback="Promise" /><void> | void;
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
          <CardTitle><T k="auto.phaseworkfloworchestrator.chargement_du_workflow" fallback="Chargement du workflow" /></CardTitle>
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
          <CardTitle><T k="auto.phaseworkfloworchestrator.workflow_indisponible" fallback="Workflow indisponible" /></CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground"><T k="auto.phaseworkfloworchestrator.impossible_de_charger_les_etapes_pour_cette_phas" fallback="Impossible de charger les étapes pour cette phase." /></p>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => onRetry && onRetry()}><T k="auto.phaseworkfloworchestrator.reessayer" fallback="Réessayer" /></Button>
            <Button variant="ghost" onClick={() => onRetry && onRetry()}><T k="auto.phaseworkfloworchestrator.forcer_rafraichissement" fallback="Forcer rafraîchissement" /></Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (normalizedSteps.length === 0 && showEmptyState) {
    return (
      <Card>
        <CardHeader>
          <CardTitle><T k="auto.phaseworkfloworchestrator.aucune_etape_planifiee" fallback="Aucune étape planifiée" /></CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground"><T k="auto.phaseworkfloworchestrator.commencez_par_ajouter_des_etapes_a_votre_workflo" fallback="Commencez par ajouter des étapes à votre workflow." /></p>
          <div className="mt-4">
            <Button onClick={() => onAddStep && onAddStep()}><T k="auto.phaseworkfloworchestrator.ajouter_une_premiere_etape" fallback="Ajouter une première étape" /></Button>
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
