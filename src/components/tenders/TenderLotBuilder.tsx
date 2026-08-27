/**
 * TenderLotBuilder - Create tender lots aligned with project phases
 * MIGRATED TO HEXAGONAL ARCHITECTURE
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Package,
  Plus,
  Trash2,
  Link2,
  DollarSign,
  Layers,
  CheckCircle,
  AlertTriangle,
  GripVertical,
  Lock,
  FileText,
  Loader2

} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useProjectPhasesForLots } from '@/hooks/hexagonal';
import { useLotPhaseBudgets } from '@/hooks/hexagonal/useLotPhaseBudgets';
import { LotPhaseBudgetService } from '@/application/services/tender/LotPhaseBudgetService';

import {
  useTenderLots,
  useCreateTenderLot,
  useUpdateTenderLot,
  useDeleteTenderLot,
} from '@/hooks/hexagonal/useTenderLotsHex';
import TenderLotDocumentsManager from './TenderLotDocumentsManager';
import { useTenderLotDocuments } from '@/hooks/hexagonal/useTenderLotDocumentsHex';
import TenderLotWorkflowBar, { TenderLotStatusBadge } from './TenderLotWorkflowBar';
import type { TenderLotStatus } from '@/dtos/transforms/TenderLotTransformer';
import { T } from '@/components/i18n/T';

interface Phase {
  id: string;
  name: string;
  description?: string;
  budget?: number;
  steps?: Step[];
}

interface Step {
  id: string;
  name: string;
  order: number;
}

interface TenderLot {
  id: string;
  number: number;
  title: string;
  description?: string;
  estimatedAmount?: number;
  linkedPhaseIds: string[];
  linkedStepIds: string[];
  requirements?: string[];
  deliverables?: string[];
  status?: TenderLotStatus;
  awardedTo?: string | null;
  awardedAmount?: number | null;
}


interface TenderLotBuilderProps {
  tenderId: string;
  projectId?: string;
  lots?: TenderLot[];
  onChange?: (lots: TenderLot[]) => void;
  readOnly?: boolean;
  /** Statut de l'AO parent (synchronisation des statuts de lot). */
  tenderStatus?: string;
}

const TenderLotBuilder: React.FC<TenderLotBuilderProps> = ({
  tenderId,
  projectId,
  lots: externalLots,
  onChange,
  readOnly = false,
  tenderStatus
}) => {
  const isPersistMode = !externalLots && !onChange && !!tenderId;

  const { data: persistedLots, isLoading: isLoadingLots } = useTenderLots(
    isPersistMode ? tenderId : ''
  );
  const createLot = useCreateTenderLot(tenderId);
  const updateLotMut = useUpdateTenderLot(tenderId);
  const deleteLotMut = useDeleteTenderLot(tenderId);

  const [internalLots, setInternalLots] = useState<TenderLot[]>([]);
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, Partial<TenderLot>>>({});

  const baseLots: TenderLot[] = isPersistMode
    ? (persistedLots ?? []).map((l) => ({
        id: l.id,
        number: l.number,
        title: l.title,
        description: l.description ?? undefined,
        estimatedAmount: l.estimatedAmount ?? undefined,
        linkedPhaseIds: l.linkedPhaseIds,
        linkedStepIds: l.linkedStepIds,
        requirements: l.requirements,
        deliverables: l.deliverables,
        status: l.status,
        awardedTo: l.awardedTo,
        awardedAmount: l.awardedAmount,
      }))

    : (externalLots ?? internalLots);

  const lots: TenderLot[] = isPersistMode
    ? baseLots.map((l) => (pendingUpdates[l.id] ? { ...l, ...pendingUpdates[l.id] } : l))
    : baseLots;

  const handleLotsChange = (newLots: TenderLot[]) => {
    if (onChange) onChange(newLots);
    else if (!isPersistMode) setInternalLots(newLots);
  };

  const [expandedLot, setExpandedLot] = useState<string | null>(null);

  // Use hexagonal hook instead of direct Supabase call
  const { data: phasesData, isLoading } = useProjectPhasesForLots(projectId);
  const phases: Phase[] = phasesData || [];

  // Montants DQE par phase → montant estimé des lots calculé automatiquement.
  const { budgets, hasDqe } = useLotPhaseBudgets(projectId);


  const addLot = () => {
    const nextNumber = lots.length + 1;
    if (isPersistMode) {
      createLot.mutate({
        tenderId,
        projectId: projectId ?? null,
        number: nextNumber,
        title: `Lot ${nextNumber}`,
        description: null,
        estimatedAmount: null,
        linkedPhaseIds: [],
        linkedStepIds: [],
        requirements: [],
        deliverables: [],
        status: 'draft',

      });
      return;
    }
    const newLot: TenderLot = {
      id: `lot-${Date.now()}`,
      number: nextNumber,
      title: `Lot ${nextNumber}`,
      linkedPhaseIds: [],
      linkedStepIds: [],
      requirements: [],
      deliverables: [],
    };
    handleLotsChange([...lots, newLot]);
    setExpandedLot(newLot.id);
  };

  // Debounced persistence per lot to avoid one mutation per keystroke.
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // pendingUpdates state declared above (before lots computation).

  useEffect(() => () => {
    Object.values(saveTimers.current).forEach(clearTimeout);
  }, []);

  const schedulePersist = useCallback(
    (lotId: string, merged: TenderLot) => {
      if (saveTimers.current[lotId]) clearTimeout(saveTimers.current[lotId]);
      saveTimers.current[lotId] = setTimeout(() => {
        updateLotMut.mutate({
          id: lotId,
          lot: {
            tenderId,
            projectId: projectId ?? null,
            number: merged.number,
            title: merged.title,
            description: merged.description ?? null,
            estimatedAmount: merged.estimatedAmount ?? null,
            linkedPhaseIds: merged.linkedPhaseIds,
            linkedStepIds: merged.linkedStepIds,
            requirements: merged.requirements ?? [],
            deliverables: merged.deliverables ?? [],
          },
        });
        setPendingUpdates((p) => {
          const n = { ...p };
          delete n[lotId];
          return n;
        });
      }, 600);
    },
    [tenderId, projectId, updateLotMut]
  );

  const updateLot = (lotId: string, updates: Partial<TenderLot>) => {
    if (isPersistMode) {
      const base = lots.find((l) => l.id === lotId);
      if (!base) return;
      const merged = { ...base, ...pendingUpdates[lotId], ...updates };
      setPendingUpdates((p) => ({ ...p, [lotId]: { ...p[lotId], ...updates } }));
      schedulePersist(lotId, merged);
      return;
    }
    handleLotsChange(lots.map(lot => lot.id === lotId ? { ...lot, ...updates } : lot));
  };

  const removeLot = (lotId: string) => {
    if (isPersistMode) {
      deleteLotMut.mutate(lotId);
      return;
    }
    handleLotsChange(lots.filter(lot => lot.id !== lotId));
  };

  /**
   * Montant estimé dérivé : priorité aux lignes DQE rattachées aux phases,
   * repli sur le budget de phase quand aucun DQE n'existe encore.
   */
  const computeAmountForPhases = (phaseIds: string[]): number => {
    if (hasDqe) return LotPhaseBudgetService.computeLotAmount(budgets, phaseIds);
    return phases
      .filter((p) => phaseIds.includes(p.id))
      .reduce((sum, p) => sum + (p.budget || 0), 0);
  };

  const togglePhaseLink = (lotId: string, phaseId: string) => {
    const lot = lots.find(l => l.id === lotId);
    if (!lot) return;

    const newPhaseIds = lot.linkedPhaseIds.includes(phaseId)
      ? lot.linkedPhaseIds.filter(id => id !== phaseId)
      : [...lot.linkedPhaseIds, phaseId];

    // Le montant estimé suit automatiquement les phases liées (jamais saisi à la main).
    updateLot(lotId, { linkedPhaseIds: newPhaseIds, estimatedAmount: computeAmountForPhases(newPhaseIds) });
  };

  const toggleStepLink = (lotId: string, stepId: string) => {
    const lot = lots.find(l => l.id === lotId);
    if (!lot) return;

    const newStepIds = lot.linkedStepIds.includes(stepId)
      ? lot.linkedStepIds.filter(id => id !== stepId)
      : [...lot.linkedStepIds, stepId];

    updateLot(lotId, { linkedStepIds: newStepIds });
  };

  const calculateEstimatedFromPhases = (lotId: string) => {
    const lot = lots.find(l => l.id === lotId);
    if (!lot) return;
    updateLot(lotId, { estimatedAmount: computeAmountForPhases(lot.linkedPhaseIds) });
  };

  // Hydratation automatique : dès que les montants DQE sont chargés, les lots liés
  // à des phases sont recalculés (anti-corruption : pas de valeur manuelle résiduelle).
  useEffect(() => {
    if (!hasDqe || readOnly) return;
    for (const lot of lots) {
      if (!lot.linkedPhaseIds.length) continue;
      const derived = LotPhaseBudgetService.computeLotAmount(budgets, lot.linkedPhaseIds);
      if (derived > 0 && Math.abs((lot.estimatedAmount || 0) - derived) > 0.01) {
        updateLot(lot.id, { estimatedAmount: derived });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasDqe, budgets, readOnly]);


  const getLinkedPhasesCount = (lot: TenderLot) => {
    return lot.linkedPhaseIds.length;
  };

  const { data: lotDocuments } = useTenderLotDocuments(tenderId);
  const countLotDocuments = (lotId: string) =>
    (lotDocuments ?? []).filter((d: any) => (d.lotIds ?? d.lot_ids ?? []).includes(lotId)).length;

  const totalEstimated = lots.reduce((sum, lot) => sum + (lot.estimatedAmount || 0), 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5 text-primary" />
            <T k="auto.tenderlotbuilder.lots_de_l_appel_d_offres" fallback="Lots de l'Appel d'Offres" />
          </CardTitle>
          {!readOnly && (
            <Button onClick={addLot} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              <T k="auto.tenderlotbuilder.ajouter_un_lot" fallback="Ajouter un lot" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium">{lots.length} lot(s)</span>
            {projectId && (
              <Badge variant="outline" className="gap-1">
                <Link2 className="h-3 w-3" />
                <T k="auto.tenderlotbuilder.projet_lie" fallback="Projet lié" />
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">
              {(totalEstimated / 1000000).toFixed(2)}M MRU
            </span>
          </div>
        </div>

        {/* Documents communs à tous les lots */}
        {isPersistMode && (
          <div className="p-3 border rounded-lg bg-muted/10">
            <TenderLotDocumentsManager
              tenderId={tenderId}
              lotId={null}
              scopeLabel="Communs à tous les lots"
              availableLots={lots.map((l) => ({ id: l.id, number: l.number, title: l.title }))}
              readOnly={readOnly}
            />

          </div>
        )}

        {/* Lots */}
        {lots.length > 0 ? (
          <Accordion
            type="single"
            collapsible
            value={expandedLot || undefined}
            onValueChange={(val) => setExpandedLot(val)}
          >
            {lots.map((lot) => (
              <AccordionItem
                key={lot.id}
                value={lot.id}
                className="border rounded-lg mb-2 overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 [&[data-state=open]]:bg-muted/30">
                  <div className="flex items-center gap-3 flex-1">
                    {!readOnly && (
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    )}
                    <Badge className="bg-primary">Lot {lot.number}</Badge>
                    <span className="font-medium">{lot.title}</span>
                    <div className="flex items-center gap-2 ml-auto mr-4">
                      <TenderLotStatusBadge status={lot.status} tenderStatus={tenderStatus} />
                      {getLinkedPhasesCount(lot) > 0 && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Layers className="h-3 w-3" />
                          {getLinkedPhasesCount(lot)} phase(s)
                        </Badge>
                      )}
                      {lot.estimatedAmount && (
                        <Badge variant="secondary" className="text-xs">
                          {(lot.estimatedAmount / 1000000).toFixed(2)}M
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs gap-1">
                        <FileText className="h-3 w-3" />
                        {countLotDocuments(lot.id)} doc(s)
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent>
                  <div className="px-4 pb-4 space-y-4">
                    {isPersistMode && (
                      <TenderLotWorkflowBar tenderId={tenderId} lot={lot as any} readOnly={readOnly} tenderStatus={tenderStatus} />
                    )}
                    {/* Basic Info */}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label><T k="auto.tenderlotbuilder.titre_du_lot" fallback="Titre du lot" /></Label>
                        <Input
                          value={lot.title}
                          onChange={(e) => updateLot(lot.id, { title: e.target.value })}
                          disabled={readOnly}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <T k="auto.tenderlotbuilder.montant_estime_mru" fallback="Montant estimé (MRU)" />
                          {hasDqe && (
                            <Badge variant="outline" className="gap-1 text-[10px]">
                              <Lock className="h-3 w-3" />
                              <T k="auto.tenderlotbuilder.calcul_auto_dqe" fallback="Calcul auto (DQE)" />
                            </Badge>
                          )}
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={lot.estimatedAmount || ''}
                            onChange={(e) => updateLot(lot.id, { estimatedAmount: Number(e.target.value) })}
                            disabled={readOnly || hasDqe}
                            readOnly={hasDqe}
                            placeholder="0"
                          />
                          {projectId && phases.length > 0 && !readOnly && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => calculateEstimatedFromPhases(lot.id)}
                              title="Recalculer à partir des phases liées"
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {hasDqe ? (
                            <>
                              <T k="auto.tenderlotbuilder.derive_lignes_dqe" fallback="Dérivé des lignes DQE des phases liées" />
                              {' · '}
                              {LotPhaseBudgetService.countLotLines(budgets, lot.linkedPhaseIds)}{' '}
                              <T k="auto.tenderlotbuilder.lignes" fallback="ligne(s)" />
                            </>
                          ) : (
                            <T k="auto.tenderlotbuilder.derive_budgets_phases" fallback="Dérivé des budgets des phases liées (aucun DQE)" />
                          )}
                        </p>
                      </div>

                    </div>

                    <div className="space-y-2">
                      <Label><T k="auto.tenderlotbuilder.description" fallback="Description" /></Label>
                      <Textarea
                        value={lot.description || ''}
                        onChange={(e) => updateLot(lot.id, { description: e.target.value })}
                        disabled={readOnly}
                        rows={2}
                      />
                    </div>

                    {/* Phase Linking */}
                    {projectId && phases.length > 0 && (
                      <div className="space-y-3">
                        <Label className="flex items-center gap-2">
                          <Link2 className="h-4 w-4 text-primary" />
                          <T k="auto.tenderlotbuilder.phases_du_projet_liees" fallback="Phases du projet liées" />
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {phases.map(phase => (
                            <div
                              key={phase.id}
                              className={cn(
                                "p-3 rounded-lg border cursor-pointer transition-all",
                                lot.linkedPhaseIds.includes(phase.id)
                                  ? "border-primary bg-primary/5"
                                  : "hover:border-primary/50"
                              )}
                              onClick={() => !readOnly && togglePhaseLink(lot.id, phase.id)}
                            >
                              <div className="flex items-start gap-2">
                                <Checkbox
                                  checked={lot.linkedPhaseIds.includes(phase.id)}
                                  disabled={readOnly}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm">{phase.name}</p>
                                  {budgets?.byPhase[phase.id] && (
                                    <p className="text-xs text-primary">
                                      DQE: {(budgets.byPhase[phase.id].amountHt / 1000000).toFixed(2)}M MRU
                                      {' · '}{budgets.byPhase[phase.id].lineCount} <T k="auto.tenderlotbuilder.lignes" fallback="ligne(s)" />
                                    </p>
                                  )}
                                  {phase.budget && (
                                    <p className="text-xs text-muted-foreground">
                                      Budget: {(phase.budget / 1000000).toFixed(2)}M MRU
                                    </p>
                                  )}

                                  {phase.steps && phase.steps.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      {phase.steps.slice(0, 3).map(step => (
                                        <div
                                          key={step.id}
                                          className="flex items-center gap-2 text-xs"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            !readOnly && toggleStepLink(lot.id, step.id);
                                          }}
                                        >
                                          <Checkbox
                                            checked={lot.linkedStepIds.includes(step.id)}
                                            className="h-3 w-3"
                                            disabled={readOnly}
                                          />
                                          <span className="text-muted-foreground">{step.name}</span>
                                        </div>
                                      ))}
                                      {phase.steps.length > 3 && (
                                        <span className="text-xs text-muted-foreground">
                                          +{phase.steps.length - 3} autres
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Documents attachés à ce lot */}
                    {isPersistMode && (
                      <div className="pt-3 border-t">
                        <TenderLotDocumentsManager
                          tenderId={tenderId}
                          lotId={lot.id}
                          scopeLabel={`Lot ${lot.number}`}
                          availableLots={lots.map((l) => ({ id: l.id, number: l.number, title: l.title }))}
                          readOnly={readOnly}
                        />

                      </div>
                    )}

                    {/* Actions */}
                    {!readOnly && (
                      <div className="flex justify-end pt-2 border-t">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeLot(lot.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          <T k="auto.tenderlotbuilder.supprimer_le_lot" fallback="Supprimer le lot" />
                        </Button>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p><T k="auto.tenderlotbuilder.aucun_lot_defini" fallback="Aucun lot défini" /></p>
            {!readOnly && (
              <Button variant="outline" className="mt-4" onClick={addLot}>
                <Plus className="h-4 w-4 mr-2" />
                <T k="auto.tenderlotbuilder.creer_le_premier_lot" fallback="Créer le premier lot" />
              </Button>
            )}
          </div>
        )}

        {/* Validation */}
        {lots.length > 0 && (
          <div className={cn(
            "p-3 rounded-lg border",
            lots.every(l => l.title && l.estimatedAmount)
              ? "bg-success/10 border-success/30"
              : "bg-amber-500/10 border-amber-500/30"
          )}>
            <div className="flex items-center gap-2 text-sm">
              {lots.every(l => l.title && l.estimatedAmount) ? (
                <>
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-success font-medium"><T k="auto.tenderlotbuilder.tous_les_lots_sont_configures" fallback="Tous les lots sont configurés" /></span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span className="text-warning">
                    {lots.filter(l => !l.title || !l.estimatedAmount).length} lot(s) incomplet(s)
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TenderLotBuilder;
