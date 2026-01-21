/**
 * Hook hexagonal pour les appels d'offres
 * Encapsule les use cases de l'architecture hexagonale
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TenderService } from '@/application/services/TenderService';
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
      const result = await tenderService.getTenderById(tenderId);
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
      // TODO: Create TenderSubmissionService when available
      // For now, return domain entity with mock data
      return TenderSubmission.create({
        id: submissionId,
        projectId: 'mock-project-id',
        tenderId: 'mock-tender-id',
        status: 'draft',
        createdAt: new Date(),
        submissionDate: new Date(),
        supplierEmail: 'mock-supplier@example.com',
        supplierName: 'Mock Supplier',
        administrativeScore: 85,
        technicalScore: 90,
        financialScore: 95,
        totalScore: 90,
        updatedAt: new Date(),
        userId: 'mock-user-id'
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
      // TODO: Create TenderSubmissionDocumentService when available
      // For now, return empty array
      return [];
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
      // TODO: Create TenderSubmissionService when available
      // Calculate total score
      const totalScore =
        scores.administrative_score * 0.3 +
        scores.technical_score * 0.4 +
        scores.financial_score * 0.3;

      // TODO: Update submission in database when service is available
      // For now, return mock result
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
      // TODO: Create TenderSubmissionService when available
      // For now, return mock data
      return { projectInfo: { id: projectId || 'mock', title: 'Mock Project' }, phases: [] };
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

      // TODO: Create PhaseService integration when available
      // For now, return mock data
      return [];
    },
    enabled: !!projectId
  });
}
