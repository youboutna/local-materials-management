/**
 * BoqLineTable — tabular view of BOQ lines.
 * Read-only by default; pass `editable` + `onChange(index, patch)` to enable
 * inline edition of designation / quantity / unit / unit price / phase.
 */
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { getPhase, WBS_REFERENTIAL, type WbsPhase } from '@/config/referentials/wbs/wbs.referential';
import { getPhasesForReferential, type ReferentialType } from '@/config/referentials';
import { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  lines: BoqLineDTO[];
  emptyLabel?: string;
  editable?: boolean;
  referentialCode?: ReferentialType;
  /** Override dynamique (phases réelles du projet). Prioritaire sur referentialCode. */
  phases?: WbsPhase[];
  onChange?: (index: number, patch: Partial<BoqLineDTO>) => void;
  onRemove?: (index: number) => void;
  /** Number of rows per page. Set to 0 to disable pagination. */
  pageSize?: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MRU', maximumFractionDigits: 0 }).format(n);

const NONE = '__none__';

export function BoqLineTable({
  lines,
  emptyLabel = 'Aucune ligne',
  editable = false,
  referentialCode,
  phases: phasesOverride,
  onChange,
  onRemove,
  pageSize = 10,
}: Props) {
  const [page, setPage] = useState(0);
  // Reset pagination when the dataset shrinks or is replaced (e.g. new import).
  useEffect(() => { setPage(0); }, [lines.length]);

  const phases: WbsPhase[] = useMemo(() => {
    if (phasesOverride && phasesOverride.length > 0) return phasesOverride;
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

  if (!lines.length) {
    return <div className="text-sm text-muted-foreground p-4 border rounded-md">{emptyLabel}</div>;
  }
  const total = lines.reduce((acc, l) => acc + (l.totalHt ?? l.quantity * (l.unitPrice ?? 0)), 0);

  const phaseLabel = (id?: string | null) => {
    if (!id) return null;
    return phases.find((p) => p.id === id)?.label ?? getPhase(id)?.label ?? id;
  };

  const patch = (i: number, p: Partial<BoqLineDTO>) => onChange?.(i, p);

  const usePaging = pageSize > 0 && lines.length > pageSize;
  const totalPages = usePaging ? Math.max(1, Math.ceil(lines.length / pageSize)) : 1;
  const safePage = Math.min(page, totalPages - 1);
  const start = usePaging ? safePage * pageSize : 0;
  const end = usePaging ? start + pageSize : lines.length;
  const pageRows = usePaging ? lines.slice(start, end) : lines;

  return (
    <div className="space-y-2">
    <div className="rounded-md border overflow-x-auto">

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[220px]">Désignation</TableHead>
            <TableHead className="min-w-[180px]">Phase</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Qté</TableHead>
            <TableHead>Unité</TableHead>
            <TableHead className="text-right">PU</TableHead>
            <TableHead className="text-right">Total HT</TableHead>
            {editable && onRemove && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((l, idx) => {
            const i = start + idx;
            const lineTotal = l.totalHt ?? l.quantity * (l.unitPrice ?? 0);
            return (
              <TableRow key={l.id ?? `row-${i}`}>

                <TableCell className="font-medium">
                  {editable ? (
                    <Input
                      value={l.designation}
                      onChange={(e) => patch(i, { designation: e.target.value })}
                      className="h-8"
                    />
                  ) : (
                    l.designation
                  )}
                </TableCell>
                <TableCell>
                  {editable ? (
                    <Select
                      value={l.phaseId ?? NONE}
                      onValueChange={(v) =>
                        patch(i, { phaseId: v === NONE ? null : v, milestoneId: null, taskId: null })
                      }
                    >
                      <SelectTrigger className="h-8"><SelectValue placeholder="Phase" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>—</SelectItem>
                        {phases.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : l.phaseId ? (
                    <Badge variant="secondary">{phaseLabel(l.phaseId)}</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {editable ? (
                    <Select
                      value={l.resourceType ?? 'material'}
                      onValueChange={(v) => patch(i, { resourceType: v as BoqLineDTO['resourceType'] })}
                    >
                      <SelectTrigger className="h-8 w-[120px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="material">material</SelectItem>
                        <SelectItem value="labour">labour</SelectItem>
                        <SelectItem value="equipment">equipment</SelectItem>
                        <SelectItem value="service">service</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline">{l.resourceType ?? 'material'}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {editable ? (
                    <Input
                      type="number"
                      value={l.quantity ?? 0}
                      onChange={(e) => patch(i, { quantity: Number(e.target.value) || 0 })}
                      className="h-8 w-24 text-right"
                    />
                  ) : (
                    l.quantity
                  )}
                </TableCell>
                <TableCell>
                  {editable ? (
                    <Input
                      value={l.unit ?? ''}
                      onChange={(e) => patch(i, { unit: e.target.value })}
                      className="h-8 w-20"
                    />
                  ) : (
                    l.unit
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {editable ? (
                    <Input
                      type="number"
                      value={l.unitPrice ?? 0}
                      onChange={(e) => patch(i, { unitPrice: Number(e.target.value) || 0 })}
                      className="h-8 w-28 text-right"
                    />
                  ) : l.unitPrice != null ? (
                    fmt(l.unitPrice)
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">{fmt(lineTotal)}</TableCell>
                {editable && onRemove && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => onRemove(i)}
                      aria-label="Supprimer la ligne"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
          <TableRow>
            <TableCell colSpan={editable && onRemove ? 7 : 6} className="text-right font-semibold">
              Total HT
            </TableCell>
            <TableCell className="text-right font-bold">{fmt(total)}</TableCell>
          </TableRow>
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
