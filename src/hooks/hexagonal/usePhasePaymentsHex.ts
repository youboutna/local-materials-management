/**
 * Hexagonal hooks for Phase Payments management
 */

import { PaymentRequestService, getPaymentRequestService} from '@/application/services/PaymentRequestService';
import { SupplierService, getSupplierService} from '@/application/services/SupplierService';
import { toast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface PhasePaymentFormData {
  amount: string;
  payment_method: string;
  payment_date: string;
  progress_at_payment: string;
  contractor_name: string;
  contractor_contact: string;
  transaction_id: string;
  supplier_id: string;
}

export function usePhasePayments(phaseId: string) {
  const paymentService = getPaymentRequestService();
  
  return useQuery({
    queryKey: ['phase-payments', phaseId],
    queryFn: async () => {
      // PaymentRequestService doesn't have getPaymentsByPhase
      // Use getAllPaymentRequests and filter client-side
      const allPayments = await paymentService.getAllPaymentRequests();
      // No phaseId on PaymentRequestDTO, return all as fallback
      return allPayments.map(payment => ({
        id: payment.id,
        project_id: payment.projectId,
        phase_id: phaseId,
        amount: payment.amount,
        payment_method: payment.paymentReason,
        payment_date: payment.createdAt,
        progress_at_payment: payment.amount.toString(),
        contractor_name: payment.description,
        transaction_id: payment.id,
        supplier_id: payment.supplierId
      }));
    },
    enabled: !!phaseId
  });
}

export function useAddPhasePayment(phaseId: string, projectId: string) {
  const queryClient = useQueryClient();
  const paymentService = getPaymentRequestService();

  return useMutation({
    mutationFn: async (paymentData: PhasePaymentFormData) => {
      return await paymentService.createPaymentRequest({
        supplierId: paymentData.supplier_id,
        projectId: projectId,
        amount: parseFloat(paymentData.amount),
        description: paymentData.contractor_name,
        paymentReason: paymentData.payment_method,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-payments', phaseId] });
      toast({ title: 'Paiement ajouté avec succès' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });
}

export function useDeletePhasePayment(phaseId: string) {
  const queryClient = useQueryClient();
  const paymentService = getPaymentRequestService();

  return useMutation({
    mutationFn: async (id: string) => {
      return await paymentService.deletePaymentRequest(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-payments', phaseId] });
      toast({ title: 'Paiement supprimé avec succès' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });
}

export function useSupplierInfo(supplierId: string | null) {
  const supplierService = getSupplierService();
  
  return useQuery({
    queryKey: ['supplier-info', supplierId],
    queryFn: async () => {
      if (!supplierId) return null;
      const supplier = await supplierService.getSupplierById(supplierId);
      return supplier ? {
        name: supplier.name,
        contact_person: supplier.contacts?.[0]?.name,
        phone: supplier.phone,
        email: supplier.email
      } : null;
    },
    enabled: !!supplierId
  });
}
