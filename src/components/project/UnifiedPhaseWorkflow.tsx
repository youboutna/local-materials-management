import React from 'react';
import IntegratedWorkflowBoard from './workflow/IntegratedWorkflowBoard';
import StepDashboard from './StepDashboard';
import QuickActionsPanel from './workflow/QuickActionsPanel';
import PaymentCalculator from './workflow/PaymentCalculator';
import UnifiedDecisionPanel from './UnifiedDecisionPanel';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DecisionNode, mapMilestoneToDecisionNode, StepItem, mapStepToStepItem } from '@/types/unified-workflow';
import { PhaseDTO, PhaseStepDTO } from '@/dtos/entities/PhaseDTO';

interface UnifiedPhaseWorkflowProps {
  projectId: string;
  phaseId: string;
  phase: PhaseDTO;
  milestones?: any[];
  metrics?: any;
  workflowMetrics?: any;
  progressMetrics?: any;
  phaseCosts?: any;
  latestApprovedInspection?: any;
  auditEntries?: any[];
  // handlers
  onScheduleInspection?: (stepId?: string) => void;
  onUpdateProgress?: (stepId?: string) => void;
  onRequestPayment?: (stepId?: string, canRequest?: boolean) => void;
  onGenerateDecompte?: () => void;
  onGeneratePV?: () => void;
  onReorderSteps?: (newOrder: string[]) => void;
  onActionComplete?: () => void;
  formatCurrency?: (n: number) => string;
}

const UnifiedPhaseWorkflow: React.FC<UnifiedPhaseWorkflowProps> = ({
  projectId,
  phaseId,
  phase,
  milestones = [],
  metrics = {},
  workflowMetrics = {},
  progressMetrics = {},
  phaseCosts = {},
  latestApprovedInspection,
  auditEntries = [],
  onScheduleInspection,
  onUpdateProgress,
  onRequestPayment,
  onGenerateDecompte,
  onGeneratePV,
  onReorderSteps,
  onActionComplete,
  formatCurrency = (n: number) => (typeof n === 'number' ? `${n.toLocaleString('fr-FR')} MRU` : ''),
}) => {
  const nodes: DecisionNode[] = (milestones || []).map(mapMilestoneToDecisionNode);

  const steps: StepItem[] = (phase?.steps || []).map(mapStepToStepItem);

  const [selectedNode, setSelectedNode] = React.useState<DecisionNode | null>(null);
  const isMobile = useIsMobile();

  const handleSelectNode = (n: DecisionNode) => setSelectedNode(n);

  const handleClosePanel = () => setSelectedNode(null);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Workflow Unifié — Nodes décisionnels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex gap-3 overflow-x-auto px-2">
              {nodes.map((n) => (
                <div key={n.id} className="p-3 rounded-lg border min-w-[220px]">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{n.name}</p>
                      <p className="text-xs text-muted-foreground">{n.type}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">{n.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <IntegratedWorkflowBoard
                steps={steps as any}
                milestones={milestones}
                phaseProgress={phase.progress || 0}
                getStepWorkflowStatus={() => ({})}
                onScheduleInspection={(s: string) => onScheduleInspection && onScheduleInspection(s)}
                onUpdateProgress={(s: string) => onUpdateProgress && onUpdateProgress(s)}
                onRequestPayment={(s: string, c: boolean) => onRequestPayment && onRequestPayment(s, c)}
                onReorder={(order: string[]) => onReorderSteps && onReorderSteps(order)}
                onSelectNode={handleSelectNode}
                formatCurrency={formatCurrency!}
              />
            </div>

            <div className="lg:col-span-1 space-y-4">
              <QuickActionsPanel
                phaseName={phase.name || 'Phase'}
                phaseProgress={phase.progress || 0}
                workflowMetrics={workflowMetrics}
                lastInspectionDate={latestApprovedInspection?.date}
                lastValidatedPV={latestApprovedInspection?.id}
                pendingPaymentAmount={workflowMetrics.totalPaid || 0}
                onScheduleInspection={() => onScheduleInspection && onScheduleInspection()}
                onInputProgress={() => onUpdateProgress && onUpdateProgress()}
                onGeneratePV={() => onGeneratePV && onGeneratePV()}
                onRequestDecompte={() => onRequestPayment && onRequestPayment(undefined, true)}
                onUpdateGuarantee={() => console.log('update guarantee')}
                formatCurrency={formatCurrency!}
              />

              <PaymentCalculator
                phaseName={phase.name || 'Phase'}
                phaseProgress={phase.progress || 0}
                validatedProgress={workflowMetrics.lastApprovedProgress}
                contractAmount={phase.estimatedCost || 0}
                guaranteeRetentionRate={5}
                previousPayments={workflowMetrics.totalPaid || 0}
                onGenerateDecompte={() => onGenerateDecompte && onGenerateDecompte()}
                onCreatePaymentRequest={() => onRequestPayment && onRequestPayment(undefined, true)}
                onViewHistory={() => console.log('view payment history')}
                formatCurrency={formatCurrency!}
                canRequestPayment={workflowMetrics.canRequestPayment}
              />

              {isMobile ? (
                <Dialog open={!!selectedNode} onOpenChange={(open) => { if (!open) handleClosePanel(); }}>
                  <DialogContent className="max-w-full max-h-[95vh] p-0">
                    <DialogHeader>
                      <DialogTitle>{selectedNode?.name}</DialogTitle>
                    </DialogHeader>
                    {selectedNode ? (
                      <UnifiedDecisionPanel
                        decisionNode={selectedNode}
                        projectId={projectId}
                        phaseId={phaseId}
                        onClose={handleClosePanel}
                        isModal={true}
                        onActionComplete={() => {
                          handleClosePanel();
                          if (typeof onActionComplete === 'function') onActionComplete();
                        }}
                      />
                    ) : null}
                  </DialogContent>
                </Dialog>
              ) : (
                selectedNode ? (
                  <UnifiedDecisionPanel
                    decisionNode={selectedNode}
                    projectId={projectId}
                    phaseId={phaseId}
                    onClose={handleClosePanel}
                    isModal={false}
                    onActionComplete={() => {
                      handleClosePanel();
                      if (typeof onActionComplete === 'function') onActionComplete();
                    }}
                  />
                ) : null
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <StepDashboard
        phase={phase}
        projectId={projectId}
        phaseId={phaseId}
        metrics={metrics}
        workflowMetrics={workflowMetrics}
        progressMetrics={progressMetrics}
        phaseCosts={phaseCosts}
        milestones={milestones}
        latestApprovedInspection={latestApprovedInspection}
        auditEntries={auditEntries}
        onGeneratePV={() => onGeneratePV && onGeneratePV()}
        onScheduleInspection={(stepId?: string) => onScheduleInspection && onScheduleInspection(stepId)}
        onUpdateProgress={(stepId?: string) => onUpdateProgress && onUpdateProgress(stepId)}
        onRequestPayment={(stepId?: string, canRequest?: boolean) => onRequestPayment && onRequestPayment(stepId, canRequest)}
        onGenerateDecompte={() => onGenerateDecompte && onGenerateDecompte()}
        formatCurrency={formatCurrency!}
      />
    </div>
  );
};

export default UnifiedPhaseWorkflow;
