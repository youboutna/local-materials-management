/**
 * PlanningVarianceView — Lot 3.
 * Sous-section "Réalisé vs Planifié" alimentée par VarianceService.
 * Charge les BoqLineDTO du projet (source planifié = quantity_takeoff / dqe,
 * source réalisé = supplier_bid awarded) puis expose totaux, tableau, export
 * PDF (window.print) et CSV.
 */
import { VarianceService, type VarianceGroupKey } from '@/application/services/boq/VarianceService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { boqRepository } from '@/infrastructure/adapters/supabase/SupabaseBoqRepository';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';

interface Props {
  projectId: string;
  groupBy?: VarianceGroupKey;
}

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

export function PlanningVarianceView({ projectId, groupBy = 'phaseId' }: Props) {
  const { data: planned = [], isLoading: pLoading } = useQuery({
    queryKey: ['boq-planned', projectId],
    queryFn: () => boqRepository.list({ source: 'quantity_takeoff', contextId: projectId, projectId }),
    enabled: !!projectId,
  });

  const { data: actual = [], isLoading: aLoading } = useQuery({
    queryKey: ['boq-actual', projectId],
    queryFn: () => boqRepository.list({ source: 'supplier_bid', projectId }),
    enabled: !!projectId,
  });

  const report = useMemo(() => VarianceService.compare(planned, actual, groupBy), [planned, actual, groupBy]);

  const downloadCsv = () => {
    const csv = VarianceService.toCsv(report, groupBy);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `variance_${projectId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isLoading = pLoading || aLoading;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Réalisé vs Planifié</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <FileText className="h-4 w-4 mr-1" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={downloadCsv}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="border rounded p-3">
                <div className="text-xs text-muted-foreground">Planifié</div>
                <div className="text-xl font-semibold">{fmt(report.totals.plannedCost)}</div>
              </div>
              <div className="border rounded p-3">
                <div className="text-xs text-muted-foreground">Réalisé</div>
                <div className="text-xl font-semibold">{fmt(report.totals.actualCost)}</div>
              </div>
              <div className="border rounded p-3">
                <div className="text-xs text-muted-foreground">Écart</div>
                <div className={`text-xl font-semibold flex items-center gap-1 ${report.totals.costDelta > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                  {report.totals.costDelta > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {fmt(report.totals.costDelta)}
                </div>
              </div>
              <div className="border rounded p-3">
                <div className="text-xs text-muted-foreground">Écart %</div>
                <div className="text-xl font-semibold">{fmtPct(report.totals.costDeltaPct)}</div>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{groupBy}</TableHead>
                  <TableHead className="text-right">Qté planif.</TableHead>
                  <TableHead className="text-right">Qté réal.</TableHead>
                  <TableHead className="text-right">Coût planif.</TableHead>
                  <TableHead className="text-right">Coût réal.</TableHead>
                  <TableHead className="text-right">Δ Coût</TableHead>
                  <TableHead className="text-right">Δ %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                      Aucune donnée disponible.
                    </TableCell>
                  </TableRow>
                ) : report.rows.map((r) => (
                  <TableRow key={r.key}>
                    <TableCell>{r.key === '__unassigned__' ? <Badge variant="outline">Non affecté</Badge> : r.key}</TableCell>
                    <TableCell className="text-right">{fmt(r.plannedQuantity)}</TableCell>
                    <TableCell className="text-right">{fmt(r.actualQuantity)}</TableCell>
                    <TableCell className="text-right">{fmt(r.plannedCost)}</TableCell>
                    <TableCell className="text-right">{fmt(r.actualCost)}</TableCell>
                    <TableCell className={`text-right font-medium ${r.costDelta > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                      {fmt(r.costDelta)}
                    </TableCell>
                    <TableCell className="text-right">{fmtPct(r.costDeltaPct)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default PlanningVarianceView;
