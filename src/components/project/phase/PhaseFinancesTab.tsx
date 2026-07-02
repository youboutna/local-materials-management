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
// PaymentCalculator component requires different props - using simpler display

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
  return (
    <div className="space-y-6">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Budget vs Actual */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Budget vs Réel</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCosts ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : phaseCosts ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Estimé:</span>
                  <span className="font-medium">{formatCurrency(phase.estimated_cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Engagé:</span>
                  <span className="font-medium text-amber-600">
                    {formatCurrency(phaseCosts.totalSpent)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Écart:</span>
                  <span className={cn(
                    phaseCosts.costVariance > 0 
                      ? "text-red-600" 
                      : "text-green-600"
                  )}>
                    {formatCurrency(phaseCosts.costVariance)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Budget restant:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(phaseCosts.remainingBudget)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune donnée financière</p>
            )}
          </CardContent>
        </Card>
        
        {/* Cost Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Répartition coûts</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCosts ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : phaseCosts ? (
              <div className="space-y-3">
                {phaseCosts.totalPayments > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-sm">Contractants</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatCurrency(phaseCosts.totalPayments)}</span>
                        <span className="text-xs text-muted-foreground">
                          {phaseCosts.totalSpent > 0 
                            ? `${((phaseCosts.totalPayments / phaseCosts.totalSpent) * 100).toFixed(1)}%`
                            : '0%'}
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={phaseCosts.totalSpent > 0 ? (phaseCosts.totalPayments / phaseCosts.totalSpent) * 100 : 0} 
                      className="h-1.5 bg-blue-100 [&>div]:bg-blue-500" 
                    />
                  </div>
                )}
                
                {phaseCosts.totalExpenses > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <span className="text-sm">Dépenses</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatCurrency(phaseCosts.totalExpenses)}</span>
                        <span className="text-xs text-muted-foreground">
                          {phaseCosts.totalSpent > 0 
                            ? `${((phaseCosts.totalExpenses / phaseCosts.totalSpent) * 100).toFixed(1)}%`
                            : '0%'}
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={phaseCosts.totalSpent > 0 ? (phaseCosts.totalExpenses / phaseCosts.totalSpent) * 100 : 0} 
                      className="h-1.5 bg-orange-100 [&>div]:bg-orange-500" 
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune donnée</p>
            )}
          </CardContent>
        </Card>
        
        {/* Budget Utilization */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Utilisation budget</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCosts ? (
              <Skeleton className="h-4 w-full" />
            ) : phaseCosts ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progression:</span>
                  <span className="font-medium">{phase.progress}%</span>
                </div>
                <Progress value={phaseCosts.budgetUtilization} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Utilisation:</span>
                  <span className={cn(
                    "font-medium",
                    phaseCosts.budgetUtilization > 100 ? "text-red-600" : "text-green-600"
                  )}>
                    {phaseCosts.budgetUtilization.toFixed(1)}%
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune donnée</p>
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
                  <Wallet className="h-4 w-4 text-blue-600" />
                  Distribution par contractant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(phaseCosts.paymentDistribution)
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .slice(0, 5)
                    .map(([contractorId, amount]) => (
                      <div key={contractorId} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-sm truncate">Contractant {contractorId.slice(0, 8)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-sm">{formatCurrency(amount as number)}</span>
                          <span className="text-xs text-muted-foreground">
                            {(((amount as number) / phaseCosts.totalPayments) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Expense Distribution */}
          {Object.keys(phaseCosts.expenseDistribution).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-orange-600" />
                  Dépenses par catégorie
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
            <CardTitle>Coûts des ressources</CardTitle>
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
                    <Package className="h-4 w-4 text-amber-600" />
                    Matériaux ({phaseResources.totalMaterials} unités)
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Coût total matériaux</span>
                      <span className="font-medium text-amber-600">
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
