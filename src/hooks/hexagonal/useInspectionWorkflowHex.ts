/**
 * Hexagonal Hook for Inspection Workflows
 * Encapsulates inspection workflow use cases and state management
 */

import { useState, useCallback } from 'react';
import { 
  CreateInspectionRequestUseCase, 
  InspectionRequestInput,
  ScheduleInspectionUseCase,
  ScheduleInspectionInput,
  ExecuteInspectionUseCase,
  ExecuteInspectionInput,
  GetInspectionsByPhaseUseCase
} from '@/application/use-cases/inspection';
import { useToast } from '@/hooks/use-toast';

// Singleton instances
const createInspectionUseCase = new CreateInspectionRequestUseCase();
const scheduleInspectionUseCase = new ScheduleInspectionUseCase();
const executeInspectionUseCase = new ExecuteInspectionUseCase();
const getInspectionsByPhaseUseCase = new GetInspectionsByPhaseUseCase();

export interface UseInspectionWorkflowHexResult {
  // Actions
  createRequest: (input: InspectionRequestInput) => Promise<{ success: boolean; inspectionId?: string }>;
  scheduleInspection: (input: ScheduleInspectionInput) => Promise<{ success: boolean; inspectionId?: string }>;
  executeInspection: (input: ExecuteInspectionInput) => Promise<{ success: boolean; canTriggerPayment?: boolean }>;
  
  // State
  loading: boolean;
  error: string | null;
}

export function useInspectionWorkflowHex(): UseInspectionWorkflowHexResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const createRequest = useCallback(async (input: InspectionRequestInput) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await createInspectionUseCase.execute(input);
      
      if (result.success) {
        toast({
          title: "Demande créée",
          description: result.message,
        });
        return { success: true, inspectionId: result.inspectionId };
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

  const scheduleInspection = useCallback(async (input: ScheduleInspectionInput) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await scheduleInspectionUseCase.execute(input);
      
      if (result.success) {
        toast({
          title: "Inspection programmée",
          description: result.message,
        });
        return { success: true, inspectionId: result.inspectionId };
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

  const executeInspection = useCallback(async (input: ExecuteInspectionInput) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await executeInspectionUseCase.execute(input);
      
      if (result.success) {
        toast({
          title: "Inspection exécutée",
          description: result.message,
        });
        return { success: true, canTriggerPayment: result.canTriggerPayment };
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
    scheduleInspection,
    executeInspection,
    loading,
    error,
  };
}
