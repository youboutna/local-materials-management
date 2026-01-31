/**
 * useCheckpointVerification - Hexagonal Architecture
 * Uses MilestoneService and PaymentService for checkpoint verification
 * Integrates with CheckpointVerificationEngine and AutomaticDecompteCalculator
 */

import { useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCheckpointVerificationEngine } from '@/application/services/CheckpointVerificationEngine';
import { AutomaticDecompteCalculator } from '@/application/services/AutomaticDecompteCalculator';
import { PaymentService } from '@/application/services/PaymentService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { toast } from '@/hooks/use-toast';
import type { AutomaticDecompteDTO } from '@/types/checkpoint-dto';
import type { CreatePaymentDTO, UpdatePaymentDTO } from '@/dtos/entities/PaymentDTO';
import type { MilestoneDTO } from '@/types/milestone-dto';

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

// Get milestone repository
const getMilestoneRepository = () => {
  return RepositoryFactory.getMilestoneRepository();
};

// Get payment service
const getPaymentService = () => {
  return new PaymentService(RepositoryFactory.getPaymentRepository());
};

export function useCheckpointVerification({ 
  projectId, 
  phaseId,
}: UseCheckpointVerificationOptions) {
  const queryClient = useQueryClient();

  // Debug logging for phase ID availability
  useEffect(() => {
    console.log('useCheckpointVerification - Phase ID Debug:', {
      projectId,
      phaseId,
      hasProjectId: !!projectId,
      hasPhaseId: !!phaseId,
      timestamp: new Date().toISOString()
    });
  }, [projectId, phaseId]);

  // Fetch checkpoints for phase/project from milestones via repository
  const { data: checkpoints, isLoading: checkpointsLoading } = useQuery({
    queryKey: ['checkpoints', projectId, phaseId],
    queryFn: async (): Promise<SimpleCheckpoint[]> => {
      try {
        if (!projectId) {
          console.warn('useCheckpointVerification: Project ID is undefined');
          return [];
        }
        
        if (!phaseId) {
          console.warn('useCheckpointVerification: Phase ID is undefined');
          return [];
        }

        console.log('useCheckpointVerification: Fetching checkpoints for', {
          projectId,
          phaseId,
          timestamp: new Date().toISOString()
        });

        const milestoneRepository = getMilestoneRepository();
        
        // Get milestones by project
        const milestones = await milestoneRepository.findByProjectId(projectId);
        
        // Filter by phase if provided
        let filteredMilestones = milestones;
        if (phaseId) {
          filteredMilestones = milestones.filter((m: MilestoneDTO) => 
            m.phase_id === phaseId
          );
        }
        
        return filteredMilestones.map((m: MilestoneDTO) => ({
          id: m.id,
          title: m.title,
          status: m.status === 'completed' ? 'verified' : 'pending',
          trigger_progress: m.weight || 25,
          verification_score: m.status === 'completed' ? 100 : 0,
          phase_id: m.phase_id || null,
        }));
      } catch (error) {
        console.error('Error fetching checkpoints:', error);
        return [];
      }
    },
    enabled: !!projectId,
    staleTime: 30_000,
  });

  // Calculate automatic decompte for phase
  const { data: decompteData } = useQuery({
    queryKey: ['automatic-decompte', projectId, phaseId, checkpoints?.length],
    queryFn: async (): Promise<AutomaticDecompteDTO | null> => {
      if (!phaseId) {
        console.warn('Phase ID is required for decompte calculation');
        return null;
      }
      
      try {
        console.log('useCheckpointVerification - About to call calculator with:', {
          projectId,
          phaseId,
          hasProjectId: !!projectId,
          hasPhaseId: !!phaseId,
          typeofPhaseId: typeof phaseId,
          timestamp: new Date().toISOString()
        });

        const calculator = new AutomaticDecompteCalculator(projectId);
        return await calculator.calculatePhaseDecompte(phaseId);
      } catch (error) {
        console.error('AutomaticDecompteCalculator.calculatePhaseDecompte failed:', error);
        return null;
      }
    },
    enabled: !!phaseId,
    staleTime: 30_000,
    retry: (failureCount, error) => {
      // Don't retry on "Phase ID is required" errors
      if (error instanceof Error && error.message.includes('Phase ID is required')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Check if payment can be generated
  const { data: canGenerateData } = useQuery({
    queryKey: ['can-generate-decompte', projectId],
    queryFn: async () => {
      try {
        const calculator = new AutomaticDecompteCalculator(projectId);
        return await calculator.canGenerateDecompte();
      } catch (error) {
        console.error('AutomaticDecompteCalculator.canGenerateDecompte failed:', error);
        return false;
      }
    },
    enabled: !!projectId,
    staleTime: 30_000,
    retry: (failureCount, error) => {
      // Don't retry on "Repository methods not available" errors
      if (error instanceof Error && error.message.includes('Repository methods not available')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Trigger payment mutation via PaymentService
  const triggerPaymentMutation = useMutation({
    mutationFn: async (decompte: AutomaticDecompteDTO) => {
      try {
        const paymentService = getPaymentService();
        
        // Create payment request DTO
        const paymentRequest: CreatePaymentDTO = {
          projectId: projectId,
          phaseId: phaseId || undefined,
          amount: decompte.net_payable,
          paymentDate: new Date().toISOString(),
          paymentMethod: 'bank_transfer',
          progressAtPayment: decompte.progress_at_decompte,
          transactionId: `AUTO-${Date.now()}`,
          contractorName: 'Auto-generated',
          contractorContact: '',
        };
        
        return await paymentService.createPayment(paymentRequest);
      } catch (error) {
        console.error('Error creating payment:', error);
        throw error;
      }
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
