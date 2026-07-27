/**
 * Hexagonal Hook for Payment Requests
 * Uses PaymentRequestService instead of direct Supabase calls
 */

import { PaymentRequestService } from '@/application/services/PaymentRequestService';
import { CreatePaymentRequestDTO, UpdatePaymentRequestDTO } from '@/dtos/entities/PaymentDTO';
import { toast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreatePaymentRequestDTO) => {
      return await paymentRequestService.createPaymentRequest(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-requests'] });
      toast({
        title: 'Succès',
        description: 'Demande de paiement créée avec succès',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Échec de la création de la demande de paiement',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePaymentRequestDTO }) => {
      return await paymentRequestService.updatePaymentRequest(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-requests'] });
      toast({
        title: 'Succès',
        description: 'Demande de paiement mise à jour avec succès',
      });
    },
    onError: () => {
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
    onError: () => {
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
    queryFn: () => paymentRequestService.getPaymentRequestsBySupplier(supplierId),
    enabled: !!supplierId,
    staleTime: 5 * 60 * 1000,
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
    staleTime: 5 * 60 * 1000,
  });
}
