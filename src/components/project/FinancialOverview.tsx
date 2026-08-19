// components/project/FinancialOverview.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DollarSign, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { formatAmount2, formatPercent2, formatIndex2 } from '@/utils/reportNumbers';

/** Libellés unifiés avec les alertes métier (« CPI non évaluable sans dépense engagée »). */
const NOT_EVALUABLE = 'Non évaluable';
const NOT_EVALUABLE_REASON = 'Aucune dépense engagée : le CPI ne peut pas être calculé.';


interface FinancialOverviewProps {
  budget: number;
  spent: number;
  phases: any[];
  /**
   * Métriques EVM calculées par ProjectMetricsOrchestrator (source unique).
   * `costPerformanceIndex === null` => CPI non évaluable (aucune dépense engagée).
   */
  financialMetrics?: {
    costVariance?: number | null;
    costPerformanceIndex?: number | null;
  };
}

const FinancialOverview: React.FC<FinancialOverviewProps> = ({
  budget,
  spent,
  phases,
  financialMetrics
}) => {
  const remaining = budget - spent;
  const percentageSpent = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
  const costVariance = financialMetrics?.costVariance ?? null;
  const cpi = financialMetrics?.costPerformanceIndex ?? null;
  const cpiAvailable = cpi != null && Number.isFinite(Number(cpi)) && Number(cpi) !== 0;


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount2(budget)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dépensé</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount2(spent)}</div>
            <p className="text-xs text-muted-foreground">
              {formatPercent2(percentageSpent)} du budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Restant</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount2(remaining)}</div>
            <p className="text-xs text-muted-foreground">
              {formatPercent2(100 - percentageSpent)} du budget
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Répartition du budget par phase</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {phases.map((phase, index) => {
              const phaseSpent = phase.actualCost || 0;
              const phaseBudget = phase.budget || 0;
              const phasePercentage = phaseBudget > 0 ? Math.min(100, (phaseSpent / phaseBudget) * 100) : 0;
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{phase.phase}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {formatAmount2(phaseSpent)} / {formatAmount2(phaseBudget)}
                      </span>
                      <Badge variant={phaseSpent > phaseBudget ? "destructive" : "default"}>
                        {formatPercent2(phasePercentage)}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={phasePercentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {financialMetrics ? (
        <Card>
          <CardHeader>
            <CardTitle>Métriques financières avancées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Variance des coûts (CV)</h4>
                <p className={(costVariance ?? 0) < 0 ? "text-destructive" : "text-success"}>
                  {costVariance === null ? NOT_EVALUABLE : formatAmount2(costVariance)}
                </p>
                {costVariance === null ? (
                  <p className="text-xs text-muted-foreground mt-1">{NOT_EVALUABLE_REASON}</p>
                ) : null}
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Indice de performance des coûts (CPI)</h4>
                {cpiAvailable ? (
                  <p>{formatIndex2(cpi, true)}</p>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="inline-flex items-center gap-1 text-muted-foreground cursor-help">
                          {NOT_EVALUABLE}
                          <Info className="h-3.5 w-3.5" aria-hidden="true" />
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>{NOT_EVALUABLE_REASON}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {!cpiAvailable ? (
                  <p className="text-xs text-muted-foreground mt-1">{NOT_EVALUABLE_REASON}</p>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

    </div>
  );
};

export default FinancialOverview;