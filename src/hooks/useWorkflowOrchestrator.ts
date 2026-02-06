/**
 * useWorkflowOrchestrator - Hook pour orchestrer les workflows projet/phase
 * Connecte WorkflowOrchestrator aux composants React
 */

import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getWorkflowOrchestrator, WorkflowOrchestrator, WorkflowEvent } from '@/application/services/WorkflowOrchestrator';

interface WorkflowState {
  isProcessing: boolean;
  lastEvent: WorkflowEvent | null;
  events: WorkflowEvent[];
  canProceed: boolean;
  nextAction: string;
  pendingPayment: number;
}

interface UseWorkflowOrchestratorResult {
  state: WorkflowState;
  updateProgress: (phaseId: string, progress: number) => Promise<void>;
  triggerPayment: (phaseId: string, amount: number) => Promise<void>;
  getStatus: (phaseId: string) => Promise<void>;
  clearEvents: () => void;
}

export function useWorkflowOrchestrator(projectId: string | undefined): UseWorkflowOrchestratorResult {
  const queryClient = useQueryClient();
  const [orchestrator, setOrchestrator] = useState<WorkflowOrchestrator | null>(null);
  const [state, setState] = useState<WorkflowState>({
    isProcessing: false,
    lastEvent: null,
    events: [],
    canProceed: false,
    nextAction: '',
    pendingPayment: 0,
  });

  useEffect(() => {
    if (!projectId) return;

    const orch = getWorkflowOrchestrator(projectId);
    setOrchestrator(orch);

    const unsubscribe = orch.subscribe((event) => {
      setState(prev => ({
        ...prev,
        lastEvent: event,
        events: [...prev.events, event],
      }));

      // Toast notifications based on event type
      switch (event.type) {
        case 'MILESTONE_VERIFIED':
          toast.success('Jalon vérifié', {
            description: `Progression mise à jour`,
          });
          break;
        case 'DECOMPTE_CALCULATED':
          toast.info('Décompte calculé', {
            description: `Montant: ${event.payload.decompte.net_payable.toLocaleString()} MRU`,
          });
          break;
        case 'PAYMENT_CREATED':
          toast.success('Paiement créé', {
            description: `Montant: ${event.payload.amount.toLocaleString()} MRU`,
          });
          queryClient.invalidateQueries({ queryKey: ['project-payments'] });
          queryClient.invalidateQueries({ queryKey: ['payments'] });
          break;
        case 'VERIFICATION_FAILED':
          toast.error('Vérification échouée', {
            description: event.payload.reason,
          });
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [projectId, queryClient]);

  const updateProgress = useCallback(async (phaseId: string, progress: number) => {
    if (!orchestrator) return;

    setState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      const result = await orchestrator.onProgressUpdated({ phaseId, newProgress: progress });
      
      if (!result.success) {
        toast.error('Erreur workflow', { description: result.error });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['project-phases'] });
      queryClient.invalidateQueries({ queryKey: ['phase'] });
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [orchestrator, queryClient]);

  const triggerPayment = useCallback(async (phaseId: string, amount: number) => {
    if (!orchestrator) return;

    setState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      const result = await orchestrator.triggerPayment({ phaseId, amount });
      
      if (!result.success) {
        toast.error('Erreur paiement', { description: result.error });
      }
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [orchestrator]);

  const getStatus = useCallback(async (phaseId: string) => {
    if (!orchestrator) return;

    try {
      const status = await orchestrator.getWorkflowStatus(phaseId);
      
      setState(prev => ({
        ...prev,
        canProceed: status.canProceed,
        nextAction: status.nextAction,
        pendingPayment: status.metrics.pendingPayment,
      }));
    } catch (error) {
      console.error('Error getting workflow status:', error);
    }
  }, [orchestrator]);

  const clearEvents = useCallback(() => {
    setState(prev => ({ ...prev, events: [], lastEvent: null }));
  }, []);

  return {
    state,
    updateProgress,
    triggerPayment,
    getStatus,
    clearEvents,
  };
}
