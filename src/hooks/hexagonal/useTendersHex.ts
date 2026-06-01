/**
 * Hook hexagonal pour les appels d'offres
 * Encapsule les use cases de l'architecture hexagonale
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TenderService } from '@/application/services/TenderService';
import { TenderSubmissionService } from '@/application/services/TenderSubmissionService';
import { Tender } from '@/domain/entities/Tender';
import { TenderSubmission } from '@/domain/entities/TenderSubmission';
import { TenderSubmissionDocument } from '@/domain/entities/TenderSubmissionDocument';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export interface UseTenderHexResult {
  tenders: Tender[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface UseTenderByIdHexResult {
  tender: Tender | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface ProjectPhaseForTender {
  id: string;
  name: string;
  description?: string;
  order: number;
  status: string;
  progress?: number;
  startDate?: string;
  endDate?: string;
  budget?: number;
  teamSize?: number;
  steps: Array<{
    id: string;
    name: string;
    order: number;
    status: string;
  }>;
}

export function useTendersHex(): UseTenderHexResult {
  // Initialize service with RepositoryFactory
  const tenderService = useMemo(() => new TenderService(
    RepositoryFactory.getTenderRepository(),
    RepositoryFactory.getParsedInvoiceRepository()
  ), []);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTenders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await tenderService.getAllTenders();
      setTenders(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tenders'));
    } finally {
      setLoading(false);
    }
  }, [tenderService]);

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

export function useTenderHex(tenderId: string | undefined): UseTenderByIdHexResult {
  // Initialize service with RepositoryFactory
  const tenderService = useMemo(() => new TenderService(
    RepositoryFactory.getTenderRepository(),
    RepositoryFactory.getParsedInvoiceRepository()
  ), []);
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
      const result = await tenderService.getTenderById({ id: tenderId });
      setTender(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tender'));
    } finally {
      setLoading(false);
    }
  }, [tenderId, tenderService]);

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

// Types for submission evaluation
export interface TenderSubmissionEvaluation {
  scores: {
    administrative_score: number;
    technical_score: number;
    financial_score: number;
  };
  finalSubmit?: boolean;
  currentStatus?: string;
}

export interface ProjectPhaseForTender {
  id: string;
  name: string;
  order: number;
  status: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  teamSize?: number;
  steps: Array<{
    id: string;
    name: string;
    order: number;
    status: string;
  }>;
}

export interface ProjectStepForTender {
  id: string;
  name: string;
  order: number;
  status: string;
}

// Hook: Fetch project phases for lot builder

// Hook: Fetch tender submission with details
export function useTenderSubmission(submissionId: string) {
  return useQuery({
    queryKey: ['tender-submission', submissionId],
    queryFn: async () => {
      const data = await TenderSubmissionService.getSubmissionById(submissionId);
      if (!data) return null;
      const row = data as Record<string, unknown>;
      return TenderSubmission.create({
        id: String(row.id),
        projectId: (row.project_id as string) ?? '',
        tenderId: String(row.tender_id),
        status: (row.status as 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected') ?? 'draft',
        createdAt: row.created_at ? new Date(row.created_at as string) : new Date(),
        submissionDate: row.submission_date ? new Date(row.submission_date as string) : new Date(),
        supplierEmail: (row.supplier_email as string) ?? '',
        supplierName: (row.supplier_name as string) ?? '',
        administrativeScore: Number(row.administrative_score) || 0,
        technicalScore: Number(row.technical_score) || 0,
        financialScore: Number(row.financial_score) || 0,
        totalScore: Number(row.total_score) || 0,
        updatedAt: row.updated_at ? new Date(row.updated_at as string) : new Date(),
        userId: (row.user_id as string) ?? '',
      });
    },
    enabled: !!submissionId
  });
}

// Hook: Fetch submission documents
export function useSubmissionDocuments(submissionId: string) {
  return useQuery({
    queryKey: ['submission-documents', submissionId],
    queryFn: async () => {
      return await TenderSubmissionService.getSubmissionDocuments(submissionId);
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
      const nextStatus: 'under_review' | 'approved' = finalSubmit ? 'approved' : 'under_review';
      await TenderSubmissionService.updateSubmissionStatus(submissionId, nextStatus);
      return { totalScore, finalSubmit };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tender-submission', submissionId] });
    }
  });
}

// Hook: Fetch project phases for tender (delegated to PhaseService via repository)
export function useProjectPhasesForTender(projectId?: string, tenderId?: string) {
  return useQuery({
    queryKey: ['tender-project-phases', projectId, tenderId],
    queryFn: async (): Promise<{ projectInfo: { id: string; title: string } | null; phases: ProjectPhaseForTender[] }> => {
      if (!projectId) return { projectInfo: null, phases: [] };
      const phaseRepo = RepositoryFactory.getProjectPhaseRepository();
      const projectRepo = RepositoryFactory.getProjectRepository();
      const [project, phases] = await Promise.all([
        projectRepo.findById(projectId),
        phaseRepo.findByProjectId(projectId),
      ]);
      const mapped: ProjectPhaseForTender[] = (phases || []).map((p: Record<string, unknown>, idx: number) => ({
        id: String(p.id),
        name: String(p.phaseName ?? p.name ?? `Phase ${idx + 1}`),
        order: Number(p.orderIndex ?? idx),
        status: String(p.status ?? 'pending'),
        startDate: p.startDate as string | undefined,
        endDate: p.endDate as string | undefined,
        budget: p.estimatedCost as number | undefined,
        steps: [],
      }));
      return {
        projectInfo: project ? { id: String((project as Record<string, unknown>).id), title: String((project as Record<string, unknown>).title ?? '') } : null,
        phases: mapped,
      };
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
      const phaseRepo = RepositoryFactory.getProjectPhaseRepository();
      const phases = await phaseRepo.findByProjectId(projectId);
      return (phases || []).map((p: Record<string, unknown>, idx: number) => ({
        id: String(p.id),
        name: String(p.phaseName ?? p.name ?? `Phase ${idx + 1}`),
        order: Number(p.orderIndex ?? idx),
        status: String(p.status ?? 'pending'),
      }));
    },
    enabled: !!projectId
  });
}
