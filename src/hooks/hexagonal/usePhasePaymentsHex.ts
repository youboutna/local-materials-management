/**
 * Hexagonal hooks for Phase Payments management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { PaymentRequestService } from '@/application/services/PaymentRequestService';
import { SupplierService } from '@/application/services/SupplierService';
import { toast } from '@/hooks/use-toast';

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

// Hook: Fetch phase payments
export function usePhasePayments(phaseId: string) {
  const paymentService = new PaymentRequestService(RepositoryFactory.getPaymentRepository());
  
  return useQuery({
    queryKey: ['phase-payments', phaseId],
    queryFn: async () => {
      // Use PaymentRequestService - placeholder implementation
      const payments = await paymentService.getPaymentsByPhase(phaseId);
      return payments.map(payment => ({
        id: payment.id,
        project_id: payment.projectId,
        phase_id: payment.phaseId,
        amount: payment.amount,
        payment_method: payment.paymentReason,
        payment_date: payment.requestedDate,
        progress_at_payment: payment.amount.toString(),
        contractor_name: payment.description,
        transaction_id: payment.id,
        supplier_id: payment.supplierId
      }));
    },
    enabled: !!phaseId
  });
}

// Hook: Add payment to phase
export function useAddPhasePayment(phaseId: string, projectId: string) {
  const queryClient = useQueryClient();
  const paymentService = new PaymentRequestService(RepositoryFactory.getPaymentRepository());

  return useMutation({
    mutationFn: async (paymentData: PhasePaymentFormData) => {
      // Use PaymentRequestService - placeholder implementation
      return await paymentService.createPaymentRequest({
        supplier_id: paymentData.supplier_id,
        project_id: projectId,
        amount: parseFloat(paymentData.amount),
        description: paymentData.contractor_name,
        payment_reason: paymentData.payment_method,
        supporting_documents: [],
        notes: paymentData.contractor_contact
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-payments', phaseId] });
      toast({ title: 'Paiement ajouté avec succès' });
    },
    onError: (error) => {
      toast({ 
        title: 'Erreur', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  });
}

// Hook: Delete phase payment
export function useDeletePhasePayment(phaseId: string) {
  const queryClient = useQueryClient();
  const paymentService = new PaymentRequestService(RepositoryFactory.getPaymentRepository());

  return useMutation({
    mutationFn: async (id: string) => {
      // Use PaymentRequestService - placeholder implementation
      return await paymentService.deletePaymentRequest(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-payments', phaseId] });
      toast({ title: 'Paiement supprimé avec succès' });
    },
    onError: (error) => {
      toast({ 
        title: 'Erreur', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  });
}

// Hook: Fetch supplier info for auto-fill
export function useSupplierInfo(supplierId: string | null) {
  const supplierService = new SupplierService(RepositoryFactory.getSupplierRepository());
  
  return useQuery({
    queryKey: ['supplier-info', supplierId],
    queryFn: async () => {
      if (!supplierId) return null;
      
      // Use SupplierService - placeholder implementation
      const supplier = await supplierService.getSupplierById(supplierId);
      return supplier ? {
        name: supplier.name,
        contact_person: supplier.contacts[0]?.name,
        phone: supplier.phone,
        email: supplier.email
      } : null;
    },
    enabled: !!supplierId
  });
}
