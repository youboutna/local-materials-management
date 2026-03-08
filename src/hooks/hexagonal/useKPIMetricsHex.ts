/**
 * KPI Metrics Hook - Real data via Services
 * Following hexagonal architecture: Hook → Service → Adapter
 */

import { useQuery } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { EVMCalculations, BudgetAnalytics } from '@/types/calculations';

export interface CriticalAlert {
  id: string;
  type: 'payment' | 'milestone' | 'delay' | 'inspection' | 'guarantee';
  title: string;
  description: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'resolved' | 'acknowledged';
  createdAt: string;
  daysUntil?: number;
  entityId?: string;
  entityType?: string;
  actionUrl?: string;
}

export interface KPIMetrics {
  spi: number;
  cpi: number;
  projectsOnTrack: number;
  projectsDelayed: number;
  projectsAtRisk: number;
  totalBudget: number;
  totalSpent: number;
  budgetVariance: number;
  milestonesCompleted: number;
  milestonesPending: number;
  milestonesOverdue: number;
  criticalAlerts: CriticalAlert[];
  evm: EVMCalculations;
  budget: BudgetAnalytics;
}

const fetchKPIMetrics = async (): Promise<KPIMetrics> => {
  try {
    const projectRepo = RepositoryFactory.getProjectRepository();
    const paymentRepo = RepositoryFactory.getPaymentRepository();
    const milestoneRepo = RepositoryFactory.getMilestoneRepository();
    const alertRepo = RepositoryFactory.getAlertRepository();

    const [projects, payments, milestones, alerts] = await Promise.all([
      projectRepo.findAll(),
      paymentRepo.findAll(),
      milestoneRepo.findByProjectId('').catch(() => []),
      alertRepo.findAll().then((all: any[]) => (all || []).filter((a: any) => a.status === 'active').slice(0, 5)),
    ]);

    const projectsList = (projects || []) as any[];
    const paymentsList = (payments || []) as any[];
    const milestonesList = (milestones || []) as any[];
    const alertsList = (alerts || []) as any[];

    const totalBudget = projectsList.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalProgress = projectsList.length > 0 
      ? projectsList.reduce((sum, p) => sum + (p.progress || 0), 0) / projectsList.length 
      : 0;
    const totalSpent = paymentsList.reduce((sum, p) => sum + (p.amount || 0), 0);

    const projectsOnTrack = projectsList.filter(p => (p.status === 'en cours' || p.status === 'in_progress') && (p.progress || 0) >= 50).length;
    const projectsDelayed = projectsList.filter(p => p.status === 'en retard' || p.status === 'suspendu').length;
    const projectsAtRisk = projectsList.filter(p => {
      const endDate = (p.end_date || p.endDate) ? new Date(p.end_date || p.endDate) : null;
      return endDate && endDate < new Date() && p.status !== 'terminé';
    }).length;

    const milestonesCompleted = milestonesList.filter(m => m.status === 'completed').length;
    const milestonesPending = milestonesList.filter(m => m.status === 'pending' || m.status === 'in_progress').length;
    const milestonesOverdue = milestonesList.filter(m => {
      const targetDate = (m.target_date || m.targetDate) ? new Date(m.target_date || m.targetDate) : null;
      return targetDate && targetDate < new Date() && m.status !== 'completed';
    }).length;

    // EVM Calculations
    const today = new Date();
    const firstProject = projectsList[0];
    const projectStart = firstProject?.start_date || firstProject?.startDate
      ? new Date(firstProject.start_date || firstProject.startDate) 
      : new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    const projectEnd = firstProject?.end_date || firstProject?.endDate
      ? new Date(firstProject.end_date || firstProject.endDate)
      : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);

    const totalDuration = Math.max(1, projectEnd.getTime() - projectStart.getTime());
    const elapsedTime = Math.max(0, today.getTime() - projectStart.getTime());
    const timeProgress = Math.min(1, elapsedTime / totalDuration);

    const plannedValue = totalBudget * timeProgress;
    const earnedValue = totalBudget * (totalProgress / 100);
    const scheduleVariance = earnedValue - plannedValue;
    const costVariance = earnedValue - totalSpent;
    const schedulePerformanceIndex = plannedValue > 0 ? earnedValue / plannedValue : 1;
    const costPerformanceIndex = totalSpent > 0 ? earnedValue / totalSpent : 1;
    const budgetAtCompletion = totalBudget;
    const estimateAtCompletion = costPerformanceIndex > 0 ? budgetAtCompletion / costPerformanceIndex : budgetAtCompletion;
    const estimateToComplete = Math.max(0, estimateAtCompletion - totalSpent);
    const varianceAtCompletion = budgetAtCompletion - estimateAtCompletion;

    const evm: EVMCalculations = {
      plannedValue, earnedValue, actualCost: totalSpent, scheduleVariance, costVariance,
      schedulePerformanceIndex, costPerformanceIndex, budgetAtCompletion,
      estimateAtCompletion, estimateToComplete, varianceAtCompletion,
    };

    const budget: BudgetAnalytics = {
      totalBudget, spentAmount: totalSpent, remainingBudget: totalBudget - totalSpent,
      budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      estimatedTotalCost: estimateAtCompletion, costVariance: totalBudget - totalSpent,
      tasksOverBudget: [], averageCostPerTask: paymentsList.length > 0 ? totalSpent / paymentsList.length : 0,
    };

    const criticalAlerts: CriticalAlert[] = alertsList.map((alert: any) => ({
      id: alert.id,
      type: mapAlertType(alert.alert_type || alert.alertType),
      title: alert.title,
      description: alert.description || '',
      message: alert.message || alert.description || '',
      severity: alert.severity || 'warning',
      priority: alert.priority || 'medium',
      status: alert.status || 'active',
      createdAt: alert.created_at || alert.createdAt,
    }));

    return {
      spi: schedulePerformanceIndex, cpi: costPerformanceIndex,
      projectsOnTrack, projectsDelayed, projectsAtRisk,
      totalBudget, totalSpent, budgetVariance: budget.costVariance,
      milestonesCompleted, milestonesPending, milestonesOverdue,
      criticalAlerts, evm, budget,
    };
  } catch (error) {
    console.error('Error fetching KPI metrics:', error);
    return getDefaultMetrics();
  }
};

function mapAlertType(alertType: string): 'payment' | 'milestone' | 'delay' | 'inspection' | 'guarantee' {
  const typeMap: Record<string, 'payment' | 'milestone' | 'delay' | 'inspection' | 'guarantee'> = {
    'payment': 'payment', 'milestone': 'milestone', 'delay': 'delay',
    'inspection': 'inspection', 'guarantee': 'guarantee'
  };
  return typeMap[alertType] || 'delay';
}

function getDefaultMetrics(): KPIMetrics {
  return {
    spi: 1, cpi: 1, projectsOnTrack: 0, projectsDelayed: 0, projectsAtRisk: 0,
    totalBudget: 0, totalSpent: 0, budgetVariance: 0,
    milestonesCompleted: 0, milestonesPending: 0, milestonesOverdue: 0,
    criticalAlerts: [],
    evm: { plannedValue: 0, earnedValue: 0, actualCost: 0, scheduleVariance: 0, costVariance: 0, schedulePerformanceIndex: 1, costPerformanceIndex: 1, budgetAtCompletion: 0, estimateAtCompletion: 0, estimateToComplete: 0, varianceAtCompletion: 0, },
    budget: { totalBudget: 0, spentAmount: 0, remainingBudget: 0, budgetUtilization: 0, estimatedTotalCost: 0, costVariance: 0, tasksOverBudget: [], averageCostPerTask: 0, },
  };
}

export function useKPIMetricsHex() {
  const query = useQuery<KPIMetrics>({
    queryKey: ['kpi-metrics'],
    queryFn: fetchKPIMetrics,
    retry: 2, retryDelay: 500,
    refetchInterval: 5 * 60 * 1000, staleTime: 2 * 60 * 1000,
  });

  return { ...query, kpiMetrics: query.data, loading: query.isLoading };
}
