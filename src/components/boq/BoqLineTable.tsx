/**
 * BoqLineTable — read-only tabular view of BOQ lines, groupable by phase.
 * Reused by DQE Import preview, Tender Estimator view, Supplier Bid review,
 * and the Project Quantity Takeoffs list.
 */
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getPhase } from '@/config/referentials/wbs/wbs.referential';

interface Props {
  lines: BoqLineDTO[];
  emptyLabel?: string;
}

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MRU', maximumFractionDigits: 0 }).format(n);

export function BoqLineTable({ lines, emptyLabel = 'Aucune ligne' }: Props) {
  if (!lines.length) {
    return <div className="text-sm text-muted-foreground p-4 border rounded-md">{emptyLabel}</div>;
  }
  const total = lines.reduce((acc, l) => acc + (l.totalHt ?? l.quantity * (l.unitPrice ?? 0)), 0);
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Désignation</TableHead>
            <TableHead>Phase</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Qté</TableHead>
            <TableHead>Unité</TableHead>
            <TableHead className="text-right">PU</TableHead>
            <TableHead className="text-right">Total HT</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((l, i) => (
            <TableRow key={l.id ?? i}>
              <TableCell className="font-medium">{l.designation}</TableCell>
              <TableCell>
                {l.phaseId ? <Badge variant="secondary">{getPhase(l.phaseId)?.label ?? l.phaseId}</Badge> : <span className="text-xs text-muted-foreground">—</span>}
              </TableCell>
              <TableCell><Badge variant="outline">{l.resourceType ?? 'material'}</Badge></TableCell>
              <TableCell className="text-right">{l.quantity}</TableCell>
              <TableCell>{l.unit}</TableCell>
              <TableCell className="text-right">{l.unitPrice != null ? fmt(l.unitPrice) : '—'}</TableCell>
              <TableCell className="text-right font-medium">{fmt(l.totalHt ?? l.quantity * (l.unitPrice ?? 0))}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={6} className="text-right font-semibold">Total HT</TableCell>
            <TableCell className="text-right font-bold">{fmt(total)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
