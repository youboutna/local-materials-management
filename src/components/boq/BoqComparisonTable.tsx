/**
 * BoqComparisonTable — side-by-side comparison of two BOQ sets.
 * Used to compare tender estimate vs supplier bid, or planning vs actual.
 */
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Props {
  reference: BoqLineDTO[];
  candidate: BoqLineDTO[];
  labels?: { reference: string; candidate: string };
}

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MRU', maximumFractionDigits: 0 }).format(n);

function key(l: BoqLineDTO) {
  return `${(l.materialId ?? '').toLowerCase()}|${l.designation.trim().toLowerCase()}|${l.unit}`;
}

export function BoqComparisonTable({ reference, candidate, labels }: Props) {
  const map = new Map<string, { ref?: BoqLineDTO; cand?: BoqLineDTO }>();
  for (const r of reference) map.set(key(r), { ref: r });
  for (const c of candidate) {
    const k = key(c);
    map.set(k, { ...(map.get(k) ?? {}), cand: c });
  }
  const rows = Array.from(map.entries());
  const refLabel = labels?.reference ?? 'Référence';
  const candLabel = labels?.candidate ?? 'Comparaison';
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Désignation</TableHead>
            <TableHead className="text-right">{refLabel} (HT)</TableHead>
            <TableHead className="text-right">{candLabel} (HT)</TableHead>
            <TableHead className="text-right">Écart</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(([k, { ref, cand }]) => {
            const rHt = ref?.totalHt ?? (ref ? ref.quantity * (ref.unitPrice ?? 0) : 0);
            const cHt = cand?.totalHt ?? (cand ? cand.quantity * (cand.unitPrice ?? 0) : 0);
            const delta = cHt - rHt;
            const pct = rHt ? (delta / rHt) * 100 : 0;
            return (
              <TableRow key={k}>
                <TableCell className="font-medium">{(ref ?? cand)?.designation}</TableCell>
                <TableCell className="text-right">{fmt(rHt)}</TableCell>
                <TableCell className="text-right">{fmt(cHt)}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={delta > 0 ? 'destructive' : delta < 0 ? 'default' : 'secondary'}>
                    {delta > 0 ? '+' : ''}{fmt(delta)} ({pct.toFixed(1)}%)
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
