/**
 * Hooks hexagonaux — Paiements d'une phase.
 *
 * Corrige la source du bug « 807500% » : la progression n'est plus dérivée
 * du montant mais du champ `progressAtPayment`, normalisé via PhaseMetricsService.
 *
 * Règles : UI → Hook → Service → Repository → Adapter → DB, DTO camelCase.
 */

import { getPaymentService } from '@/application/services/PaymentService';
import { getSupplierService } from '@/application/services/SupplierService';
import { PhaseMetricsService } from '@/application/services/PhaseMetricsService';
import type { CreatePaymentDTO, PaymentDTO, UpdatePaymentDTO } from '@/dtos/entities/PaymentDTO';
import { toast } from '@/hooks/use-toast';
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

/** Paiements réellement rattachés à la phase (DTO camelCase, progression bornée). */
export function usePhasePayments(phaseId: string) {
  const paymentService = getPaymentService();

  return useQuery({
    queryKey: ['phase-payments', phaseId],
    queryFn: async (): Promise<PaymentDTO[]> => {
      if (!phaseId) return [];
      const result = await paymentService.getPaymentsByPhase(phaseId);
      const payments = Array.isArray(result) ? result : result?.data ?? [];
      return payments.map((payment) => ({
        ...payment,
        phaseId: payment.phaseId ?? payment.phaseRef?.id ?? phaseId,
        progressAtPayment: PhaseMetricsService.normalizeProgressPercent
          ? PhaseMetricsService.normalizeProgressPercent(payment.progressAtPayment)
          : payment.progressAtPayment,
      }));
    },
    enabled: !!phaseId,
    staleTime: 60 * 1000,
  });
}

const invalidatePhasePaymentQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
  phaseId: string,
  projectId?: string
) => {
  queryClient.invalidateQueries({ queryKey: ['phase-payments', phaseId] });
  queryClient.invalidateQueries({ queryKey: ['phase-metrics', phaseId] });
  queryClient.invalidateQueries({ queryKey: ['payments'] });
  if (projectId) {
    queryClient.invalidateQueries({ queryKey: ['project-payments', projectId] });
  }
};

/** Création d'un paiement rattaché à la phase courante (contexte conservé). */
export function useAddPhasePayment(phaseId: string, projectId: string) {
  const queryClient = useQueryClient();
  const paymentService = getPaymentService();

  return useMutation({
    mutationFn: async (formData: PhasePaymentFormData) => {
      const payload: CreatePaymentDTO = {
        projectId,
        phaseId,
        phaseRef: { id: phaseId },
        projectRef: { id: projectId },
        contractorId: formData.supplier_id,
        supplierId: formData.supplier_id || undefined,
        contractorName: formData.contractor_name,
        contractorContact: formData.contractor_contact,
        amount: parseFloat(formData.amount) || 0,
        paymentMethod: formData.payment_method,
        paymentDate: formData.payment_date,
        transactionId: formData.transaction_id,
        progressAtPayment: PhaseMetricsService.normalizeProgressPercent(formData.progress_at_payment),
        origin: 'project',
      };
      return await paymentService.createPayment(payload);
    },
    onSuccess: () => invalidatePhasePaymentQueries(queryClient, phaseId, projectId),
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });
}

/** Mise à jour d'un paiement sans perte du contexte phase/projet. */
export function useUpdatePhasePayment(phaseId: string, projectId?: string) {
  const queryClient = useQueryClient();
  const paymentService = getPaymentService();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdatePaymentDTO }) => {
      const payload: UpdatePaymentDTO = {
        ...updates,
        phaseId: updates.phaseId ?? phaseId,
        phaseRef: updates.phaseRef ?? { id: phaseId },
        ...(updates.progressAtPayment !== undefined
          ? { progressAtPayment: PhaseMetricsService.normalizeProgressPercent(updates.progressAtPayment) }
          : {}),
      };
      await paymentService.updatePayment(id, payload);
      return id;
    },
    onSuccess: () => invalidatePhasePaymentQueries(queryClient, phaseId, projectId),
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeletePhasePayment(phaseId: string, projectId?: string) {
  const queryClient = useQueryClient();
  const paymentService = getPaymentService();

  return useMutation({
    mutationFn: async (id: string) => {
      await paymentService.deletePayment(id);
      return id;
    },
    onSuccess: () => invalidatePhasePaymentQueries(queryClient, phaseId, projectId),
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });
}

export function useSupplierInfo(supplierId: string | null) {
  const supplierService = getSupplierService();

  return useQuery({
    queryKey: ['supplier-info', supplierId],
    queryFn: async () => {
      if (!supplierId) return null;
      const supplier = await supplierService.getSupplierById(supplierId);
      return supplier
        ? {
            name: supplier.name,
            contact_person: supplier.contacts?.[0]?.name,
            phone: supplier.phone,
            email: supplier.email,
          }
        : null;
    },
    enabled: !!supplierId,
  });
}
