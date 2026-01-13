// Hook hexagonal pour les KPIs de performance projet

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';

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
}

async function fetchKPIMetrics(): Promise<KPIMetrics> {
  const today = new Date();

  // Parallel fetches
  const [
    { data: projects },
    { data: milestones },
    { data: payments },
    { data: guarantees }
  ] = await Promise.all([
    supabase.from('projects').select('id, title, status, progress, budget, start_date, end_date'),
    supabase.from('enhanced_project_milestones').select('*'),
    supabase.from('payments').select('amount, status, due_date, project_id'),
    supabase.from('bank_guarantees').select('*').gte('expiry_date', today.toISOString()).order('expiry_date', { ascending: true }).limit(5)
  ]);

  let projectsOnTrack = 0;
  let projectsDelayed = 0;
  let projectsAtRisk = 0;
  let totalBudget = 0;
  let totalSpent = 0;
  let plannedProgress = 0;
  let actualProgress = 0;

  (projects || []).forEach((project: any) => {
    totalBudget += project.budget || 0;
    actualProgress += project.progress || 0;

    if (project.start_date && project.end_date) {
      const startDate = new Date(project.start_date);
      const endDate = new Date(project.end_date);
      const totalDays = differenceInDays(endDate, startDate);
      const elapsedDays = differenceInDays(today, startDate);
      const expectedProgress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
      plannedProgress += expectedProgress;

      const variance = (project.progress || 0) - expectedProgress;
      if (variance >= -5) projectsOnTrack++;
      else if (variance >= -15) projectsAtRisk++;
      else projectsDelayed++;
    } else {
      projectsOnTrack++;
    }
  });

  const spi = plannedProgress > 0 ? actualProgress / plannedProgress : 1;

  (payments || []).forEach((payment: any) => {
    if (payment.status === 'paid' || payment.status === 'completed') {
      totalSpent += payment.amount || 0;
    }
  });

  const cpi = totalSpent > 0 ? (actualProgress / 100 * totalBudget) / totalSpent : 1;

  const milestonesCompleted = (milestones || []).filter((m: any) => m.status === 'completed').length;
  const milestonesPending = (milestones || []).filter((m: any) => m.status !== 'completed').length;
  const milestonesOverdue = (milestones || []).filter((m: any) => {
    if (m.status === 'completed') return false;
    return m.target_date && new Date(m.target_date) < today;
  }).length;

  // Generate critical alerts
  const criticalAlerts: CriticalAlert[] = [];

  // Payment alerts
  (payments || []).forEach((payment: any) => {
    if (payment.status === 'pending' && payment.due_date) {
      const daysUntil = differenceInDays(new Date(payment.due_date), today);
      if (daysUntil <= 7 && daysUntil >= 0) {
        criticalAlerts.push({
          id: `payment-${payment.project_id}`,
          type: 'payment',
          title: 'Paiement imminent',
          description: `Échéance dans ${daysUntil} jour(s) - ${(payment.amount / 1000000).toFixed(2)}M MRU`,
          severity: daysUntil <= 3 ? 'critical' : 'warning',
          daysUntil,
          entityId: payment.project_id,
          entityType: 'payment',
          actionUrl: '/payment-control'
        });
      }
    }
  });

  // Overdue milestones
  (milestones || []).filter((m: any) => {
    if (m.status === 'completed') return false;
    return m.target_date && new Date(m.target_date) < today;
  }).slice(0, 3).forEach((m: any) => {
    const daysLate = differenceInDays(today, new Date(m.target_date));
    criticalAlerts.push({
      id: `milestone-${m.id}`,
      type: 'milestone',
      title: 'Jalon en retard',
      description: `${m.title} - ${daysLate} jour(s) de retard`,
      severity: daysLate > 7 ? 'critical' : 'warning',
      daysUntil: -daysLate,
      entityId: m.project_id,
      entityType: 'milestone',
      actionUrl: `/projects/${m.project_id}`
    });
  });

  // Guarantee expiry alerts
  (guarantees || []).forEach((g: any) => {
    const daysUntil = differenceInDays(new Date(g.expiry_date), today);
    if (daysUntil <= 30) {
      criticalAlerts.push({
        id: `guarantee-${g.id}`,
        type: 'guarantee',
        title: 'Garantie bancaire',
        description: `Expiration dans ${daysUntil} jour(s) - ${g.bank_name}`,
        severity: daysUntil <= 7 ? 'critical' : 'warning',
        daysUntil,
        entityId: g.id,
        entityType: 'guarantee',
        actionUrl: '/bank-guarantee-monitor'
      });
    }
  });

  // Sort by severity
  criticalAlerts.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return (a.daysUntil || 0) - (b.daysUntil || 0);
  });

  return {
    spi: Math.round(spi * 100) / 100,
    cpi: Math.round(cpi * 100) / 100,
    projectsOnTrack,
    projectsDelayed,
    projectsAtRisk,
    totalBudget,
    totalSpent,
    budgetVariance: totalBudget - totalSpent,
    milestonesCompleted,
    milestonesPending,
    milestonesOverdue,
    criticalAlerts: criticalAlerts.slice(0, 5)
  };
}

export function useKPIMetricsHex() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['kpi-metrics'],
    queryFn: fetchKPIMetrics,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000 // 1 minute
  });

  return {
    kpiMetrics: data,
    loading: isLoading,
    error,
    refetch
  };
}
