// hooks/hexagonal/usePaymentRequestsHex.ts - Hexagonal hook for payment requests management
// Uses SupplierPaymentService instead of direct Supabase access

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SupplierPaymentService } from '@/application/services/SupplierPaymentService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
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

  const {
    data: paymentRequests = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['payment-requests-hex'],
    queryFn: async () => {
      const service = new SupplierPaymentService(RepositoryFactory.getSupplierPaymentRepository());
      const requests = await service.getAllPaymentRequests();
      // Map from DTO to the expected interface
      return requests.map(r => ({
        id: r.id,
        supplier_id: r.supplierId || '',
        project_id: r.projectId || '',
        amount: r.amount,
        description: r.workDescription || '',
        payment_reason: r.paymentType || '',
        status: r.status,
        requested_date: r.requestedAt,
        notes: r.comments || '',
        approved_by: r.validatedBy,
        approved_at: r.validatedAt,
        rejection_reason: r.rejectionReason,
      })) as PaymentRequest[];
    }
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, userId, notes }: { id: string; userId: string; notes?: string }) => {
      const service = new SupplierPaymentService(RepositoryFactory.getSupplierPaymentRepository());
      await service.approvePaymentRequest(id, userId, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-requests-hex'] });
      toast({ title: 'Demande approuvée', description: 'La demande de paiement a été approuvée' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: `Erreur lors de l'approbation: ${error.message}`, variant: 'destructive' });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const service = new SupplierPaymentService(RepositoryFactory.getSupplierPaymentRepository());
      await service.rejectPaymentRequest(id, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-requests-hex'] });
      toast({ title: 'Demande rejetée', description: 'La demande de paiement a été rejetée' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: `Erreur lors du rejet: ${error.message}`, variant: 'destructive' });
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
