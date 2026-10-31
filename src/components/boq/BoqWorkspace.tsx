/**
 * src/components/boq/BoqWorkspace.tsx
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { ArrowRightCircle, ChevronDown, FileCheck2, FileSpreadsheet, Loader2, Lock, Plus, RefreshCw, Settings2, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BoqImportDialog } from './BoqImportDialog';
import { BoqLineTable } from './BoqLineTable';
import { FiscalCompliancePanel, type FiscalComplianceValue } from './FiscalCompliancePanel';
import { QuickAddLineDialog } from './QuickAddLineDialog';
import { BoqLineAutofillService, type AutofillMaterial } from '@/application/services/boq/BoqLineAutofillService';
import { WbsSelector, applyWbsScope, type WbsValue, type WbsScopeValue } from './WbsSelector';
import { WbsScopeSelector, EMPTY_WBS_SCOPE } from './WbsScopeSelector';
import { MultiSelectCombobox } from '@/components/ui/multi-select-combobox';
import { DocumentContextSummary, type DocumentContextItem } from './DocumentContextSummary';


import { BoqCalculatorService } from '@/application/services/boq/BoqCalculatorService';
import { UnifiedBoqParser } from '@/application/services/boq/UnifiedBoqParser';
import { BoqManualLineTransformer } from '@/dtos/transforms/BoqManualLineTransformer';
import { loadProjectWbs, isActivePhaseStatus, type ProjectWbsPhase } from '@/application/services/boq/ProjectWbsLoader';
import { tenderToPlanningService } from '@/application/services/TenderToPlanningService';
import type { ReferentialType } from '@/config/referentials';
import { getReferentialOptions, getPhasesForReferential } from '@/config/referentials';

import { BOQ_FISCAL_PROFILES, getFiscalProfile, getFiscalProfileLabel } from '@/config/referentials/boq/default-values.referential';
import { TaxService } from '@/application/services/TaxService';
import { formatCurrency } from '@/utils/phaseDisplayHelpers';
import type { WbsPhase } from '@/config/referentials/wbs/wbs.referential';
import type { BoqSource, BoqStatus } from '@/domain/entities/boq/BoqLine';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import { useBoqDocument } from '@/hooks/hexagonal/useBoqDocument';
import { useMaterialsHex } from '@/hooks/hexagonal/useMaterialsHex';
import { useActiveEmployeesHex } from '@/hooks/hexagonal/useActiveEmployeesHex';
import { useActiveSuppliersHex } from '@/hooks/hexagonal/useActiveSuppliersHex';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useOwnerOrganization } from '@/hooks/useOwnerOrganization';

import type { StakeholderOption } from './BoqLineTable';
import { useI18n } from '@/hooks/useI18n';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { T } from '@/components/i18n/T';

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
  emptyLabel, documentId,
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
  const [openImport, setOpenImport] = useState(false);
  const [linePageSize, setLinePageSize] = useState(10);
  const { materials } = useMaterialsHex();
  const [fiscalCode, setFiscalCode] = useState<string>(() => readPrefs().fiscalCode ?? 'MR_STANDARD');
  /** Contrôles LFR 2026 du document (NIF fournisseur, moyen de paiement, facture normalisée). */
  const [compliance, setCompliance] = useState<FiscalComplianceValue>({
    supplierNif: null, supplierNifStatus: 'unknown', paymentMethod: 'virement', hasNormalizedInvoice: false,
  });

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
    ...organizations.map((o) => ({ id: o.id, name: o.name, type: 'organization' as const, nif: o.nif ?? null })),
    ...activeEmployees.map((e) => ({ id: e.id, name: e.full_name, type: 'employee' as const })),
    ...activeSuppliers.map((s) => ({ id: s.id, name: s.name, type: 'supplier' as const, nif: s.nif ?? null })),
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
  const defaultSupplierNif = defaultStakeholder?.type === 'supplier'
    ? defaultStakeholder.nif ?? null
    : null;
  useEffect(() => {
    if (!defaultSupplierNif || compliance.supplierNif) return;
    setCompliance((current) => ({ ...current, supplierNif: defaultSupplierNif }));
  }, [compliance.supplierNif, defaultSupplierNif]);
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

  const documentContextItems = useMemo<DocumentContextItem[]>(() => {
    const scopedPhaseLabels = wbsScope.phaseIds
      .map((id) => availablePhases.find((phase) => phase.id === id)?.label)
      .filter((label): label is string => Boolean(label));
    const selectedReferentialLabels = enrichReferentials
      .map((code) => referentialOptions.find((option) => option.value === code)?.label ?? code)
      .filter(Boolean);
    const wbsValue = scopedPhaseLabels.length > 0
      ? `${scopedPhaseLabels.slice(0, 2).join(' · ')}${scopedPhaseLabels.length > 2 ? ` +${scopedPhaseLabels.length - 2}` : ''}`
      : `${availablePhases.length} ${t('dqe.context.phases', undefined, 'phase(s)')}`;
    const selectedPhase = availablePhases.find((phase) => phase.id === wbsDefault.phaseId);
    const selectedMilestone = selectedPhase?.milestones.find((milestone) => milestone.id === wbsDefault.milestoneId);
    const selectedTask = selectedMilestone?.tasks.find((task) => task.id === wbsDefault.taskId);
    const classification = [selectedPhase?.label, selectedMilestone?.label, selectedTask?.label].filter(Boolean).join(' › ');
    return [
      { label: t('dqe.context.wbs', undefined, 'Périmètre WBS'), value: wbsValue },
      { label: t('dqe.context.classification', undefined, 'Classification'), value: classification || t('dqe.context.not_set', undefined, 'Non définie') },
      { label: t('dqe.context.responsible', undefined, 'Responsable'), value: defaultStakeholder?.name ?? t('dqe.context.not_set', undefined, 'Non défini') },
      { label: t('dqe.context.referentials', undefined, 'Référentiels'), value: selectedReferentialLabels.length > 0 ? selectedReferentialLabels.join(' · ') : t('dqe.context.project_default', undefined, 'Projet courant') },
      { label: t('dqe.context.fiscal_profile', undefined, 'Profil fiscal'), value: getFiscalProfileLabel(fiscalCode, lang) },
    ];
  }, [availablePhases, defaultStakeholder?.name, enrichReferentials, fiscalCode, lang, referentialOptions, t, wbsDefault.phaseId, wbsScope.phaseIds]);

  /** Métadonnées par défaut d'une nouvelle ligne (responsable hérité de la Zone 3). */
  const defaultLineMetadata = useMemo<Record<string, unknown> | null>(
    () => (defaultStakeholder
      ? {       stakeholder: { id: defaultStakeholder.id, name: defaultStakeholder.name, type: defaultStakeholder.type, nif: defaultStakeholder.nif ?? null } }
      : null),
    [defaultStakeholder],
  );

  const fiscalProfileOptions = useMemo(
    () => {
      const serviceProfiles = TaxService.listAvailableProfiles(
        {},
        fiscalCode,
        getFiscalProfile(fiscalCode),
        lang,
      );
      const list = serviceProfiles.length > 0 ? serviceProfiles : Object.values(BOQ_FISCAL_PROFILES).map((p) => ({
        code: p.code,
        label: getFiscalProfileLabel(p.code, lang),
        vatRate: p.vatRate,
        withholdingRate: p.withholdingRate,
        recommended: p.code === fiscalCode,
      }));
      return list.sort((a, b) => Number(b.recommended) - Number(a.recommended) || a.label.localeCompare(b.label));
    },
    [fiscalCode, lang],
  );

  useEffect(() => {
    if (!fiscalProfileOptions.length) return;
    if (!fiscalProfileOptions.some((p) => p.code === fiscalCode)) {
      setFiscalCode(fiscalProfileOptions[0].code);
      writePrefs({ fiscalCode: fiscalProfileOptions[0].code });
    }
  }, [fiscalCode, fiscalProfileOptions]);

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
  }, [contextWbs]);

  // ---- Tampon local (batch) : « Ajouter » n'écrit PAS en DB.
  //      La persistance atomique se fait via « Enregistrer le DQE » (bulkCreate).
  const [draftLines, setDraftLines] = useState<BoqLineDTO[]>([]);
  const [baselineLines, setBaselineLines] = useState<BoqLineDTO[]>([]);
  const [dirty, setDirty] = useState(false);

  /**
   * Synchronisation tampon ↔ persistance.
   * Un seul effet : le changement de document réinitialise le tampon SANS écraser
   * les lignes déjà chargées (l'ancien double effet vidait le tampon lorsque
   * `documentId` et `doc.lines` arrivaient dans le même commit → tableau vide
   * alors que N lignes étaient persistées).
   */
  const docKey = `${source}::${contextId ?? ''}::${documentId ?? ''}`;
  const docKeyRef = useRef(docKey);
  useEffect(() => {
    const switched = docKeyRef.current !== docKey;
    if (switched) docKeyRef.current = docKey;
    if (!switched && dirty) return;
    if (switched) setDirty(false);
    setDraftLines(doc.lines);
    setBaselineLines(doc.lines);
  }, [docKey, doc.lines, dirty, source]);


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
        title: t('auto.boqworkspace.lignes_incompletes'),
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
        title: t('auto.boqworkspace.enregistrement_echoue'),
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
      toast({ title: t('auto.boqworkspace.contexte_incomplet'), description: 'projectId + estimateId requis', variant: 'destructive' });
      return;
    }
    setAligning(true);
    try {
      const res = await tenderToPlanningService.convert({ estimateId, projectId });
      toast({ title: t('auto.boqworkspace.aligne_a_la_planification'), description: `${res.linesCopied} lignes → ${res.distinctPhases.length} phases` });
      window.dispatchEvent(new CustomEvent('boq-kpi-refresh'));
    } catch (e) {
      toast({ title: t('auto.boqworkspace.echec_alignement'), description: String(e instanceof Error ? e.message : e), variant: 'destructive' });
    } finally { setAligning(false); }
  };

  // ---- Raccourcis clavier des 5 actions P0 du gestionnaire -------------------
  // Ctrl+Maj+A ajouter · Ctrl+Maj+M métré · Ctrl+Maj+I importer
  // Ctrl+S enregistrer · Ctrl+Entrée soumettre pour validation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (e.shiftKey && key === 'a') { if (!locked) { e.preventDefault(); setQuickAddOpen(true); } return; }
      if (e.shiftKey && key === 'm') { if (!locked) { e.preventDefault(); setQuickAddOpen(true); } return; }
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

  // ---- Ajout assisté d'une ligne (autocomplétion + détection référentielle) --
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  /** Matériaux du projet exposés au moteur de suggestion. */
  const autofillMaterials = useMemo<AutofillMaterial[]>(
    () => materials.map((m) => {
      const mm = m as unknown as { id: string; name: string; unit?: string | null; pricePerUnit?: number | null; unitPrice?: number | null; category?: string | null };
      return { id: mm.id, name: mm.name, unit: mm.unit ?? null, unitPrice: mm.pricePerUnit ?? mm.unitPrice ?? null, category: mm.category ?? null };
    }),
    [materials],
  );

  const addAssistedLine = (patch: Partial<BoqLineDTO>) => {
    const clientRowId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    const input = BoqManualLineTransformer.formToMeterInput(patch, {
      source, contextId,
      documentId: documentId ?? null,
      phaseId: wbsDefault.phaseId ?? null,
      milestoneId: wbsDefault.milestoneId ?? null,
      taskId: wbsDefault.taskId ?? null,
      metadata: { ...defaultLineMetadata, clientRowId },
    });
    const lines = UnifiedBoqParser.fromManual([input]);
    setDraftLines((prev) => [...lines, ...prev]);
    setDirty(true);
  };

  // ---- Ajout inline d'une ligne vide (édition dans le tableau) ---------------
  const addEmptyRow = () => {
    const profile = getFiscalProfile(fiscalCode);
    const newRowTax = TaxService.resolve({ designation: null }, profile);
    const clientRowId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    setDraftLines((prev) => [{
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
      metadata: { ...(defaultLineMetadata ?? {}), clientRowId },
      status: 'draft',

    }, ...prev]);
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
  const [showDocumentSettings, setShowDocumentSettings] = useState(false);
  const handleParsedImport = (lines: BoqLineDTO[]) => {
    // Enrichissement référentiel : unité, métré, catégorie, compte PCM, WBS, fiscalité.
    const enrichedLines = BoqLineAutofillService.enrichImported(lines, {
      materials: autofillMaterials,
      phases: availablePhases as never,
      fiscalProfileCode: fiscalCode,
    });
    setDraftLines((prev) => [...prev, ...enrichedLines.map((enriched) => {
      const hasStakeholder = !!(enriched.metadata as { stakeholder?: unknown } | null)?.stakeholder;
      return {
        ...enriched,
        source,
        contextId,
        documentId: documentId ?? null,
        id: undefined,
        // Responsable par défaut (Zone 3) hérité si la ligne importée n'en porte pas.
        metadata: hasStakeholder || !defaultLineMetadata
          ? enriched.metadata ?? null
          : { ...(enriched.metadata ?? {}), ...defaultLineMetadata },
        status: 'draft' as const,
      };
    })]);
    setDirty(true);
  };

  return (
    <div className="space-y-4">
      <section className="space-y-0">
        <div className="grid gap-3 border-b p-3 md:grid-cols-[minmax(180px,0.8fr)_minmax(220px,1.2fr)_minmax(180px,0.8fr)_auto] md:items-end">
          <div className="min-w-0 space-y-1">
            <div className="text-[11px] font-medium uppercase text-muted-foreground"><T k="auto.boqworkspace.document" fallback="Document" /></div>
            <div className="truncate text-base font-semibold">{labels.docPrefix.toUpperCase()} · {docRef}</div>
          </div>
          <div className="min-w-0 space-y-1">
            <Label className="text-[11px] text-muted-foreground">{t('referential.label')}</Label>
            {referentialLocked ? (
              <div
                className="flex h-9 items-center gap-2 rounded-md border bg-muted/40 px-3 text-sm"
                title={t('dqe.referential.hint')}
              >
                <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate font-medium">{projectName}</span>
                {referentialCode ? <span className="shrink-0 text-xs text-muted-foreground">({referentialCode})</span> : null}
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
                showBadges={false}
                size="sm"
              />
            )}
          </div>
          <div className="min-w-0 space-y-1">
            <Label className="text-[11px] text-muted-foreground"><T k="auto.boqworkspace.profil_fiscal" fallback="Profil fiscal" /></Label>
            <Select value={fiscalCode} onValueChange={(v) => { setFiscalCode(v); writePrefs({ fiscalCode: v }); }}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {fiscalProfileOptions.map((p) => (
                  <SelectItem key={p.code} value={p.code}>
                    {p.label} ({t('dqe.fiscal.vat')} {(p.vatRate * 100).toLocaleString(lang === 'ar' ? 'ar-MR' : lang === 'en' ? 'en-GB' : 'fr-FR', { maximumFractionDigits: 2 })}%){p.recommended ? ' · recommandé' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex md:justify-end">
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
              {finalizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileCheck2 className="mr-2 h-4 w-4" />}
              {t('dqe.action.save')}{pendingCount > 0 ? ` (${pendingCount})` : ''}
            </Button>
          </div>
        </div>

        <Collapsible open={showDocumentSettings} onOpenChange={setShowDocumentSettings}>
          <div className="flex min-h-10 items-center justify-between gap-2 border-b bg-muted/20 px-3">
            <div className="flex min-w-0 items-center gap-2">
              <Settings2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="truncate text-xs font-semibold"><T k="auto.boqworkspace.configuration_document" fallback="Configuration du document" /></span>
              <span className="truncate text-[11px] text-muted-foreground"><T k="auto.boqworkspace.wbs_fiscal_responsable" fallback="Périmètre WBS, classification et responsable" /></span>
            </div>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label={showDocumentSettings ? 'Réduire la configuration' : 'Développer la configuration'}>
                <ChevronDown className={`h-4 w-4 transition-transform ${showDocumentSettings ? 'rotate-180' : ''}`} aria-hidden="true" />
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="border-b px-3 py-3">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,1fr)]">
              <div className="min-w-0 space-y-1">
                <Label className="text-[11px] text-muted-foreground"><T k="auto.boqworkspace.perimetre_du_document" fallback="Périmètre du document" /></Label>
                <WbsScopeSelector phases={availablePhases} value={wbsScope} onChange={updateWbsScope} disabled={locked} />
              </div>
              <div className="min-w-0 space-y-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground"><T k="auto.boqworkspace.classification_par_defaut" fallback="Classification par défaut" /></Label>
                  <WbsSelector value={wbsDefault} onChange={setWbsDefault} phases={availablePhases} scope={wbsScope} referentialCode={effectiveReferential} locked={wbsLocked} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground"><T k="auto.boqworkspace.responsable_par_defaut" fallback="Responsable par défaut" /></Label>
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
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b p-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground" aria-live="polite">
              <T k="dqe.lines.results" fallback="Résultats" /> · {displayedLines.length}
            </span>
            <QuickAddLineDialog
              open={quickAddOpen}
              onOpenChange={setQuickAddOpen}
              disabled={locked}
              trigger={<Button size="sm" disabled={locked}><Plus className="h-4 w-4 mr-1" /><T k="auto.boqworkspace.ajouter_une_ligne" fallback="Ajouter une ligne" /></Button>}
              materials={autofillMaterials}
              phases={availablePhases}
              scope={wbsScope}
              referentialCode={effectiveReferential}
              fiscalProfileCode={fiscalCode}
              defaultWbs={wbsDefault}
              wbsLocked={wbsLocked}
              onSubmit={addAssistedLine}
            />
            <Button size="sm" variant="ghost" onClick={addEmptyRow} disabled={locked}><T k="dqe.lines.add_empty" fallback="Ligne vide" /></Button>


          <BoqImportDialog
            open={openImport}
            onOpenChange={setOpenImport}
            source={source}
            contextId={contextId}
            projectId={projectId}
            defaultReferentialCode={effectiveReferential}
            fiscalProfileCode={fiscalCode}
            contextItems={documentContextItems}
            title={t('dqe.import_document')}
            trigger={
              <Button size="sm" variant="outline" disabled={locked}>
                <FileSpreadsheet className="h-4 w-4 mr-1" />{t('dqe.import_document')}
              </Button>
            }
            variant="inline"
            commitOnSubmit={false}
            onParsed={handleParsedImport}
          />

          {/* Recharge les lignes persistées (utile après un import ou un transfert externe). */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setDirty(false); void doc.refetch?.(); }}
            disabled={doc.isLoading}
            title={t('auto.boqworkspace.recharger_les_lignes_persistees')}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${doc.isLoading ? 'animate-spin' : ''}`} />
            <T k="dqe.action.refresh" fallback="Actualiser" />
          </Button>
          <div className="flex items-center gap-2 border-l pl-2 text-xs text-muted-foreground">
            <label htmlFor="dqe-line-page-size" className="whitespace-nowrap"><T k="dqe.lines.show" fallback="Afficher" /></label>
            <Select value={String(linePageSize)} onValueChange={(value) => setLinePageSize(Number(value))}>
              <SelectTrigger id="dqe-line-page-size" className="h-8 w-[76px]" aria-label={t('auto.boqworkspace.nombre_de_lignes_affichees')}><SelectValue /></SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((size) => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
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
          pageSize={linePageSize}
          newRowsAt="start"
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
