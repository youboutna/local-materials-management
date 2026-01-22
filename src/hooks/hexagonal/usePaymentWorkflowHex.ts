/**
 * Hexagonal Hook for Payment Workflows
 * Encapsulates payment workflow use cases and state management
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { PaymentRequestService } from '@/application/services/PaymentRequestService';

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
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  notes?: string;
}

export interface UsePaymentWorkflowHexResult {
  // Actions
  createRequest: (input: PaymentRequestInput) => Promise<{ success: boolean; paymentId?: string; errors?: string[] }>;
  validatePayment: (input: ValidatePaymentInput) => Promise<{ success: boolean; nextStep?: string }>;
  
  // State
  loading: boolean;
  error: string | null;
}

export function usePaymentWorkflowHex(): UsePaymentWorkflowHexResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const paymentRequestService = new PaymentRequestService(RepositoryFactory.getPaymentRepository());

  const createRequest = useCallback(async (input: PaymentRequestInput) => {
    setLoading(true);
    setError(null);
    
    try {
      const validationErrors: string[] = [];
      if (!input.supplier_id) validationErrors.push('supplier_id est requis');
      if (!Number.isFinite(input.amount) || input.amount <= 0) validationErrors.push('amount doit être > 0');
      if (validationErrors.length > 0) {
        const message = 'Erreur de validation';
        setError(message);
        toast({
          title: message,
          description: validationErrors.join(', '),
          variant: 'destructive',
        });
        return { success: false, errors: validationErrors };
      }

      const created = await paymentRequestService.createPaymentRequest({
        supplier_id: input.supplier_id,
        project_id: input.project_id,
        amount: input.amount,
        description: input.description,
        payment_reason: input.payment_reason,
        supporting_documents: input.supporting_documents,
        notes: input.notes,
      });

      if (created?.id) {
        toast({
          title: "Demande créée",
          description: 'La demande de paiement a été créée.',
        });
        return { success: true, paymentId: created.id };
      } else {
        const message = 'Création impossible';
        setError(message);
        toast({
          title: "Erreur de validation",
          description: message,
          variant: "destructive",
        });
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

        toast({
          title: "Validation effectuée",
          description: 'Le statut de paiement a été mis à jour.',
        });
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
