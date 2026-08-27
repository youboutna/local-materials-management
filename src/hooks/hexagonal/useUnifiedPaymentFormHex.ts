/**
 * Hexagonal hooks for the unified payment form
 * Manages form context (phases, inspections, supplier) and submission/update
 * 
 * Utilisé par UnifiedPaymentFormDialog pour :
 * - Récupérer les phases, inspections, fournisseur et projet en fonction du contexte
 * - Soumettre un nouveau paiement (create)
 * - Mettre à jour un paiement existant (update)
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// Services
import { getProjectService } from '@/application/services/ProjectService';
import { getSupplierService } from '@/application/services/SupplierService';
import { getInspectionService } from '@/application/services/InspectionService';
import { getPhaseService } from '@/application/services/PhaseService';
import { getPaymentService } from '@/application/services/PaymentService';
import { getDocumentService } from '@/application/services/DocumentService';

// DTOs
import { CreatePaymentDTO, UpdatePaymentDTO } from '@/dtos/entities/PaymentDTO';
import { PaymentTransformer } from '@/dtos/transforms/PaymentTransformer';

// Types
import { PaymentOriginKey, getInitialStatusForOrigin } from '@/config/referentials/payment-origin.referential';

// ============================================================
// Hook : Contexte du formulaire (phases, inspections, supplier, project)
// ============================================================

interface FormContextState {
  phases: Array<{ id: string; name: string; phaseType?: string; status?: string }>;
  inspections: Array<{ id: string; label: string; phaseId?: string; progress?: number; date?: string }>;
  supplier: {
    id: string;
    name: string;
    contact: string;
    bankName?: string;
    accountNumber?: string;
    rib?: string;
  } | null;
  project: {
    id: string;
    title: string;
    reference?: string;
    status?: string;
    budget?: number;
  } | null;
  isLoading: boolean;
  error: Error | null;
}

export function usePaymentFormContextHex(
  projectId?: string,
  contractorId?: string,
  phaseId?: string,
  inspectionId?: string
): FormContextState & { refetch: () => void } {
  const [state, setState] = useState<FormContextState>({
    phases: [],
    inspections: [],
    supplier: null,
    project: null,
    isLoading: false,
    error: null,
  });

  const projectService = useMemo(() => getProjectService(), []);
  const supplierService = useMemo(() => getSupplierService(), []);
  const inspectionService = useMemo(() => getInspectionService(), []);
  const phaseService = useMemo(() => getPhaseService(), []);

  const loadContext = useCallback(async () => {
    if (!projectId && !contractorId) {
      setState(prev => ({ ...prev, isLoading: false, error: null }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const results = await Promise.allSettled([
        projectId ? projectService.getProjectById(projectId) : Promise.resolve(null),
        projectId ? phaseService.getPhasesByProject(projectId) : Promise.resolve([]),
        projectId ? inspectionService.getInspectionsByProject(projectId) : Promise.resolve([]),
        contractorId ? supplierService.getSupplierById(contractorId) : Promise.resolve(null),
      ]);

      const [projectResult, phasesResult, inspectionsResult, supplierResult] = results;

      const project = projectResult.status === 'fulfilled' ? projectResult.value : null;
      const phases = phasesResult.status === 'fulfilled' ? phasesResult.value : [];
      const inspections = inspectionsResult.status === 'fulfilled' ? inspectionsResult.value : [];
      const supplier = supplierResult.status === 'fulfilled' ? supplierResult.value : null;

      const formattedPhases = Array.isArray(phases) ? phases.map((p: any) => ({
        id: p.id,
        name: p.name || p.phaseName || p.title || 'Phase',
        phaseType: p.phaseType || p.type,
        status: p.status,
      })) : [];

      // Libellé métier uniquement : jamais d'UUID exposé à l'UI.
      const formattedInspections = Array.isArray(inspections) ? inspections.map((i: any) => {
        const rawDate = i.date || i.inspectionDate || i.inspection_date;
        const phaseName = formattedPhases.find((p) => p.id === (i.phaseId || i.phase_id))?.name;
        const businessName = [i.title, i.label, i.inspectionType, i.inspection_type, i.type]
          .find((v: unknown) => typeof v === 'string' && v.trim().length > 0) as string | undefined;
        const dateLabel = rawDate ? new Date(rawDate).toLocaleDateString('fr-FR') : undefined;
        const parts = [
          businessName?.trim() || (dateLabel ? `Inspection du ${dateLabel}` : 'Inspection sans titre'),
          phaseName,
        ].filter(Boolean);
        return {
          id: i.id,
          label: parts.join(' — '),
          phaseId: i.phaseId || i.phase_id,
          progress: i.progressAtInspection || i.progress || i.progress_at_inspection,
          date: rawDate,
        };
      }) : [];

      const primaryContact = supplier?.contacts?.[0];
      const formattedSupplier = supplier ? {
        id: supplier.id,
        name: supplier.name || 'Fournisseur',
        contact: primaryContact?.name || primaryContact?.email || supplier.email || '',
        bankName: '',
        accountNumber: '',
        rib: '',
      } : null;

      const formattedProject = project ? {
        id: project.id,
        title: project.title || 'Projet',
        reference: project.projectReference,
        status: project.status,
        budget: project.budget,
      } : null;

      setState({
        phases: formattedPhases,
        inspections: formattedInspections,
        supplier: formattedSupplier,
        project: formattedProject,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('[usePaymentFormContextHex] Error loading context:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Erreur de chargement du contexte'),
      }));
    }
  }, [projectId, contractorId, projectService, supplierService, inspectionService, phaseService]);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  return {
    ...state,
    refetch: loadContext,
  };
}

// ============================================================
// Hook : Soumission et mise à jour des paiements
// ============================================================

interface SubmitPaymentParams {
  payment: CreatePaymentDTO;
  initialStatus: string;
}

export function useSubmitUnifiedPaymentHex() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  const paymentService = useMemo(() => getPaymentService(), []);
  const documentService = useMemo(() => getDocumentService(), []);

  /**
   * Créer un nouveau paiement
   */
  const submitPayment = useCallback(
    async ({ payment, initialStatus }: SubmitPaymentParams) => {
      setIsPending(true);
      try {
        const paymentData = {
          ...payment,
          status: initialStatus || 'pending',
        };

        const created = await paymentService.createPayment(paymentData);

        if (payment.documentIds?.length) {
          try {
            await documentService.linkDocumentsToPayment(created.id, payment.documentIds);
          } catch (linkError) {
            console.warn('[useSubmitUnifiedPaymentHex] Erreur liaison documents:', linkError);
          }
        }

        await queryClient.invalidateQueries({ queryKey: ['payments'] });
        await queryClient.invalidateQueries({ queryKey: ['associated-payments'] });

        toast({
          title: 'Paiement créé',
          description: `Le paiement de ${payment.amount?.toLocaleString()} MRU a été enregistré.`,
        });

        return created;
      } catch (error) {
        console.error('[useSubmitUnifiedPaymentHex] Error creating payment:', error);
        toast({
          title: 'Erreur',
          description: error instanceof Error ? error.message : 'Impossible de créer le paiement.',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [paymentService, documentService, queryClient, toast]
  );

  /**
   * Mettre à jour un paiement existant
   */
  const updatePayment = useCallback(
    async (paymentId: string, data: UpdatePaymentDTO) => {
      setIsPending(true);
      try {
        await paymentService.updatePayment(paymentId, data);

        if (data.documentIds !== undefined) {
          try {
            await documentService.replacePaymentDocuments(paymentId, data.documentIds);
          } catch (linkError) {
            console.warn('[useSubmitUnifiedPaymentHex] Erreur mise à jour documents:', linkError);
          }
        }

        await queryClient.invalidateQueries({ queryKey: ['payments'] });
        await queryClient.invalidateQueries({ queryKey: ['associated-payments'] });

        toast({
          title: 'Paiement mis à jour',
          description: 'Les modifications ont été enregistrées.',
        });

        return true;
      } catch (error) {
        console.error('[useSubmitUnifiedPaymentHex] Error updating payment:', error);
        toast({
          title: 'Erreur',
          description: error instanceof Error ? error.message : 'Impossible de mettre à jour le paiement.',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [paymentService, documentService, queryClient, toast]
  );

  /**
   * Soumettre avec origine (pour compatibilité avec le formulaire)
   */
  const submitWithOrigin = useCallback(
    async (payment: CreatePaymentDTO, origin: PaymentOriginKey = 'manual') => {
      const initialStatus = getInitialStatusForOrigin(origin);
      return submitPayment({ payment, initialStatus });
    },
    [submitPayment]
  );

  return {
    submitPayment,
    updatePayment,
    submitWithOrigin,
    isPending,
  };
}