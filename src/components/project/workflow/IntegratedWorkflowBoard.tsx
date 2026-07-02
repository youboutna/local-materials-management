import React from 'react';
import WorkflowKanban from './WorkflowKanban';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MilestoneItem, StepItem, DecisionNode } from '@/dtos/workflows/UnifiedWorkflowDTO';
import { mapMilestoneToDecisionNode } from '@/dtos/types/unified-workflow';
import { PhaseStepDTO } from '@/dtos/entities/PhaseDTO';

type StepWorkflowStatus = {
  inspectionStatus?: string;
  paymentStatus?: string;
  totalPaid?: number;
  latestInspection?: { id: string; date: string } | null;
};

interface IntegratedWorkflowBoardProps {
  steps: StepItem[] | PhaseStepDTO[];
  milestones?: MilestoneItem[] | any[];
  phaseProgress: number;
  getStepWorkflowStatus: (step: StepItem | PhaseStepDTO) => StepWorkflowStatus;
  onScheduleInspection: (stepId: string) => void;
  onUpdateProgress: (stepId: string) => void;
  onRequestPayment: (stepId: string, canRequest: boolean) => void;
  onReorder?: (newOrder: string[]) => void;
  onSelectNode?: (node: DecisionNode) => void;
  formatCurrency: (amount: number) => string;
}

const IntegratedWorkflowBoard: React.FC<IntegratedWorkflowBoardProps> = ({
  steps,
  milestones = [],
  phaseProgress,
  getStepWorkflowStatus,
  onScheduleInspection,
  onUpdateProgress,
  onRequestPayment,
  onReorder,
  onSelectNode,
  formatCurrency,
}) => {
  const [localSteps, setLocalSteps] = React.useState<(StepItem | PhaseStepDTO)[]>(() => steps || []);

  React.useEffect(() => {
    setLocalSteps(steps || []);
  }, [steps]);

  // HTML5 Drag & Drop for quick reordering (compact lane)
  const dragSrcId = React.useRef<string | null>(null);

  const onDragStart = (e: React.DragEvent, id: string) => {
    dragSrcId.current = id;
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const srcId = dragSrcId.current;
    if (!srcId || srcId === targetId) return;

    const srcIndex = localSteps.findIndex(s => s.id === srcId);
    const targetIndex = localSteps.findIndex(s => s.id === targetId);
    if (srcIndex === -1 || targetIndex === -1) return;

    const newSteps = [...localSteps];
    const [moved] = newSteps.splice(srcIndex, 1);
    newSteps.splice(targetIndex, 0, moved);
    setLocalSteps(newSteps);

    if (onReorder) {
      onReorder(newSteps.map(s => s.id));
    }
  };

  const getStepName = (s: StepItem | PhaseStepDTO): string => {
    return (s as StepItem).name || (s as PhaseStepDTO).name || 'Étape';
  };

  const getStepStatus = (s: StepItem | PhaseStepDTO): string => {
    return (s as StepItem).status || (s as PhaseStepDTO).status || 'pending';
  };

  const getStepProgress = (s: StepItem | PhaseStepDTO): number => {
    return (s as StepItem).progress ?? (s as PhaseStepDTO).progress ?? 0;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Board Intégré — Jalons & Étapes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex gap-3 overflow-x-auto">
              {(milestones as any[]).map((m: any) => {
                const node = mapMilestoneToDecisionNode(m);
                return (
                  <div
                    key={node.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={false}
                    aria-label={`Milestone ${node.name}`}
                    className="p-3 rounded-lg border bg-muted/30 min-w-[220px] cursor-pointer"
                    onClick={() => { if (onSelectNode) onSelectNode(node); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (onSelectNode) onSelectNode(node);
                      } else if (e.key === 'ArrowRight') {
                        const next = (e.currentTarget.nextElementSibling as HTMLElement | null);
                        if (next) next.focus();
                      } else if (e.key === 'ArrowLeft') {
                        const prev = (e.currentTarget.previousElementSibling as HTMLElement | null);
                        if (prev) prev.focus();
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{node.name}</p>
                        <p className="text-xs text-muted-foreground">{node.type}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">{node.status || 'unknown'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compact reorder lane */}
          <div className="mb-4">
            <div className="flex gap-2 overflow-x-auto items-start">
              {localSteps.map((s, idx) => (
                <div
                  key={s.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, s.id)}
                  onDragOver={onDragOver}
                  onDrop={(e) => onDrop(e, s.id)}
                  className="p-2 min-w-[160px] rounded-lg border bg-white/80 shadow-sm cursor-grab"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{getStepName(s)}</p>
                      <p className="text-xs text-muted-foreground">{getStepStatus(s)} • {getStepProgress(s)}%</p>
                    </div>
                    <div className="ml-2 text-xs text-muted-foreground">#{idx + 1}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <WorkflowKanban
            steps={localSteps as StepItem[]}
            phaseProgress={phaseProgress}
            getStepWorkflowStatus={getStepWorkflowStatus as any}
            onScheduleInspection={onScheduleInspection}
            onUpdateProgress={onUpdateProgress}
            onRequestPayment={onRequestPayment}
            onViewInspection={(id: string) => console.log('view inspection', id)}
            onViewPayment={(id: string) => console.log('view payment', id)}
            formatCurrency={formatCurrency}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegratedWorkflowBoard;
