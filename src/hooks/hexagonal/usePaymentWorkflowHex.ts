/**
 * Hexagonal Hook for Payment Workflows
 */

import { PaymentRequestService } from '@/application/services/PaymentRequestService';
import { useToast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useCallback, useState } from 'react';

export interface PaymentRequestInput {
  supplier_id: string;
  project_id?: string;
  amount: number;
  description: string;
  payment_reason: string;
  supporting_documents?: string[];
  notes?: string;
}

export interface ValidatePaymentInput {
  paymentId: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled';
  notes?: string;
}

export interface UsePaymentWorkflowHexResult {
  createRequest: (input: PaymentRequestInput) => Promise<{ success: boolean; paymentId?: string; errors?: string[] }>;
  validatePayment: (input: ValidatePaymentInput) => Promise<{ success: boolean; nextStep?: string }>;
  loading: boolean;
  error: string | null;
}

export function usePaymentWorkflowHex(): UsePaymentWorkflowHexResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const paymentRequestService = getPaymentRequestService();

  const createRequest = useCallback(async (input: PaymentRequestInput) => {
    setLoading(true);
    setError(null);
    
    try {
      const validationErrors: string[] = [];
      if (!input.supplier_id) validationErrors.push('supplier_id est requis');
      if (!Number.isFinite(input.amount) || input.amount <= 0) validationErrors.push('amount doit être > 0');
      if (validationErrors.length > 0) {
        setError('Erreur de validation');
        toast({ title: 'Erreur de validation', description: validationErrors.join(', '), variant: 'destructive' });
        return { success: false, errors: validationErrors };
      }

      const created = await paymentRequestService.createPaymentRequest({
        supplierId: input.supplier_id,
        projectId: input.project_id,
        amount: input.amount,
        description: input.description,
        paymentReason: input.payment_reason,
      });

      if (created?.id) {
        toast({ title: "Demande créée", description: 'La demande de paiement a été créée.' });
        return { success: true, paymentId: created.id };
      } else {
        setError('Création impossible');
        return { success: false };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [paymentRequestService, toast]);

  const validatePayment = useCallback(async (input: ValidatePaymentInput) => {
    setLoading(true);
    setError(null);
    
    try {
      await paymentRequestService.updatePaymentRequest(input.paymentId, {
        status: input.status,
        notes: input.notes,
      });

      toast({ title: "Validation effectuée", description: 'Le statut de paiement a été mis à jour.' });
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [paymentRequestService, toast]);

  return {
    createRequest,
    validatePayment,
    loading,
    error,
  };
}
