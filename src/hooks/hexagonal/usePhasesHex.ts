/**
 * Hexagonal Hook for Phases
 * Encapsulates phase operations using hexagonal architecture
 */

import { useState, useEffect, useCallback } from 'react';
import { Phase, PhaseStep } from '@/domain/entities';
import { PhaseMetrics } from '@/domain/repositories';
import { GetPhaseDetailsUseCase } from '@/application/use-cases/project';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

const phaseRepository = RepositoryFactory.getPhaseRepository();
const getPhaseDetailsUseCase = new GetPhaseDetailsUseCase(phaseRepository);

export interface UsePhaseHexResult {
  phase: Phase | null;
  metrics: PhaseMetrics;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateProgress: (progress: number) => Promise<boolean>;
  updateStepStatus: (stepId: string, status: string) => Promise<boolean>;
}

export interface UsePhasesHexResult {
  phases: Phase[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const defaultMetrics: PhaseMetrics = {
  materialCost: 0,
  totalMaterials: 0,
  totalTasks: 0,
  completedTasks: 0,
  taskCompletionRate: 0,
  totalInspections: 0,
  passedInspections: 0,
  inspectionPassRate: 0,
  totalEmployees: 0,
  totalPayments: 0,
  totalPaymentAmount: 0,
  totalDocuments: 0,
  milestoneProgress: 0,
  stepsCount: 0,
  completedSteps: 0,
};

/**
 * Hook for single phase with details and metrics
 */
export function usePhaseHex(phaseId: string | undefined): UsePhaseHexResult {
  const [phase, setPhase] = useState<Phase | null>(null);
  const [metrics, setMetrics] = useState<PhaseMetrics>(defaultMetrics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPhase = useCallback(async () => {
    if (!phaseId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getPhaseDetailsUseCase.execute(phaseId);
      
      if (result.success && result.phase) {
        setPhase(result.phase);
        setMetrics(result.metrics);
      } else {
        setError(result.error || 'Failed to load phase');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load phase');
    } finally {
      setLoading(false);
    }
  }, [phaseId]);

  useEffect(() => {
    fetchPhase();
  }, [fetchPhase]);

  const updateProgress = useCallback(async (progress: number): Promise<boolean> => {
    if (!phaseId) return false;
    
    try {
      await phaseRepository.updateProgress(phaseId, progress);
      await fetchPhase();
      return true;
    } catch (err) {
      console.error('Failed to update progress:', err);
      return false;
    }
  }, [phaseId, fetchPhase]);

  const updateStepStatus = useCallback(async (stepId: string, status: string): Promise<boolean> => {
    if (!phaseId) return false;
    
    try {
      await phaseRepository.updateStep(phaseId, stepId, { status: status as any });
      await fetchPhase();
      return true;
    } catch (err) {
      console.error('Failed to update step status:', err);
      return false;
    }
  }, [phaseId, fetchPhase]);

  return {
    phase,
    metrics,
    loading,
    error,
    refetch: fetchPhase,
    updateProgress,
    updateStepStatus,
  };
}

/**
 * Hook for phases list by project
 */
export function usePhasesHex(projectId: string | undefined): UsePhasesHexResult {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPhases = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await phaseRepository.findByProjectId(projectId);
      setPhases(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load phases');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchPhases();
  }, [fetchPhases]);

  return {
    phases,
    loading,
    error,
    refetch: fetchPhases,
  };
}
