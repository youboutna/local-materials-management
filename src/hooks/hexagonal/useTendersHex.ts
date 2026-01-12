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
