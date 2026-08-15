/**
 * Hexagonal hook: contexte d'auto-complétion du formulaire unifié de paiement.
 * UI -> Hook -> Services (Phase / Inspection / Supplier / Payment) -> Repositories
 * Aucun accès direct à Supabase ici.
 */

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getInspectionService } from '@/application/services/InspectionService';
import { getPaymentService } from '@/application/services/PaymentService';
import { getProjectService } from '@/application/services/ProjectService';
import { getSupplierService } from '@/application/services/SupplierService';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import type { CreatePaymentDTO, PaymentDTO, UpdatePaymentDTO } from '@/dtos/entities/PaymentDTO';

export interface PaymentFormPhaseOption {
  id: string;
  name: string;
}

export interface PaymentFormInspectionOption {
  id: string;
  label: string;
  phaseId?: string;
  date?: string;
  progress?: number;
}

export interface PaymentFormSupplierContext {
  id: string;
  name: string;
  contact: string;
  bankName?: string;
  accountNumber?: string;
}

export function usePaymentFormContextHex(projectId?: string, supplierId?: string) {
  const phaseRepository = useMemo(() => RepositoryFactory.getPhaseRepository(), []);

  const phasesQuery = useQuery<PaymentFormPhaseOption[]>({
    queryKey: ['payment-form', 'phases', projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const phases = await phaseRepository.findByProjectId(projectId as string);
      return (phases ?? []).map((p: any) => ({
        id: String(p.id),
        name: String(p.name ?? p.phaseName ?? p.phase_name ?? 'Phase'),
      }));
    },
  });

  const inspectionsQuery = useQuery<PaymentFormInspectionOption[]>({
    queryKey: ['payment-form', 'inspections', projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const inspections = await getInspectionService().getInspectionsByProject(projectId as string);
      return (inspections ?? []).map((i: any) => ({
        id: String(i.id),
        label: `${String(i.status ?? 'inspection')} — ${String(i.date ?? '').slice(0, 10)}`,
        phaseId: i.phaseId ?? undefined,
        date: i.date ?? undefined,
        progress: typeof i.progressAtInspection === 'number' ? i.progressAtInspection : undefined,
      }));
    },
  });

  const supplierQuery = useQuery<PaymentFormSupplierContext | null>({
    queryKey: ['payment-form', 'supplier', supplierId],
    enabled: Boolean(supplierId),
    queryFn: async () => {
      const supplier: any = await getSupplierService().getSupplierById(supplierId as string);
      if (!supplier) return null;
      return {
        id: String(supplier.id),
        name: String(supplier.name ?? ''),
        contact: String(supplier.contactPerson ?? supplier.email ?? supplier.phone ?? ''),
        bankName: supplier.bankName ?? undefined,
        accountNumber: supplier.accountNumber ?? supplier.rib ?? undefined,
      };
    },
  });

  const projectQuery = useQuery({
    queryKey: ['payment-form', 'project', projectId],
    enabled: Boolean(projectId),
    queryFn: async () => getProjectService().getProjectById(projectId as string),
  });

  return {
    phases: phasesQuery.data ?? [],
    inspections: inspectionsQuery.data ?? [],
    supplier: supplierQuery.data ?? null,
    project: projectQuery.data ?? null,
    isLoading:
      phasesQuery.isLoading ||
      inspectionsQuery.isLoading ||
      supplierQuery.isLoading ||
      projectQuery.isLoading,
  };
}

export interface SubmitUnifiedPaymentInput {
  payment: CreatePaymentDTO;
  /** Statut initial issu du référentiel (type de demande) */
  initialStatus?: UpdatePaymentDTO['status'];
}

export function useSubmitUnifiedPaymentHex() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ payment, initialStatus }: SubmitUnifiedPaymentInput): Promise<PaymentDTO> => {
      const paymentService = getPaymentService();
      const created = await paymentService.createPayment(payment);
      if (initialStatus && created?.id) {
        await paymentService.updatePayment(created.id, { status: initialStatus });
      }
      return created;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment-blocks'] });
      queryClient.invalidateQueries({ queryKey: ['project-with-payments', variables.payment.projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.payment.projectId] });
    },
  });

  return {
    submitPayment: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error as Error | null,
  };
}
