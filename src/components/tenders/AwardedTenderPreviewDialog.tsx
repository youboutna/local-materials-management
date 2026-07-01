/**
 * AwardedTenderPreviewDialog
 * Preview interactive du mapping DQE → phases/tâches/jalons.
 * L'utilisateur peut renommer, supprimer, ajuster durées avant application au projet.
 *
 * @see .lovable/plan.md — Lot 4
 */

import { useState, useMemo, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Layers, ListTodo, Target, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAwardedTenderToProjectService } from '@/application/services/AwardedTenderToProjectService';
import type { AwardedProjectHydrationPayload } from '@/dtos/transforms/AwardedTenderTransformer';

export interface AwardedTenderPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  tenderId: string;
  winningEstimateId: string;
  supplierName?: string;
  supplierId?: string;
  onApplied?: (result: { phases: number; tasks: number; milestones: number }) => void;
}

export function AwardedTenderPreviewDialog(props: AwardedTenderPreviewDialogProps) {
  const { open, onOpenChange, projectId, tenderId, winningEstimateId, supplierId, supplierName, onApplied } = props;
  const { toast } = useToast();
  const [payload, setPayload] = useState<AwardedProjectHydrationPayload | null>(null);

  const previewMutation = useMutation({
    mutationFn: async () => {
      const svc = getAwardedTenderToProjectService();
      const res = await svc.hydrateFromWinner({
        projectId, tenderId, winningEstimateId, supplierId, supplierName, apply: false,
      });
      return res.payload;
    },
  });

  // Charger le preview à l'ouverture (effet, pas useMemo).
  useEffect(() => {
    if (open && !payload && !previewMutation.isPending) {
      previewMutation.mutate(undefined, {
        onSuccess: (p) => setPayload(p),
        onError: (e: any) => toast({ title: 'Erreur preview', description: e?.message, variant: 'destructive' }),
      });
    }
    if (!open) setPayload(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!payload) throw new Error('Aucun payload à appliquer');
      const svc = getAwardedTenderToProjectService();
      return svc.hydrateFromWinner({
        projectId, tenderId, winningEstimateId, supplierId, supplierName,
        apply: true, overridePayload: payload,
      });
    },
    onSuccess: (res) => {
      toast({
        title: 'Projet hydraté',
        description: `${res.createdPhaseIds?.length ?? 0} phases, ${res.createdTaskIds?.length ?? 0} tâches, ${res.createdMilestoneIds?.length ?? 0} jalons créés${res.warnings.length ? ` (${res.warnings.length} avertissements)` : ''}.`,
      });
      onApplied?.({
        phases: res.createdPhaseIds?.length ?? 0,
        tasks: res.createdTaskIds?.length ?? 0,
        milestones: res.createdMilestoneIds?.length ?? 0,
      });
      onOpenChange(false);
    },
    onError: (e: any) => toast({ title: 'Erreur application', description: e?.message, variant: 'destructive' }),
  });

  const updatePhase = (idx: number, patch: Partial<AwardedProjectHydrationPayload['phases'][number]>) => {
    setPayload((p) => p ? { ...p, phases: p.phases.map((ph, i) => i === idx ? { ...ph, ...patch } : ph) } : p);
  };

  const removePhase = (idx: number) => {
    setPayload((p) => p ? { ...p, phases: p.phases.filter((_, i) => i !== idx) } : p);
  };

  const stats = useMemo(() => {
    if (!payload) return { phases: 0, tasks: 0, milestones: 0, amount: 0 };
    return {
      phases: payload.phases.length,
      tasks: payload.phases.reduce((s, p) => s + p.tasks.length, 0),
      milestones: payload.phases.reduce((s, p) => s + p.milestones.length, 0),
      amount: payload.phases.reduce((s, p) => s + p.amount, 0),
    };
  }, [payload]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Preview — Hydratation du projet depuis DQE lauréat</DialogTitle>
        </DialogHeader>

        {previewMutation.isPending && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Génération du mapping…
          </div>
        )}

        {payload && (
          <>
            <div className="grid grid-cols-4 gap-2 text-sm">
              <SummaryCard icon={<Layers className="h-4 w-4" />} label="Phases" value={stats.phases} />
              <SummaryCard icon={<ListTodo className="h-4 w-4" />} label="Tâches" value={stats.tasks} />
              <SummaryCard icon={<Target className="h-4 w-4" />} label="Jalons" value={stats.milestones} />
              <SummaryCard label="Montant" value={`${stats.amount.toLocaleString('fr-FR')} ${payload.currency}`} />
            </div>

            <ScrollArea className="flex-1 pr-3 border rounded-md">
              <div className="p-3 space-y-3">
                {payload.phases.map((phase, idx) => (
                  <div key={idx} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge>{phase.order}</Badge>
                      <Input
                        value={phase.name}
                        onChange={(e) => updatePhase(idx, { name: e.target.value })}
                        className="flex-1 h-8 font-medium"
                      />
                      <Input
                        type="number"
                        value={phase.durationDays}
                        onChange={(e) => updatePhase(idx, { durationDays: Number(e.target.value) })}
                        className="w-20 h-8"
                        title="Durée (jours)"
                      />
                      <Badge variant="secondary">{phase.amount.toLocaleString('fr-FR')} {payload.currency}</Badge>
                      <Button size="icon" variant="ghost" onClick={() => removePhase(idx)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="pl-4 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="font-semibold text-muted-foreground mb-1">Tâches ({phase.tasks.length})</p>
                        <ul className="space-y-0.5">
                          {phase.tasks.slice(0, 5).map((t, i) => (
                            <li key={i} className="truncate">• {t.name}</li>
                          ))}
                          {phase.tasks.length > 5 && <li className="text-muted-foreground">… +{phase.tasks.length - 5}</li>}
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-muted-foreground mb-1">Jalons ({phase.milestones.length})</p>
                        <ul className="space-y-0.5">
                          {phase.milestones.map((m, i) => (
                            <li key={i}>{m.progressPercent}% — {m.name}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
                {payload.phases.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Aucune phase à créer.</p>
                )}
              </div>
            </ScrollArea>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button
            onClick={() => applyMutation.mutate()}
            disabled={!payload || payload.phases.length === 0 || applyMutation.isPending}
          >
            {applyMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Appliquer au projet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryCard({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded border p-2 flex items-center gap-2">
      {icon}
      <div>
        <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
        <div className="font-semibold">{value}</div>
      </div>
    </div>
  );
}

export default AwardedTenderPreviewDialog;
