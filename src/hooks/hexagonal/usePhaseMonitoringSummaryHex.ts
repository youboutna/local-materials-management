// Hook hexagonal pour les résumés de monitoring de phase
// Centralise les données pour PhaseMonitoringDashboard et UnifiedPhaseMonitoring

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TasksSummary {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
}

export interface InspectionsSummary {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  avgProgress: number;
}

export interface PaymentsSummary {
  total: number;
  totalAmount: number;
}

export interface PhaseMonitoringSummary {
  tasks: TasksSummary;
  inspections: InspectionsSummary;
  payments: PaymentsSummary;
}

async function fetchTasksSummary(phaseId: string): Promise<TasksSummary> {
  const { data } = await supabase
    .from('task_assignments')
    .select('status')
    .eq('phase_id', phaseId);

  const total = data?.length || 0;
  const completed = data?.filter(t => t.status === 'completed').length || 0;
  const inProgress = data?.filter(t => t.status === 'in_progress').length || 0;
  const pending = data?.filter(t => t.status === 'pending').length || 0;

  return { total, completed, inProgress, pending };
}

async function fetchInspectionsSummary(phaseId: string): Promise<InspectionsSummary> {
  const { data } = await supabase
    .from('inspections')
    .select('status, progress_at_inspection')
    .eq('phase_id', phaseId);

  const total = data?.length || 0;
  const approved = data?.filter(i => i.status === 'approved').length || 0;
  const pending = data?.filter(i => i.status === 'pending' || i.status === 'scheduled').length || 0;
  const rejected = data?.filter(i => i.status === 'rejected').length || 0;
  const avgProgress = total > 0
    ? Math.round(data!.reduce((sum, i) => sum + (i.progress_at_inspection || 0), 0) / total)
    : 0;

  return { total, approved, pending, rejected, avgProgress };
}

async function fetchPaymentsSummary(phaseId: string): Promise<PaymentsSummary> {
  const { data } = await supabase
    .from('payments')
    .select('amount')
    .eq('phase_id', phaseId);

  const total = data?.length || 0;
  const totalAmount = data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  return { total, totalAmount };
}

export function useTasksSummaryHex(phaseId: string) {
  return useQuery({
    queryKey: ['phase-tasks-summary', phaseId],
    queryFn: () => fetchTasksSummary(phaseId),
    enabled: !!phaseId,
    staleTime: 30000,
  });
}

export function useInspectionsSummaryHex(phaseId: string) {
  return useQuery({
    queryKey: ['phase-inspections-summary', phaseId],
    queryFn: () => fetchInspectionsSummary(phaseId),
    enabled: !!phaseId,
    staleTime: 30000,
  });
}

export function usePaymentsSummaryHex(phaseId: string) {
  return useQuery({
    queryKey: ['phase-payments-summary', phaseId],
    queryFn: () => fetchPaymentsSummary(phaseId),
    enabled: !!phaseId,
    staleTime: 30000,
  });
}

export function usePhaseMonitoringSummaryHex(phaseId: string) {
  const tasksQuery = useTasksSummaryHex(phaseId);
  const inspectionsQuery = useInspectionsSummaryHex(phaseId);
  const paymentsQuery = usePaymentsSummaryHex(phaseId);

  const isLoading = tasksQuery.isLoading || inspectionsQuery.isLoading || paymentsQuery.isLoading;
  const isError = tasksQuery.isError || inspectionsQuery.isError || paymentsQuery.isError;

  return {
    tasksSummary: tasksQuery.data,
    inspectionsSummary: inspectionsQuery.data,
    paymentsSummary: paymentsQuery.data,
    isLoading,
    isError,
    refetch: () => {
      tasksQuery.refetch();
      inspectionsQuery.refetch();
      paymentsQuery.refetch();
    },
  };
}
