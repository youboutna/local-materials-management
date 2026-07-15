/**
 * BoqWorkspace — composant mutualisé de gestion BOQ pour 3 contextes existants :
 *  - Projet DQE prévisionnel      (source='dqe' | 'quantity_takeoff', mode='planning')
 *  - Portail fournisseur / Devis  (source='tender_estimate',           mode='bid')
 *  - Portail fournisseur / Factures (source='supplier_bid',            mode='invoice')
 *
 * Fournit un document métier unique, sans ouvrir de nouvelle page/onglet :
 *   • Saisie manuelle inline dans la grille (batch local)
 *   • Import multi-format PDF/Excel/CSV via BoqImportDialog (parseur unifié)
 *   • Édition / suppression inline via BoqLineTable (updateLine / deleteLine)
 *   • Récap fiscal HT / TVA / RAS / TTC via BoqCalculatorService
 *   • Alignement planification via TenderToPlanningService (mode planning/bid)
 *
 * N'accède jamais à supabase.from() directement. Toute écriture passe par
 * useBoqDocument (hexagonal).
 */
import React, { useMemo, useState, useEffect } from 'react';
import { FileSpreadsheet, Plus, ArrowRightCircle, Loader2, FileCheck2, Calculator, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { BoqLineTable } from './BoqLineTable';
import { BoqImportDialog } from './BoqImportDialog';
import { WbsSelector, type WbsValue } from './WbsSelector';

import { useBoqDocument } from '@/hooks/hexagonal/useBoqDocument';
import { BoqCalculatorService } from '@/application/services/boq/BoqCalculatorService';
import { MeterService } from '@/application/services/boq/MeterService';
import { loadProjectWbs } from '@/application/services/boq/ProjectWbsLoader';
import { tenderToPlanningService } from '@/application/services/tender/TenderToPlanningService';
import { useMaterialsHex } from '@/hooks/hexagonal/useMaterialsHex';
import { BOQ_FISCAL_PROFILES, getFiscalProfile } from '@/config/referentials/boq/default-values.referential';
import { ELEMENT_TYPES, getElementType, type ElementTypeCode } from '@/config/referentials/boq/element-types.referential';
import type { WbsPhase } from '@/config/referentials/wbs/wbs.referential';
import type { BoqSource, BoqResourceType } from '@/domain/boq/BoqLine';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type { ReferentialType } from '@/config/referentials';

type ManualCategory = 'material' | 'labour' | 'equipment' | 'overhead';
const catToResource = (c: ManualCategory): BoqResourceType =>
  c === 'labour' ? 'labor' : c === 'equipment' ? 'equipment' : 'material';
const UNITS = ['u', 'ml', 'm2', 'm3', 'kg', 'h', 'j', 'ff', 'ens', 'lot'];
const LABOUR_TIME_UNITS = new Set(['h', 'j', 'hj', 'homme/jour']);


export type BoqWorkspaceMode = 'planning' | 'bid' | 'invoice';

interface Props {
  source: BoqSource;
  contextId: string;
  projectId?: string;
  mode: BoqWorkspaceMode;
  referentialCode?: ReferentialType;
  /** cible d'alignement planification (mode bid uniquement) */
  estimateId?: string;
  emptyLabel?: string;
  importLabel?: string;
  /** conservé pour compatibilité des contextes qui fournissent un destinataire */
  defaultEmail?: string;
}

const LABELS: Record<BoqWorkspaceMode, { import: string; empty: string; docPrefix: string }> = {
  planning: { import: 'Importer un DQE',      empty: 'Document vide — ajoutez une ligne, importez un DQE ou utilisez le métré.',    docPrefix: 'dqe' },
  bid:      { import: 'Importer un chiffrage', empty: 'Document vide — ajoutez ou importez les lignes du devis.',                   docPrefix: 'devis' },
  invoice:  { import: 'Analyser une facture',  empty: 'Document vide — importez la facture ou saisissez ses lignes contrôlées.',    docPrefix: 'facture' },
};

export function BoqWorkspace({
  source, contextId, projectId, mode,
  referentialCode, estimateId,
  emptyLabel, importLabel,
}: Props) {
  const doc = useBoqDocument({ source, contextId, projectId });
  const { toast } = useToast();
  const labels = LABELS[mode];

  // ---- Saisie manuelle inline (alignée sur TenderEstimatorForm) --------------
  const [openManual, setOpenManual] = useState(false);
  const { materials } = useMaterialsHex();
  const [fiscalCode, setFiscalCode] = useState<string>('MR_STANDARD');
  const [overheadPct, setOverheadPct] = useState<number>(0);
  const [category, setCategory] = useState<ManualCategory>('material');
  const [materialId, setMaterialId] = useState<string>('');
  const [depotId, setDepotId] = useState<string>('');
  const [elementType, setElementType] = useState<ElementTypeCode>('generic');
  const [wbs, setWbs] = useState<WbsValue>({ phaseId: null, milestoneId: null, taskId: null });
  const [wbsDefault, setWbsDefault] = useState<WbsValue>({ phaseId: null, milestoneId: null, taskId: null });
  const [projectPhases, setProjectPhases] = useState<WbsPhase[]>([]);
  const [form, setForm] = useState<Partial<BoqLineDTO> & { length?: number; width?: number; height?: number }>({
    designation: '', unit: 'u', quantity: 1, unitPrice: 0,
  });

  const [finalizing, setFinalizing] = useState(false);

  // Load real project WBS (phases → milestones → tasks) — dynamic, per project
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!projectId) { setProjectPhases([]); return; }
      const phases = await loadProjectWbs(projectId);
      if (!cancelled) setProjectPhases(phases);
    })();
    return () => { cancelled = true; };
  }, [projectId]);

  // Groupe les articles par dépôt (utilise material.warehouse / depot / location si dispo)
  const depots = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();
    for (const m of materials) {
      const mm = m as unknown as { warehouseId?: string; warehouseName?: string; depot?: string; location?: string };
      const id = mm.warehouseId || mm.depot || mm.location || 'default';
      const label = mm.warehouseName || mm.depot || mm.location || 'Dépôt principal';
      if (!map.has(id)) map.set(id, { id, label });
    }
    return Array.from(map.values());
  }, [materials]);
  const filteredMaterials = useMemo(() => {
    if (!depotId) return materials;
    return materials.filter((m) => {
      const mm = m as unknown as { warehouseId?: string; depot?: string; location?: string };
      return (mm.warehouseId || mm.depot || mm.location || 'default') === depotId;
    });
  }, [materials, depotId]);

  const resetForm = () => {
    setForm({ designation: '', unit: 'u', quantity: 1, unitPrice: 0 });
    setMaterialId(''); setCategory('material'); setElementType('generic');
    // Réapplique le WBS par défaut (fallback contexte de saisie)
    setWbs({ ...wbsDefault });
  };

  const onPickMaterial = (id: string) => {
    setMaterialId(id);
    const m = materials.find((x) => x.id === id);
    if (m) {
      setForm((f) => ({
        ...f,
        designation: m.name,
        unit: m.unit || f.unit || 'u',
        unitPrice: m.pricePerUnit ?? f.unitPrice ?? 0,
      }));
    }
  };

  // RH rule: main-d'œuvre + unité temps (h/j) → arithmétique simple, PAS de métré volumique
  const isLabourTime = category === 'labour' && LABOUR_TIME_UNITS.has(String(form.unit ?? '').toLowerCase());
  const elDef = getElementType(elementType);
  const useAdvanced = !isLabourTime && elementType !== 'generic' && !!elDef;

  // Dynamic quantity — recomputed from L/W/H + element type (or user-entered on generic/RH)
  const computedQuantity = useMemo(() => {
    if (!useAdvanced) return Number(form.quantity) || 0;
    const r = MeterService.compute({
      source, contextId,
      designation: form.designation ?? '',
      elementType,
      unit: form.unit || 'u',
      length: form.length ?? null,
      width: form.width ?? null,
      height: form.height ?? null,
      quantity: 0,
      unitPrice: form.unitPrice ?? 0,
    });
    return r.quantity;
  }, [useAdvanced, elementType, form.length, form.width, form.height, form.quantity, form.unit, form.designation, form.unitPrice, source, contextId]);

  const manualPreview = useMemo(() => {
    const pu = Number(form.unitPrice) || 0;
    const htBase = computedQuantity * pu;
    const ht = htBase * (1 + (Number(overheadPct) || 0) / 100);
    const profile = getFiscalProfile(fiscalCode);
    const tva = ht * profile.vatRate;
    return { ht, tva, ttc: ht + tva, ras: ht * profile.withholdingRate, qty: computedQuantity };
  }, [computedQuantity, form.unitPrice, fiscalCode, overheadPct]);

  // ---- Tampon local (batch) : « Ajouter » n'écrit PAS en DB.
  //      La persistance atomique se fait via « Enregistrer le DQE » (bulkCreate).
  const [pendingLines, setPendingLines] = useState<BoqLineDTO[]>([]);

  const handleCreate = () => {
    if (!form.designation?.trim()) {
      toast({ title: 'Désignation requise', variant: 'destructive' });
      return;
    }
    const profile = getFiscalProfile(fiscalCode);
    const overheadNote = (Number(overheadPct) || 0) > 0 ? `Frais généraux ${overheadPct}%` : null;
    const effectivePu = (Number(form.unitPrice) || 0) * (1 + (Number(overheadPct) || 0) / 100);
    const effectiveWbs: WbsValue = {
      phaseId: wbs.phaseId ?? wbsDefault.phaseId ?? null,
      milestoneId: wbs.milestoneId ?? wbsDefault.milestoneId ?? null,
      taskId: wbs.taskId ?? wbsDefault.taskId ?? null,
    };
    const draft: BoqLineDTO = {
      source, contextId,
      designation: form.designation!,
      elementType: useAdvanced ? elementType : null,
      unit: form.unit || 'u',
      length: useAdvanced ? (form.length ?? null) : null,
      width: useAdvanced ? (form.width ?? null) : null,
      height: useAdvanced ? (form.height ?? null) : null,
      quantity: computedQuantity,
      unitPrice: effectivePu,
      totalHt: computedQuantity * effectivePu,
      resourceType: catToResource(category),
      materialId: materialId || null,
      phaseId: effectiveWbs.phaseId,
      milestoneId: effectiveWbs.milestoneId,
      taskId: effectiveWbs.taskId,
      vatRate: profile.vatRate,
      note: [category === 'overhead' ? 'Frais généraux' : null, overheadNote].filter(Boolean).join(' • ') || null,
      sourceType: useAdvanced ? 'avance' : 'rapide',
      status: 'draft',
    };
    setPendingLines((prev) => [...prev, draft]);
    resetForm();
    setOpenManual(false);
    toast({ title: 'Ligne ajoutée au brouillon', description: 'Cliquez « Enregistrer le DQE » pour persister.' });
  };

  const persistPending = async (silent = false): Promise<boolean> => {
    if (pendingLines.length === 0) return true;
    setFinalizing(true);
    try {
      await doc.bulkCreate(pendingLines);
      if (!silent) toast({ title: `${pendingLines.length} ligne(s) enregistrée(s)` });
      setPendingLines([]);
      return true;
    } catch (e) {
      toast({
        title: 'Enregistrement échoué',
        description: String(e instanceof Error ? e.message : e),
        variant: 'destructive',
      });
      return false;
    } finally { setFinalizing(false); }
  };

  const draftLineIds = useMemo(
    () => doc.lines.filter((l) => l.status === 'draft' && l.id).map((l) => l.id!),
    [doc.lines]
  );

  const finalizeDraftLines = async (silent = false): Promise<boolean> => {
    // 1) persiste d'abord le tampon local
    const persisted = await persistPending(true);
    if (!persisted) return false;
    // 2) puis passe tous les brouillons DB en submitted
    if (draftLineIds.length === 0) {
    if (!silent) toast({ title: `${labels.docPrefix.toUpperCase()} enregistré` });
      return true;
    }
    try {
      await doc.updateStatus(draftLineIds, 'submitted', source);
      if (!silent) toast({ title: `${draftLineIds.length} ligne(s) finalisée(s)` });
      return true;
    } catch (e) {
      toast({
        title: 'Finalisation échouée',
        description: String(e instanceof Error ? e.message : e),
        variant: 'destructive',
      });
      return false;
    }
  };

  // ---- Édition inline (persistée) + tampon (local) ---------------------------
  const displayedLines = useMemo<BoqLineDTO[]>(
    () => [...doc.lines, ...pendingLines],
    [doc.lines, pendingLines],
  );
  const persistedCount = doc.lines.length;

  const handlePatch = async (index: number, patch: Partial<BoqLineDTO>) => {
    if (index >= persistedCount) {
      setPendingLines((prev) => prev.map((l, i) => (i === index - persistedCount ? { ...l, ...patch } : l)));
      return;
    }
    const line = doc.lines[index];
    if (!line?.id) return;
    try { await doc.updateLine(line.id, patch); } catch (e) {
      toast({ title: 'Échec mise à jour', description: String(e instanceof Error ? e.message : e), variant: 'destructive' });
    }
  };
  const handleRemove = async (index: number) => {
    if (index >= persistedCount) {
      setPendingLines((prev) => prev.filter((_, i) => i !== index - persistedCount));
      return;
    }
    const line = doc.lines[index];
    if (!line?.id) return;
    try { await doc.deleteLine(line.id, source); } catch (e) {
      toast({ title: 'Échec suppression', variant: 'destructive' });
    }
  };

  // ---- Récap fiscal (inclut brouillons) --------------------------------------
  const totals = useMemo(() => BoqCalculatorService.aggregate(displayedLines), [displayedLines]);

  // ---- Alignement planification (mode bid → project planning) ----------------
  const [aligning, setAligning] = useState(false);
  const handleAlignPlanning = async () => {
    if (!projectId || !estimateId) {
      toast({ title: 'Contexte incomplet', description: 'projectId + estimateId requis', variant: 'destructive' });
      return;
    }
    setAligning(true);
    try {
      const res = await tenderToPlanningService.convert({ estimateId, projectId });
      toast({ title: 'Aligné à la planification', description: `${res.linesCopied} lignes → ${res.distinctPhases.length} phases` });
      window.dispatchEvent(new CustomEvent('boq-kpi-refresh'));
    } catch (e) {
      toast({ title: 'Échec alignement', description: String(e instanceof Error ? e.message : e), variant: 'destructive' });
    } finally { setAligning(false); }
  };

  // ---- Ajout inline d'une ligne vide (édition dans le tableau) ---------------
  const addEmptyRow = () => {
    const profile = getFiscalProfile(fiscalCode);
    setPendingLines((prev) => [...prev, {
      source, contextId,
      designation: '',
      unit: 'u',
      length: null, width: null, height: null,
      quantity: 0,
      unitPrice: 0,
      totalHt: 0,
      vatRate: profile.vatRate,
      resourceType: 'material',
      phaseId: wbsDefault.phaseId ?? null,
      milestoneId: wbsDefault.milestoneId ?? null,
      taskId: wbsDefault.taskId ?? null,
      sourceType: 'rapide',
      status: 'draft',
    }]);
  };

  // ---- Render ---------------------------------------------------------------
  const docRef = contextId.slice(0, 8).toUpperCase();
  const pendingCount = pendingLines.length + draftLineIds.length;
  const docStatus = pendingCount > 0 ? 'À enregistrer' : (doc.lines.length > 0 ? 'Document validé' : 'Nouveau document');
  const isDocumentEmpty = displayedLines.length === 0;
  return (
    <div className="space-y-4">
      <section className="space-y-0">
        <div className="grid gap-4 border-b p-4 lg:grid-cols-[minmax(220px,0.8fr)_minmax(320px,1.2fr)_minmax(220px,0.8fr)_auto] lg:items-end">
          <div className="space-y-2">
            <div className="text-xs font-medium uppercase text-muted-foreground">Document</div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-semibold">{labels.docPrefix.toUpperCase()} · {docRef}</span>
              <Badge variant={pendingCount > 0 ? 'secondary' : doc.lines.length > 0 ? 'default' : 'outline'}>{docStatus}</Badge>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Classification par défaut</Label>
            <WbsSelector value={wbsDefault} onChange={setWbsDefault} phases={projectPhases.length > 0 ? projectPhases : undefined} referentialCode={referentialCode} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Profil fiscal</Label>
            <Select value={fiscalCode} onValueChange={setFiscalCode}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.values(BOQ_FISCAL_PROFILES).map((p) => (
                  <SelectItem key={p.code} value={p.code}>{p.label} (TVA {(p.vatRate * 100).toFixed(0)}%)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex lg:justify-end">
            <Button onClick={() => finalizeDraftLines(false)} disabled={pendingCount === 0 || finalizing || doc.isPending}>
              {finalizing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileCheck2 className="h-4 w-4 mr-2" />}
              Enregistrer le {labels.docPrefix.toUpperCase()}{pendingCount > 0 ? ` (${pendingCount})` : ''}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={addEmptyRow}><Plus className="h-4 w-4 mr-1" />Ajouter une ligne</Button>


          <Dialog open={openManual} onOpenChange={setOpenManual}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Calculator className="h-4 w-4 mr-1" />Calcul métré</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Calcul métré — ajouter au document</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-6 gap-3">
                <div className="col-span-3">
                  <Label>Catégorie</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as ManualCategory)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="material">Matériau</SelectItem>
                      <SelectItem value="labour">Main-d'œuvre</SelectItem>
                      <SelectItem value="equipment">Équipement</SelectItem>
                      <SelectItem value="overhead">Frais généraux</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Label>Profil fiscal</Label>
                  <Select value={fiscalCode} onValueChange={setFiscalCode}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.values(BOQ_FISCAL_PROFILES).map((p) => (
                        <SelectItem key={p.code} value={p.code}>
                          {p.label} (TVA {(p.vatRate * 100).toFixed(0)}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {category === 'material' && materials.length > 0 && (
                  <>
                    {depots.length > 1 && (
                      <div className="col-span-3">
                        <Label>Dépôt</Label>
                        <Select value={depotId || '__all__'} onValueChange={(v) => { setDepotId(v === '__all__' ? '' : v); setMaterialId(''); }}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent className="max-h-64">
                            <SelectItem value="__all__">— Tous les dépôts —</SelectItem>
                            {depots.map((d) => <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className={depots.length > 1 ? 'col-span-3' : 'col-span-6'}>
                      <Label>Article {depotId ? '(dépôt filtré)' : '(du dépôt, optionnel)'}</Label>
                      <Select value={materialId || '__none__'} onValueChange={(v) => (v === '__none__' ? setMaterialId('') : onPickMaterial(v))}>
                        <SelectTrigger><SelectValue placeholder="Sélectionner un article — auto-remplit désignation, unité, PU" /></SelectTrigger>
                        <SelectContent className="max-h-64">
                          <SelectItem value="__none__">— Saisie libre —</SelectItem>
                          {filteredMaterials.slice(0, 200).map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name}{m.unit ? ` · ${m.unit}` : ''}{m.pricePerUnit ? ` · ${m.pricePerUnit} MRU` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div className="col-span-6">
                  <Label>Désignation</Label>
                  <Input value={form.designation ?? ''} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
                </div>

                {/* Classification WBS projet (Phase → Jalon → Tâche) — dynamique */}
                <div className="col-span-6">
                  <Label className="text-xs text-muted-foreground">
                    Classification WBS {projectPhases.length > 0 ? '(phases du projet)' : '(référentiel)'}
                  </Label>
                  <WbsSelector
                    value={wbs}
                    onChange={setWbs}
                    phases={projectPhases.length > 0 ? projectPhases : undefined}
                    referentialCode={referentialCode}
                  />
                </div>

                {/* Type d'élément — pilote le moteur de métré dynamique (inline, pas de modal) */}
                {!isLabourTime && (
                  <div className="col-span-3">
                    <Label>Type d'ouvrage (métré)</Label>
                    <Select value={elementType} onValueChange={(v) => setElementType(v as ElementTypeCode)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="generic">— Saisie directe —</SelectItem>
                        {ELEMENT_TYPES.map((e) => (
                          <SelectItem key={e.code} value={e.code}>{e.label} ({e.defaultUnit})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {isLabourTime && (
                  <div className="col-span-3 text-xs text-muted-foreground self-end pb-2">
                    Main-d'œuvre au temps → quantité saisie directement (pas de métré volumique).
                  </div>
                )}

                <div className="col-span-1">
                  <Label>Unité</Label>
                  <Select value={form.unit ?? 'u'} onValueChange={(v) => setForm({ ...form, unit: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>{useAdvanced ? 'Quantité (calculée)' : 'Quantité'}</Label>
                  <Input
                    type="number"
                    value={useAdvanced ? computedQuantity.toFixed(2) : (form.quantity ?? 0)}
                    onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                    readOnly={useAdvanced}
                    className={useAdvanced ? 'bg-muted' : ''}
                  />
                </div>

                {/* Dimensions L/W/H — visibles selon le référentiel element-types */}
                {useAdvanced && elDef && (
                  <>
                    {elDef.dimensions.length && (
                      <div className="col-span-2">
                        <Label>Longueur (m)</Label>
                        <Input type="number" value={form.length ?? ''} onChange={(e) => setForm({ ...form, length: Number(e.target.value) })} />
                      </div>
                    )}
                    {elDef.dimensions.width && (
                      <div className="col-span-2">
                        <Label>Largeur (m)</Label>
                        <Input type="number" value={form.width ?? ''} onChange={(e) => setForm({ ...form, width: Number(e.target.value) })} />
                      </div>
                    )}
                    {elDef.dimensions.height && (
                      <div className="col-span-2">
                        <Label>Hauteur (m)</Label>
                        <Input type="number" value={form.height ?? ''} onChange={(e) => setForm({ ...form, height: Number(e.target.value) })} />
                      </div>
                    )}
                  </>
                )}

                <div className="col-span-1">
                  <Label>PU (MRU)</Label>
                  <Input type="number" value={form.unitPrice ?? 0} onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })} />
                </div>
                <div className="col-span-2">
                  <Label>Frais généraux (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    value={overheadPct}
                    onChange={(e) => setOverheadPct(Number(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="mt-3 rounded-md border bg-muted/30 p-3 text-sm grid grid-cols-5 gap-2">
                <div>Qté : <span className="font-semibold">{manualPreview.qty.toFixed(2)}</span></div>
                <div>HT : <span className="font-semibold">{manualPreview.ht.toLocaleString('fr-FR')}</span></div>
                <div>TVA : <span className="font-semibold">{manualPreview.tva.toLocaleString('fr-FR')}</span></div>
                <div>RAS : <span className="font-semibold">{manualPreview.ras.toLocaleString('fr-FR')}</span></div>
                <div>TTC : <span className="font-bold text-primary">{manualPreview.ttc.toLocaleString('fr-FR')}</span></div>
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpenManual(false)}>Annuler</Button>
                <Button onClick={handleCreate} disabled={doc.isPending}>
                  {doc.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}Ajouter
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <BoqImportDialog
            source={source}
            contextId={contextId}
            projectId={projectId}
            defaultReferentialCode={referentialCode}
            title={importLabel ?? labels.import}
            trigger={
              <Button size="sm" variant="outline">
                <FileSpreadsheet className="h-4 w-4 mr-1" />{importLabel ?? labels.import}
              </Button>
            }
            onImported={() => doc.refetch()}
          />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isDocumentEmpty ? null : (
              <Button size="sm" variant="ghost" onClick={() => setPendingLines([])} disabled={pendingLines.length === 0}>
                <Trash2 className="h-4 w-4 mr-1" />Vider brouillon
              </Button>
            )}
          {mode === 'bid' && projectId && estimateId && (
            <Button size="sm" onClick={handleAlignPlanning} disabled={aligning}>
              {aligning ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ArrowRightCircle className="h-4 w-4 mr-1" />}
              Aligner à la planification
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-b bg-muted/20 p-4 text-sm md:grid-cols-4">
        <div><div className="text-muted-foreground">Total HT</div><div className="font-medium">{totals.totalHt.toLocaleString('fr-FR')} MRU</div></div>
        <div><div className="text-muted-foreground">TVA</div><div className="font-medium">{totals.totalTva.toLocaleString('fr-FR')} MRU</div></div>
        {'totalRas' in totals && (totals as { totalRas?: number }).totalRas ? (
          <div><div className="text-muted-foreground">RAS</div><div className="font-medium">{(totals as { totalRas: number }).totalRas.toLocaleString('fr-FR')} MRU</div></div>
        ) : <div />}
        <div><div className="text-muted-foreground">Total TTC</div><div className="font-semibold">{totals.totalTtc.toLocaleString('fr-FR')} MRU</div></div>
      </div>

      <div className="p-4">
      {doc.isLoading ? (
        <div className="text-sm text-muted-foreground">Chargement…</div>
      ) : (
        <BoqLineTable
          lines={displayedLines}
          emptyLabel={emptyLabel ?? labels.empty}
          editable
          referentialCode={referentialCode}
          phases={projectPhases.length > 0 ? projectPhases : undefined}
          onChange={handlePatch}
          onRemove={handleRemove}
        />
      )}
      </div>
      </section>
    </div>
  );
}
