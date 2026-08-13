import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertTriangle, TrendingUp, Wallet } from 'lucide-react';
import { ProjectMetricsOrchestrator } from '@/application/services/ProjectMetricsOrchestrator';
import { formatAmount2, formatIndex2, formatPercent2 } from '@/utils/reportNumbers';

/**
 * PortfolioMetricsSummary — bandeau de synthèse du portefeuille projets.
 *
 * Chaque projet est évalué par ProjectMetricsOrchestrator (même moteur que le
 * détail projet, le dashboard monitoring et les rapports PDF) puis agrégé :
 * avancement pondéré par budget, engagement budgétaire, SPI/CPI moyens et
 * nombre d'alertes actives.
 */
interface Props {
  projects: any[];
  className?: string;
}

export const PortfolioMetricsSummary: React.FC<Props> = ({ projects, className }) => {
  const summary = useMemo(() => {
    const rows = (projects || []).map((p: any) =>
      ProjectMetricsOrchestrator.compute({
        project: {
          id: p?.id,
          title: p?.title,
          budget: p?.budget ?? 0,
          progress: p?.progress ?? 0,
          startDate: p?.startDate ?? null,
          endDate: p?.endDate ?? null,
          interventionZones: p?.interventionZones ?? [],
          currency: p?.currency || 'MRU',
        },
        phases: (p?.phases ?? []).map((ph: any) => ({
          id: ph.id,
          name: ph.name ?? ph.phase ?? ph.phase_name,
          weight: ph.weight ?? ph.weight_percentage,
          budget: ph.budget ?? ph.estimatedCost,
          startDate: ph.startDate ?? ph.start_date,
          endDate: ph.endDate ?? ph.end_date,
          progress: ph.progress ?? 0,
          actualCost: ph.actualCost ?? ph.actual_cost,
          status: ph.status,
        })),
        actualCost: p?.actualCost ?? 0,
        risks: p?.risks ?? [],
      }),
    );

    const totalBudget = rows.reduce((sum, r) => sum + (r.budget || 0), 0);
    const totalActual = rows.reduce((sum, r) => sum + (r.actualCost || 0), 0);
    const weightedProgress =
      totalBudget > 0
        ? rows.reduce((sum, r) => sum + r.progress * (r.budget || 0), 0) / totalBudget
        : rows.length
          ? rows.reduce((sum, r) => sum + r.progress, 0) / rows.length
          : 0;

    const spis = rows.map((r) => r.evm.schedulePerformanceIndex).filter((v): v is number => v !== null);
    const cpis = rows.map((r) => r.evm.costPerformanceIndex).filter((v): v is number => v !== null);
    const avg = (values: number[]) =>
      values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

    const alerts = rows.flatMap((r) => r.alerts);

    return {
      count: rows.length,
      totalBudget,
      totalActual,
      commitmentRate: totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0,
      weightedProgress,
      avgSpi: avg(spis),
      avgCpi: avg(cpis),
      criticalCount: alerts.filter((a) => a.level === 'critical').length,
      warningCount: alerts.filter((a) => a.level === 'warning').length,
      atRiskProjects: rows.filter((r) => r.alerts.some((a) => a.level === 'critical')).length,
    };
  }, [projects]);

  if (summary.count === 0) return null;

  return (
    <div className={`grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 ${className ?? ''}`}>
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Avancement pondéré (portefeuille)</p>
              <p className="text-lg font-semibold">{formatPercent2(summary.weightedProgress)}</p>
            </div>
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{summary.count} projet(s) évalué(s)</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Budget cumulé</p>
              <p className="text-lg font-semibold">{formatAmount2(summary.totalBudget)}</p>
            </div>
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            engagé {formatAmount2(summary.totalActual)} ({formatPercent2(summary.commitmentRate)})
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">SPI / CPI moyens</p>
              <p className="text-lg font-semibold">
                {formatIndex2(summary.avgSpi, summary.avgSpi !== null)} /{' '}
                {formatIndex2(summary.avgCpi, summary.avgCpi !== null)}
              </p>
            </div>
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            N/A = aucun coût ou aucune valeur engagée
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Alertes actives</p>
              <p className="text-lg font-semibold">{summary.criticalCount + summary.warningCount}</p>
            </div>
            <AlertTriangle className="h-6 w-6 text-primary" />
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            <Badge variant="destructive" className="text-[10px]">
              {summary.criticalCount} critique(s)
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              {summary.warningCount} vigilance
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {summary.atRiskProjects} projet(s) à risque
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioMetricsSummary;
