// Hook hexagonal pour les résumés de monitoring de phase
// Uses services instead of direct Supabase access

import { useQuery } from '@tanstack/react-query';
import { PhaseService } from '@/application/services/PhaseService';
import { InspectionService } from '@/application/services/InspectionService';
import { PaymentService } from '@/application/services/PaymentService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

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
  try {
    const phaseService = new PhaseService(RepositoryFactory.getPhaseRepository());
    const tasks = await phaseService.getPhaseTasksSummary(phaseId);
    return tasks || { total: 0, completed: 0, inProgress: 0, pending: 0 };
  } catch {
    return { total: 0, completed: 0, inProgress: 0, pending: 0 };
  }
}

async function fetchInspectionsSummary(phaseId: string): Promise<InspectionsSummary> {
  try {
    const inspections = await InspectionService.getInspectionsByPhase(phaseId);
    const total = inspections.length;
    const approved = inspections.filter(i => i.status === 'approved').length;
    const pending = inspections.filter(i => i.status === 'pending' || i.status === 'scheduled').length;
    const rejected = inspections.filter(i => i.status === 'rejected').length;
    const avgProgress = total > 0
      ? Math.round(inspections.reduce((sum, i) => sum + (i.progressAtInspection || 0), 0) / total)
      : 0;
    return { total, approved, pending, rejected, avgProgress };
  } catch {
    return { total: 0, approved: 0, pending: 0, rejected: 0, avgProgress: 0 };
  }
}

async function fetchPaymentsSummary(phaseId: string): Promise<PaymentsSummary> {
  try {
    const service = new PaymentService(RepositoryFactory.getPaymentRepository());
    const payments = await service.getPaymentsByPhase(phaseId);
    const total = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    return { total, totalAmount };
  } catch {
    return { total: 0, totalAmount: 0 };
  }
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
