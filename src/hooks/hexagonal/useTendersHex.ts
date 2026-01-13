/**
 * Hook hexagonal pour les appels d'offres
 * Encapsule les use cases de l'architecture hexagonale
 */
import { useState, useEffect, useCallback } from 'react';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { 
  GetTendersListUseCase,
  GetTenderByIdUseCase
} from '@/application/use-cases';
import { Tender } from '@/domain/entities/Tender';

// Singleton instances des use cases
const tenderRepository = RepositoryFactory.getTenderRepository();
const getTendersListUseCase = new GetTendersListUseCase(tenderRepository);
const getTenderByIdUseCase = new GetTenderByIdUseCase(tenderRepository);

export interface UseTendersHexResult {
  tenders: Tender[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useTendersHex(): UseTendersHexResult {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTenders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getTendersListUseCase.execute();
      if (result.success) {
        setTenders(result.tenders);
      } else {
        throw new Error(result.error || 'Failed to fetch tenders');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tenders'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenders();
  }, [fetchTenders]);

  return {
    tenders,
    loading,
    error,
    refetch: fetchTenders,
  };
}

export interface UseTenderHexResult {
  tender: Tender | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useTenderHex(tenderId: string | undefined): UseTenderHexResult {
  const [tender, setTender] = useState<Tender | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTender = useCallback(async () => {
    if (!tenderId) {
      setTender(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await getTenderByIdUseCase.execute(tenderId);
      if (result.success) {
        setTender(result.tender);
      } else {
        throw new Error(result.error || 'Failed to fetch tender');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tender'));
    } finally {
      setLoading(false);
    }
  }, [tenderId]);

  useEffect(() => {
    fetchTender();
  }, [fetchTender]);

  return {
    tender,
    loading,
    error,
    refetch: fetchTender,
  };
}

// ============= Additional React Query-based hooks for component migration =============

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types for submission evaluation
export interface TenderSubmission {
  id: string;
  tender_id: string;
  supplier_name: string;
  supplier_email: string;
  submission_date: string;
  status: string;
  administrative_score?: number;
  technical_score?: number;
  financial_score?: number;
  total_score?: number;
}

export interface TenderSubmissionDocument {
  id: string;
  submission_id: string;
  category: string;
  subcategory?: string;
  document?: {
    id: string;
    title: string;
    file_name: string;
    file_url: string;
  };
}

export interface ProjectPhaseForTender {
  id: string;
  name: string;
  description?: string;
  status: string;
  progress: number;
  startDate?: string;
  endDate?: string;
  budget?: number;
  teamSize?: number;
  steps: ProjectStepForTender[];
}

export interface ProjectStepForTender {
  id: string;
  name: string;
  order: number;
  status: string;
}

// Hook: Fetch tender submission with details
export function useTenderSubmission(submissionId: string) {
  return useQuery({
    queryKey: ['tender-submission', submissionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tender_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (error) throw error;
      return data as TenderSubmission;
    },
    enabled: !!submissionId
  });
}

// Hook: Fetch submission documents
export function useSubmissionDocuments(submissionId: string) {
  return useQuery({
    queryKey: ['submission-documents', submissionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tender_submission_documents')
        .select(`
          *,
          document:documents(*)
        `)
        .eq('submission_id', submissionId);

      if (error) throw error;
      return (data || []) as TenderSubmissionDocument[];
    },
    enabled: !!submissionId
  });
}

// Hook: Save submission evaluation
export function useSaveSubmissionEvaluation(submissionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      scores,
      finalSubmit = false,
      currentStatus
    }: {
      scores: {
        administrative_score: number;
        technical_score: number;
        financial_score: number;
      };
      finalSubmit?: boolean;
      currentStatus?: string;
    }) => {
      const totalScore =
        scores.administrative_score * 0.3 +
        scores.technical_score * 0.4 +
        scores.financial_score * 0.3;

      const { error } = await supabase
        .from('tender_submissions')
        .update({
          administrative_score: scores.administrative_score,
          technical_score: scores.technical_score,
          financial_score: scores.financial_score,
          total_score: totalScore,
          status: finalSubmit ? 'under_review' : currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (error) throw error;
      return { totalScore, finalSubmit };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tender-submission', submissionId] });
    }
  });
}

// Hook: Fetch project phases for tender
export function useProjectPhasesForTender(projectId?: string, tenderId?: string) {
  return useQuery({
    queryKey: ['tender-project-phases', projectId, tenderId],
    queryFn: async (): Promise<{ projectInfo: { id: string; title: string } | null; phases: ProjectPhaseForTender[] }> => {
      let targetProjectId = projectId;

      // If no projectId, get from tender
      if (!targetProjectId && tenderId) {
        const { data: tenderData, error: tenderError } = await supabase
          .from('tenders')
          .select('project_id, title')
          .eq('id', tenderId)
          .single();

        if (tenderError || !tenderData?.project_id) {
          return { projectInfo: null, phases: [] };
        }
        targetProjectId = tenderData.project_id;
      }

      if (!targetProjectId) {
        return { projectInfo: null, phases: [] };
      }

      // Get project info
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, title')
        .eq('id', targetProjectId)
        .single();

      if (projectError) throw projectError;

      // Get phases with steps
      const { data: phasesData, error: phasesError } = await supabase
        .from('project_phases')
        .select(`
          *,
          phase_steps (*)
        `)
        .eq('project_id', targetProjectId)
        .order('phase_order', { ascending: true });

      if (phasesError) throw phasesError;

      const phases: ProjectPhaseForTender[] = (phasesData || []).map((p: any) => ({
        id: p.id,
        name: p.phase_name || 'Phase sans nom',
        description: p.description,
        status: p.status || 'pending',
        progress: p.progress || 0,
        startDate: p.start_date,
        endDate: p.end_date,
        budget: p.budget_allocated,
        teamSize: p.team_size,
        steps: (p.phase_steps || [])
          .sort((a: any, b: any) => (a.step_order || 0) - (b.step_order || 0))
          .map((s: any) => ({
            id: s.id,
            name: s.step_name || s.name || 'Étape',
            order: s.step_order || 0,
            status: s.status || 'pending'
          }))
      }));

      return { projectInfo: project, phases };
    },
    enabled: !!(projectId || tenderId)
  });
}

// Hook: Fetch project phases for lot builder
export function useProjectPhasesForLots(projectId?: string) {
  return useQuery({
    queryKey: ['project-phases-for-lots', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_phases')
        .select(`
          *,
          phase_steps (*)
        `)
        .eq('project_id', projectId)
        .order('phase_order', { ascending: true });

      if (error) throw error;

      return (data || []).map((p: any) => ({
        id: p.id,
        name: p.phase_name || p.name,
        description: p.description,
        budget: p.budget_allocated,
        steps: (p.phase_steps || []).map((s: any) => ({
          id: s.id,
          name: s.step_name || s.name,
          order: s.step_order || 0
        }))
      }));
    },
    enabled: !!projectId
  });
}
