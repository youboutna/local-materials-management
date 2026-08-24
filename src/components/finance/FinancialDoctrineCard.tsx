/**
 * FinancialDoctrineCard — carte financière UNIQUE réutilisée par tous les modules.
 *
 * Affiche la chaîne doctrinale : Budget (DQE validé) → Engagé (devis acceptés)
 * → Dépensé (décomptes validés) → Payé → Restant.
 *
 * Aucun calcul local : tout provient de ProjectFinancialsService via le hook.
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { T } from '@/components/i18n/T';
import { formatCurrency } from '@/utils/phaseDisplayHelpers';
import { useProjectFinancialsHex } from '@/hooks/hexagonal/useProjectFinancialsHex';
import type { FinancialScope } from '@/dtos/entities/ProjectFinancialDTO';
import { Wallet } from 'lucide-react';

interface Props {
  scope: FinancialScope;
  entityId?: string | null;
  /** Budget déclaré (repli documenté si aucun DQE validé). */
  declaredBudget?: number | null;
  currency?: string;
  compact?: boolean;
  className?: string;
}

const BUDGET_SOURCE_LABEL: Record<string, { key: string; fallback: string }> = {
  dqe: { key: 'finance.budgetSource.dqe', fallback: 'DQE validé' },
  phases: { key: 'finance.budgetSource.phases', fallback: 'Somme des phases' },
  declared: { key: 'finance.budgetSource.declared', fallback: 'Budget déclaré' },
  none: { key: 'finance.budgetSource.none', fallback: 'Non sourcé' },
};

export const FinancialDoctrineCard: React.FC<Props> = ({
  scope,
  entityId,
  declaredBudget,
  currency = 'MRU',
  compact = false,
  className,
}) => {
  const { financials, isLoading } = useProjectFinancialsHex({
    scope,
    entityId,
    declaredBudget,
    currency,
  });

  if (isLoading || !financials) {
    return <Skeleton className={`h-40 w-full ${className ?? ''}`} />;
  }

  const source = BUDGET_SOURCE_LABEL[financials.budgetSource] ?? BUDGET_SOURCE_LABEL.none;

  const cells = [
    {
      key: 'finance.budgetTotal',
      fallback: 'Budget total',
      value: financials.budgetTotal,
      hint: <T k={source.key} fallback={source.fallback} />,
    },
    {
      key: 'finance.engaged',
      fallback: 'Engagé (devis acceptés)',
      value: financials.engaged,
      hint: `${financials.engagementRate.toLocaleString('fr-FR')} %`,
    },
    {
      key: 'finance.spent',
      fallback: 'Dépensé (décomptes validés)',
      value: financials.spent,
      hint: `${financials.consumptionRate.toLocaleString('fr-FR')} %`,
    },
    {
      key: 'finance.paid',
      fallback: 'Payé',
      value: financials.paid,
      hint: (
        <>
          <T k="finance.remainingToPay" fallback="Reste à payer" /> :{' '}
          {formatCurrency(financials.remainingToPay)}
        </>
      ),
    },
    {
      key: 'finance.remaining',
      fallback: 'Restant (Budget − Dépensé)',
      value: financials.remaining,
      hint: (
        <>
          {financials.validatedDecompteCount}{' '}
          <T k="finance.validatedDecomptes" fallback="décomptes validés" />
          {financials.pendingDecompteCount > 0
            ? ` · ${financials.pendingDecompteCount} ${'en attente'}`
            : ''}
        </>
      ),
    },
  ];

  return (
    <Card className={className}>
      <CardHeader className={compact ? 'py-3' : undefined}>
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <T k="finance.doctrine.title" fallback="Situation financière" />
          </span>
          <Badge variant="outline">
            <T k="finance.doctrine.badge" fallback="Dépensé = décomptes validés" />
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {cells.map((cell) => (
            <div key={cell.key} className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">
                <T k={cell.key} fallback={cell.fallback} />
              </p>
              <p className="text-lg font-semibold">{formatCurrency(cell.value)}</p>
              <p className="truncate text-[11px] text-muted-foreground">{cell.hint}</p>
            </div>
          ))}
        </div>
        <div>
          <Progress value={Math.min(100, financials.consumptionRate)} className="h-2" />
          <p className="mt-1 text-[11px] text-muted-foreground">
            <T k="finance.consumption" fallback="Consommation du budget" /> :{' '}
            {financials.consumptionRate.toLocaleString('fr-FR')} %
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialDoctrineCard;
