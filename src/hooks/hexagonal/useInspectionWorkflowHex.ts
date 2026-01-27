/**
 * Hexagonal Hook for Inspection Workflows
 * Encapsulates inspection workflow use cases and state management
 */

import { useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { InspectionService } from '@/application/services/InspectionService';
import type { Inspection, InspectionStatus } from '@/domain/entities/Inspection';

export interface InspectionRequestInput {
  projectId: string;
  phaseId?: string;
  stepId?: string;
  inspector: string;
  date: string;
  comments?: string;
}

export interface ScheduleInspectionInput {
  inspectionId: string;
  comments?: string;
}

export interface ExecuteInspectionInput {
  inspectionId: string;
  status: InspectionStatus | string;
  progressAtInspection?: number;
  comments?: string;
}

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

  const inspectionService = useMemo(
    () => new InspectionService(RepositoryFactory.getInspectionRepository()),
    []
  );

  const createRequest = useCallback(async (input: InspectionRequestInput) => {
    setLoading(true);
    setError(null);
    
    try {
      const validationErrors: string[] = [];
      if (!input.projectId) validationErrors.push('projectId est requis');
      if (!input.inspector) validationErrors.push('inspector est requis');
      if (!input.date) validationErrors.push('date est requis');

      if (validationErrors.length > 0) {
        const message = 'Erreur de validation';
        setError(message);
        toast({
          title: message,
          description: validationErrors.join(', '),
          variant: 'destructive',
        });
        return { success: false };
      }

      const created = await inspectionService.createInspection({
        projectId: input.projectId,
        phaseId: input.phaseId,
        stepId: input.stepId,
        inspector: input.inspector,
        date: input.date,
        comments: input.comments,
      });

      toast({
        title: 'Demande créée',
        description: "La demande d'inspection a été créée.",
      });

      return { success: true, inspectionId: created.id };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [inspectionService, toast]);

  const scheduleInspection = useCallback(async (input: ScheduleInspectionInput) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!input.inspectionId) {
        const message = 'inspectionId manquant';
        setError(message);
        toast({
          title: 'Erreur',
          description: message,
          variant: 'destructive',
        });
        return { success: false };
      }

      const updates: Partial<Inspection> = {
        status: 'scheduled' as InspectionStatus,
        comments: input.comments || undefined,
        updatedAt: new Date().toISOString(),
      };

      await inspectionService.updateInspection(input.inspectionId, updates);

      toast({
        title: 'Inspection programmée',
        description: "L'inspection a été programmée.",
      });

      return { success: true, inspectionId: input.inspectionId };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [inspectionService, toast]);

  const executeInspection = useCallback(async (input: ExecuteInspectionInput) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!input.inspectionId) {
        const message = 'inspectionId manquant';
        setError(message);
        toast({
          title: 'Erreur',
          description: message,
          variant: 'destructive',
        });
        return { success: false };
      }

      const updates: Partial<Inspection> = {
        status: input.status as InspectionStatus,
        progressAtInspection: input.progressAtInspection,
        comments: input.comments || undefined,
        updatedAt: new Date().toISOString(),
      };

      await inspectionService.updateInspection(input.inspectionId, updates);

      const canTriggerPayment = input.status === 'approved' && (input.progressAtInspection ?? 0) >= 25;

      toast({
        title: 'Inspection exécutée',
        description: "L'inspection a été mise à jour.",
      });

      return { success: true, canTriggerPayment };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [inspectionService, toast]);

  return {
    createRequest,
    scheduleInspection,
    executeInspection,
    loading,
    error,
  };
}
