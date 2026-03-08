/**
 * Payment Control Hook - Hexagonal Architecture
 * 
 * Hook for payment control and blocking functionality
 * Following hexagonal architecture patterns:
 * - Uses services for business logic
 * - Uses React Query for state management
 * - Exposes clean interface to UI components
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PaymentControlDashboardDTO, 
  PaymentBlockingInterfaceDTO 
} from '@/dtos/entities/MonitoringDTOs';
import { PaymentControlService } from '@/application/services/PaymentControlServiceWorking';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

// =================== INTERFACES ===================

export interface UsePaymentControlHexResult {
  dashboard: PaymentControlDashboardDTO | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  blockPayment: (paymentId: string, reason: string, blockedBy: string, autoRelease?: boolean, releaseConditions?: string[]) => Promise<PaymentBlockingInterfaceDTO>;
  approvePayment: (paymentId: string, approvedBy: string, notes?: string) => Promise<void>;
  rejectPayment: (paymentId: string, rejectedBy: string, reason: string) => Promise<void>;
}

// =================== HOOK IMPLEMENTATION ===================

export function usePaymentControlHex(userId: string, period: 'week' | 'month' | 'quarter' | 'year' = 'month'): UsePaymentControlHexResult {
  const queryClient = useQueryClient();

  // Initialize service
  const paymentControlService = new PaymentControlService(
    RepositoryFactory.getPaymentRepository(),
    RepositoryFactory.getNotificationRepository()
  );

  // Get payment control dashboard query
  const {
    data: dashboard,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['payment-control-dashboard', userId, period],
    queryFn: () => paymentControlService.getPaymentControlDashboard(userId, period),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Block payment mutation
  const blockPaymentMutation = useMutation({
    mutationFn: ({ 
      paymentId, 
      reason, 
      blockedBy, 
      autoRelease, 
      releaseConditions 
    }: { 
      paymentId: string; 
      reason: string; 
      blockedBy: string; 
      autoRelease?: boolean; 
      releaseConditions?: string[] 
    }) => paymentControlService.blockPayment(paymentId, reason, blockedBy, autoRelease, releaseConditions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-control-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error: Error) => {
      console.error('Failed to block payment:', error);
    }
  });

  // Approve payment mutation
  const approvePaymentMutation = useMutation({
    mutationFn: ({ 
      paymentId, 
      approvedBy, 
      notes 
    }: { 
      paymentId: string; 
      approvedBy: string; 
      notes?: string 
    }) => paymentControlService.approvePayment(paymentId, approvedBy, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-control-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error: Error) => {
      console.error('Failed to approve payment:', error);
    }
  });

  // Reject payment mutation
  const rejectPaymentMutation = useMutation({
    mutationFn: ({ 
      paymentId, 
      rejectedBy, 
      reason 
    }: { 
      paymentId: string; 
      rejectedBy: string; 
      reason: string 
    }) => paymentControlService.rejectPayment?.(paymentId, rejectedBy, reason) || Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-control-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error: Error) => {
      console.error('Failed to reject payment:', error);
    }
  });

  return {
    dashboard: dashboard || null,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
    blockPayment: async (paymentId: string, reason: string, blockedBy: string, autoRelease?: boolean, releaseConditions?: string[]) => blockPaymentMutation.mutateAsync({ paymentId, reason, blockedBy, autoRelease, releaseConditions }),
    approvePayment: async (paymentId: string, approvedBy: string, notes?: string) => approvePaymentMutation.mutateAsync({ paymentId, approvedBy, notes }),
    rejectPayment: async (paymentId: string, rejectedBy: string, reason: string) => rejectPaymentMutation.mutateAsync({ paymentId, rejectedBy, reason })
  };
}
