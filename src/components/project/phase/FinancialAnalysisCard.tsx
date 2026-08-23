import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ProjectCalculationService } from '@/application/services/ProjectCalculationService';
import {
import { T } from '@/components/i18n/T';
  formatCurrency,
  getFinancialHealthColor,
  getFinancialHealthLabel,
  getFinancialHealthIcon,
} from '@/utils/phaseHelpers';

interface FinancialAnalysisCardProps {
  phaseId: string;
  projectId: string;
  estimatedCost?: number;
  compact?: boolean;
}

const FinancialAnalysisCard: React.FC<FinancialAnalysisCardProps> = ({
  phaseId,
  projectId,
  estimatedCost = 0,
  compact = false,
}) => {
  const { data: phaseCosts, isLoading: loadingCosts } = useQuery({
    queryKey: ['phase-costs', projectId, phaseId],
    queryFn: () => ProjectCalculationService.calculatePhaseCosts(projectId, phaseId),
    enabled: !!projectId && !!phaseId,
  });

  if (loadingCosts) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium"><T k="auto.financialanalysiscard.analyse_financiere" fallback="Analyse financière" /></CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!phaseCosts) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium"><T k="auto.financialanalysiscard.analyse_financiere" fallback="Analyse financière" /></CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            <T k="auto.financialanalysiscard.aucune_donnee_financiere_disponible" fallback="Aucune donnée financière disponible" />
          </p>
        </CardContent>
      </Card>
    );
  }

  // Derive financial health from budget utilization
  const financialHealth = phaseCosts.budgetUtilization > 90 ? 'critical' 
    : phaseCosts.budgetUtilization > 75 ? 'warning' : 'healthy';
  const totalSpent = phaseCosts.totalPayments + phaseCosts.totalExpenses;
  const remainingBudget = Math.max(0, estimatedCost - totalSpent);

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span><T k="auto.financialanalysiscard.budget" fallback="Budget" /></span>
            <Badge variant="outline" className={getFinancialHealthColor(financialHealth)}>
              {getFinancialHealthLabel(financialHealth)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground"><T k="auto.financialanalysiscard.utilise" fallback="Utilisé:" /></span>
            <span className="font-medium">{phaseCosts.budgetUtilization.toFixed(1)}%</span>
          </div>
          <Progress 
            value={Math.min(100, phaseCosts.budgetUtilization)} 
            className={cn(
              "h-2",
              phaseCosts.budgetUtilization > 90 
                ? "[&>div]:bg-red-500" 
                : phaseCosts.budgetUtilization > 75
                ? "[&>div]:bg-amber-500"
                : "[&>div]:bg-success"
            )}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span><T k="auto.financialanalysiscard.analyse_financiere" fallback="Analyse financière" /></span>
          <Badge variant="outline" className={getFinancialHealthColor(financialHealth)}>
            {getFinancialHealthIcon(financialHealth)}
            <span className="ml-1">{getFinancialHealthLabel(financialHealth)}</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Budget Overview */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground"><T k="auto.financialanalysiscard.budget_estime" fallback="Budget estimé:" /></span>
            <span className="font-medium">{formatCurrency(estimatedCost)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground"><T k="auto.financialanalysiscard.depense" fallback="Dépensé:" /></span>
            <span className="font-medium text-warning">{formatCurrency(totalSpent)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between font-medium">
            <span><T k="auto.financialanalysiscard.ecart" fallback="Écart:" /></span>
            <span className={cn(
              (phaseCosts.costVariance ?? 0) > 0 
                ? "text-destructive" 
                : "text-success"
            )}>
              {formatCurrency(phaseCosts.costVariance ?? 0)}
            </span>
          </div>
        </div>

        {/* Budget Utilization */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground"><T k="auto.financialanalysiscard.utilisation_budget" fallback="Utilisation budget:" /></span>
            <span className={cn(
              "font-medium",
              phaseCosts.budgetUtilization > 90 
                ? "text-destructive" 
                : phaseCosts.budgetUtilization > 75
                ? "text-warning"
                : "text-success"
            )}>
              {phaseCosts.budgetUtilization.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={Math.min(100, phaseCosts.budgetUtilization)}
            className={cn(
              "h-2",
              phaseCosts.budgetUtilization > 90 
                ? "[&>div]:bg-red-600" 
                : phaseCosts.budgetUtilization > 75
                ? "[&>div]:bg-amber-600"
                : "[&>div]:bg-success"
            )}
          />
        </div>

        {/* Cost Breakdown */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase"><T k="auto.financialanalysiscard.repartition" fallback="Répartition" /></h4>
          {phaseCosts.totalPayments > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span><T k="auto.financialanalysiscard.paiements" fallback="Paiements" /></span>
              </div>
              <span className="font-medium">{formatCurrency(phaseCosts.totalPayments)}</span>
            </div>
          )}
          {phaseCosts.totalExpenses > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span><T k="auto.financialanalysiscard.depenses" fallback="Dépenses" /></span>
              </div>
              <span className="font-medium">{formatCurrency(phaseCosts.totalExpenses)}</span>
            </div>
          )}
        </div>

        {/* Remaining Budget */}
        {remainingBudget > 0 && (
          <div className="pt-2 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground"><T k="auto.financialanalysiscard.budget_restant" fallback="Budget restant:" /></span>
              <span className="font-medium text-success">
                {formatCurrency(remainingBudget)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FinancialAnalysisCard;
