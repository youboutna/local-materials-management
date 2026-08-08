/**
 * Payment Control Hook - Hexagonal Architecture
 */

import { PaymentControlService } from '@/application/services/PaymentControlServiceWorking';
import {
    PaymentBlockingInterfaceDTO,
    PaymentControlDashboardDTO
} from '@/dtos/entities/MonitoringDTOs';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPaymentControlService } from '@/application/services/PaymentControlService';

export interface UsePaymentControlHexResult {
  dashboard: PaymentControlDashboardDTO | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  blockPayment: (paymentId: string, reason: string, blockedBy: string, autoRelease?: boolean, releaseConditions?: string[]) => Promise<PaymentBlockingInterfaceDTO>;
  approvePayment: (paymentId: string, approvedBy: string, notes?: string) => Promise<void>;
  rejectPayment: (paymentId: string, rejectedBy: string, reason: string) => Promise<void>;
}

export function usePaymentControlHex(userId: string, period: 'week' | 'month' | 'quarter' | 'year' = 'month'): UsePaymentControlHexResult {
  const queryClient = useQueryClient();

  const paymentControlService = getPaymentControlService();

  const {
    data: dashboard,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['payment-control-dashboard', userId, period],
    queryFn: () => paymentControlService.getPaymentControlDashboard(userId, period),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });

  const blockPaymentMutation = useMutation({
    mutationFn: ({ paymentId, reason, blockedBy, autoRelease, releaseConditions }: { 
      paymentId: string; reason: string; blockedBy: string; autoRelease?: boolean; releaseConditions?: string[] 
    }) => paymentControlService.blockPayment(paymentId, reason, blockedBy, autoRelease, releaseConditions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-control-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });

  const approvePaymentMutation = useMutation({
    mutationFn: ({ paymentId, approvedBy, notes }: { paymentId: string; approvedBy: string; notes?: string }) => 
      paymentControlService.approvePayment(paymentId, approvedBy, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-control-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });

  // Use approvePayment-based rejection since the Working service doesn't have rejectPayment
  // but the main PaymentControlService does
  const rejectPaymentMutation = useMutation({
    mutationFn: async ({ paymentId, rejectedBy, reason }: { paymentId: string; rejectedBy: string; reason: string }) => {
      // Block the payment as a rejection mechanism
      await paymentControlService.blockPayment(paymentId, reason, rejectedBy);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-control-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });

  return {
    dashboard: dashboard || null,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
    blockPayment: async (paymentId, reason, blockedBy, autoRelease?, releaseConditions?) => 
      blockPaymentMutation.mutateAsync({ paymentId, reason, blockedBy, autoRelease, releaseConditions }),
    approvePayment: async (paymentId, approvedBy, notes?) => {
      await approvePaymentMutation.mutateAsync({ paymentId, approvedBy, notes });
    },
    rejectPayment: async (paymentId, rejectedBy, reason) => {
      await rejectPaymentMutation.mutateAsync({ paymentId, rejectedBy, reason });
    },
  };
}
