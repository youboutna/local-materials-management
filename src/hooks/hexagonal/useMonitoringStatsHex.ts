// Hook hexagonal pour les statistiques de monitoring
// Uses RepositoryFactory instead of direct Supabase calls

import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useQuery } from '@tanstack/react-query';

export interface MonitoringMetric {
  /** Nombre total d'enregistrements du domaine. */
  total: number;
  /** Nombre d'enregistrements nécessitant une action (expiration, retard, blocage). */
  count: number;
  status: string;
}

export interface MonitoringStats {
  guarantees: MonitoringMetric;
  payments: MonitoringMetric;
  inspections: MonitoringMetric;
}

async function fetchMonitoringStats(): Promise<MonitoringStats> {
  const bankGuaranteeRepo = RepositoryFactory.getBankGuaranteeRepository();
  const paymentBlockingRepo = RepositoryFactory.getPaymentBlockingRepository();
  const inspectionRepo = RepositoryFactory.getInspectionRepository();

  const [allGuarantees, blockedPayments, allInspections, overdueInspections] = await Promise.all([
    bankGuaranteeRepo.findAll().catch(() => []),
    paymentBlockingRepo.getActiveBlocks().catch(() => []),
    inspectionRepo.findAll().catch(() => []),
    inspectionRepo.findOverdue().catch(() => []),
  ]);

  const threshold = new Date();
  threshold.setDate(threshold.getDate() + 30);
  const expiringGuarantees = (allGuarantees as any[]).filter((g: any) => {
    const exp = new Date(g.expiry_date || g.expiryDate);
    return !Number.isNaN(exp.getTime()) && exp <= threshold && g.status === 'active';
  });

  return {
    guarantees: {
      total: allGuarantees?.length || 0,
      count: expiringGuarantees.length,
      status: expiringGuarantees.length ? `${expiringGuarantees.length} alertes` : 'Actif'
    },
    payments: {
      total: blockedPayments?.length || 0,
      count: blockedPayments?.length || 0,
      status: blockedPayments?.length ? `${blockedPayments.length} bloqué(s)` : 'Actif'
    },
    inspections: {
      total: allInspections?.length || 0,
      count: overdueInspections?.length || 0,
      status: overdueInspections?.length ? `${overdueInspections.length} en retard` : 'Actif'
    }
  };
}

export function useMonitoringStatsHex() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['monitoring-stats'],
    queryFn: fetchMonitoringStats,
    staleTime: 30000,
    refetchInterval: 30000
  });

  return {
    stats: data || {
      guarantees: { total: 0, count: 0, status: 'Actif' },
      payments: { total: 0, count: 0, status: 'Actif' },
      inspections: { total: 0, count: 0, status: 'Actif' }
    },
    loading: isLoading,
    error,
    refetch
  };
}
