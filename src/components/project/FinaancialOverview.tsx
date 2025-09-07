// components/project/FinancialOverview.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface FinancialOverviewProps {
  budget: number;
  spent: number;
  phases: any[];
  financialMetrics?: any;
}

const FinancialOverview: React.FC<FinancialOverviewProps> = ({
  budget,
  spent,
  phases,
  financialMetrics
}) => {
  const remaining = budget - spent;
  const percentageSpent = budget > 0 ? (spent / budget) * 100 : 0;
  const costVariance = financialMetrics?.costVariance || spent - budget;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budget.toLocaleString()} MRU</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dépensé</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{spent.toLocaleString()} MRU</div>
            <p className="text-xs text-muted-foreground">
              {percentageSpent.toFixed(1)}% du budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Restant</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{remaining.toLocaleString()} MRU</div>
            <p className="text-xs text-muted-foreground">
              {(100 - percentageSpent).toFixed(1)}% du budget
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
              const phasePercentage = phaseBudget > 0 ? (phaseSpent / phaseBudget) * 100 : 0;
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{phase.phase}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {phaseSpent.toLocaleString()} / {phaseBudget.toLocaleString()} MRU
                      </span>
                      <Badge variant={phaseSpent > phaseBudget ? "destructive" : "default"}>
                        {phasePercentage.toFixed(1)}%
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

      {financialMetrics && (
        <Card>
          <CardHeader>
            <CardTitle>Métriques financières avancées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Variance des coûts (CV)</h4>
                <p className={costVariance < 0 ? "text-red-600" : "text-green-600"}>
                  {costVariance.toLocaleString()} MRU
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Indice de performance des coûts (CPI)</h4>
                <p>{financialMetrics.costPerformanceIndex?.toFixed(2) || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinancialOverview;