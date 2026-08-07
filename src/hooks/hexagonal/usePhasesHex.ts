/**
 * Hexagonal Hook for Phases
 * Encapsulates phase operations using hexagonal architecture
 */

import { Phase, PhaseStatus } from '@/domain/entities';
import type { PhaseMetrics } from '@/domain/repositories/IPhaseRepository';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useCallback, useEffect, useMemo, useState } from 'react';

export interface CreatePhaseData {
  phase_name: string;
  description: string;
  construction_phase?: string;
  construction_stage?: string;
  start_date?: string;
  end_date?: string;
  estimated_cost?: number;
  estimated_duration?: number;
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
export interface UsePhaseHexResult {
  phase: Phase | null;
  metrics: PhaseMetrics;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateProgress?: (progress: number) => Promise<boolean>;
  updateStepStatus?: (stepId: string, status: string) => Promise<boolean>;
}

export function usePhaseHex(phaseId?: string): UsePhaseHexResult {
  const phaseRepository = useMemo(
    () => RepositoryFactory.getPhaseRepository(),
    []
  );
  
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
      const phaseData = await phaseRepository.findWithSteps(phaseId);
      const metricsData = await phaseRepository.getMetrics(phaseId);
      
      setPhase(phaseData);
      setMetrics(metricsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load phase');
    } finally {
      setLoading(false);
    }
  }, [phaseId, phaseRepository]);

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
  }, [phaseId, fetchPhase, phaseRepository]);

  const updateStepStatus = useCallback(async (stepId: string, status: string): Promise<boolean> => {
    if (!phaseId) return false;
    
    try {
      await phaseRepository.updateStep(phaseId, stepId, { status: status as PhaseStatus });
      await fetchPhase();
      return true;
    } catch (err) {
      console.error('Failed to update step status:', err);
      return false;
    }
  }, [phaseId, fetchPhase, phaseRepository]);

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
 * Hook for phases list by project with CRUD operations
 */
export interface UpdatePhaseData {
  phase_name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  estimated_cost?: number;
  status?: string;
  progress?: number;
}

export interface UsePhasesHexResult {
  phases: Phase[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createPhase: (data: CreatePhaseData) => Promise<Phase | null>;
  updatePhase: (phaseId: string, data: UpdatePhaseData) => Promise<boolean>;
  deletePhase: (phaseId: string) => Promise<boolean>;
  isCreating: boolean;
  isDeleting: boolean;
  isUpdating: boolean;
}

export function usePhasesHex(projectId: string | undefined): UsePhasesHexResult {
  const phaseRepository = useMemo(
    () => RepositoryFactory.getPhaseRepository(),
    []
  );
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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
  }, [projectId, phaseRepository]);

  useEffect(() => {
    fetchPhases();
  }, [fetchPhases]);

  const createPhase = useCallback(async (data: CreatePhaseData): Promise<Phase | null> => {
    if (!projectId) return null;
    
    setIsCreating(true);
    try {
      const newPhase = await phaseRepository.create({
        projectId,
        name: data.phase_name,
        description: data.description,
        constructionPhase: data.construction_phase,
        constructionStage: data.construction_stage,
        startDate: data.start_date ? new Date(data.start_date) : undefined,
        endDate: data.end_date ? new Date(data.end_date) : undefined,
        estimatedCost: data.estimated_cost,
        status: 'pending',
        progress: 0,
      } as Partial<Phase>);
      await fetchPhases();
      return newPhase;
    } catch (err) {
      console.error('Failed to create phase:', err);
      setError(err instanceof Error ? err.message : 'Failed to create phase');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [projectId, fetchPhases, phaseRepository]);

  const updatePhase = useCallback(async (phaseId: string, data: UpdatePhaseData): Promise<boolean> => {
    setIsUpdating(true);
    try {
      const updates: Record<string, unknown> = {};
      if (data.phase_name !== undefined) updates.name = data.phase_name;
      if (data.description !== undefined) updates.description = data.description;
      if (data.start_date !== undefined) updates.startDate = data.start_date;
      if (data.end_date !== undefined) updates.endDate = data.end_date;
      if (data.estimated_cost !== undefined) updates.estimatedCost = data.estimated_cost;
      if (data.status !== undefined) updates.status = data.status;
      if (data.progress !== undefined) updates.progress = data.progress;
      await phaseRepository.update(phaseId, updates as unknown as Partial<Phase>);
      await fetchPhases();
      return true;
    } catch (err) {
      console.error('Failed to update phase:', err);
      setError(err instanceof Error ? err.message : 'Failed to update phase');
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [fetchPhases, phaseRepository]);

  const deletePhase = useCallback(async (phaseId: string): Promise<boolean> => {
    setIsDeleting(true);
    try {
      await phaseRepository.delete(phaseId);
      await fetchPhases();
      return true;
    } catch (err) {
      console.error('Failed to delete phase:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete phase');
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [fetchPhases, phaseRepository]);

  return {
    phases,
    loading,
    error,
    refetch: fetchPhases,
    createPhase,
    updatePhase,
    deletePhase,
    isCreating,
    isDeleting,
    isUpdating,
  };
}