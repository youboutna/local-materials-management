/**
 * useCheckpointVerification - Hook intégrant CheckpointVerificationEngine
 * Gère la vérification automatique et les déclenchements de paiement
 */

import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCheckpointVerificationEngine } from '@/services/CheckpointVerificationEngine';
import { AutomaticDecompteCalculator } from '@/services/AutomaticDecompteCalculator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { 
  CheckpointDTO, 
  AutomaticDecompteDTO,
} from '@/types/checkpoint-dto';

interface UseCheckpointVerificationOptions {
  projectId: string;
  phaseId?: string;
}

interface SimpleCheckpoint {
  id: string;
  title: string;
  status: string;
  trigger_progress: number;
  verification_score: number;
  phase_id: string | null;
}

export function useCheckpointVerification({ 
  projectId, 
  phaseId,
}: UseCheckpointVerificationOptions) {
  const queryClient = useQueryClient();

  // Fetch checkpoints for phase/project from milestones
  const { data: checkpoints, isLoading: checkpointsLoading } = useQuery({
    queryKey: ['checkpoints', projectId, phaseId],
    queryFn: async (): Promise<SimpleCheckpoint[]> => {
      const query = supabase
        .from('enhanced_project_milestones')
        .select('*')
        .eq('project_id', projectId);
      
      if (phaseId) query.eq('phase_id', phaseId);
      
      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(m => ({
        id: m.id,
        title: m.title,
        status: m.status === 'completed' ? 'verified' : 'pending',
        trigger_progress: m.weight || 25,
        verification_score: m.status === 'completed' ? 100 : 0,
        phase_id: m.phase_id,
      }));
    },
    enabled: !!projectId,
    staleTime: 30_000,
  });

  // Calculate automatic decompte for phase
  const { data: decompteData } = useQuery({
    queryKey: ['automatic-decompte', projectId, phaseId, checkpoints?.length],
    queryFn: async (): Promise<AutomaticDecompteDTO | null> => {
      if (!phaseId) return null;
      
      const calculator = new AutomaticDecompteCalculator(projectId);
      return calculator.calculatePhaseDecompte(phaseId);
    },
    enabled: !!phaseId,
    staleTime: 30_000,
  });

  // Check if payment can be generated
  const { data: canGenerateData } = useQuery({
    queryKey: ['can-generate-decompte', projectId],
    queryFn: async () => {
      const calculator = new AutomaticDecompteCalculator(projectId);
      return calculator.canGenerateDecompte();
    },
    enabled: !!projectId,
    staleTime: 30_000,
  });

  // Trigger payment mutation
  const triggerPaymentMutation = useMutation({
    mutationFn: async (decompte: AutomaticDecompteDTO) => {
      const { error } = await supabase.from('payments').insert({
        project_id: projectId,
        phase_id: phaseId || null,
        amount: decompte.net_payable,
        payment_date: new Date().toISOString(),
        payment_method: 'bank_transfer',
        progress_at_payment: decompte.progress_at_decompte,
        contractor_name: 'Auto-generated',
        contractor_contact: '',
        transaction_id: `AUTO-${Date.now()}`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Paiement créé', description: 'Décompte automatique enregistré' });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['automatic-decompte'] });
    },
    onError: (err) => {
      toast({ title: 'Erreur', description: String(err), variant: 'destructive' });
    },
  });

  // Aggregated verification status
  const verificationStatus = useMemo(() => {
    if (!checkpoints) return { total: 0, verified: 0, pending: 0, failed: 0, score: 0 };
    
    const verified = checkpoints.filter(c => c.status === 'verified').length;
    const failed = checkpoints.filter(c => c.status === 'failed').length;
    const pending = checkpoints.length - verified - failed;
    const score = checkpoints.length > 0 
      ? Math.round(checkpoints.reduce((s, c) => s + c.verification_score, 0) / checkpoints.length)
      : 0;

    return { total: checkpoints.length, verified, pending, failed, score };
  }, [checkpoints]);

  return {
    // Data
    checkpoints,
    decompteData,
    verificationStatus,
    canGenerateData,
    
    // Loading states
    isLoading: checkpointsLoading,
    
    // Actions
    triggerPayment: () => decompteData && triggerPaymentMutation.mutate(decompteData),
    
    // Flags
    canTriggerPayment: canGenerateData?.allowed ?? false,
    isPaying: triggerPaymentMutation.isPending,
  };
}
