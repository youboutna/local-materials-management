/**
 * KPI Metrics Hook - Real data from Supabase
 * Following hexagonal architecture: Hook → Supabase Adapter
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EVMCalculations, BudgetAnalytics } from '@/types/calculations';
import { toast } from 'sonner';

export interface CriticalAlert {
  id: string;
  type: 'payment' | 'milestone' | 'delay' | 'inspection' | 'guarantee';
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
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

/**
 * Fetch real KPI metrics from Supabase
 */
const fetchKPIMetrics = async (): Promise<KPIMetrics> => {
  try {
    // Fetch projects data
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, title, budget, progress, status, start_date, end_date');

    if (projectsError) throw projectsError;

    // Fetch payments data
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('id, amount, status, project_id');

    if (paymentsError) throw paymentsError;

    // Fetch milestones data
    const { data: milestones, error: milestonesError } = await supabase
      .from('enhanced_project_milestones')
      .select('id, title, status, target_date, completed_date');

    if (milestonesError) throw milestonesError;

    // Fetch critical alerts
    const { data: alerts, error: alertsError } = await supabase
      .from('monitoring_alerts')
      .select('id, title, description, priority, alert_type, status')
      .in('priority', ['critical', 'high'])
      .eq('status', 'active')
      .limit(5);

    if (alertsError) throw alertsError;

    // Calculate totals
    const projectsList = projects || [];
    const paymentsList = payments || [];
    const milestonesList = milestones || [];
    const alertsList = alerts || [];

    const totalBudget = projectsList.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalProgress = projectsList.length > 0 
      ? projectsList.reduce((sum, p) => sum + (p.progress || 0), 0) / projectsList.length 
      : 0;
    const totalSpent = paymentsList
      .filter(p => p.status === 'approved' || p.status === 'completed')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    // Project status counts
    const projectsOnTrack = projectsList.filter(p => p.status === 'in_progress' && (p.progress || 0) >= 50).length;
    const projectsDelayed = projectsList.filter(p => p.status === 'delayed' || p.status === 'on_hold').length;
    const projectsAtRisk = projectsList.filter(p => {
      const endDate = p.end_date ? new Date(p.end_date) : null;
      return endDate && endDate < new Date() && p.status !== 'completed';
    }).length;

    // Milestone counts
    const milestonesCompleted = milestonesList.filter(m => m.status === 'completed').length;
    const milestonesPending = milestonesList.filter(m => m.status === 'pending' || m.status === 'in_progress').length;
    const milestonesOverdue = milestonesList.filter(m => {
      const targetDate = m.target_date ? new Date(m.target_date) : null;
      return targetDate && targetDate < new Date() && m.status !== 'completed';
    }).length;

    // EVM Calculations
    const today = new Date();
    const projectStart = projectsList.length > 0 && projectsList[0].start_date 
      ? new Date(projectsList[0].start_date) 
      : new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    const projectEnd = projectsList.length > 0 && projectsList[0].end_date 
      ? new Date(projectsList[0].end_date) 
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
      plannedValue,
      earnedValue,
      actualCost: totalSpent,
      scheduleVariance,
      costVariance,
      schedulePerformanceIndex,
      costPerformanceIndex,
      budgetAtCompletion,
      estimateAtCompletion,
      estimateToComplete,
      varianceAtCompletion,
    };

    const budget: BudgetAnalytics = {
      totalBudget,
      spentAmount: totalSpent,
      remainingBudget: totalBudget - totalSpent,
      budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      estimatedTotalCost: estimateAtCompletion,
      costVariance: totalBudget - totalSpent,
      tasksOverBudget: [],
      averageCostPerTask: paymentsList.length > 0 ? totalSpent / paymentsList.length : 0,
    };

    // Map critical alerts
    const criticalAlerts: CriticalAlert[] = alertsList.map((alert: any) => ({
      id: alert.id,
      type: mapAlertType(alert.alert_type),
      title: alert.title,
      description: alert.description || '',
      severity: alert.priority === 'critical' ? 'critical' : 'warning',
      entityId: alert.id,
      entityType: alert.alert_type
    }));

    return {
      spi: schedulePerformanceIndex,
      cpi: costPerformanceIndex,
      projectsOnTrack,
      projectsDelayed,
      projectsAtRisk,
      totalBudget,
      totalSpent,
      budgetVariance: budget.costVariance,
      milestonesCompleted,
      milestonesPending,
      milestonesOverdue,
      criticalAlerts,
      evm,
      budget,
    };
  } catch (error) {
    console.error('Error fetching KPI metrics:', error);
    // Return default values on error
    return getDefaultMetrics();
  }
};

function mapAlertType(alertType: string): CriticalAlert['type'] {
  const typeMap: Record<string, CriticalAlert['type']> = {
    'payment': 'payment',
    'milestone': 'milestone',
    'delay': 'delay',
    'inspection': 'inspection',
    'guarantee': 'guarantee'
  };
  return typeMap[alertType] || 'delay';
}

function getDefaultMetrics(): KPIMetrics {
  return {
    spi: 1,
    cpi: 1,
    projectsOnTrack: 0,
    projectsDelayed: 0,
    projectsAtRisk: 0,
    totalBudget: 0,
    totalSpent: 0,
    budgetVariance: 0,
    milestonesCompleted: 0,
    milestonesPending: 0,
    milestonesOverdue: 0,
    criticalAlerts: [],
    evm: {
      plannedValue: 0,
      earnedValue: 0,
      actualCost: 0,
      scheduleVariance: 0,
      costVariance: 0,
      schedulePerformanceIndex: 1,
      costPerformanceIndex: 1,
      budgetAtCompletion: 0,
      estimateAtCompletion: 0,
      estimateToComplete: 0,
      varianceAtCompletion: 0,
    },
    budget: {
      totalBudget: 0,
      spentAmount: 0,
      remainingBudget: 0,
      budgetUtilization: 0,
      estimatedTotalCost: 0,
      costVariance: 0,
      tasksOverBudget: [],
      averageCostPerTask: 0,
    },
  };
}

export function useKPIMetricsHex() {
  const query = useQuery<KPIMetrics>({
    queryKey: ['kpi-metrics'],
    queryFn: fetchKPIMetrics,
    retry: 2,
    retryDelay: 500,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });

  return {
    ...query,
    // Compatibility aliases
    kpiMetrics: query.data,
    loading: query.isLoading
  };
}
