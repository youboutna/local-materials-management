import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, Calendar, Users, CheckCircle, AlertTriangle, DollarSign } from 'lucide-react';
import WorkflowKanban from './workflow/WorkflowKanban';
import { MilestoneItem, mapMilestoneToDecisionNode, DecisionNode } from '@/dtos/types/unified-workflow';
import { PhaseStepDTO, PhaseDTO } from '@/dtos/entities/PhaseDTO';
import { AuditEntry } from '@/hooks/useAuditEntries';
import { StepItem } from '@/dtos/types/unified-workflow';

// Local metric and helper types to avoid loose Record usage
type Metrics = {
  overallProgress?: number;
};

type ProgressMetrics = {
  physical?: number;
  quality?: number;
  docs?: number;
  compliance?: number;
  safety?: number;
  prep?: number;
  cables?: number;
  connections?: number;
  tests?: number;
  safetyScore?: number;
  complianceScore?: number;
  docsProduced?: number;
  docsRequired?: number;
  managerAdjustment?: string | number;
};

type PhaseCosts = {
  isOverBudget?: boolean;
  unlockable?: number;
};

type MilestoneSummary = {
  id?: string;
  name?: string;
  due_date?: string;
};

type InspectionSummary = {
  id?: string;
  date?: string;
  status?: string;
};

type StepWorkflowStatus = {
  inspectionStatus: 'approved' | 'pending' | 'none';
  paymentStatus: 'paid' | 'available' | 'blocked';
  totalPaid: number;
  latestInspection: { id: string; date: string } | null;
};

interface StepDashboardProps {
  phase: PhaseDTO | null;
  projectId?: string;
  phaseId?: string;
  metrics?: Metrics | null;
  workflowMetrics?: Metrics | null;
  progressMetrics?: ProgressMetrics | null;
  phaseCosts?: PhaseCosts | null;
  milestones?: MilestoneSummary[];
  // accept unified MilestoneItem[] as well
  rawMilestones?: MilestoneItem[] | MilestoneSummary[];
  onReorder?: (newOrder: string[]) => void;
  onSelectNode?: (node: DecisionNode) => void;
  latestApprovedInspection?: InspectionSummary | null;
  // accept legacy PhaseStepDTO[] or unified StepItem[]
  steps?: PhaseStepDTO[] | StepItem[];
  getStepWorkflowStatus?: (step: PhaseStepDTO | StepItem) => StepWorkflowStatus;
  onViewInspection?: (inspectionId: string) => void;
  onViewPayment?: (stepId: string) => void;
  onScheduleInspection?: (stepId?: string) => void;
  onUpdateProgress?: (stepId?: string) => void;
  onRequestPayment?: (stepId?: string, canRequest?: boolean) => void;
  onGenerateDecompte?: () => void;
  onGeneratePV?: () => void;
  auditEntries?: AuditEntry[];
  formatCurrency?: (n: number) => string;
}

const StepDashboard: React.FC<StepDashboardProps> = ({
  phase,
  metrics = {},
  workflowMetrics = {},
  progressMetrics = {},
  phaseCosts = {},
  milestones = [],
  latestApprovedInspection,
  onScheduleInspection,
  onUpdateProgress,
  onRequestPayment,
  onGenerateDecompte,
  onGeneratePV,
  auditEntries = [] as AuditEntry[],
  // workflow/kanban props
  steps = [],
  rawMilestones = [],
  onReorder,
  onSelectNode,
  getStepWorkflowStatus,
  onViewInspection,
  onViewPayment,
  formatCurrency = (n: number) => (typeof n === 'number' ? `${n.toLocaleString('fr-FR')} MRU` : ''),
}) => {
  const overall = phase?.progress ?? metrics?.overallProgress ?? 0;

  const physical = (progressMetrics?.physical ?? 66.5);
  const quality = (progressMetrics?.quality ?? 45);
  const docs = (progressMetrics?.docs ?? 12);

  const [simWorkers, setSimWorkers] = React.useState<number>(0);
  const [simResult, setSimResult] = React.useState<string | null>(null);

  type LocalStep = StepItem | PhaseStepDTO;
  const [localSteps, setLocalSteps] = React.useState<LocalStep[]>(() => (steps as LocalStep[]) || []);

  React.useEffect(() => {
    setLocalSteps((steps as StepItem[]) || []);
  }, [steps]);

  // drag-and-drop state
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

    const srcIndex = localSteps.findIndex((s) => (s as { id?: string }).id === srcId);
    const targetIndex = localSteps.findIndex((s) => (s as { id?: string }).id === targetId);
    if (srcIndex === -1 || targetIndex === -1) return;

    const newSteps = [...localSteps as LocalStep[]];
    const [moved] = newSteps.splice(srcIndex, 1);
    newSteps.splice(targetIndex, 0, moved);
    setLocalSteps(newSteps);

    if (onReorder) onReorder(newSteps.map((s) => s.id));
  };

  const runSimulation = () => {
    const saved = simWorkers * 1.5; // heuristic days saved per worker
    setSimResult(`Estimé: -${saved.toFixed(1)} jours (confiance basse)`);
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {phase?.name || 'Étape'}</h3>
            <p className="text-sm text-muted-foreground">
              Phase: {phase?.name || '—'} • Projet: {phase?.projectId || '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Responsable: {'—'} • Équipe: {'—'} personnes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Progression</div>
              <div className="text-2xl font-bold text-primary">{Math.round(overall)}%</div>
            </div>
            <div className="w-44">
              <Progress value={Math.min(100, Math.round(overall))} className="h-3" />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Zone 2 - Synthetic state & indicators */}
        <div className="lg:col-span-1 p-3 border rounded-lg">
          <h4 className="text-sm font-semibold">État synthétique</h4>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <div>Physique: <strong className="text-foreground">{(physical).toFixed(1)}%</strong></div>
            <div>Qualité: <strong className="text-foreground">{(quality).toFixed(1)}%</strong></div>
            <div>Conformité: <strong className="text-foreground">{progressMetrics?.compliance ?? 90}%</strong></div>
            <div>Sécurité: <strong className="text-foreground">{progressMetrics?.safety ?? 95}%</strong></div>
          </div>
          <div className="mt-3">
            <Badge className="bg-blue-50 text-blue-700">{phase?.status || 'En cours'}</Badge>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Prochaine: {milestones?.[0]?.name || 'Inspection finalisation'} • {milestones?.[0]?.due_date ? new Date(milestones[0].due_date).toLocaleDateString('fr-FR') : '—'}
          </div>
            <div className="mt-3 space-y-2">
              {phaseCosts?.isOverBudget && (
                <div className="flex items-center gap-2 text-sm text-red-600"><AlertTriangle className="h-4 w-4" /> Sur budget</div>
              )}
              {typeof phaseCosts?.unlockable === 'number' && (
                <div className="flex items-center gap-2 text-sm text-green-700"><DollarSign className="h-4 w-4" /> Déblocable: {formatCurrency(phaseCosts.unlockable)}</div>
              )}
            </div>
        </div>

        {/* Zone 3 - Calculation detail (big) */}
        <div className="lg:col-span-2 p-3 border rounded-lg">
          <h4 className="text-sm font-semibold">Détail du calcul de progression</h4>
          <div className="mt-3 text-sm text-muted-foreground">
            <p>1. Avancement physique (poids 60%)</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs">Préparation site</div>
                <div className="font-medium">{progressMetrics?.prep ?? 100}% • Poids 20%</div>
              </div>
              <div>
                <div className="text-xs">Pose câbles</div>
                <div className="font-medium">{progressMetrics?.cables ?? 90}% • Poids 35%</div>
              </div>
              <div>
                <div className="text-xs">Connexions</div>
                <div className="font-medium">{progressMetrics?.connections ?? 50}% • Poids 30%</div>
              </div>
              <div>
                <div className="text-xs">Tests</div>
                <div className="font-medium">{progressMetrics?.tests ?? 0}% • Poids 15%</div>
              </div>
            </div>

            <div className="mt-4">
              <p>2. Validations qualité (poids 25%)</p>
              <div className="mt-2 text-sm">Inspection sécurité: {progressMetrics?.safetyScore ?? 95}/100</div>
              <div className="mt-1 text-sm">Contrôle conformité: {progressMetrics?.complianceScore ?? 85}/100</div>
            </div>

            <div className="mt-4">
              <p>3. Documents & traçabilité (poids 15%)</p>
              <div className="mt-2 text-sm">Documents produits: {(progressMetrics?.docsProduced ?? 4)}/{(progressMetrics?.docsRequired ?? 5)}</div>
            </div>

            <div className="mt-4 font-medium">Calcul final: {(overall).toFixed(1)}%</div>
            <div className="mt-2 text-xs text-muted-foreground">Ajustement chef de projet: {progressMetrics?.managerAdjustment ?? '+0.0%'}</div>
            <div className="mt-3 flex gap-2">
              <Button aria-label="Générer décompte" size="sm" onClick={() => onGenerateDecompte && onGenerateDecompte()}>Générer décompte</Button>
              <Button aria-label="Programmer inspection" size="sm" variant="outline" onClick={() => onScheduleInspection && onScheduleInspection()}>Programmer inspection</Button>
              <Button aria-label="Générer PV" size="sm" variant="ghost" onClick={() => onGeneratePV && onGeneratePV()}>Générer PV</Button>
            </div>

            <div className="mt-4">
              <details>
                <summary className="cursor-pointer text-sm font-medium">Simulation d'impact</summary>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <label className="text-xs">Ajout d'électriciens</label>
                  <input
                    type="number"
                    min={0}
                    value={simWorkers}
                    onChange={(e) => setSimWorkers(Number(e.target.value))}
                    className="w-28 rounded border px-2 py-1"
                    aria-label="Nombre d'électriciens à ajouter pour simulation"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={runSimulation} aria-label="Exécuter la simulation">Exécuter</Button>
                    <Button size="sm" variant="outline" onClick={() => { setSimWorkers(0); setSimResult(null); }} aria-label="Réinitialiser la simulation">Réinitialiser</Button>
                  </div>
                  {simResult && <div className="text-xs text-muted-foreground">{simResult}</div>}
                </div>
              </details>

              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium">Historique / Audit</summary>
                <div className="mt-2 text-xs text-muted-foreground space-y-2">
                  {Array.isArray(auditEntries) && auditEntries.length > 0 ? (
                    auditEntries.slice(0,5).map((e: AuditEntry, i: number) => (
                      <div key={i}>{e.date ? new Date(e.date).toLocaleString('fr-FR') : ''} - {e.summary || e.message || e.action}</div>
                    ))
                  ) : (
                    <div>Aucun historique disponible</div>
                  )}
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* Zone 4 & 5 - Actions/workflow + Impacts */}
        <div className="lg:col-span-1 space-y-3">
          <div className="p-3 border rounded-lg">
            <h4 className="text-sm font-semibold">Actions rapides</h4>
            <div className="mt-3 space-y-2">
              <Button size="sm" onClick={() => onUpdateProgress && onUpdateProgress()} className="w-full">Saisir progression</Button>
              <Button size="sm" variant="outline" onClick={() => onRequestPayment && onRequestPayment(undefined, true)} className="w-full">Préparer paiement</Button>
              <Button size="sm" variant="ghost" onClick={() => console.log('Affecter ressources')} className="w-full">Affecter ressources</Button>
            </div>
          </div>

          <div className="p-3 border rounded-lg">
            <h4 className="text-sm font-semibold">Impacts & dépendances</h4>
            <div className="mt-3 text-sm text-muted-foreground space-y-2">
              <div>Contribue à {'30%'} de la phase</div>
              <div>Impact projet: {'+1.2%'}</div>
              <div>Dépendances: {phase?.dependencies?.length ?? 0}</div>
              <div className="mt-2">Budget: {formatCurrency(phase?.estimatedCost || 0)}</div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Integrated Kanban / Step table for step-level actions */}
      <div className="mt-4">
        {/* Milestones bar (from IntegratedWorkflowBoard) */}
        <div className="mb-4">
          <div className="flex gap-3 overflow-x-auto">
            {Array.isArray(rawMilestones) && rawMilestones.map((m: MilestoneItem | MilestoneSummary) => {
              const node = mapMilestoneToDecisionNode(m as MilestoneItem);
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

        {/* Compact reorder lane (from IntegratedWorkflowBoard) */}
        <div className="mb-4">
          <div className="flex gap-2 overflow-x-auto items-start">
            {localSteps.map((s) => {
              const sid = (s as { id?: string }).id || '';
              return (
                <div
                  key={sid}
                  draggable
                  onDragStart={(e) => onDragStart(e, sid)}
                  onDragOver={onDragOver}
                  onDrop={(e) => onDrop(e, sid)}
                  className="p-2 min-w-[160px] rounded-lg border bg-white/80 shadow-sm cursor-grab"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{(s as LocalStep & { name?: string }).name}</p>
                      <p className="text-xs text-muted-foreground">{(s as LocalStep & { status?: string }).status} • {(s as LocalStep & { progress?: number }).progress}%</p>
                    </div>
                    <div className="ml-2 text-xs text-muted-foreground">#{localSteps.indexOf(s) + 1}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <WorkflowKanban
          steps={localSteps as (PhaseStepDTO[] | StepItem[])}
          phaseProgress={overall}
          getStepWorkflowStatus={
            getStepWorkflowStatus ||
            (() => ({ inspectionStatus: 'none', paymentStatus: 'blocked', totalPaid: 0, latestInspection: null } as StepWorkflowStatus))
          }
          onScheduleInspection={(stepId: string) => onScheduleInspection && onScheduleInspection(stepId)}
          onUpdateProgress={(stepId: string) => onUpdateProgress && onUpdateProgress(stepId)}
          onRequestPayment={(stepId: string, canRequest: boolean) => onRequestPayment && onRequestPayment(stepId, canRequest)}
          onViewInspection={(id: string) => onViewInspection && onViewInspection(id)}
          onViewPayment={(stepId: string) => onViewPayment && onViewPayment(stepId)}
          formatCurrency={formatCurrency}
        />
      </div>
    </Card>
  );
};

export default StepDashboard;
