/**
 * Hexagonal Hook: usePaymentStatsHex
 * Provides payment statistics and blocking info via services
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { detectProjectDelays } from '@/services/BankGuaranteeService';

export interface PaymentStats {
  blockedPayments: number;
  expiredInsurances: number;
  delayedProjects: number;
  missingDocuments: number;
}

async function fetchPaymentStats(): Promise<PaymentStats> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Fetch all data in parallel
  const [
    blockedPaymentsResult,
    expiredInsurancesResult,
    delayedProjects,
    thresholdResult,
    missingDocsResult
  ] = await Promise.all([
    supabase
      .from('payment_blocks')
      .select('id', { count: 'exact' })
      .is('resolved_at', null)
      .gte('blocked_at', startOfMonth.toISOString()),
    supabase
      .from('insurance_certificates')
      .select('contractor_id', { count: 'exact' })
      .lt('valid_until', new Date().toISOString()),
    detectProjectDelays(),
    supabase
      .from('escalation_thresholds')
      .select('threshold_value')
      .eq('threshold_type', 'project_delay')
      .eq('threshold_name', 'bank_notification')
      .maybeSingle(),
    supabase
      .from('documents')
      .select('project_id', { count: 'exact' })
      .eq('status', 'draft')
      .eq('document_type', 'contract')
  ]);

  const threshold = thresholdResult.data?.threshold_value || 20;
  const criticallyDelayed = delayedProjects.filter(
    (p) => p.delayPercentage >= threshold
  );

  return {
    blockedPayments: blockedPaymentsResult.data?.length || 0,
    expiredInsurances: expiredInsurancesResult.data?.length || 0,
    delayedProjects: criticallyDelayed.length,
    missingDocuments: missingDocsResult.data?.length || 0,
  };
}

export function usePaymentStatsHex() {
  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['payment-stats-hex'],
    queryFn: fetchPaymentStats,
    staleTime: 30_000,
    refetchInterval: 60_000, // Refresh every minute
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
