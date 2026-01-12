/**
 * Hexagonal Hook for Payment Workflows
 * Encapsulates payment workflow use cases and state management
 */

import { useState, useCallback } from 'react';
import { 
  CreatePaymentRequestUseCase, 
  PaymentRequestInput,
  ValidatePaymentUseCase,
  ValidatePaymentInput,
  GetPaymentsByPhaseUseCase
} from '@/application/use-cases/payment';
import { useToast } from '@/hooks/use-toast';

// Singleton instances
const createPaymentUseCase = new CreatePaymentRequestUseCase();
const validatePaymentUseCase = new ValidatePaymentUseCase();
const getPaymentsByPhaseUseCase = new GetPaymentsByPhaseUseCase();

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

  const createRequest = useCallback(async (input: PaymentRequestInput) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await createPaymentUseCase.execute(input);
      
      if (result.success) {
        toast({
          title: "Demande créée",
          description: result.message,
        });
        return { success: true, paymentId: result.paymentId };
      } else {
        setError(result.message);
        toast({
          title: "Erreur de validation",
          description: result.validationErrors?.join(', ') || result.message,
          variant: "destructive",
        });
        return { success: false, errors: result.validationErrors };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const validatePayment = useCallback(async (input: ValidatePaymentInput) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await validatePaymentUseCase.execute(input);
      
      if (result.success) {
        toast({
          title: "Validation effectuée",
          description: result.message,
        });
        return { success: true, nextStep: result.nextStep };
      } else {
        setError(result.message);
        toast({
          title: "Erreur",
          description: result.message,
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
  }, [toast]);

  return {
    createRequest,
    validatePayment,
    loading,
    error,
  };
}
