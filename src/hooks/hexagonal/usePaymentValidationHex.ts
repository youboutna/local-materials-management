/**
 * Hexagonal Hook: usePaymentValidationHex
 * Provides payment validation and blocking operations via services
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  validatePaymentEligibility, 
  attemptPayment, 
  getPaymentBlockHistory 
} from '@/services/paymentBlockingService';
import { detectProjectDelays } from '@/services/BankGuaranteeService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PaymentStats {
  blockedPayments: number;
  expiredInsurances: number;
  delayedProjects: number;
  missingDocuments: number;
}

async function getBlockedPaymentsCount(): Promise<number> {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('payment_blocks')
      .select('id', { count: 'exact' })
      .is('resolved_at', null)
      .gte('blocked_at', startOfMonth.toISOString());

    if (error) throw error;
    return data?.length || 0;
  } catch (error) {
    console.error('Error getting blocked payments count:', error);
    return 0;
  }
}

async function getExpiredInsurancesCount(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('insurance_certificates')
      .select('contractor_id', { count: 'exact' })
      .lt('valid_until', new Date().toISOString());

    if (error) throw error;
    return data?.length || 0;
  } catch (error) {
    console.error('Error getting expired insurances count:', error);
    return 0;
  }
}

async function getMissingDocumentsCount(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('project_id', { count: 'exact' })
      .eq('status', 'draft')
      .eq('document_type', 'contract');

    if (error) throw error;
    return data?.length || 0;
  } catch (error) {
    console.error('Error getting missing documents count:', error);
    return 0;
  }
}

async function getRecentPaymentBlocks(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('payment_blocks')
      .select('*')
      .order('blocked_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting recent payment blocks:', error);
    return [];
  }
}

export function usePaymentValidationHex() {
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['payment-validation-stats-hex'],
    queryFn: async () => {
      const [blockedPayments, expiredInsurances, delayedProjects, missingDocuments] = await Promise.all([
        getBlockedPaymentsCount(),
        getExpiredInsurancesCount(),
        detectProjectDelays().then(delays => delays.filter(p => p.delayPercentage >= 20).length),
        getMissingDocumentsCount(),
      ]);

      return {
        blockedPayments,
        expiredInsurances,
        delayedProjects,
        missingDocuments,
      } as PaymentStats;
    },
    staleTime: 30_000,
  });

  const { data: recentBlocks = [], isLoading: blocksLoading } = useQuery({
    queryKey: ['payment-blocks-recent-hex'],
    queryFn: getRecentPaymentBlocks,
    staleTime: 30_000,
  });

  const validatePaymentMutation = useMutation({
    mutationFn: async ({ projectId, contractorId, amount }: { 
      projectId: string; 
      contractorId: string; 
      amount: number 
    }) => {
      return await validatePaymentEligibility(projectId, contractorId, amount);
    },
    onSuccess: (result) => {
      if (result.canProceed) {
        toast({ title: 'Succès', description: 'Le paiement peut être traité' });
      } else {
        toast({
          title: 'Blocage détecté',
          description: `${result.blockingReasons.length} problème(s) détecté(s)`,
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      console.error('Error validating payment:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la validation du paiement',
        variant: 'destructive',
      });
    },
  });

  const processPaymentMutation = useMutation({
    mutationFn: async ({ projectId, contractorId, amount, metadata }: { 
      projectId: string; 
      contractorId: string; 
      amount: number;
      metadata: any;
    }) => {
      return await attemptPayment(projectId, contractorId, amount, metadata);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({ title: 'Succès', description: 'Paiement traité avec succès' });
        queryClient.invalidateQueries({ queryKey: ['payment-blocks-recent-hex'] });
        queryClient.invalidateQueries({ queryKey: ['payment-validation-stats-hex'] });
      } else {
        toast({
          title: 'Erreur',
          description: "Le paiement n'a pas pu être traité",
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      console.error('Error processing payment:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors du traitement du paiement',
        variant: 'destructive',
      });
    },
  });

  return {
    stats: stats || { blockedPayments: 0, expiredInsurances: 0, delayedProjects: 0, missingDocuments: 0 },
    recentBlocks,
    isLoading: statsLoading || blocksLoading,
    refetchStats,
    validatePayment: validatePaymentMutation.mutateAsync,
    processPayment: processPaymentMutation.mutateAsync,
    isValidating: validatePaymentMutation.isPending,
    isProcessing: processPaymentMutation.isPending,
  };
}

export default usePaymentValidationHex;
