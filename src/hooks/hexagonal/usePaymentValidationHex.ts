/**
 * Hexagonal Hook: usePaymentValidationHex
 * Provides payment validation and blocking operations via services
 */
import { PaymentValidationService } from '@/application/services/PaymentValidationService';
import { toast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface PaymentStats {
  blockedPayments: number;
  expiredInsurances: number;
  delayedProjects: number;
  missingDocuments: number;
}

export function usePaymentValidationHex() {
  const queryClient = useQueryClient();
  
  // Initialize service with repositories
  const paymentValidationService = new PaymentValidationService(
    RepositoryFactory.getPaymentBlockingRepository(),
    RepositoryFactory.getBankGuaranteeRepository(),
    RepositoryFactory.getInsuranceRepository(),
    RepositoryFactory.getDocumentRepository()
  );

  // Get payment statistics
  const {
    data: paymentStats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['payment-stats'],
    queryFn: async () => {
      return await paymentValidationService.getPaymentStats();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Validate payment for a project
  const validatePaymentMutation = useMutation({
    mutationFn: async (projectId: string) => {
      return await paymentValidationService.validatePayment(projectId);
    },
    onSuccess: (result) => {
      toast({
        title: "Validation Complete",
        description: result.canPay 
          ? "Payment can be processed" 
          : `Payment blocked: ${result.blockingReasons.join(', ')}`,
        variant: result.canPay ? "default" : "destructive",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Validation Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Get blocked payments count
  const {
    data: blockedPaymentsCount,
    isLoading: blockedLoading,
    error: blockedError
  } = useQuery({
    queryKey: ['blocked-payments-count'],
    queryFn: async () => {
      return await paymentValidationService.getBlockedPaymentsCount();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get expired insurances count
  const {
    data: expiredInsurancesCount,
    isLoading: expiredLoading,
    error: expiredError
  } = useQuery({
    queryKey: ['expired-insurances-count'],
    queryFn: async () => {
      return await paymentValidationService.getExpiredInsurancesCount();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get missing documents count
  const {
    data: missingDocumentsCount,
    isLoading: missingLoading,
    error: missingError
  } = useQuery({
    queryKey: ['missing-documents-count'],
    queryFn: async () => {
      return await paymentValidationService.getMissingDocumentsCount();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get delayed projects count
  const {
    data: delayedProjectsCount,
    isLoading: delayedLoading,
    error: delayedError
  } = useQuery({
    queryKey: ['delayed-projects-count'],
    queryFn: async () => {
      return await paymentValidationService.getDelayedProjectsCount();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    // Data
    paymentStats: paymentStats || {
      blockedPayments: 0,
      expiredInsurances: 0,
      delayedProjects: 0,
      missingDocuments: 0
    },
    blockedPaymentsCount: blockedPaymentsCount || 0,
    expiredInsurancesCount: expiredInsurancesCount || 0,
    missingDocumentsCount: missingDocumentsCount || 0,
    delayedProjectsCount: delayedProjectsCount || 0,
    
    // Loading states
    isLoading: statsLoading || blockedLoading || expiredLoading || missingLoading || delayedLoading,
    statsLoading,
    blockedLoading,
    expiredLoading,
    missingLoading,
    delayedLoading,
    
    // Error states
    error: statsError || blockedError || expiredError || missingError || delayedError,
    statsError,
    blockedError,
    expiredError,
    missingError,
    delayedError,
    
    // Actions
    validatePayment: validatePaymentMutation.mutate,
    refetchStats,
    
    // Mutation states
    isValidationLoading: validatePaymentMutation.isPending,
    validationError: validatePaymentMutation.error
  };
}

export default usePaymentValidationHex;
