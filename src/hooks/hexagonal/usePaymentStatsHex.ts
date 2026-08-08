/**
 * Hexagonal Hook: usePaymentStatsHex
 * Uses services instead of direct Supabase access
 */
import { PaymentControlService } from '@/application/services/PaymentControlServiceWorking';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useQuery } from '@tanstack/react-query';

export interface PaymentStats {
  blockedPayments: number;
  expiredInsurances: number;
  delayedProjects: number;
  missingDocuments: number;
}

async function fetchPaymentStats(): Promise<PaymentStats> {
  try {
    const service = getPaymentControlService();
    // Use the dashboard method to derive stats
    const dashboard = await service.getPaymentControlDashboard('system', 'month');
    return {
      blockedPayments: dashboard?.blockedPayments ?? 0,
      expiredInsurances: 0,
      delayedProjects: dashboard?.overduePayments ?? 0,
      missingDocuments: 0,
    };
  } catch {
    return {
      blockedPayments: 0,
      expiredInsurances: 0,
      delayedProjects: 0,
      missingDocuments: 0,
    };
  }
}

export function usePaymentStatsHex() {
  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['payment-stats-hex'],
    queryFn: fetchPaymentStats,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return {
    stats: stats ?? {
      blockedPayments: 0,
      expiredInsurances: 0,
      delayedProjects: 0,
      missingDocuments: 0,
    },
    isLoading,
    error,
    refetch,
  };
}

export default usePaymentStatsHex;
