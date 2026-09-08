/**
 * src/components/boq/BoqLineTable.tsx
 * BoqLineTable — grille unique saisie/import alignée sur les colonnes parseur.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type { BoqResourceType } from '@/domain/entities/boq/BoqLine';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle, Calculator } from 'lucide-react';
import { MeterService } from '@/application/services/boq/MeterService';
import { MetreDialog } from './MetreDialog';

import DataPagination from '@/components/common/DataPagination';
import { WBS_REFERENTIAL, type WbsPhase } from '@/config/referentials/wbs/wbs.referential';
import { getPhasesForReferential, type ReferentialType } from '@/config/referentials';
import { ELEMENT_TYPES } from '@/config/referentials/boq/element-types.referential';
import { DQE_UNIT_CODES } from '@/config/referentials/boq/unit-catalog.referential';
import { T } from '@/components/i18n/T';
import { TaxService } from '@/application/services/TaxService';
import { PcmAccountSelect } from './PcmAccountSelect';
import { SearchableSelect } from '@/components/ui/searchable-select';



export interface StakeholderOption {
  id: string;
  name: string;
  type: 'organization' | 'employee' | 'supplier';
}

interface Props {
  lines: BoqLineDTO[];
  emptyLabel?: string;
  editable?: boolean;
  referentialCode?: ReferentialType;
  phases?: WbsPhase[];
  /** Parties prenantes assignables ligne à ligne (organisation / employé / fournisseur). */
  stakeholders?: StakeholderOption[];
  onChange?: (index: number, patch: Partial<BoqLineDTO>) => void;
  onRemove?: (index: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  /** Position des lignes ajoutées par le parent, pour afficher immédiatement la nouvelle saisie. */
  newRowsAt?: 'start' | 'end';
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MRU', maximumFractionDigits: 0 }).format(n);
const NONE = '__none__';
const UNITS = DQE_UNIT_CODES;
const TAX_REGIMES_OPTIONS = TaxService.listRegimes();
const RESOURCE_TYPES: { value: BoqResourceType; label: string }[] = [
  { value: 'material', label: 'Métré / matériau' },
  { value: 'labor', label: "RH / prestation" },
  { value: 'equipment', label: 'Équipement' },
];
const STAKEHOLDER_GROUPS: { type: StakeholderOption['type']; label: string }[] = [
  { type: 'organization', label: 'Organisations' },
  { type: 'employee', label: 'Employés' },
  { type: 'supplier', label: 'Fournisseurs' },
];

const stakeholderOf = (l: BoqLineDTO) =>
  (l.metadata as { stakeholder?: { id?: string; name?: string; type?: string } } | null)?.stakeholder ?? null;

export function BoqLineTable({ lines, emptyLabel = 'Document vide — ajoutez, importez ou calculez des lignes.', editable = false, referentialCode, phases: phasesOverride, stakeholders = [], onChange, onRemove, pageSize = 10, onPageSizeChange, pageSizeOptions, newRowsAt = 'end' }: Props) {

  const [page, setPage] = useState(0);
  const [metreIndex, setMetreIndex] = useState<number | null>(null);
  const previousLength = useRef(lines.length);
  const previousPageSize = useRef(pageSize);


  useEffect(() => {
    const previousPages = pageSize > 0 ? Math.max(1, Math.ceil(previousLength.current / pageSize)) : 1;
    const nextPages = pageSize > 0 ? Math.max(1, Math.ceil(lines.length / pageSize)) : 1;
    if (pageSize !== previousPageSize.current) {
      setPage(0);
    } else if (lines.length > previousLength.current && previousLength.current > 0) {
      setPage(newRowsAt === 'start' ? 0 : nextPages - 1);
    } else if (previousPages !== nextPages) {
      setPage((current) => Math.min(current, nextPages - 1));
    }
    previousLength.current = lines.length;
    previousPageSize.current = pageSize;
  }, [lines.length, pageSize]);

  const phases: WbsPhase[] = useMemo(() => {
    if (phasesOverride?.length) return phasesOverride;
    if (!referentialCode) return WBS_REFERENTIAL;
    return getPhasesForReferential(referentialCode).map((phase) => ({
      id: phase.code,
      label: phase.label,
      milestones: phase.steps.map((step) => ({
        id: step.code,
        label: step.label,
        tasks: step.tasks.map((task) => ({ id: task.code, label: task.label })),
      })),
    }));
  }, [phasesOverride, referentialCode]);

  const phaseOf = (id?: string | null) => phases.find((p) => p.id === id);
  const milestoneOf = (phaseId?: string | null, milestoneId?: string | null) => phaseOf(phaseId)?.milestones.find((m) => m.id === milestoneId);
  const taskOf = (phaseId?: string | null, milestoneId?: string | null, taskId?: string | null) => milestoneOf(phaseId, milestoneId)?.tasks.find((t) => t.id === taskId);
  const lineTotal = (l: BoqLineDTO) => l.totalHt || ((l.quantity || 0) * (l.unitPrice ?? 0) + (l.fees ?? 0));
  // Fiscalité temps réel ligne à ligne : TVA, RAS, TTC et déductibilité LFR 2026,
  // résolues par TaxService (régime + compte PCM), jamais recalculées à la main.
  const taxOf = (l: BoqLineDTO) => TaxService.resolve({ ...l, totalHt: lineTotal(l) });
  const lineVat = (l: BoqLineDTO) => taxOf(l).vatAmount;
  const lineRas = (l: BoqLineDTO) => taxOf(l).rasAmount;
  const lineTtc = (l: BoqLineDTO) => lineTotal(l) + lineVat(l);
  const total = lines.reduce((acc, l) => acc + lineTotal(l), 0);
  const totalVat = lines.reduce((acc, l) => acc + lineVat(l), 0);
  const totalRas = lines.reduce((acc, l) => acc + lineRas(l), 0);
  const totalTtc = total + totalVat;


  const patch = (i: number, p: Partial<BoqLineDTO>) => {
    const next: Partial<BoqLineDTO> = { ...p };
    const line = lines[i];
    // Métré centralisé : le type d'ouvrage fixe l'unité et la formule, les
    // dimensions recalculent la quantité en temps réel (MeterService).
    const touchesMetre = 'elementType' in p || 'length' in p || 'width' in p || 'height' in p;
    if (touchesMetre) {
      const merged = { ...line, ...p } as BoqLineDTO;
      const metre = MeterService.quantityFor({
        designation: merged.designation,
        elementType: merged.elementType,
        length: merged.length,
        width: merged.width,
        height: merged.height,
      });
      if (metre.unit) next.unit = metre.unit;
      if (metre.quantity > 0) next.quantity = Number(metre.quantity.toFixed(3));
    }
    if ('quantity' in next || 'unitPrice' in p || 'fees' in p) {
      const q = 'quantity' in next ? (next.quantity ?? 0) : (line.quantity ?? 0);
      const pu = 'unitPrice' in p ? (p.unitPrice ?? 0) : (line.unitPrice ?? 0);
      const fees = 'fees' in p ? (p.fees ?? 0) : (line.fees ?? 0);
      next.totalHt = (Number(q) || 0) * (Number(pu) || 0) + (Number(fees) || 0);
    }
    onChange?.(i, next);
  };


  const usePaging = pageSize > 0 && lines.length > pageSize;
  const totalPages = usePaging ? Math.max(1, Math.ceil(lines.length / pageSize)) : 1;
  const safePage = Math.min(page, totalPages - 1);
  const start = usePaging ? safePage * pageSize : 0;
  const end = usePaging ? start + pageSize : lines.length;
  const pageRows = usePaging ? lines.slice(start, end) : lines;
  const hasActions = editable && !!onRemove;
  // Colonnes déclarées une seule fois et rendues en flux adaptatif à toute largeur.
  const columns: { id: string; label: ReactNode; align?: 'right'; head?: string; cell: (l: BoqLineDTO, i: number) => ReactNode }[] = [
    {
      id: 'designation', label: <T k="auto.boqlinetable.designation" fallback="Désignation" />, head: 'min-w-[240px]',
      cell: (l, i) => editable ? <Input value={l.designation} onChange={(e) => patch(i, { designation: e.target.value })} className="h-8 w-full" /> : <span className="font-medium">{l.designation}</span>,
    },
    {
      id: 'phase', label: <T k="auto.boqlinetable.phase" fallback="Phase" />, head: 'min-w-[150px]',
      cell: (l, i) => editable ? <SearchableSelect value={l.phaseId ?? undefined} onChange={(v) => patch(i, { phaseId: v || null, milestoneId: null, taskId: null })} options={phases.map((p) => ({ value: p.id, label: p.label }))} placeholder="—" searchPlaceholder="Rechercher une phase…" clearLabel="—" className="h-8 w-full" /> : (phaseOf(l.phaseId) ? <Badge variant="secondary">{phaseOf(l.phaseId)!.label}</Badge> : <span className="text-xs text-muted-foreground">—</span>),
    },
    {
      id: 'milestone', label: <T k="auto.boqlinetable.jalon" fallback="Jalon" />, head: 'min-w-[150px]',
      cell: (l, i) => editable ? <SearchableSelect value={l.milestoneId ?? undefined} onChange={(v) => patch(i, { milestoneId: v || null, taskId: null })} options={(phaseOf(l.phaseId)?.milestones ?? []).map((m) => ({ value: m.id, label: m.label }))} placeholder="—" searchPlaceholder="Rechercher un jalon…" clearLabel="—" disabled={!l.phaseId} className="h-8 w-full" /> : (milestoneOf(l.phaseId, l.milestoneId) ? <Badge variant="outline">{milestoneOf(l.phaseId, l.milestoneId)!.label}</Badge> : <span className="text-xs text-muted-foreground">—</span>),
    },
    {
      id: 'task', label: <T k="auto.boqlinetable.tache" fallback="Tâche" />, head: 'min-w-[150px]',
      cell: (l, i) => editable ? <SearchableSelect value={l.taskId ?? undefined} onChange={(v) => patch(i, { taskId: v || null })} options={(milestoneOf(l.phaseId, l.milestoneId)?.tasks ?? []).map((t) => ({ value: t.id, label: t.label }))} placeholder="—" searchPlaceholder="Rechercher une tâche…" clearLabel="—" disabled={!l.milestoneId} className="h-8 w-full" /> : (taskOf(l.phaseId, l.milestoneId, l.taskId) ? <span className="text-xs">{taskOf(l.phaseId, l.milestoneId, l.taskId)!.label}</span> : <span className="text-xs text-muted-foreground">—</span>),
    },
    {
      id: 'resourceType', label: <T k="auto.boqlinetable.nature" fallback="Nature" />, head: 'min-w-[140px]',
      cell: (l, i) => editable ? <Select value={l.resourceType ?? 'material'} onValueChange={(v) => patch(i, { resourceType: v as BoqResourceType })}><SelectTrigger className="h-8 w-full"><SelectValue /></SelectTrigger><SelectContent>{RESOURCE_TYPES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent></Select> : <Badge variant={l.resourceType === 'labor' ? 'default' : 'secondary'}>{RESOURCE_TYPES.find((r) => r.value === (l.resourceType ?? 'material'))?.label}</Badge>,
    },
    {
      id: 'elementType', label: <T k="auto.boqlinetable.type_ouvrage" fallback="Type ouvrage" />, head: 'min-w-[140px]',
      cell: (l, i) => editable ? <Select value={l.elementType ?? 'generic'} onValueChange={(v) => patch(i, { elementType: v === 'generic' ? null : v })}><SelectTrigger className="h-8 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="generic">— saisie —</SelectItem>{ELEMENT_TYPES.map((e) => <SelectItem key={e.code} value={e.code}>{e.label}</SelectItem>)}</SelectContent></Select> : <Badge variant="outline">{l.elementType ?? '—'}</Badge>,
    },
    {
      id: 'stakeholder', label: <T k="auto.boqlinetable.intervenant" fallback="Intervenant" />, head: 'min-w-[160px]',
      cell: (l, i) => editable ? <Select value={stakeholderOf(l)?.id ?? NONE} onValueChange={(v) => { const opt = stakeholders.find((s) => s.id === v); patch(i, { metadata: { ...(l.metadata ?? {}), stakeholder: v === NONE || !opt ? null : { id: opt.id, name: opt.name, type: opt.type } } }); }}><SelectTrigger className="h-8 w-full"><SelectValue placeholder="—" /></SelectTrigger><SelectContent><SelectItem value={NONE}>—</SelectItem>{STAKEHOLDER_GROUPS.map(({ type, label }) => { const opts = stakeholders.filter((s) => s.type === type); if (!opts.length) return null; return [<SelectItem key={`${type}-h`} value={`__group_${type}`} disabled>{label}</SelectItem>, ...opts.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)]; })}</SelectContent></Select> : <span className="text-xs">{stakeholderOf(l)?.name ?? '—'}</span>,
    },
    {
      id: 'unit', label: <T k="auto.boqlinetable.unite" fallback="Unité" />,
      cell: (l, i) => editable ? <Select value={l.unit ?? 'u'} onValueChange={(v) => patch(i, { unit: v })}><SelectTrigger className="h-8 w-full min-w-[80px]"><SelectValue /></SelectTrigger><SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select> : <>{l.unit}</>,
    },
    { id: 'length', label: 'L', align: 'right', cell: (l, i) => editable ? <Input type="number" value={l.length ?? ''} onChange={(e) => patch(i, { length: e.target.value === '' ? null : Number(e.target.value) })} className="h-8 w-full min-w-[64px] text-right" /> : <>{l.length ?? '—'}</> },
    { id: 'width', label: 'l', align: 'right', cell: (l, i) => editable ? <Input type="number" value={l.width ?? ''} onChange={(e) => patch(i, { width: e.target.value === '' ? null : Number(e.target.value) })} className="h-8 w-full min-w-[64px] text-right" /> : <>{l.width ?? '—'}</> },
    { id: 'height', label: 'h', align: 'right', cell: (l, i) => editable ? <Input type="number" value={l.height ?? ''} onChange={(e) => patch(i, { height: e.target.value === '' ? null : Number(e.target.value) })} className="h-8 w-full min-w-[64px] text-right" /> : <>{l.height ?? '—'}</> },
    { id: 'quantity', label: <T k="auto.boqlinetable.qte" fallback="Qté" />, align: 'right', cell: (l, i) => editable ? <Input type="number" value={l.quantity ?? 0} onChange={(e) => patch(i, { quantity: Number(e.target.value) || 0 })} className="h-8 w-full min-w-[80px] text-right" /> : <>{l.quantity}</> },
    { id: 'unitPrice', label: 'PU', align: 'right', cell: (l, i) => editable ? <Input type="number" value={l.unitPrice ?? 0} onChange={(e) => patch(i, { unitPrice: Number(e.target.value) || 0 })} className="h-8 w-full min-w-[96px] text-right" /> : <>{l.unitPrice != null ? fmt(l.unitPrice) : '—'}</> },
    {
      id: 'regime', label: <T k="auto.boqlinetable.regime_tva" fallback="Régime TVA" />, head: 'min-w-[170px]',
      cell: (l, i) => editable ? (
        <Select
          value={l.taxRegimeCode ?? TaxService.detectTaxRegime(l).code}
          onValueChange={(v) => {
            const regime = TAX_REGIMES_OPTIONS.find((r) => r.code === v);
            patch(i, { taxRegimeCode: v, vatRate: regime?.vatRate ?? 0, rasRate: regime?.withholdingRate ?? 0 });
          }}
        >
          <SelectTrigger className="h-8 w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TAX_REGIMES_OPTIONS.map((r) => <SelectItem key={r.code} value={r.code}>{r.labels.fr}</SelectItem>)}
          </SelectContent>
        </Select>
      ) : <span className="text-xs text-muted-foreground">{TaxService.detectTaxRegime(l).labels.fr}</span>,
    },
    {
      id: 'account', label: <T k="dqe.line.pcm_account" fallback="Compte PCM" />, head: 'min-w-[200px]',
      cell: (l, i) => editable ? (
        <PcmAccountSelect value={l.accountCode ?? taxOf(l).accountCode} onChange={(code) => patch(i, { accountCode: code })} className="w-full" />
      ) : (
        <span className="text-xs text-muted-foreground">{taxOf(l).accountCode ? `${taxOf(l).accountCode} · ${taxOf(l).accountLabel ?? ''}` : '—'}</span>
      ),
    },
    {
      id: 'vat', label: <T k="auto.boqlinetable.tva" fallback="TVA %" />, align: 'right',
      cell: (l, i) => (
        <>
          {editable ? <Input type="number" step={0.01} value={l.vatRate ?? 0} onChange={(e) => patch(i, { vatRate: Number(e.target.value) || 0 })} className="h-8 w-full min-w-[72px] text-right" /> : `${((l.vatRate ?? 0) * 100).toFixed(0)}%`}
          <div className="text-[10px] text-muted-foreground">{fmt(lineVat(l))}</div>
        </>
      ),
    },
    {
      id: 'ras', label: <T k="auto.boqlinetable.ras" fallback="RAS %" />, align: 'right',
      cell: (l, i) => (
        <>
          {editable ? <Input type="number" step={0.01} value={l.rasRate ?? 0} onChange={(e) => patch(i, { rasRate: Number(e.target.value) || 0 })} className="h-8 w-full min-w-[72px] text-right" /> : `${((l.rasRate ?? 0) * 100).toFixed(0)}%`}
          <div className="text-[10px] text-muted-foreground">{fmt(lineRas(l))}</div>
        </>
      ),
    },
    { id: 'fees', label: <T k="auto.boqlinetable.frais" fallback="Frais" />, align: 'right', cell: (l, i) => editable ? <Input type="number" value={l.fees ?? 0} onChange={(e) => patch(i, { fees: Number(e.target.value) || 0 })} className="h-8 w-full min-w-[80px] text-right" /> : <>{fmt(l.fees ?? 0)}</> },
    { id: 'totalHt', label: <T k="auto.boqlinetable.total_ht" fallback="Total HT" />, align: 'right', cell: (l) => <span className="font-medium">{fmt(lineTotal(l))}</span> },
    { id: 'totalTtc', label: <T k="dqe.line.total_ttc" fallback="Total TTC" />, align: 'right', cell: (l) => <span className="font-semibold">{fmt(lineTtc(l))}</span> },
  ];

  const lineFlag = (l: BoqLineDTO) => taxOf(l).deductibility.deductible ? null : (
    <span title={`Non déductible (LFR 2026) : ${taxOf(l).deductibility.issues.map((x) => x.message).join(' • ')}`}>
      <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
    </span>
  );
  const rowKey = (l: BoqLineDTO, i: number) => l.id ?? String((l.metadata as { clientRowId?: string } | null)?.clientRowId ?? `row-${i}`);

  const totalsRows: { label: ReactNode; value: string }[] = [
    { label: <T k="auto.boqlinetable.total_ht" fallback="Total HT" />, value: fmt(total) },
    { label: <T k="dqe.line.total_vat" fallback="Total TVA" />, value: fmt(totalVat) },
    { label: <T k="dqe.line.total_ras" fallback="Total retenues RAS" />, value: `-${fmt(totalRas)}` },
    { label: <T k="dqe.line.total_ttc" fallback="Total TTC" />, value: fmt(totalTtc) },
  ];

  return (
    <div className="space-y-2">
      <div className="min-w-0">
        {lines.length === 0 && (
          <p className="rounded-md border py-8 text-center text-sm text-muted-foreground">{emptyLabel}</p>
        )}
        {pageRows.map((l, idx) => {
          const i = start + idx;
          return (
            <section key={rowKey(l, i)} className="min-w-0 border-b py-4 first:border-t">
              <div className="mb-3 flex min-w-0 items-start justify-between gap-2">
                <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground">N° {i + 1}{lineFlag(l)}</span>
                {!editable && <div className="min-w-0 flex-1 break-words text-sm font-medium">{l.designation}</div>}
                <div className="flex shrink-0 items-center gap-1">
                  {editable && (
                    <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => setMetreIndex(i)}>
                      <Calculator className="h-3.5 w-3.5" /> Calcul métré
                    </Button>
                  )}
                  {hasActions && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onRemove?.(i)} aria-label="Supprimer la ligne">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              {MeterService.detectAnomalies(l).map((a) => (
                <p key={a.code} className="mb-2 flex items-start gap-1 text-xs text-destructive">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="break-words">{a.message}</span>
                </p>
              ))}
              <div className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {columns.map((c) => (
                  <div key={c.id} className={c.id === 'designation' ? 'min-w-0 sm:col-span-2 lg:col-span-3 2xl:col-span-4' : 'min-w-0'}>
                    <div className="mb-1 text-[11px] font-medium text-muted-foreground">{c.label}</div>
                    <div className="min-w-0 break-words text-sm">{c.cell(l, i)}</div>
                  </div>
                ))}
              </div>
            </section>

          );
        })}
        {lines.length > 0 && (
          <div className="mt-3 grid grid-cols-1 gap-2 border-y bg-muted/40 p-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            {totalsRows.map((r, i) => (
              <div key={i} className="min-w-0">
                <div className="text-xs font-medium text-muted-foreground">{r.label}</div>
                <div className="break-words font-bold">{r.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {usePaging && (
        <DataPagination
          page={safePage}
          totalItems={lines.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={pageSizeOptions}
        />
      )}
    </div>
  );
}

