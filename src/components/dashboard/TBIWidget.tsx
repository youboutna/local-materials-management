/**
 * TBIWidget — Tableau de Bord des Indicateurs.
 *
 * Affichage feu tricolore (vert/orange/rouge) pour chaque indicateur clé
 * issu de `indicator-templates.referential.ts`.
 * AUCUNE logique métier ici : tout est lu depuis le référentiel et calculé via
 * `WeightedProgressCalculator` + `DeviationEngine`.
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatNumber2, formatAmount2, formatPercent2, formatRatio2 } from '@/utils/reportNumbers';
import {
  INDICATOR_TEMPLATES,
  IndicatorStatus,
  IndicatorTemplate,
  evaluateIndicator,
  getIndicatorsForProjectType,
} from '@/config/referentials/indicator-templates.referential';

export interface ProjectAggregate {
  id: string;
  title?: string;
  status?: string;
  progress?: number;
  budget?: number;
  actualCost?: number;
  plannedEndDate?: string | Date | null;
  actualEndDate?: string | Date | null;
  earnedValue?: number;
  plannedValue?: number;
  revenue?: number;
  projectType?: string;
}

interface TBIWidgetProps {
  projects: ProjectAggregate[];
  projectType?: string;
  title?: string;
}

const STATUS_STYLE: Record<IndicatorStatus, string> = {
  green: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  red: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30',
  unknown: 'bg-muted text-muted-foreground border-muted',
};

const STATUS_DOT: Record<IndicatorStatus, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  unknown: 'bg-muted-foreground/40',
};

/** Calcule la valeur agrégée portefeuille pour un indicateur donné. */
function aggregate(indicator: IndicatorTemplate, projects: ProjectAggregate[]): number | null {
  if (!projects.length) return null;
  const safeAvg = (vals: number[]) =>
    vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;

  switch (indicator.code) {
    case 'CPI': {
      const vals = projects
        .filter((p) => p.earnedValue && p.actualCost && p.actualCost > 0)
        .map((p) => (p.earnedValue as number) / (p.actualCost as number));
      return safeAvg(vals);
    }
    case 'SPI': {
      const vals = projects
        .filter((p) => p.earnedValue && p.plannedValue && p.plannedValue > 0)
        .map((p) => (p.earnedValue as number) / (p.plannedValue as number));
      return safeAvg(vals);
    }
    case 'TEP':
      return safeAvg(projects.map((p) => p.progress ?? 0));
    case 'TEF': {
      const totalBudget = projects.reduce((s, p) => s + (p.budget ?? 0), 0);
      const totalActual = projects.reduce((s, p) => s + (p.actualCost ?? 0), 0);
      return totalBudget > 0 ? (totalActual / totalBudget) * 100 : null;
    }
    case 'MARGIN_ETER': {
      const vals = projects
        .filter((p) => p.revenue && p.revenue > 0 && p.actualCost != null)
        .map((p) => (((p.revenue as number) - (p.actualCost as number)) / (p.revenue as number)) * 100);
      return safeAvg(vals);
    }
    case 'DURATION_VARIANCE': {
      const vals = projects
        .filter((p) => p.plannedEndDate && p.actualEndDate)
        .map((p) => {
          const planned = new Date(p.plannedEndDate as string).getTime();
          const actual = new Date(p.actualEndDate as string).getTime();
          return Math.round((actual - planned) / (1000 * 60 * 60 * 24));
        });
      return safeAvg(vals);
    }
    default:
      return null;
  }
}

function formatValue(indicator: IndicatorTemplate, value: number | null): string {
  if (value === null || Number.isNaN(value)) return '—';
  switch (indicator.unit) {
    case '%':
      return formatPercent2(value);
    case 'ratio':
      return formatRatio2(value);
    case 'days':
      return `${value > 0 ? '+' : ''}${Math.round(value)} j`;
    case 'pts':
      return `${formatNumber2(value)} pts`;
    case 'MRU':
      return formatAmount2(value);
    default:
      return String(value);
  }
}

const TBIWidget: React.FC<TBIWidgetProps> = ({ projects, projectType, title }) => {
  const indicators = useMemo(
    () => getIndicatorsForProjectType(projectType),
    [projectType]
  );

  const rows = useMemo(
    () =>
      indicators.map((ind) => {
        const value = aggregate(ind, projects);
        const status = evaluateIndicator(ind, value);
        return { ind, value, status };
      }),
    [indicators, projects]
  );

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          {title ?? 'TBI — Tableau de bord des indicateurs'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {rows.map(({ ind, value, status }) => {
            const trendIcon =
              ind.direction === 'higher_is_better' ? (
                <TrendingUp className="h-3 w-3" />
              ) : ind.direction === 'lower_is_better' ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              );
            return (
              <div
                key={ind.code}
                className={`rounded-md border p-2.5 flex flex-col gap-1 ${STATUS_STYLE[status]}`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-medium uppercase tracking-wide">
                    {ind.code}
                  </span>
                  <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} aria-hidden />
                </div>
                <div className="text-lg font-bold leading-tight">
                  {formatValue(ind, value)}
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] opacity-80 line-clamp-1" title={ind.label.fr}>
                    {ind.label.fr}
                  </span>
                  <Badge variant="outline" className="h-4 px-1 text-[9px] gap-0.5 bg-background/60">
                    {trendIcon}
                    {ind.level}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default TBIWidget;
