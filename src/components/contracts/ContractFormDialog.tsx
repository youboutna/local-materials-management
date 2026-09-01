// src/components/contracts/ContractFormDialog.tsx

import { getContractPdfService } from '@/application/services/ContractPdfService';
import {
  CONTRACT_STATUSES,
  CONTRACT_STATUS_LABELS,
  CONTRACT_TYPES,
  CONTRACT_TYPE_LABELS,
} from '@/application/services/ContractService';
import { TaxService } from '@/application/services/TaxService';
import ProjectDocumentUpload from '@/components/project/ProjectDocumentUpload';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MultiSelectCombobox } from '@/components/ui/multi-select-combobox';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import type { TaxRegimeDefinition } from '@/config/referentials/boq/tax-regimes.referential';
import type { ContractRecordDTO } from '@/dtos/entities/ContractRecordDTO';
import type { PhaseDTO } from '@/dtos/entities/PhaseDTO';
import {
  useContractLinesHex,
  useContractMutations,
} from '@/hooks/hexagonal/useContractsHex';
import { usePhasesHex } from '@/hooks/hexagonal/usePhasesHex';
import { useProjectsSelector, useSuppliersSelector } from '@/hooks/hexagonal/useSelectorsHex';
import { useTendersHex } from '@/hooks/hexagonal/useTendersHex';
import { FileDown, Loader2, Upload } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

interface ContractFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string | null;
  tenderId?: string | null;
  contract?: ContractRecordDTO | null;
  onSaved?: (contract: ContractRecordDTO) => void;
}

interface FormState {
  contractNumber: string;
  title: string;
  contractType: string;
  status: string;
  projectId: string;
  phaseId: string;
  tenderId: string;
  supplierIds: string[];
  taxRegimeCode: string;
  vatRate: string;
  startDate: string;
  endDate: string;
  totalAmount: string;
  currency: string;
  signedDocumentUrl: string;
  contentHtml: string;
  notes: string;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const CURRENCIES = ['MRU', 'EUR', 'USD'] as const;

const emptyState: FormState = {
  contractNumber: '',
  title: '',
  contractType: 'works',
  status: 'draft',
  projectId: '',
  phaseId: '',
  tenderId: '',
  supplierIds: [],
  taxRegimeCode: 'TRAVAUX_BTP',
  vatRate: '16',
  startDate: '',
  endDate: '',
  totalAmount: '0',
  currency: 'MRU',
  signedDocumentUrl: '',
  contentHtml: '',
  notes: '',
};

// ============================================================================
// UTILITAIRES
// ============================================================================

const money = (value: number, currency: string) =>
  `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value || 0)} ${currency}`;

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function ContractFormDialog({
  open,
  onOpenChange,
  projectId,
  tenderId,
  contract,
  onSaved,
}: ContractFormDialogProps) {
  const { createContract, updateContract, isPending } = useContractMutations();
  const [form, setForm] = useState<FormState>(emptyState);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);

  // ==========================================================================
  // HOOKS
  // ==========================================================================

  const { data: projects = [] } = useProjectsSelector({ enabled: open });
  const { data: suppliers = [] } = useSuppliersSelector(supplierSearch, open);
  const { phases } = usePhasesHex(form.projectId || undefined);
  const { tenders } = useTendersHex();
  const { data: contractLines = [] } = useContractLinesHex(contract?.id);

  const regimes = useMemo(() => TaxService.listRegimes(), []);

  // ==========================================================================
  // FILTRES ET DÉRIVÉS
  // ==========================================================================

  const awardedTenders = useMemo(
    () =>
      tenders.filter(
        (t) =>
          (!form.projectId || t.projectId === form.projectId) &&
          ['awarded', 'attributed', 'closed', 'under_evaluation'].includes(String(t.status)),
      ),
    [tenders, form.projectId],
  );

  // ==========================================================================
  // EFFETS
  // ==========================================================================

  useEffect(() => {
    if (!open) return;
    const meta = (contract?.metadata ?? {}) as Record<string, unknown>;
    if (contract) {
      setForm({
        contractNumber: contract.contractNumber ?? '',
        title: contract.title ?? '',
        contractType: contract.contractType ?? 'works',
        status: contract.status ?? 'draft',
        projectId: contract.projectId ?? '',
        phaseId: String(meta.phaseId ?? ''),
        tenderId: contract.tenderId ?? '',
        supplierIds: Array.isArray(meta.awardedSupplierIds)
          ? (meta.awardedSupplierIds as string[])
          : contract.supplierId
            ? [contract.supplierId]
            : [],
        taxRegimeCode: String(meta.taxRegimeCode ?? 'TRAVAUX_BTP'),
        vatRate: String(
          meta.vatRate != null ? Number(meta.vatRate) * (Number(meta.vatRate) <= 1 ? 100 : 1) : 16,
        ),
        startDate: contract.startDate?.slice(0, 10) ?? '',
        endDate: contract.endDate?.slice(0, 10) ?? '',
        totalAmount: String(contract.totalAmount ?? 0),
        currency: contract.currency ?? 'MRU',
        signedDocumentUrl: contract.signedDocumentUrl ?? '',
        contentHtml: String(meta.contentHtml ?? ''),
        notes: String(meta.notes ?? ''),
      });
    } else {
      setForm({
        ...emptyState,
        projectId: projectId ?? '',
        tenderId: tenderId ?? '',
      });
    }
  }, [open, contract, projectId, tenderId]);

  // ==========================================================================
  // FONCTIONS UTILITAIRES
  // ==========================================================================

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /** Pré-remplissage depuis l'appel d'offres attribué. */
  const applyTender = (id: string) => {
    setForm((prev) => {
      const tender = awardedTenders.find((t) => t.id === id);
      if (!tender) return { ...prev, tenderId: id };
      const project = projects.find((p) => p.id === (tender.projectId ?? prev.projectId));
      return {
        ...prev,
        tenderId: id,
        projectId: tender.projectId ?? prev.projectId,
        title:
          prev.title ||
          `Contrat — ${project?.title ?? tender.title} — ${tender.tenderNumber ?? tender.title}`,
        totalAmount:
          Number(prev.totalAmount) > 0
            ? prev.totalAmount
            : String(tender.budgetMax ?? tender.budgetMin ?? 0),
        startDate: prev.startDate || (tender.attributionDate?.slice(0, 10) ?? ''),
        endDate: prev.endDate || (tender.deadlineDate?.slice(0, 10) ?? ''),
      };
    });
  };

  /** Intitulé automatique « Contrat — Projet X — Lot/Phase Y ». */
  const autoTitle = () => {
    const project = projects.find((p) => p.id === form.projectId);
    const phase = phases.find((p) => p.id === form.phaseId) as PhaseDTO | undefined;
    const phaseName = phase?.phaseName || phase?.name || '';
    const parts = ['Contrat', project?.title, phaseName].filter(Boolean);
    if (parts.length < 2) {
      toast.info('Sélectionnez un projet pour générer l’intitulé.');
      return;
    }
    set('title', parts.join(' — '));
  };

  // ==========================================================================
  // CALCULS FINANCIERS
  // ==========================================================================

  const amountHt = Number(form.totalAmount) || 0;
  const vatRateValue = (Number(form.vatRate) || 0) / 100;
  const vatAmount = Math.round(amountHt * vatRateValue * 100) / 100;
  const amountTtc = Math.round((amountHt + vatAmount) * 100) / 100;

  // ==========================================================================
  // ACTIONS
  // ==========================================================================

  const buildPayload = () => ({
    contractNumber: form.contractNumber.trim() || undefined,
    title: form.title.trim(),
    contractType: form.contractType,
    status: form.status,
    startDate: form.startDate || null,
    endDate: form.endDate || null,
    totalAmount: amountHt,
    currency: form.currency,
    signedDocumentUrl: form.signedDocumentUrl.trim() || null,
    projectId: form.projectId || contract?.projectId || projectId || null,
    tenderId: form.tenderId || contract?.tenderId || tenderId || null,
    supplierId: form.supplierIds[0] ?? contract?.supplierId ?? null,
    metadata: {
      ...((contract?.metadata as Record<string, unknown>) ?? {}),
      phaseId: form.phaseId || null,
      awardedSupplierIds: form.supplierIds,
      awardedSupplierNames: form.supplierIds
        .map((id) => suppliers.find((s) => s.id === id)?.name)
        .filter(Boolean),
      taxRegimeCode: form.taxRegimeCode || null,
      vatRate: vatRateValue,
      vatAmount,
      totalTtc: amountTtc,
      contentHtml: form.contentHtml || null,
      notes: form.notes.trim() || null,
    } as Record<string, unknown>,
  });

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error('Intitulé du contrat requis');
      return;
    }
    try {
      const payload = buildPayload();
      const saved = contract
        ? await updateContract(contract.id, payload)
        : await createContract(payload);

      toast.success(contract ? 'Contrat mis à jour' : 'Contrat créé');
      onSaved?.(saved);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Enregistrement impossible');
    }
  };

  const handleGeneratePdf = () => {
    const project = projects.find((p) => p.id === form.projectId);
    const draft: ContractRecordDTO = {
      ...(contract ?? {
        id: 'draft',
        sourceEstimateId: null,
        signedAt: null,
        signedBy: null,
        signedDocumentId: null,
        createdAt: null,
        updatedAt: null,
      }),
      ...buildPayload(),
      contractNumber: form.contractNumber.trim() || contract?.contractNumber || 'CONTRAT-BROUILLON',
    } as ContractRecordDTO;

    getContractPdfService().download(draft, contractLines, {
      projectName: project?.title,
      supplierName: form.supplierIds
        .map((id) => suppliers.find((s) => s.id === id)?.name)
        .filter(Boolean)
        .join(', '),
    });
  };

  // ==========================================================================
  // RENDU
  // ==========================================================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contract ? 'Modifier le contrat' : 'Nouveau contrat'}</DialogTitle>
          <DialogDescription>
            Rattachement projet / phase / appel d'offres, attributaires, fiscalité et contenu du
            contrat. Le numéro est généré automatiquement s'il est laissé vide.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Rattachement */}
          <div className="space-y-1.5">
            <Label>Projet</Label>
            <SearchableSelect
              value={form.projectId}
              onChange={(v) => setForm((prev) => ({ ...prev, projectId: v, phaseId: '' }))}
              options={projects.map((p) => ({
                value: p.id,
                label: p.title,
                description: (p as { project_reference?: string | null }).project_reference ?? undefined,
              }))}
              placeholder="Rechercher un projet…"
              clearLabel="Aucun projet"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Phase / Lot</Label>
            <SearchableSelect
              value={form.phaseId}
              onChange={(v) => set('phaseId', v)}
              options={phases.map((p) => {
                // ✅ Correction : utiliser PhaseDTO avec phaseName
                const phase = p as unknown as PhaseDTO;
                return {
                  value: phase.id,
                  label: phase.phaseName || phase.name || 'Phase',
                };
              })}
              placeholder={form.projectId ? 'Sélectionner une phase…' : 'Choisir un projet d’abord'}
              disabled={!form.projectId}
              clearLabel="Aucune phase"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Appel d'offres attribué</Label>
            <SearchableSelect
              value={form.tenderId}
              onChange={applyTender}
              options={awardedTenders.map((t) => ({
                value: t.id,
                label: t.title,
                description: t.tenderNumber ?? undefined,
              }))}
              placeholder="Rechercher un appel d'offres…"
              clearLabel="Contrat hors AO"
            />
            <p className="text-xs text-muted-foreground">
              La sélection pré-remplit l'intitulé, le montant et les dates d'exécution.
            </p>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Attributaire(s)</Label>
            <MultiSelectCombobox
              values={form.supplierIds}
              onChange={(v) => set('supplierIds', v)}
              options={suppliers.map((s) => ({
                value: s.id,
                label: s.name,
                description: (s as any).type || (s as any).category || undefined,
              }))}
              placeholder="Sélectionner les titulaires (groupement possible)…"
              searchPlaceholder="Rechercher un fournisseur…"
            />
          </div>

          <Separator className="sm:col-span-2" />

          {/* Identification */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="contract-title">Intitulé *</Label>
            <div className="flex gap-2">
              <Input
                id="contract-title"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="Contrat de travaux — Lot 1"
              />
              <Button type="button" variant="outline" onClick={autoTitle}>
                Auto
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contract-number">Numéro</Label>
            <Input
              id="contract-number"
              value={form.contractNumber}
              onChange={(e) => set('contractNumber', e.target.value)}
              placeholder="CTR-2026-…"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={form.contractType} onValueChange={(v) => set('contractType', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONTRACT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {CONTRACT_TYPE_LABELS[type as keyof typeof CONTRACT_TYPE_LABELS] || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Statut</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONTRACT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {CONTRACT_STATUS_LABELS[status as keyof typeof CONTRACT_STATUS_LABELS] || status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Devise</Label>
            <Select value={form.currency} onValueChange={(v) => set('currency', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fiscalité */}
          <div className="space-y-1.5">
            <Label htmlFor="contract-amount">Montant HT</Label>
            <Input
              id="contract-amount"
              type="number"
              min="0"
              step="0.01"
              value={form.totalAmount}
              onChange={(e) => set('totalAmount', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Régime fiscal</Label>
            <Select
              value={form.taxRegimeCode}
              onValueChange={(code) => {
                const regime = regimes.find((r) => r.code === code);
                setForm((prev) => ({
                  ...prev,
                  taxRegimeCode: code,
                  vatRate: String(Math.round((regime?.vatRate ?? 0) * 100)),
                }));
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {regimes.map((r) => {
                  // ✅ Correction : utiliser labels plutôt que label
                  const regime = r as TaxRegimeDefinition & { labels?: { fr?: string }; label?: string };
                  return (
                    <SelectItem key={regime.code} value={regime.code}>
                      {regime.labels?.fr || regime.label || regime.code} — {Math.round((regime.vatRate ?? 0) * 100)} %
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contract-vat">Taux TVA (%)</Label>
            <Input
              id="contract-vat"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={form.vatRate}
              onChange={(e) => set('vatRate', e.target.value)}
            />
          </div>

          <div className="rounded-md border border-border bg-muted/40 p-3 text-sm sm:col-span-2">
            <div className="flex justify-between">
              <span>Total HT</span>
              <span>{money(amountHt, form.currency)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>TVA ({form.vatRate || 0} %)</span>
              <span>{money(vatAmount, form.currency)}</span>
            </div>
            <div className="mt-1 flex justify-between font-semibold">
              <span>Total TTC</span>
              <span>{money(amountTtc, form.currency)}</span>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-1.5">
            <Label htmlFor="contract-start">Début</Label>
            <Input
              id="contract-start"
              type="date"
              value={form.startDate}
              onChange={(e) => set('startDate', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contract-end">Fin</Label>
            <Input
              id="contract-end"
              type="date"
              value={form.endDate}
              onChange={(e) => set('endDate', e.target.value)}
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="contract-url">Lien du contrat signé (optionnel)</Label>
            <div className="flex gap-2">
              <Input
                id="contract-url"
                value={form.signedDocumentUrl}
                onChange={(e) => set('signedDocumentUrl', e.target.value)}
                placeholder="https://…"
              />
              <Button type="button" variant="outline" onClick={() => setUploadOpen((v) => !v)}>
                <Upload className="mr-2 h-4 w-4" />
                Importer
              </Button>
            </div>
          </div>

          {uploadOpen && (
            <div className="sm:col-span-2 rounded-md border border-border p-3">
              <ProjectDocumentUpload
                projectId={form.projectId || null}
                context="project"
                contextLabel={`Contrat ${form.contractNumber || form.title || 'brouillon'}`}
                onDocumentUploaded={() => {
                  setUploadOpen(false);
                  toast.success('Document rattaché au contrat');
                }}
              />
            </div>
          )}

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Contenu du contrat</Label>
            <RichTextEditor
              value={form.contentHtml}
              onChange={(html) => set('contentHtml', html)}
              placeholder="Objet, obligations des parties, modalités de paiement…"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="contract-notes">Notes</Label>
            <Textarea
              id="contract-notes"
              rows={3}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" onClick={handleGeneratePdf}>
            <FileDown className="mr-2 h-4 w-4" />
            Générer le contrat
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {contract ? 'Enregistrer' : 'Créer le contrat'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}