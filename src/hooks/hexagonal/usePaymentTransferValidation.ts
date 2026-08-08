/**
 * Hexagonal Hook: usePaymentTransferValidation
 * Provides payment validation logic for payment transfer forms
 * Follows Rule #5: UI Layer Separation
 */

import { PaymentValidationService, getPaymentValidationService} from '@/application/services/PaymentValidationService';
import { useCallback, useState } from 'react';

export interface PaymentTransferValidationResult {
  allowedAmount: number;
  maxAllowedAmount: number;
  isInitialPaymentPhase: boolean;
  maxInitialPayment: number;
  canPay: boolean;
  blockingReasons: string[];
  recommendations: string[];
  paymentStatus: 'initial_allowed' | 'initial' | 'inspection_required' | 'requires_changes' | 'rejected';
  isLoading: boolean;
  error: string | null;
}

export interface PaymentTransferValidationProps {
  projectId: string;
  project: {
    budget: number;
    progress: number;
    allowsInitialPayment?: boolean;
    initialPaymentPercentage?: number;
    payments?: Array<{ amount: number }>;
    inspections?: Array<{
      date: string;
      status: string;
    }>;
  };
}

export function usePaymentTransferValidation({ 
  projectId, 
  project 
}: PaymentTransferValidationProps): PaymentTransferValidationResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize service with repositories (Rule #1: Arrow Flow)
  const paymentValidationService = PaymentValidationService.getPaymentValidationService();

  // Calculate payment validation
  const validatePayment = useCallback(async (): Promise<{
    allowedAmount: number;
    maxAllowedAmount: number;
    canPay: boolean;
    blockingReasons: string[];
    recommendations: string[];
  }> => {
    setIsLoading(true);
    setError(null);

    try {
      // Use hexagonal service for validation
      const validationResult = await paymentValidationService.validatePayment(projectId);
      
      // Calculate amounts based on project data
      const totalPaid = project.payments ? 
        project.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
      
      const allowsInitialPayment = project.allowsInitialPayment || false;
      const initialPaymentPercentage = project.initialPaymentPercentage || 0;
      const maxInitialPayment = (project.budget * initialPaymentPercentage) / 100;
      
      const isInitialPaymentPhase = totalPaid === 0 && project.progress < 25 && allowsInitialPayment;
      
      // Get allowed amount from service
      const serviceAllowedAmount = isInitialPaymentPhase 
        ? maxInitialPayment
        : await paymentValidationService.calculateAllowedAmount(projectId);
      
      // Apply 1.5x tolerance for non-initial payments
      const maxAllowedAmount = isInitialPaymentPhase
        ? maxInitialPayment
        : serviceAllowedAmount * 1.5;

      return {
        allowedAmount: serviceAllowedAmount,
        maxAllowedAmount,
        canPay: validationResult.canPay,
        blockingReasons: validationResult.blockingReasons,
        recommendations: validationResult.recommendations
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Validation failed';
      setError(errorMessage);
      
      // Return safe defaults
      return {
        allowedAmount: 0,
        maxAllowedAmount: 0,
        canPay: false,
        blockingReasons: [errorMessage],
        recommendations: []
      };
    } finally {
      setIsLoading(false);
    }
  }, [projectId, project, paymentValidationService]);

  // Determine payment status
  const getPaymentStatus = useCallback((): 'initial_allowed' | 'initial' | 'inspection_required' | 'requires_changes' | 'rejected' => {
    const totalPaid = project.payments ? 
      project.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
    
    const allowsInitialPayment = project.allowsInitialPayment || false;
    const initialPaymentPercentage = project.initialPaymentPercentage || 0;
    const maxInitialPayment = (project.budget * initialPaymentPercentage) / 100;
    
    const isInitialPaymentPhase = totalPaid === 0 && project.progress < 25 && allowsInitialPayment;
    
    if (isInitialPaymentPhase) return "initial_allowed";
    if (project.progress < 25) return "initial";
    
    const latestInspection = project.inspections?.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    
    if (!latestInspection) return "inspection_required";
    
    return latestInspection.status as any;
  }, [project]);

  // Calculate derived values
  const totalPaid = project.payments ? 
    project.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
  
  const allowsInitialPayment = project.allowsInitialPayment || false;
  const initialPaymentPercentage = project.initialPaymentPercentage || 0;
  const maxInitialPayment = (project.budget * initialPaymentPercentage) / 100;
  
  const isInitialPaymentPhase = totalPaid === 0 && project.progress < 25 && allowsInitialPayment;
  const progressBasedAmount = (project.budget * project.progress) / 100;

  return {
    allowedAmount: isInitialPaymentPhase ? maxInitialPayment : progressBasedAmount,
    maxAllowedAmount: isInitialPaymentPhase ? maxInitialPayment : progressBasedAmount * 1.5,
    isInitialPaymentPhase,
    maxInitialPayment,
    canPay: true, // Will be updated by validatePayment
    blockingReasons: [],
    recommendations: [],
    paymentStatus: getPaymentStatus(),
    isLoading,
    error
  };
}

export default usePaymentTransferValidation;
