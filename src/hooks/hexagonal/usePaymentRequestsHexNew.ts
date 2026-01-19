/**
 * Hexagonal Hook for Payment Requests
 * Uses PaymentRequestService instead of direct Supabase calls
 * Following hexagonal architecture principles
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { PaymentRequestService } from '@/application/services/PaymentRequestService';
import { CreatePaymentRequestData, UpdatePaymentRequestData } from '@/application/services/PaymentRequestService';
import { useToast } from '@/hooks/use-toast';

export function usePaymentRequests() {
  const queryClient = useQueryClient();
  
  const paymentRequestService = new PaymentRequestService(
    RepositoryFactory.getPaymentRepository()
  );

  const {
    data: paymentRequests = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['payment-requests'],
    queryFn: () => paymentRequestService.getAllPaymentRequests(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreatePaymentRequestData) => {
      return await paymentRequestService.createPaymentRequest(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-requests'] });
      toast({
        title: 'Succès',
        description: 'Demande de paiement créée avec succès',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: 'Échec de la création de la demande de paiement',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePaymentRequestData }) => {
      return await paymentRequestService.updatePaymentRequest(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-requests'] });
      toast({
        title: 'Succès',
        description: 'Demande de paiement mise à jour avec succès',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: 'Échec de la mise à jour de la demande de paiement',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await paymentRequestService.deletePaymentRequest(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-requests'] });
      toast({
        title: 'Succès',
        description: 'Demande de paiement supprimée avec succès',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: 'Échec de la suppression de la demande de paiement',
        variant: 'destructive',
      });
    },
  });

  return {
    paymentRequests,
    isLoading,
    error,
    refetch,
    createPaymentRequest: createMutation.mutate,
    updatePaymentRequest: updateMutation.mutate,
    deletePaymentRequest: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function usePaymentRequestsBySupplier(supplierId: string) {
  const paymentRequestService = new PaymentRequestService(
    RepositoryFactory.getPaymentRepository()
  );

  return useQuery({
    queryKey: ['payment-requests', 'supplier', supplierId],
    queryFn: () => paymentRequestService.getPaymentRequestsByProject(supplierId),
    enabled: !!supplierId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePaymentRequestsByProject(projectId: string) {
  const paymentRequestService = new PaymentRequestService(
    RepositoryFactory.getPaymentRepository()
  );

  return useQuery({
    queryKey: ['payment-requests', 'project', projectId],
    queryFn: () => paymentRequestService.getPaymentRequestsByProject(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
