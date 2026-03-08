// Hook hexagonal pour les statistiques de monitoring
// Uses RepositoryFactory instead of direct Supabase calls

import { useQuery } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export interface MonitoringStats {
  guarantees: { count: number; status: string };
  payments: { count: number; status: string };
  inspections: { count: number; status: string };
}

async function fetchMonitoringStats(): Promise<MonitoringStats> {
  const bankGuaranteeRepo = RepositoryFactory.getBankGuaranteeRepository();
  const paymentBlockingRepo = RepositoryFactory.getPaymentBlockingRepository();
  const inspectionRepo = RepositoryFactory.getInspectionRepository();

  const [guarantees, blockedPayments, inspections] = await Promise.all([
    bankGuaranteeRepo.findAll().then(all => all.filter((g: any) => {
      const exp = new Date(g.expiry_date || g.expiryDate);
      const threshold = new Date(); threshold.setDate(threshold.getDate() + 30);
      return exp <= threshold && (g.status === 'active');
    })).catch(() => []),
    paymentBlockingRepo.getActiveBlocks().catch(() => []),
    inspectionRepo.findOverdue().catch(() => []),
  ]);

  return {
    guarantees: {
      count: guarantees?.length || 0,
      status: guarantees?.length ? `${guarantees.length} alertes` : 'Actif'
    },
    payments: {
      count: blockedPayments?.length || 0,
      status: blockedPayments?.length ? `${blockedPayments.length} en retard` : 'Actif'
    },
    inspections: {
      count: inspections?.length || 0,
      status: inspections?.length ? `${inspections.length} en retard` : 'Actif'
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
      guarantees: { count: 0, status: 'Actif' },
      payments: { count: 0, status: 'Actif' },
      inspections: { count: 0, status: 'Actif' }
    },
    loading: isLoading,
    error,
    refetch
  };
}