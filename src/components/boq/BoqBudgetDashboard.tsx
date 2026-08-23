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
import { BudgetConsistencyService } from '@/application/services/BudgetConsistencyService';
import BudgetConsistencyAlerts from '@/components/project/BudgetConsistencyAlerts';
import { i18nService } from '@/application/services/I18nService';

interface Props {
  planned: BoqLineDTO[];      // quantity_takeoff
  actual: BoqLineDTO[];       // dqe / supplier_bid
  currency?: string;
  /** Libellés réels des phases du projet (id → nom), prioritaires sur le référentiel. */
  phaseLabels?: Record<string, string>;
  /** Libellés réels des jalons du projet (id → titre). */
  milestoneLabels?: Record<string, string>;
  /** Budget inscrit au projet — sert au contrôle réel ≤ budget. */
  projectBudget?: number | null;
}

const UNASSIGNED = i18nService.translateTerm('wbs_unassigned');

interface Row {
  key: string;
  phaseLabel: string;
  milestoneLabel: string;
  plannedHt: number;
  actualHt: number;
  plannedTtc: number;
  actualTtc: number;
}

type Labeller = (phaseId?: string, milestoneId?: string) => { phaseLabel: string; milestoneLabel: string };

/** Regroupe par libellé résolu : toutes les lignes non affectées fusionnent en une seule ligne. */
function bucketize(lines: BoqLineDTO[], label: Labeller): Map<string, { ht: number; ttc: number }> {
  const m = new Map<string, { ht: number; ttc: number }>();
  for (const l of lines) {
    const { phaseLabel, milestoneLabel } = label(l.phaseId ?? undefined, l.milestoneId ?? undefined);
    const key = `${phaseLabel}::${milestoneLabel}`;
    const t = BoqCalculatorService.computeTotals({
      unit: l.unit,
      length: l.length,
      width: l.width,
      height: l.height,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      vatRate: l.vatRate,
    }, BoqCalculatorService.defaultProfile());
    const cur = m.get(key) ?? { ht: 0, ttc: 0 };
    m.set(key, { ht: cur.ht + t.totalHt, ttc: cur.ttc + t.totalTtc });
  }
  return m;
}

const fmt = (n: number, ccy = 'MRU') =>
  `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n)} ${ccy}`;

export const BoqBudgetDashboard: React.FC<Props> = ({
  planned,
  actual,
  currency = 'MRU',
  phaseLabels,
  milestoneLabels,
  projectBudget = null,
}) => {
  const label = useMemo<Labeller>(() => (phaseId, milestoneId) => {
    const phaseLabel =
      (phaseId ? phaseLabels?.[phaseId] : undefined) ??
      getPhase(phaseId)?.label ??
      UNASSIGNED;
    const milestoneLabel =
      (milestoneId ? milestoneLabels?.[milestoneId] : undefined) ??
      getMilestone(phaseId, milestoneId)?.label ??
      '—';
    return { phaseLabel, milestoneLabel };
  }, [phaseLabels, milestoneLabels]);

  const rows = useMemo<Row[]>(() => {
    const p = bucketize(planned, label);
    const a = bucketize(actual, label);
    const keys = new Set<string>([...p.keys(), ...a.keys()]);
    const out: Row[] = [];
    for (const k of keys) {
      const [phaseLabel, milestoneLabel] = k.split('::');
      const pv = p.get(k) ?? { ht: 0, ttc: 0 };
      const av = a.get(k) ?? { ht: 0, ttc: 0 };
      out.push({
        key: k,
        phaseLabel,
        milestoneLabel,
        plannedHt: pv.ht,
        actualHt: av.ht,
        plannedTtc: pv.ttc,
        actualTtc: av.ttc,
      });
    }
    // Les lignes non affectées apparaissent en dernier.
    return out.sort((x, y) =>
      (x.phaseLabel === UNASSIGNED ? 1 : 0) - (y.phaseLabel === UNASSIGNED ? 1 : 0) ||
      x.phaseLabel.localeCompare(y.phaseLabel) ||
      x.milestoneLabel.localeCompare(y.milestoneLabel));
  }, [planned, actual, label]);

  const totalPlanned = rows.reduce((s, r) => s + r.plannedHt, 0);
  const totalActual = rows.reduce((s, r) => s + r.actualHt, 0);
  const totalPlannedTtc = rows.reduce((s, r) => s + r.plannedTtc, 0);
  const totalActualTtc = rows.reduce((s, r) => s + r.actualTtc, 0);
  const totalVariance = totalActual - totalPlanned;

  // Réconciliation : détection des résidus hors WBS et des dépassements
  const reconciliation = useMemo(() => {
    const unassigned = rows.filter((r) => r.phaseLabel === UNASSIGNED);
    return BudgetConsistencyService.reconcileBoq({
      plannedTotal: totalPlanned,
      actualTotal: totalActual,
      unassignedPlanned: unassigned.reduce((s, r) => s + r.plannedHt, 0),
      unassignedActual: unassigned.reduce((s, r) => s + r.actualHt, 0),
      projectBudget,
      currency,
    });
  }, [rows, totalPlanned, totalActual, projectBudget, currency]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Suivi budgétaire par jalon (HT / TTC)</CardTitle>
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
                <TableHead className="text-right">Prévu HT</TableHead>
                <TableHead className="text-right">Réel HT</TableHead>
                <TableHead className="text-right">Prévu TTC</TableHead>
                <TableHead className="text-right">Réel TTC</TableHead>
                <TableHead className="text-right">Écart HT</TableHead>
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
                    <TableCell className="text-right text-muted-foreground">{fmt(r.plannedTtc, currency)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{fmt(r.actualTtc, currency)}</TableCell>
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
                <TableCell className="text-right text-muted-foreground">{fmt(totalPlannedTtc, currency)}</TableCell>
                <TableCell className="text-right text-muted-foreground">{fmt(totalActualTtc, currency)}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={totalVariance > 0 ? 'destructive' : 'default'}>
                    {totalVariance >= 0 ? '+' : ''}{fmt(totalVariance, currency)}
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}

        {rows.length > 0 && (
          <div className="mt-4 space-y-2">
            <BudgetConsistencyAlerts
              findings={reconciliation.findings}
              okLabel={`Réconciliation complète : toutes les lignes sont affectées à la ${i18nService.translateTerm('wbs_short').toLowerCase()} et les montants réels restent dans l'enveloppe.`}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BoqBudgetDashboard;
