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
 * N'accède jamais directement aux tables Supabase. Toute écriture passe par
 * useBoqDocument (hexagonal).
 */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowRightCircle, Calculator, FileCheck2, FileSpreadsheet, Loader2, Lock, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { BoqImportDialog } from './BoqImportDialog';
import { BoqLineTable } from './BoqLineTable';
import { FiscalCompliancePanel, type FiscalComplianceValue } from './FiscalCompliancePanel';
import { WbsSelector, applyWbsScope, type WbsValue, type WbsScopeValue } from './WbsSelector';
import { WbsScopeSelector, EMPTY_WBS_SCOPE } from './WbsScopeSelector';
import { MultiSelectCombobox } from '@/components/ui/multi-select-combobox';


import { BoqCalculatorService } from '@/application/services/boq/BoqCalculatorService';
import { MeterService } from '@/application/services/boq/MeterService';
import { loadProjectWbs, isActivePhaseStatus, type ProjectWbsPhase } from '@/application/services/boq/ProjectWbsLoader';
import { tenderToPlanningService } from '@/application/services/TenderToPlanningService';
import type { ReferentialType } from '@/config/referentials';
import { getReferentialOptions, getPhasesForReferential } from '@/config/referentials';

import { BOQ_FISCAL_PROFILES, getFiscalProfile, getFiscalProfileLabel } from '@/config/referentials/boq/default-values.referential';
import { resolveLineTax } from '@/config/referentials/boq/tax-regimes.referential';
import { TaxService } from '@/application/services/TaxService';
import { formatCurrency } from '@/utils/phaseDisplayHelpers';
import { ELEMENT_TYPES, getElementType, type ElementTypeCode } from '@/config/referentials/boq/element-types.referential';
import { DQE_UNIT_CODES } from '@/config/referentials/boq/unit-catalog.referential';
import { getRecommendationItems } from '@/config/referentials/boq/recommendations.referential';
import type { WbsPhase } from '@/config/referentials/wbs/wbs.referential';
import type { BoqResourceType, BoqSource, BoqStatus } from '@/domain/entities/boq/BoqLine';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import { useBoqDocument } from '@/hooks/hexagonal/useBoqDocument';
import { useMaterialsHex } from '@/hooks/hexagonal/useMaterialsHex';
import { useActiveEmployeesHex } from '@/hooks/hexagonal/useActiveEmployeesHex';
import { useActiveSuppliersHex } from '@/hooks/hexagonal/useActiveSuppliersHex';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useOwnerOrganization } from '@/hooks/useOwnerOrganization';

import type { StakeholderOption } from './BoqLineTable';
import { getEnumOptions } from '@/config/referentials/i18n/enum-labels.referential';
import { useI18n } from '@/hooks/useI18n';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { i18nService } from '@/application/services/I18nService';
import { T } from '@/components/i18n/T';

type ManualCategory = 'material' | 'labour' | 'equipment' | 'overhead';
const catToResource = (c: ManualCategory): BoqResourceType =>
  c === 'labour' ? 'labor' : c === 'equipment' ? 'equipment' : 'material';
const UNITS = DQE_UNIT_CODES;
const LABOUR_TIME_UNITS = new Set(['h', 'j', 'hj', 'homme/jour']);


export type BoqWorkspaceMode = 'planning' | 'bid' | 'invoice';

interface Props {
  source: BoqSource;
  contextId: string;
  projectId?: string;
  projectName?: string;
  mode: BoqWorkspaceMode;
  referentialCode?: ReferentialType;
  /** cible d'alignement planification (mode bid uniquement) */
  estimateId?: string;
  emptyLabel?: string;
  importLabel?: string;
  /** conservé pour compatibilité des contextes qui fournissent un destinataire */
  defaultEmail?: string;
  /** Identifiant du document conteneur — plusieurs documents par contexte. */
  documentId?: string;
}

const LABELS: Record<BoqWorkspaceMode, { import: string; empty: string; docPrefix: string }> = {
  planning: { import: 'Importer un DQE',      empty: 'Document vide — ajoutez une ligne, importez un DQE ou utilisez le métré.',    docPrefix: 'dqe' },
  bid:      { import: 'Importer un chiffrage', empty: 'Document vide — ajoutez ou importez les lignes du devis.',                   docPrefix: 'devis' },
  invoice:  { import: 'Analyser une facture',  empty: 'Document vide — importez la facture ou saisissez ses lignes contrôlées.',    docPrefix: 'facture' },
};

export function BoqWorkspace({
  source, contextId, projectId, projectName, mode,
  referentialCode, estimateId,
  emptyLabel, importLabel, documentId,
}: Props) {
  const { translateTerm, t, language: lang } = useI18n();
  const doc = useBoqDocument({ source, contextId, projectId, documentId });
  const { toast } = useToast();
  const labels = LABELS[mode];
  // Référentiel actif — défaut = référentiel du projet courant (prop),
  // modifiable pour enrichir le mapping (phases/étapes/tâches alternatives).
  // Préférences du document persistées (référentiel enrichi + profil fiscal) :
  // la sélection survit à la navigation, le référentiel projet reste le défaut.
  const prefsKey = `boq-prefs:${contextId}`;
  type BoqPrefs = {
    referential?: ReferentialType;
    referentials?: ReferentialType[];
    fiscalCode?: string;
    stakeholderId?: string;
    wbsScope?: WbsScopeValue;
  };
  const readPrefs = (): BoqPrefs => {
    try { return JSON.parse(localStorage.getItem(prefsKey) ?? '{}'); } catch { return {}; }
  };
  const writePrefs = (patch: BoqPrefs) => {
    try { localStorage.setItem(prefsKey, JSON.stringify({ ...readPrefs(), ...patch })); } catch { /* stockage indisponible */ }
  };

  /** Référentiels enrichissant le document (multi-options) — le référentiel projet reste le socle. */
  const [enrichReferentials, setEnrichReferentials] = useState<ReferentialType[]>(() => {
    const p = readPrefs();
    return p.referentials ?? (p.referential ? [p.referential] : []);
  });
  const [activeReferential, setActiveReferential] = useState<ReferentialType | undefined>(
    () => readPrefs().referentials?.[0] ?? readPrefs().referential ?? referentialCode,
  );
  useEffect(() => {
    const p = readPrefs();
    const refs = p.referentials ?? (p.referential ? [p.referential] : []);
    setEnrichReferentials(refs);
    setActiveReferential(refs[0] ?? referentialCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referentialCode, contextId]);
  const referentialOptions = useMemo(() => getReferentialOptions('fr'), []);


  // ---- Saisie manuelle inline (alignée sur TenderEstimatorForm) --------------
  const [openManual, setOpenManual] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const { materials } = useMaterialsHex();
  const [fiscalCode, setFiscalCode] = useState<string>(() => readPrefs().fiscalCode ?? 'MR_STANDARD');
  /** Contrôles LFR 2026 du document (NIF fournisseur, moyen de paiement, facture normalisée). */
  const [compliance, setCompliance] = useState<FiscalComplianceValue>({
    supplierNif: null, supplierNifStatus: 'unknown', paymentMethod: 'virement', hasNormalizedInvoice: false,
  });

  const [overheadPct, setOverheadPct] = useState<number>(0);
  const [category, setCategory] = useState<ManualCategory>('material');
  const [materialId, setMaterialId] = useState<string>('');
  const [depotId, setDepotId] = useState<string>('');
  const [elementType, setElementType] = useState<ElementTypeCode>('generic');
  /** Ouvertures à déduire (référentiel element-types : `deductOpenings`). */
  const [openings, setOpenings] = useState<{ count: number; width: number; height: number }>({ count: 0, width: 0, height: 0 });
  /** Génère une ligne article par recommandation du référentiel. */
  const [autoRecs, setAutoRecs] = useState(false);
  const [wbs, setWbs] = useState<WbsValue>({ phaseId: null, milestoneId: null, taskId: null });
  const [wbsDefault, setWbsDefault] = useState<WbsValue>({ phaseId: null, milestoneId: null, taskId: null });
  const [projectPhases, setProjectPhases] = useState<ProjectWbsPhase[]>([]);
  /** Périmètre WBS du document (multi-options), persisté avec les préférences. */
  const [wbsScope, setWbsScope] = useState<WbsScopeValue>(() => readPrefs().wbsScope ?? EMPTY_WBS_SCOPE);
  useEffect(() => {
    setWbsScope(readPrefs().wbsScope ?? EMPTY_WBS_SCOPE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextId]);
  const updateWbsScope = (next: WbsScopeValue) => { setWbsScope(next); writePrefs({ wbsScope: next }); };


  // Parties prenantes assignables ligne à ligne (organisation / employé / fournisseur).
  const { data: organizations = [] } = useOrganizations();
  const { data: activeEmployees = [] } = useActiveEmployeesHex();
  const { data: activeSuppliers = [] } = useActiveSuppliersHex();
  const stakeholders = useMemo<StakeholderOption[]>(() => [
    ...organizations.map((o) => ({ id: o.id, name: o.name, type: 'organization' as const })),
    ...activeEmployees.map((e) => ({ id: e.id, name: e.full_name, type: 'employee' as const })),
    ...activeSuppliers.map((s) => ({ id: s.id, name: s.name, type: 'supplier' as const })),
  ], [organizations, activeEmployees, activeSuppliers]);
  /** Responsable par défaut (Zone 3) — appliqué aux nouvelles lignes sans partie prenante. */
  const [defaultStakeholderId, setDefaultStakeholderId] = useState<string>(() => readPrefs().stakeholderId ?? '');
  /** Hydratation : à défaut de préférence, le maître d'ouvrage du projet est responsable. */
  const { organization: ownerOrganization } = useOwnerOrganization();
  useEffect(() => {
    if (defaultStakeholderId) return;
    const stored = readPrefs().stakeholderId;
    if (stored) { setDefaultStakeholderId(stored); return; }
    if (ownerOrganization?.id) setDefaultStakeholderId(ownerOrganization.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerOrganization?.id, defaultStakeholderId]);
  const defaultStakeholder = useMemo(
    () => stakeholders.find((s) => s.id === defaultStakeholderId) ?? null,
    [stakeholders, defaultStakeholderId],
  );
  /** Référentiel verrouillé sur le projet actif (contexte projet = source de vérité). */
  const referentialLocked = mode === 'planning' && !!projectId && !!projectName;
  const effectiveReferential = referentialLocked ? referentialCode : activeReferential;

  /**
   * Arbre WBS proposé = phases réelles du projet + union des phases des référentiels
   * sélectionnés (multi-options). Aucune donnée en dur : tout vient des référentiels.
   */
  const availablePhases = useMemo<WbsPhase[]>(() => {
    const codes = referentialLocked
      ? (referentialCode ? [referentialCode] : [])
      : Array.from(new Set([...(referentialCode ? [referentialCode] : []), ...enrichReferentials]));
    const fromReferentials: WbsPhase[] = codes.flatMap((code) =>
      getPhasesForReferential(code, lang as 'fr' | 'ar' | 'en').map((phase) => ({
        id: phase.code,
        label: phase.label,
        milestones: phase.steps.map((step) => ({
          id: step.code,
          label: step.label,
          tasks: step.tasks.map((task) => ({ id: task.code, label: task.label })),
        })),
      })),
    );
    const merged: WbsPhase[] = [...projectPhases, ...fromReferentials];
    const seen = new Set<string>();
    return merged.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
  }, [projectPhases, referentialCode, enrichReferentials, referentialLocked, lang]);



  /** Métadonnées par défaut d'une nouvelle ligne (responsable hérité de la Zone 3). */
  const defaultLineMetadata = useMemo<Record<string, unknown> | null>(
    () => (defaultStakeholder
      ? { stakeholder: { id: defaultStakeholder.id, name: defaultStakeholder.name, type: defaultStakeholder.type } }
      : null),
    [defaultStakeholder],
  );

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

  /**
   * Pré-remplissage du rattachement WBS : la phase active du projet (à défaut la
   * première) est appliquée, avec son premier jalon et sa première tâche. Le
   * contexte projet devient la source de vérité ; l'utilisateur ne re-saisit rien.
   */
  const contextWbs = useMemo<WbsValue | null>(() => {
    if (projectPhases.length === 0) return null;
    const phase = projectPhases.find((p) => isActivePhaseStatus(p.status)) ?? projectPhases[0];
    const milestone = phase.milestones[0] ?? null;
    const task = milestone?.tasks?.[0] ?? null;
    return { phaseId: phase.id, milestoneId: milestone?.id ?? null, taskId: task?.id ?? null };
  }, [projectPhases]);

  /** Vrai si le projet possède une phase en cours → jalon/tâche verrouillés. */
  const projectIsActive = useMemo(
    () => projectPhases.some((p) => isActivePhaseStatus(p.status)),
    [projectPhases],
  );
  const wbsLocked = useMemo(
    () => ({ phase: false, milestone: projectIsActive, task: projectIsActive }),
    [projectIsActive],
  );

  useEffect(() => {
    if (!contextWbs) return;
    setWbsDefault((prev) => (prev.phaseId ? prev : { ...contextWbs }));
    setWbs((prev) => (prev.phaseId ? prev : { ...contextWbs }));
  }, [contextWbs]);

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
    setOpenings({ count: 0, width: 0, height: 0 });
    setAutoRecs(false);
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

  /** Ouvertures effectives (référentiel `element-types.deductOpenings`). */
  const effectiveOpenings = useMemo(() => (
    elDef?.deductOpenings && openings.count > 0 && openings.width > 0 && openings.height > 0
      ? [{ width: openings.width, height: openings.height, count: openings.count }]
      : undefined
  ), [elDef, openings]);

  /** Recommandations du référentiel pour le type d'ouvrage courant. */
  const recommendations = useMemo(() => (useAdvanced ? getRecommendationItems(elementType) : []), [useAdvanced, elementType]);

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
      openings: effectiveOpenings,
    });
    return r.quantity;
  }, [useAdvanced, elementType, form.length, form.width, form.height, form.quantity, form.unit, form.designation, form.unitPrice, source, contextId, effectiveOpenings]);


  const manualPreview = useMemo(() => {
    const pu = Number(form.unitPrice) || 0;
    const htBase = computedQuantity * pu;
    const ht = htBase * (1 + (Number(overheadPct) || 0) / 100);
    const profile = getFiscalProfile(fiscalCode);
    // La TVA/RAS dépendent de la nature du poste (travaux, fourniture, consulting…).
    const tax = TaxService.resolve({ category, designation: form.designation, elementType, totalHt: ht }, profile);
    const tva = ht * tax.vatRate;
    return { ht, tva, ttc: ht + tva, ras: ht * tax.rasRate, qty: computedQuantity, regimeLabel: tax.regimeLabel };
  }, [computedQuantity, form.unitPrice, fiscalCode, overheadPct, category, form.designation, elementType]);

  // ---- Tampon local (batch) : « Ajouter » n'écrit PAS en DB.
  //      La persistance atomique se fait via « Enregistrer le DQE » (bulkCreate).
  const [draftLines, setDraftLines] = useState<BoqLineDTO[]>([]);
  const [baselineLines, setBaselineLines] = useState<BoqLineDTO[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (dirty) return;
    setDraftLines(doc.lines);
    setBaselineLines(doc.lines);
  }, [doc.lines, dirty]);

  useEffect(() => {
    setDirty(false);
    setDraftLines([]);
    setBaselineLines([]);
  }, [documentId, contextId]);

  const handleCreate = () => {
    if (!form.designation?.trim()) {
      toast({ title: 'Désignation requise', variant: 'destructive' });
      return;
    }
    const profile = getFiscalProfile(fiscalCode);
    // Fiscalité résolue une seule fois (régime + imputation PCM) pour la ligne saisie.
    const manualTax = TaxService.resolve({ category, designation: form.designation, elementType }, profile);
    const overheadNote = (Number(overheadPct) || 0) > 0 ? `Frais généraux ${overheadPct}%` : null;
    const effectivePu = (Number(form.unitPrice) || 0) * (1 + (Number(overheadPct) || 0) / 100);
    const effectiveWbs: WbsValue = {
      phaseId: wbs.phaseId ?? wbsDefault.phaseId ?? null,
      milestoneId: wbs.milestoneId ?? wbsDefault.milestoneId ?? null,
      taskId: wbs.taskId ?? wbsDefault.taskId ?? null,
    };
    const draft: BoqLineDTO = {
      source, contextId,
      documentId: documentId ?? null,
      designation: form.designation!,
      elementType: useAdvanced ? elementType : null,
      unit: form.unit || 'u',
      length: useAdvanced ? (form.length ?? null) : null,
      width: useAdvanced ? (form.width ?? null) : null,
      height: useAdvanced ? (form.height ?? null) : null,
      quantity: computedQuantity,
      unitPrice: effectivePu,
      totalHt: computedQuantity * effectivePu,
      rasRate: manualTax.rasRate,
      fees: 0,
      resourceType: catToResource(category),
      materialId: materialId || null,
      phaseId: effectiveWbs.phaseId,
      milestoneId: effectiveWbs.milestoneId,
      taskId: effectiveWbs.taskId,
      vatRate: manualTax.vatRate,
      taxRegimeCode: manualTax.regimeCode,
      accountCode: manualTax.accountCode,
      note: [
        category === 'overhead' ? 'Frais généraux' : null,
        overheadNote,
        effectiveOpenings ? `Ouvertures déduites : ${openings.count} × ${openings.width}×${openings.height} m` : null,
      ].filter(Boolean).join(' • ') || null,
      sourceType: useAdvanced ? 'avance' : 'rapide',
      metadata: defaultLineMetadata,
      status: 'draft',
    };

    // Recommandations du référentiel → 1 ligne article par recommandation.
    const recoDrafts: BoqLineDTO[] = (autoRecs ? recommendations : []).map((rec) => ({
      ...draft,
      designation: `${draft.designation} — ${rec.label}`,
      elementType: null,
      length: null, width: null, height: null,
      unit: rec.unit ?? draft.unit,
      quantity: rec.quantity ?? 1,
      totalHt: (rec.quantity ?? 1) * effectivePu,
      note: ['Recommandation', overheadNote].filter(Boolean).join(' • '),
      sourceType: 'avance',
    }));
    setDraftLines((prev) => [...prev, draft, ...recoDrafts]);
    setDirty(true);
    resetForm();
    setOpenManual(false);
    toast({
      title: 'Ligne ajoutée au brouillon',
      description: recoDrafts.length
        ? `1 ligne + ${recoDrafts.length} recommandation(s). Cliquez « Enregistrer le DQE » pour persister.`
        : 'Cliquez « Enregistrer le DQE » pour persister.',
    });
  };


  const saveDraftLines = async (silent = false): Promise<boolean> => {
    // Une ligne saisie manuellement n'est enregistrable que si elle est valorisée :
    // désignation obligatoire + quantité ou montant. Les lignes vides (clic sur
    // « Ajouter une ligne » sans saisie) sont écartées silencieusement.
    const isBlank = (l: BoqLineDTO) =>
      !String(l.designation ?? '').trim() && !l.quantity && !l.unitPrice && !l.totalHt;
    const candidates = draftLines.filter((l) => !isBlank(l));
    const invalid = candidates.filter((l) => !String(l.designation ?? '').trim() || (!l.quantity && !l.totalHt));
    if (invalid.length) {
      toast({
        title: 'Lignes incomplètes',
        description: `${invalid.length} ligne(s) sans désignation ou sans quantité/montant. Complétez-les avant d'enregistrer.`,
        variant: 'destructive',
      });
      return false;
    }
    const baselineIds = new Set(baselineLines.flatMap((line) => line.id ? [line.id] : []));
    const candidateIds = new Set(candidates.flatMap((line) => line.id ? [line.id] : []));
    const create = candidates.filter((line) => !line.id);
    const update = candidates.flatMap((line) => line.id ? [{ id: line.id, dto: line }] : []);
    const remove = [...baselineIds]
      .filter((id) => !candidateIds.has(id))
      .map((id) => ({ id, source }));
    setFinalizing(true);
    try {
      const persistedLines = await doc.commitChanges({ create, update, remove });
      setBaselineLines(persistedLines);
      setDraftLines(persistedLines);
      setDirty(false);
      if (!silent) toast({ title: t('dqe.save_success') });
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

  // ---- Édition locale : aucune mutation distante avant « Enregistrer » ------
  const displayedLines = draftLines;

  const handlePatch = (index: number, patch: Partial<BoqLineDTO>) => {
    setDirty(true);
    setDraftLines((prev) => prev.map((line, i) => i === index ? { ...line, ...patch } : line));
  };
  const handleRemove = (index: number) => {
    setDirty(true);
    setDraftLines((prev) => prev.filter((_, i) => i !== index));
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

  // ---- Raccourcis clavier des 5 actions P0 du gestionnaire -------------------
  // Ctrl+Maj+A ajouter · Ctrl+Maj+M métré · Ctrl+Maj+I importer
  // Ctrl+S enregistrer · Ctrl+Entrée soumettre pour validation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (e.shiftKey && key === 'a') { if (!locked) { e.preventDefault(); addEmptyRow(); } return; }
      if (e.shiftKey && key === 'm') { if (!locked) { e.preventDefault(); setOpenManual(true); } return; }
      if (e.shiftKey && key === 'i') { if (!locked) { e.preventDefault(); setOpenImport(true); } return; }
      if (!e.shiftKey && key === 's') { if (!locked) { e.preventDefault(); void saveDraftLines(false); } return; }
      if (!e.shiftKey && e.key === 'Enter') {
        if (locked) return;
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('boq-shortcut-submit'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ---- Ajout inline d'une ligne vide (édition dans le tableau) ---------------
  const addEmptyRow = () => {
    const profile = getFiscalProfile(fiscalCode);
    const newRowTax = TaxService.resolve({ designation: null }, profile);
    setDraftLines((prev) => [...prev, {
      source, contextId,
      documentId: documentId ?? null,
      designation: '',
      unit: 'u',
      length: null, width: null, height: null,
      quantity: 0,
      unitPrice: 0,
      totalHt: 0,
      vatRate: newRowTax.vatRate,
      rasRate: newRowTax.rasRate,
      taxRegimeCode: newRowTax.regimeCode,
      fees: 0,
      resourceType: 'material',
      phaseId: wbsDefault.phaseId ?? null,
      milestoneId: wbsDefault.milestoneId ?? null,
      taskId: wbsDefault.taskId ?? null,
      sourceType: 'rapide',
      metadata: defaultLineMetadata,
      status: 'draft',

    }]);
    setDirty(true);
  };

  // ---- Render ---------------------------------------------------------------
  const rawDocRef = documentId ?? contextId;
  const docRef = rawDocRef.includes('-') ? rawDocRef.slice(0, 12).toUpperCase() : rawDocRef.toUpperCase();
  // Tant que le document n'est pas signé, l'édition (ajout / modification /
  // suppression de lignes) reste ouverte. La signature figeage le document.
  const signatureInfo = useMemo(() => {
    for (const l of doc.lines) {
      const sig = (l.metadata as { signature?: { signedBy?: string; signedAt?: string } } | null)?.signature;
      if (sig?.signedAt) return { by: sig.signedBy ?? '—', at: new Date(sig.signedAt).toLocaleString('fr-FR') };
    }
    return null;
  }, [doc.lines]);
  // Document déjà transmis (soumis / publié / facturé) : plus aucune modification.
  const transmittedInfo = useMemo(() => {
    const finalStatuses: BoqStatus[] = ['validated', 'invoiced', 'paid', 'archived'];
    for (const l of doc.lines) {
      const tr = (l.metadata as { transfer?: { transferredAt?: string; stage?: string } } | null)?.transfer;
      if (tr?.transferredAt) {
        return { at: new Date(tr.transferredAt).toLocaleString('fr-FR'), stage: tr.stage ?? null };
      }
      if (l.status && finalStatuses.includes(l.status)) return { at: null, stage: l.status };
    }
    return null;
  }, [doc.lines]);
  const locked = !!signatureInfo || !!transmittedInfo;
  const pendingCount = dirty ? Math.abs(draftLines.length - baselineLines.length) || 1 : 0;
  const docStatus = dirty ? t('dqe.doc_status.to_save') : (doc.lines.length > 0 ? t('dqe.doc_status.validated') : t('dqe.doc_status.new'));
  const isDocumentEmpty = displayedLines.length === 0;
  const handleParsedImport = (lines: BoqLineDTO[]) => {
    setDraftLines((prev) => [...prev, ...lines.map((line) => {
      const hasStakeholder = !!(line.metadata as { stakeholder?: unknown } | null)?.stakeholder;
      return {
        ...line,
        source,
        contextId,
        documentId: documentId ?? null,
        id: undefined,
        // Responsable par défaut (Zone 3) hérité si la ligne importée n'en porte pas.
        metadata: hasStakeholder || !defaultLineMetadata
          ? line.metadata ?? null
          : { ...(line.metadata ?? {}), ...defaultLineMetadata },
        status: 'draft' as const,
      };
    })]);
    setDirty(true);
  };

  return (
    <div className="space-y-4">
      <section className="space-y-0">
        <div className="grid gap-4 border-b p-4 lg:grid-cols-[minmax(200px,0.7fr)_minmax(180px,0.8fr)_minmax(300px,1.1fr)_minmax(200px,0.8fr)_auto] lg:items-end">
          <div className="space-y-2">
            <div className="text-xs font-medium uppercase text-muted-foreground"><T k="auto.boqworkspace.document" fallback="Document" /></div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-semibold">{labels.docPrefix.toUpperCase()} · {docRef}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t('referential.label')}</Label>
            {referentialLocked ? (
              <div
                className="flex h-10 items-center gap-2 rounded-md border bg-muted/40 px-3 text-sm"
                title={t('dqe.referential.hint')}
              >
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="truncate font-medium">{projectName}</span>
                {referentialCode ? <span className="text-xs text-muted-foreground">({referentialCode})</span> : null}
              </div>
            ) : (
              <MultiSelectCombobox
                values={enrichReferentials}
                onChange={(vals) => {
                  const next = vals as ReferentialType[];
                  setEnrichReferentials(next);
                  setActiveReferential(next[0] ?? referentialCode);
                  writePrefs({ referentials: next, referential: next[0] });
                }}
                options={referentialOptions.map((opt) => ({
                  value: opt.value,
                  label: `${t('dqe.referential.enrich')} ${opt.label}`,
                  description: opt.description,
                }))}
                placeholder={projectName ? `${t('dqe.referential.project')} ${projectName}` : t('dqe.referential.project_default')}
                searchPlaceholder={t('referential.label')}
              />
            )}

            <p className="text-[11px] text-muted-foreground">
              {t('dqe.referential.hint')}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground"><T k="auto.boqworkspace.perimetre_du_document" fallback="Périmètre du document" /></Label>
            <WbsScopeSelector phases={availablePhases} value={wbsScope} onChange={updateWbsScope} disabled={locked} />
            <Label className="text-xs text-muted-foreground"><T k="auto.boqworkspace.classification_par_defaut" fallback="Classification par défaut" /></Label>
            <WbsSelector value={wbsDefault} onChange={setWbsDefault} phases={availablePhases} scope={wbsScope} referentialCode={effectiveReferential} locked={wbsLocked} />

            <Select
              value={defaultStakeholderId || '__none__'}
              onValueChange={(v) => {
                const next = v === '__none__' ? '' : v;
                setDefaultStakeholderId(next);
                writePrefs({ stakeholderId: next });
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder={t('dqe.responsible.placeholder')} />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="__none__">{t('dqe.responsible.none')}</SelectItem>
                {stakeholders.map((s) => (
                  <SelectItem key={`${s.type}-${s.id}`} value={s.id}>
                    {s.name} · {translateTerm(s.type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground"><T k="auto.boqworkspace.profil_fiscal" fallback="Profil fiscal" /></Label>
            <Select value={fiscalCode} onValueChange={(v) => { setFiscalCode(v); writePrefs({ fiscalCode: v }); }}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.values(BOQ_FISCAL_PROFILES).map((p) => (
                   <SelectItem key={p.code} value={p.code}>{getFiscalProfileLabel(p.code, lang)} ({t('dqe.fiscal.vat')} {(p.vatRate * 100).toLocaleString(lang === 'ar' ? 'ar-MR' : lang === 'en' ? 'en-GB' : 'fr-FR', { maximumFractionDigits: 2 })}%)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex lg:justify-end">
            <Button
               onClick={() => saveDraftLines(false)}
              disabled={locked || (pendingCount === 0 && !dirty) || finalizing || doc.isPending}
              title={
                transmittedInfo
                  ? t('dqe.locked_transmitted')
                  : signatureInfo
                    ? t('dqe.locked_signed')
                    : pendingCount === 0 && !dirty
                      ? t('dqe.save_hint_no_pending')
                      : undefined
              }
            >
              {finalizing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileCheck2 className="h-4 w-4 mr-2" />}
              {t('dqe.action.save')}{pendingCount > 0 ? ` (${pendingCount})` : ''}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={addEmptyRow} disabled={locked}><Plus className="h-4 w-4 mr-1" /><T k="auto.boqworkspace.ajouter_une_ligne" fallback="Ajouter une ligne" /></Button>


          <Dialog open={openManual} onOpenChange={setOpenManual}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" disabled={locked}><Calculator className="h-4 w-4 mr-1" /><T k="auto.boqworkspace.calcul_metre" fallback="Calcul métré" /></Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t('dqe.action.takeoff')}</DialogTitle>
                <DialogDescription><T k="auto.boqworkspace.calculez_les_quantites_puis_ajoutez_les_lignes_o" fallback="Calculez les quantités puis ajoutez les lignes obtenues au document courant." /></DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-6 gap-3">
                <div className="col-span-3">
                  <Label><T k="auto.boqworkspace.categorie" fallback="Catégorie" /></Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as ManualCategory)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {getEnumOptions('ResourceType', lang).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Label><T k="auto.boqworkspace.profil_fiscal" fallback="Profil fiscal" /></Label>
                  <Select value={fiscalCode} onValueChange={setFiscalCode}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.values(BOQ_FISCAL_PROFILES).map((p) => (
                        <SelectItem key={p.code} value={p.code}>
                           {getFiscalProfileLabel(p.code, lang)} ({t('dqe.fiscal.vat')} {(p.vatRate * 100).toLocaleString(lang === 'ar' ? 'ar-MR' : lang === 'en' ? 'en-GB' : 'fr-FR', { maximumFractionDigits: 2 })}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {category === 'material' && materials.length > 0 && (
                  <>
                    {depots.length > 1 && (
                      <div className="col-span-3">
                        <Label><T k="auto.boqworkspace.depot" fallback="Dépôt" /></Label>
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
                              {m.name}{m.unit ? ` · ${i18nService.translateUnit(m.unit)}` : ''}{m.pricePerUnit ? ` · ${formatCurrency(m.pricePerUnit)}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div className="col-span-6">
                  <Label><T k="auto.boqworkspace.designation" fallback="Désignation" /></Label>
                  <Input value={form.designation ?? ''} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
                </div>

                {/* Classification WBS projet (Phase → Jalon → Tâche) — dynamique */}
                <div className="col-span-6">
                  <Label className="text-xs text-muted-foreground">
                    {translateTerm('wbs_classification')} {projectPhases.length > 0 ? '(phases du projet)' : '(référentiel)'}
                  </Label>
                  <WbsSelector
                    value={wbs}
                    onChange={setWbs}
                    phases={availablePhases}
                    scope={wbsScope}
                    locked={wbsLocked}
                    referentialCode={effectiveReferential}
                  />
                </div>

                {/* Type d'élément — pilote le moteur de métré dynamique (inline, pas de modal) */}
                {!isLabourTime && (
                  <div className="col-span-3">
                    <Label><T k="auto.boqworkspace.type_d_ouvrage_metre" fallback="Type d'ouvrage (métré)" /></Label>
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
                  <Label><T k="auto.boqworkspace.unite" fallback="Unité" /></Label>
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
                        <Label><T k="auto.boqworkspace.longueur_m" fallback="Longueur (m)" /></Label>
                        <Input type="number" value={form.length ?? ''} onChange={(e) => setForm({ ...form, length: Number(e.target.value) })} />
                      </div>
                    )}
                    {elDef.dimensions.width && (
                      <div className="col-span-2">
                        <Label><T k="auto.boqworkspace.largeur_m" fallback="Largeur (m)" /></Label>
                        <Input type="number" value={form.width ?? ''} onChange={(e) => setForm({ ...form, width: Number(e.target.value) })} />
                      </div>
                    )}
                    {elDef.dimensions.height && (
                      <div className="col-span-2">
                        <Label><T k="auto.boqworkspace.hauteur_m" fallback="Hauteur (m)" /></Label>
                        <Input type="number" value={form.height ?? ''} onChange={(e) => setForm({ ...form, height: Number(e.target.value) })} />
                      </div>
                    )}
                  </>
                )}

                {/* Ouvertures à déduire — piloté par le référentiel element-types */}
                {useAdvanced && elDef?.deductOpenings && (
                  <>
                    <div className="col-span-2">
                      <Label><T k="auto.boqworkspace.ouvertures_nb" fallback="Ouvertures (nb)" /></Label>
                      <Input type="number" min={0} value={openings.count || ''} onChange={(e) => setOpenings({ ...openings, count: Number(e.target.value) || 0 })} />
                    </div>
                    <div className="col-span-2">
                      <Label><T k="auto.boqworkspace.ouverture_larg_m" fallback="Ouverture larg. (m)" /></Label>
                      <Input type="number" min={0} step={0.01} value={openings.width || ''} onChange={(e) => setOpenings({ ...openings, width: Number(e.target.value) || 0 })} />
                    </div>
                    <div className="col-span-2">
                      <Label><T k="auto.boqworkspace.ouverture_haut_m" fallback="Ouverture haut. (m)" /></Label>
                      <Input type="number" min={0} step={0.01} value={openings.height || ''} onChange={(e) => setOpenings({ ...openings, height: Number(e.target.value) || 0 })} />
                    </div>
                  </>
                )}



                <div className="col-span-1">
                  <Label><T k="auto.boqworkspace.pu_mru" fallback="PU (MRU)" /></Label>
                  <Input type="number" value={form.unitPrice ?? 0} onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })} />
                </div>
                <div className="col-span-2">
                  <Label><T k="auto.boqworkspace.frais_generaux" fallback="Frais généraux (%)" /></Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    value={overheadPct}
                    onChange={(e) => setOverheadPct(Number(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Recommandations métier (référentiel) pour le type d'ouvrage */}
              {recommendations.length > 0 && (
                <div className="mt-3 rounded-md border border-dashed p-3">
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4"
                      checked={autoRecs}
                      onChange={(e) => setAutoRecs(e.target.checked)}
                    />
                    <span>
                      Générer une ligne article par recommandation ({recommendations.length}) — PU / unité de la ligne principale
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {recommendations.map((r) => r.label).join(' • ')}
                      </span>
                    </span>
                  </label>
                </div>
              )}



              <div className="mt-3 rounded-md border bg-muted/30 p-3 text-sm grid grid-cols-5 gap-2">
                <div><T k="auto.boqworkspace.qte" fallback="Qté :" /> <span className="font-semibold">{manualPreview.qty.toFixed(2)}</span></div>
                <div>{t('dqe.fiscal.ht')} <span className="font-semibold">{manualPreview.ht.toLocaleString('fr-FR')}</span></div>
                <div><T k="auto.boqworkspace.tva" fallback="TVA :" /> <span className="font-semibold">{manualPreview.tva.toLocaleString('fr-FR')}</span></div>
                <div><T k="auto.boqworkspace.ras" fallback="RAS :" /> <span className="font-semibold">{manualPreview.ras.toLocaleString('fr-FR')}</span></div>
                <div><T k="auto.boqworkspace.ttc" fallback="TTC :" /> <span className="font-bold text-primary">{manualPreview.ttc.toLocaleString('fr-FR')}</span></div>
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpenManual(false)}><T k="auto.boqworkspace.annuler" fallback="Annuler" /></Button>
                <Button onClick={handleCreate} disabled={doc.isPending}>
                  {doc.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}{t('dqe.action.add')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <BoqImportDialog
            open={openImport}
            onOpenChange={setOpenImport}
            source={source}
            contextId={contextId}
            projectId={projectId}
            defaultReferentialCode={effectiveReferential}
            title={importLabel ?? labels.import}
            trigger={
              <Button size="sm" variant="outline" disabled={locked}>
                <FileSpreadsheet className="h-4 w-4 mr-1" />{importLabel ?? labels.import}
              </Button>
            }
            commitOnSubmit={false}
            onParsed={handleParsedImport}
          />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isDocumentEmpty ? null : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="ghost" disabled={!dirty || locked}>
                    <Trash2 className="h-4 w-4 mr-1" />{t('dqe.action.clear_draft')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('dqe.action.clear_draft')}</AlertDialogTitle>
                    <AlertDialogDescription>{t('dqe.clear_draft.confirm')}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => { setDraftLines(baselineLines); setDirty(false); }}>{t('common.confirm')}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          {mode === 'bid' && projectId && estimateId && (
            <Button size="sm" onClick={handleAlignPlanning} disabled={aligning}>
              {aligning ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ArrowRightCircle className="h-4 w-4 mr-1" />}
              {t('dqe.action.align_planning')}
            </Button>
          )}
        </div>
      </div>

      {/* Aperçu fiscal temps réel + contrôles de conformité LFR 2026 (avant génération) */}
      <FiscalCompliancePanel
        lines={displayedLines}
        value={compliance}
        onChange={(patch) => {
          const next = { ...compliance, ...patch };
          setCompliance(next);
          // Les contrôles du document se propagent aux lignes (déductibilité par ligne).
          setDraftLines((prev) => prev.map((l) => ({
            ...l,
            supplierNif: next.supplierNif ?? null,
            supplierNifStatus: next.supplierNifStatus ?? 'unknown',
            paymentMethod: next.paymentMethod ?? null,
          })));
          if (displayedLines.length > 0) setDirty(true);
        }}
        profile={getFiscalProfile(fiscalCode)}
        lang={lang as 'fr' | 'ar' | 'en'}
        disabled={locked}
      />


      <div className="p-4">
      {doc.isLoading ? (
        <div className="text-sm text-muted-foreground">Chargement…</div>
      ) : (
        <BoqLineTable
          lines={displayedLines}
          emptyLabel={emptyLabel ?? labels.empty}
          editable={!locked}
          referentialCode={effectiveReferential}
          phases={applyWbsScope(availablePhases, wbsScope)}
          stakeholders={stakeholders}
          onChange={handlePatch}
          onRemove={handleRemove}
        />
      )}
      </div>

      {/* Journal de traçabilité — persistance / signature / transmission.
          Ces badges ne polluent plus l'en-tête : ils sont regroupés ici. */}
      <div className="flex flex-wrap items-center gap-2 border-t bg-muted/10 p-3 text-xs text-muted-foreground">
        <span className="font-medium uppercase tracking-wide">
          <T k="dqe.journal.title" fallback="Journal de traçabilité" />
        </span>
        <Badge variant={dirty ? 'secondary' : doc.lines.length > 0 ? 'default' : 'outline'}>{docStatus}</Badge>
        <span>
          <T k="dqe.journal.lines" fallback="Lignes persistées" /> : {doc.lines.length}
        </span>
        {signatureInfo && (
          <Badge variant="outline" className="border-primary text-primary">
            {t('dqe.locked_signed')} · {signatureInfo.at} — {signatureInfo.by}
          </Badge>
        )}
        {!signatureInfo && transmittedInfo && (
          <Badge variant="outline" className="border-primary text-primary">
            {t('dqe.locked_transmitted')}{transmittedInfo.at ? ` · ${transmittedInfo.at}` : ''}
          </Badge>
        )}
      </div>
      </section>

    </div>
  );
}
