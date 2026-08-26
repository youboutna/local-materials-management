/**
 * PhaseFinancesTab Component
 * Displays financial analysis for a phase
 * Max 400 lines following SRP
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  DollarSign,
  Package,
  PieChart,
  Users,
  Wallet,
} from "lucide-react";
import { PhaseDTO } from "@/dtos/types/phase-dto";
import { formatCurrency } from "@/utils/phaseDisplayHelpers";
import { T } from '@/components/i18n/T';

// ✅ IMPORT entityLabels
import { getEntityLabel, formatReference } from '@/utils/entityLabels';
import { useProjectsHex } from '@/hooks/hexagonal/useProjectsHex';
import { usePhaseAggregateHex } from '@/hooks/hexagonal/usePhaseAggregateHex';


interface PhaseCosts {
  estimatedCost: number;
  totalSpent: number;
  totalPayments: number;
  totalExpenses: number;
  costVariance: number;
  remainingBudget: number;
  budgetUtilization: number;
  paymentsCount: number;
  expensesCount: number;
  paymentDistribution: Record<string, number>;
  expenseDistribution: Record<string, number>;
}

interface PhaseResources {
  totalEmployees: number;
  totalMaterials: number;
  employeesByPosition: Record<string, number>;
  materialsByCategory: Record<string, number>;
  materialMetrics?: {
    estimatedCost?: number;
  };
}

interface PhaseFinancesTabProps {
  phase: PhaseDTO;
  projectId: string;
  phaseId: string;
  phaseCosts?: PhaseCosts | null;
  phaseResources?: PhaseResources | null;
  loadingCosts?: boolean;
  loadingResources?: boolean;
  onCreatePayment?: (data: { amount: number; progress: number }) => void;
}

const PhaseFinancesTab: React.FC<PhaseFinancesTabProps> = ({
  phase,
  projectId,
  phaseId,
  phaseCosts,
  phaseResources,
  loadingCosts,
  loadingResources,
  onCreatePayment,
}) => {
  // ✅ Récupérer les projets pour les labels
  const { projects = [] } = useProjectsHex();

  // Source unique : agrégat de la phase (bordereau + doctrine financière).
  const { aggregate, isLoading: loadingAggregate } = usePhaseAggregateHex({
    projectId,
    phaseId,
    declaredBudget: phase?.estimatedCost ?? 0,
  });

  // ✅ RÉSOLUTION DU LABEL DU PROJET
  const projectLabel = projectId 
    ? getEntityLabel(projectId, projects, 'project')
    : 'Projet inconnu';

  const budget = aggregate.totalPlanned > 0 ? aggregate.totalPlanned : (phase?.estimatedCost ?? 0);
  const engaged = aggregate.totalEngaged;
  const spent = aggregate.totalSpent;
  const paid = aggregate.totalPaid;
  const remaining = budget - spent;
  const utilization = budget > 0 ? (spent / budget) * 100 : 0;
  const engagementRate = budget > 0 ? (engaged / budget) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Doctrine : Budget → Engagé → Dépensé → Payé → Restant */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <T k="phase.finances.doctrine" fallback="Budget → Engagé → Dépensé" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAggregate ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    <T k="phase.finances.budget" fallback="Budget" />
                    {aggregate.linkedToBoq && (
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        {aggregate.source === 'devis' ? 'Devis' : 'DQE'}
                      </Badge>
                    )}
                  </span>
                  <span className="font-medium">{formatCurrency(budget)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground"><T k="auto.phasefinancestab.engage" fallback="Engagé:" /></span>
                  <span className="font-medium text-warning">{formatCurrency(engaged)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground"><T k="phase.finances.spent" fallback="Dépensé (décomptes validés)" /></span>
                  <span className="font-medium">{formatCurrency(spent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground"><T k="phase.finances.paid" fallback="Payé" /></span>
                  <span className="font-medium">{formatCurrency(paid)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span><T k="auto.phasefinancestab.budget_restant" fallback="Budget restant:" /></span>
                  <span className={cn(remaining < 0 ? 'text-destructive' : 'text-success')}>
                    {formatCurrency(remaining)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ressources planifiées (matériaux / équipements / main d'œuvre) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium"><T k="auto.phasefinancestab.repartition_couts" fallback="Répartition coûts" /></CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAggregate ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : aggregate.resources.totals.lineCount > 0 ? (
              <div className="space-y-3">
                {([
                  { key: 'material', label: 'Matériaux', bucket: aggregate.resources.materials, color: 'bg-orange-500' },
                  { key: 'equipment', label: 'Équipements', bucket: aggregate.resources.equipment, color: 'bg-blue-500' },
                  { key: 'labor', label: "Main d'œuvre", bucket: aggregate.resources.labor, color: 'bg-purple-500' },
                ] as const).map((row) => {
                  const cost = row.bucket.plannedCost + row.bucket.engagedCost;
                  const share = budget > 0 ? (cost / budget) * 100 : 0;
                  return (
                    <div key={row.key} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn('w-3 h-3 rounded-full', row.color)} />
                          <span className="text-sm">{row.label} ({row.bucket.count})</span>
                        </div>
                        <span className="font-medium">{formatCurrency(cost)}</span>
                      </div>
                      <Progress value={Math.min(share, 100)} className="h-1.5" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                <T k="phase.finances.no_resources" fallback="Aucune ligne de bordereau rattachée à cette phase." />
              </p>
            )}
          </CardContent>
        </Card>

        {/* Budget Utilization */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium"><T k="auto.phasefinancestab.utilisation_budget" fallback="Utilisation budget" /></CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAggregate ? (
              <Skeleton className="h-4 w-full" />
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground"><T k="auto.phasefinancestab.progression" fallback="Progression:" /></span>
                  <span className="font-medium">{phase?.progress ?? 0}%</span>
                </div>
                <Progress value={Math.min(utilization, 100)} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground"><T k="auto.phasefinancestab.utilisation" fallback="Utilisation:" /></span>
                  <span className={cn('font-medium', utilization > 100 ? 'text-destructive' : 'text-success')}>
                    {utilization.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground"><T k="phase.finances.engagement_rate" fallback="Taux d'engagement:" /></span>
                  <span className="font-medium">{engagementRate.toFixed(1)}%</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      
      {/* Detailed Cost Analysis */}
      {(phaseCosts && (phaseCosts.paymentsCount > 0 || phaseCosts.expensesCount > 0)) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Distribution */}
          {Object.keys(phaseCosts.paymentDistribution).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" />
                  <T k="auto.phasefinancestab.distribution_par_contractant" fallback="Distribution par contractant" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(phaseCosts.paymentDistribution)
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .slice(0, 5)
                    .map(([contractorId, amount]) => {
                      // ✅ RÉSOLUTION DU LABEL DU CONTRACTANT
                      const contractorLabel = getEntityLabel(contractorId, projects, 'supplier');
                      return (
                        <div key={contractorId} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-sm truncate">
                              {/* ✅ AFFICHAGE DU LABEL AU LIEU DE contractorId.slice(0, 8) */}
                              {contractorLabel || formatReference(contractorId, 'SUP')}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-sm">{formatCurrency(amount as number)}</span>
                            <span className="text-xs text-muted-foreground">
                              {(((amount as number) / phaseCosts.totalPayments) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Expense Distribution */}
          {Object.keys(phaseCosts.expenseDistribution).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-warning" />
                  <T k="auto.phasefinancestab.depenses_par_categorie" fallback="Dépenses par catégorie" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(phaseCosts.expenseDistribution)
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .slice(0, 5)
                    .map(([category, amount]) => (
                      <div key={category} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          <span className="text-sm truncate">{category}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-sm">{formatCurrency(amount as number)}</span>
                          <span className="text-xs text-muted-foreground">
                            {(((amount as number) / phaseCosts.totalExpenses) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      {/* Resource Cost Analysis */}
      {phaseResources && (phaseResources.totalEmployees > 0 || (phaseResources.materialMetrics?.estimatedCost ?? 0) > 0) && (
        <Card>
          <CardHeader>
            <CardTitle><T k="auto.phasefinancestab.couts_des_ressources" fallback="Coûts des ressources" /></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Employees Analysis */}
              {phaseResources.totalEmployees > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    Équipe ({phaseResources.totalEmployees} personnes)
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(phaseResources.employeesByPosition)
                      .sort(([,a], [,b]) => (b as number) - (a as number))
                      .slice(0, 5)
                      .map(([position, count]) => (
                        <div key={position} className="flex justify-between items-center">
                          <span className="text-sm truncate">{position}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{count as number}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {(((count as number) / phaseResources.totalEmployees) * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              
              {/* Materials Analysis */}
              {phaseResources.totalMaterials > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4 text-warning" />
                    Matériaux ({phaseResources.totalMaterials} unités)
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm"><T k="auto.phasefinancestab.cout_total_materiaux" fallback="Coût total matériaux" /></span>
                      <span className="font-medium text-warning">
                        {formatCurrency(phaseResources.materialMetrics?.estimatedCost ?? 0)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(phaseResources.materialsByCategory)
                        .sort(([,a], [,b]) => (b as number) - (a as number))
                        .slice(0, 5)
                        .map(([category, quantity]) => (
                          <div key={category} className="flex justify-between items-center">
                            <span className="text-sm truncate">{category}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{quantity as number}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {(((quantity as number) / phaseResources.totalMaterials) * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PhaseFinancesTab;