/**
 * BoqLineTable — tabular view of BOQ lines, exposing the SAME columns as the
 * parser: Désignation · Phase · Type · Unité · L · l · h · Qté · PU · TVA%
 * · Total HT · Actions. Editable inline when `editable`.
 */
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getPhase, WBS_REFERENTIAL, type WbsPhase } from '@/config/referentials/wbs/wbs.referential';
import { getPhasesForReferential, type ReferentialType } from '@/config/referentials';
import { ELEMENT_TYPES } from '@/config/referentials/boq/element-types.referential';
import { useMemo, useState, useEffect } from 'react';

interface Props {
  lines: BoqLineDTO[];
  emptyLabel?: string;
  editable?: boolean;
  referentialCode?: ReferentialType;
  phases?: WbsPhase[];
  onChange?: (index: number, patch: Partial<BoqLineDTO>) => void;
  onRemove?: (index: number) => void;
  pageSize?: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MRU', maximumFractionDigits: 0 }).format(n);

const NONE = '__none__';
const UNITS = ['u', 'ml', 'm2', 'm3', 'kg', 'h', 'j', 'ff', 'ens', 'lot'];

export function BoqLineTable({
  lines,
  emptyLabel = 'Aucune ligne. Cliquez « Ajouter une ligne » ou importez un fichier.',
  editable = false,
  referentialCode,
  phases: phasesOverride,
  onChange,
  onRemove,
  pageSize = 10,
}: Props) {
  const [page, setPage] = useState(0);
  useEffect(() => { setPage(0); }, [lines.length]);

  const phases: WbsPhase[] = useMemo(() => {
    if (phasesOverride && phasesOverride.length > 0) return phasesOverride;
    if (!referentialCode) return WBS_REFERENTIAL;
    return getPhasesForReferential(referentialCode).map((phase) => ({
      id: phase.code, label: phase.label,
      milestones: phase.steps.map((step) => ({
        id: step.code, label: step.label,
        tasks: step.tasks.map((task) => ({ id: task.code, label: task.label })),
      })),
    }));
  }, [phasesOverride, referentialCode]);

  const total = lines.reduce((acc, l) => acc + (l.totalHt ?? l.quantity * (l.unitPrice ?? 0)), 0);

  const phaseLabel = (id?: string | null) =>
    id ? (phases.find((p) => p.id === id)?.label ?? getPhase(id)?.label ?? id) : null;

  const patch = (i: number, p: Partial<BoqLineDTO>) => {
    // Recompute total_ht locally when qty/pu change
    const next: Partial<BoqLineDTO> = { ...p };
    if ('quantity' in p || 'unitPrice' in p) {
      const q = 'quantity' in p ? (p.quantity ?? 0) : (lines[i].quantity ?? 0);
      const pu = 'unitPrice' in p ? (p.unitPrice ?? 0) : (lines[i].unitPrice ?? 0);
      next.totalHt = (Number(q) || 0) * (Number(pu) || 0);
    }
    onChange?.(i, next);
  };

  const usePaging = pageSize > 0 && lines.length > pageSize;
  const totalPages = usePaging ? Math.max(1, Math.ceil(lines.length / pageSize)) : 1;
  const safePage = Math.min(page, totalPages - 1);
  const start = usePaging ? safePage * pageSize : 0;
  const end = usePaging ? start + pageSize : lines.length;
  const pageRows = usePaging ? lines.slice(start, end) : lines;

  const colCount = editable && onRemove ? 12 : 11;

  return (
    <div className="space-y-2">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[220px]">Désignation</TableHead>
              <TableHead className="min-w-[140px]">Phase</TableHead>
              <TableHead>Type ouvrage</TableHead>
              <TableHead>Unité</TableHead>
              <TableHead className="text-right">L</TableHead>
              <TableHead className="text-right">l</TableHead>
              <TableHead className="text-right">h</TableHead>
              <TableHead className="text-right">Qté</TableHead>
              <TableHead className="text-right">PU</TableHead>
              <TableHead className="text-right">TVA %</TableHead>
              <TableHead className="text-right">Total HT</TableHead>
              {editable && onRemove && <TableHead className="w-8" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.length === 0 && (
              <TableRow>
                <TableCell colSpan={colCount} className="text-center text-sm text-muted-foreground py-8">
                  {emptyLabel}
                </TableCell>
              </TableRow>
            )}
            {pageRows.map((l, idx) => {
              const i = start + idx;
              const lineTotal = l.totalHt ?? l.quantity * (l.unitPrice ?? 0);
              return (
                <TableRow key={l.id ?? `row-${i}`}>
                  <TableCell className="font-medium">
                    {editable ? (
                      <Input value={l.designation} onChange={(e) => patch(i, { designation: e.target.value })} className="h-8" />
                    ) : l.designation}
                  </TableCell>
                  <TableCell>
                    {editable ? (
                      <Select value={l.phaseId ?? NONE} onValueChange={(v) => patch(i, { phaseId: v === NONE ? null : v, milestoneId: null, taskId: null })}>
                        <SelectTrigger className="h-8"><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>—</SelectItem>
                          {phases.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : l.phaseId ? <Badge variant="secondary">{phaseLabel(l.phaseId)}</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    {editable ? (
                      <Select value={l.elementType ?? 'generic'} onValueChange={(v) => patch(i, { elementType: v === 'generic' ? null : v })}>
                        <SelectTrigger className="h-8 w-[130px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="generic">— saisie —</SelectItem>
                          {ELEMENT_TYPES.map((e) => <SelectItem key={e.code} value={e.code}>{e.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : <Badge variant="outline">{l.elementType ?? l.resourceType ?? '—'}</Badge>}
                  </TableCell>
                  <TableCell>
                    {editable ? (
                      <Select value={l.unit ?? 'u'} onValueChange={(v) => patch(i, { unit: v })}>
                        <SelectTrigger className="h-8 w-[80px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : l.unit}
                  </TableCell>
                  <TableCell className="text-right">
                    {editable ? <Input type="number" value={l.length ?? ''} onChange={(e) => patch(i, { length: e.target.value === '' ? null : Number(e.target.value) })} className="h-8 w-20 text-right" /> : (l.length ?? '—')}
                  </TableCell>
                  <TableCell className="text-right">
                    {editable ? <Input type="number" value={l.width ?? ''} onChange={(e) => patch(i, { width: e.target.value === '' ? null : Number(e.target.value) })} className="h-8 w-20 text-right" /> : (l.width ?? '—')}
                  </TableCell>
                  <TableCell className="text-right">
                    {editable ? <Input type="number" value={l.height ?? ''} onChange={(e) => patch(i, { height: e.target.value === '' ? null : Number(e.target.value) })} className="h-8 w-20 text-right" /> : (l.height ?? '—')}
                  </TableCell>
                  <TableCell className="text-right">
                    {editable ? <Input type="number" value={l.quantity ?? 0} onChange={(e) => patch(i, { quantity: Number(e.target.value) || 0 })} className="h-8 w-24 text-right" /> : l.quantity}
                  </TableCell>
                  <TableCell className="text-right">
                    {editable ? <Input type="number" value={l.unitPrice ?? 0} onChange={(e) => patch(i, { unitPrice: Number(e.target.value) || 0 })} className="h-8 w-28 text-right" /> : (l.unitPrice != null ? fmt(l.unitPrice) : '—')}
                  </TableCell>
                  <TableCell className="text-right">
                    {editable ? <Input type="number" step={0.01} value={l.vatRate ?? 0} onChange={(e) => patch(i, { vatRate: Number(e.target.value) || 0 })} className="h-8 w-20 text-right" /> : `${((l.vatRate ?? 0) * 100).toFixed(0)}%`}
                  </TableCell>
                  <TableCell className="text-right font-medium">{fmt(lineTotal)}</TableCell>
                  {editable && onRemove && (
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onRemove(i)} aria-label="Supprimer la ligne">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
            {lines.length > 0 && (
              <TableRow>
                <TableCell colSpan={colCount - 1} className="text-right font-semibold">Total HT</TableCell>
                <TableCell className="text-right font-bold">{fmt(total)}</TableCell>
                {editable && onRemove && <TableCell />}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {usePaging && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Lignes {start + 1} à {Math.min(end, lines.length)} sur {lines.length}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={safePage === 0}>
              <ChevronLeft className="h-4 w-4" /> Précédent
            </Button>
            <span>Page {safePage + 1} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1}>
              Suivant <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
