/**
 * BoqBudgetDashboard — P2: suivi budget par jalon avec écarts prévu/réel.
 *
 * - "Prévu" = expression de besoin (source='quantity_takeoff')
 * - "Réel"  = DQE consolidé ou meilleure offre fournisseur retenue
 * Écart = Réel − Prévu (positif = dépassement).
 *
 * Pure UI: consomme deux jeux de BoqLineDTO déjà chargés via useBoqDocument.
 * Aucun accès Supabase direct.
 */
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BoqCalculatorService } from '@/application/services/boq/BoqCalculatorService';
import { getMilestone, getPhase } from '@/config/referentials/wbs/wbs.referential';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';

interface Props {
  planned: BoqLineDTO[];      // quantity_takeoff
  actual: BoqLineDTO[];       // dqe / supplier_bid
  currency?: string;
}

interface Row {
  key: string;
  phaseLabel: string;
  milestoneLabel: string;
  plannedHt: number;
  actualHt: number;
}

function bucketize(lines: BoqLineDTO[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const l of lines) {
    const key = `${l.phaseId ?? '__'}::${l.milestoneId ?? '__'}`;
    const t = BoqCalculatorService.computeTotals({
      unit: l.unit,
      length: l.length,
      width: l.width,
      height: l.height,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      vatRate: l.vatRate,
    });
    m.set(key, (m.get(key) ?? 0) + t.totalHt);
  }
  return m;
}

const fmt = (n: number, ccy = 'MRU') =>
  `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n)} ${ccy}`;

export const BoqBudgetDashboard: React.FC<Props> = ({ planned, actual, currency = 'MRU' }) => {
  const rows = useMemo<Row[]>(() => {
    const p = bucketize(planned);
    const a = bucketize(actual);
    const keys = new Set<string>([...p.keys(), ...a.keys()]);
    const out: Row[] = [];
    for (const k of keys) {
      const [phaseId, milestoneId] = k.split('::');
      const phase = getPhase(phaseId === '__' ? undefined : phaseId);
      const milestone = getMilestone(
        phaseId === '__' ? undefined : phaseId,
        milestoneId === '__' ? undefined : milestoneId,
      );
      out.push({
        key: k,
        phaseLabel: phase?.label ?? 'Non affecté',
        milestoneLabel: milestone?.label ?? '—',
        plannedHt: p.get(k) ?? 0,
        actualHt: a.get(k) ?? 0,
      });
    }
    return out.sort((x, y) => x.phaseLabel.localeCompare(y.phaseLabel));
  }, [planned, actual]);

  const totalPlanned = rows.reduce((s, r) => s + r.plannedHt, 0);
  const totalActual = rows.reduce((s, r) => s + r.actualHt, 0);
  const totalVariance = totalActual - totalPlanned;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Suivi budgétaire par jalon (HT)</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune donnée budgétaire disponible.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phase</TableHead>
                <TableHead>Jalon</TableHead>
                <TableHead className="text-right">Prévu</TableHead>
                <TableHead className="text-right">Réel</TableHead>
                <TableHead className="text-right">Écart</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const variance = r.actualHt - r.plannedHt;
                const pct = r.plannedHt > 0 ? (variance / r.plannedHt) * 100 : 0;
                const variant = variance > 0 ? 'destructive' : variance < 0 ? 'default' : 'secondary';
                return (
                  <TableRow key={r.key}>
                    <TableCell>{r.phaseLabel}</TableCell>
                    <TableCell>{r.milestoneLabel}</TableCell>
                    <TableCell className="text-right">{fmt(r.plannedHt, currency)}</TableCell>
                    <TableCell className="text-right">{fmt(r.actualHt, currency)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={variant as any}>
                        {variance >= 0 ? '+' : ''}{fmt(variance, currency)}
                        {r.plannedHt > 0 && ` (${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%)`}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="font-medium bg-muted/40">
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell className="text-right">{fmt(totalPlanned, currency)}</TableCell>
                <TableCell className="text-right">{fmt(totalActual, currency)}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={totalVariance > 0 ? 'destructive' : 'default'}>
                    {totalVariance >= 0 ? '+' : ''}{fmt(totalVariance, currency)}
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default BoqBudgetDashboard;
