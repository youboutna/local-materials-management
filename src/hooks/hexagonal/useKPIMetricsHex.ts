/**
 * KPI Metrics Hook - Real data via Services
 * Following hexagonal architecture: Hook → Service → Adapter
 */

import type { BudgetAnalytics, EVMCalculations } from '@/dtos/entities/CalculationsDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { getMonitoringAlertService } from '@/application/services/MonitoringAlertService';
import { useQuery } from '@tanstack/react-query';

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
    const alertService = getMonitoringAlertService();

    const [projects, payments, alerts] = await Promise.all([
      projectRepo.findAll(),
      paymentRepo.findAll(),
      alertService.getAllAlerts(),
    ]);

    const projectsList = (projects || []) as any[];
    const paymentsList = (payments || []) as any[];
    const milestonesList = (await Promise.all(
      projectsList.map((project) => milestoneRepo.findByProjectId(project.id))
    )).flat();
    const alertsList = (alerts || []).filter((alert) => !alert.acknowledged).slice(0, 5);

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

    // ===== EVM portefeuille : agrégation projet par projet (pas de date « premier projet ») =====
    const today = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    const clampIndex = (value: number) => Math.min(3, Math.max(0, Number.isFinite(value) ? value : 0));

    let plannedValue = 0;
    let earnedValue = 0;
    for (const project of projectsList) {
      const budget = Number(project.budget) || 0;
      if (budget <= 0) continue;

      const rawStart = project.startDate || project.start_date;
      const rawEnd = project.endDate || project.end_date;
       if (!rawStart || !rawEnd) continue;
       const start = new Date(rawStart).getTime();
       const end = new Date(rawEnd).getTime();
       if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;
      const duration = Math.max(DAY, end - start);
      const timeProgress = Math.min(1, Math.max(0, (today - start) / duration));

      plannedValue += budget * timeProgress;
      earnedValue += budget * (Math.min(100, Math.max(0, Number(project.progress) || 0)) / 100);
    }

    const scheduleVariance = earnedValue - plannedValue;
    const costVariance = earnedValue - totalSpent;
    const schedulePerformanceIndex = plannedValue > 0 ? clampIndex(earnedValue / plannedValue) : 1;
    const costPerformanceIndex = totalSpent > 0 ? clampIndex(earnedValue / totalSpent) : 1;
    const budgetAtCompletion = totalBudget;
    const estimateAtCompletion =
      costPerformanceIndex > 0.01 ? budgetAtCompletion / costPerformanceIndex : budgetAtCompletion;
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
       type: mapAlertType(alert.type || ''),
      title: alert.title,
      description: alert.description || '',
      message: alert.description || '',
      severity: (alert.severity === 'critical' || alert.severity === 'high') ? 'critical' : 'warning',
      priority: alert.severity === 'critical' ? 'critical' : alert.severity === 'high' ? 'high' : 'medium',
       status: alert.status === 'resolved' ? 'resolved' : alert.acknowledged ? 'acknowledged' : 'active',
       createdAt: alert.createdAt || alert.timestamp,
       entityId: alert.projectId || alert.relatedEntityId,
       entityType: alert.phaseId ? 'phase' : alert.projectId ? 'project' : undefined,
       actionUrl: alert.projectId ? `/projects/${alert.projectId}${alert.phaseId ? `?phase=${alert.phaseId}` : ''}` : undefined,
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
    throw error;
  }
};

function mapAlertType(alertType: string): 'payment' | 'milestone' | 'delay' | 'inspection' | 'guarantee' {
  const typeMap: Record<string, 'payment' | 'milestone' | 'delay' | 'inspection' | 'guarantee'> = {
    'payment': 'payment', 'milestone': 'milestone', 'delay': 'delay',
    'inspection': 'inspection', 'guarantee': 'guarantee'
  };
  return typeMap[alertType] || 'delay';
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
