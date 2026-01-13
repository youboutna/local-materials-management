// hooks/hexagonal/usePaymentRequestsHex.ts - Hexagonal hook for payment requests management

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PaymentRequest {
  id: string;
  supplier_id: string;
  project_id: string;
  amount: number;
  description: string;
  payment_reason: string;
  status: string;
  requested_date: string;
  notes: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  suppliers?: {
    name: string;
    account_number: string | null;
    bank_name: string | null;
    rib: string | null;
  };
  projects?: {
    title: string;
  };
}

export const usePaymentRequestsHex = () => {
  const queryClient = useQueryClient();

  // Fetch payment requests with enriched data
  const {
    data: paymentRequests = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['payment-requests-hex'],
    queryFn: async () => {
      const { data: requests, error } = await supabase
        .from('supplier_payment_requests')
        .select('*')
        .order('requested_date', { ascending: false });

      if (error) throw error;

      // Enrich with supplier and project data
      const enrichedRequests = await Promise.all(
        (requests || []).map(async (request) => {
          const [supplierRes, projectRes] = await Promise.all([
            supabase
              .from('suppliers')
              .select('name, account_number, bank_name, rib')
              .eq('id', request.supplier_id)
              .maybeSingle(),
            request.project_id ? supabase
              .from('projects')
              .select('title')
              .eq('id', request.project_id)
              .maybeSingle() : Promise.resolve({ data: null })
          ]);

          return {
            ...request,
            suppliers: supplierRes.data || undefined,
            projects: projectRes.data || undefined
          } as PaymentRequest;
        })
      );

      return enrichedRequests;
    }
  });

  // Approve payment request
  const approveMutation = useMutation({
    mutationFn: async ({ id, userId, notes }: { id: string; userId: string; notes?: string }) => {
      const { error } = await supabase
        .from('supplier_payment_requests')
        .update({
          status: 'approved',
          approved_by: userId,
          approved_at: new Date().toISOString(),
          notes: notes || null
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-requests-hex'] });
      toast({
        title: 'Demande approuvée',
        description: 'La demande de paiement a été approuvée'
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: `Erreur lors de l'approbation: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from('supplier_payment_requests')
        .update({
          status: 'rejected',
          rejection_reason: reason
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-requests-hex'] });
      toast({
        title: 'Demande rejetée',
        description: 'La demande de paiement a été rejetée'
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: `Erreur lors du rejet: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  return {
    paymentRequests,
    isLoading,
    error,
    refetch,
    approveRequest: approveMutation.mutateAsync,
    rejectRequest: rejectMutation.mutateAsync,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending
  };
};
