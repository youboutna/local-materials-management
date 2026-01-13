// Hook hexagonal pour les statistiques de monitoring

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MonitoringStats {
  guarantees: { count: number; status: string };
  payments: { count: number; status: string };
  inspections: { count: number; status: string };
}

async function fetchMonitoringStats(): Promise<MonitoringStats> {
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const today = new Date().toISOString();

  const [
    { data: guarantees, error: guaranteesError },
    { data: blockedPayments, error: paymentsError },
    { data: inspections, error: inspectionsError }
  ] = await Promise.all([
    supabase
      .from('bank_guarantees')
      .select('*')
      .eq('status', 'active')
      .lte('expiry_date', thirtyDaysFromNow),
    supabase
      .from('payment_blocks')
      .select('*')
      .is('resolved_at', null),
    supabase
      .from('inspections')
      .select('*')
      .eq('status', 'scheduled')
      .lt('date', today)
  ]);

  if (guaranteesError) console.error('Error loading guarantees:', guaranteesError);
  if (paymentsError) console.error('Error loading payments:', paymentsError);
  if (inspectionsError) console.error('Error loading inspections:', inspectionsError);

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
