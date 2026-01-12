/**
 * Hook hexagonal pour les documents
 * Encapsule les use cases de l'architecture hexagonale
 */
import { useState, useEffect, useCallback } from 'react';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { 
  GetDocumentsListUseCase,
  GetDocumentsByProjectUseCase
} from '@/application/use-cases';
import { Document } from '@/domain/entities/Document';

// Singleton instances des use cases
const documentRepository = RepositoryFactory.getDocumentRepository();
const getDocumentsListUseCase = new GetDocumentsListUseCase(documentRepository);
const getDocumentsByProjectUseCase = new GetDocumentsByProjectUseCase(documentRepository);

export interface UseDocumentsHexResult {
  documents: Document[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useDocumentsHex(): UseDocumentsHexResult {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getDocumentsListUseCase.execute();
      if (result.success) {
        setDocuments(result.documents);
      } else {
        throw new Error(result.error || 'Failed to fetch documents');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch documents'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    documents,
    loading,
    error,
    refetch: fetchDocuments,
  };
}

export interface UseProjectDocumentsHexResult {
  documents: Document[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useProjectDocumentsHex(projectId: string | undefined): UseProjectDocumentsHexResult {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!projectId) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await getDocumentsByProjectUseCase.execute(projectId);
      if (result.success) {
        setDocuments(result.documents);
      } else {
        throw new Error(result.error || 'Failed to fetch project documents');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch project documents'));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    documents,
    loading,
    error,
    refetch: fetchDocuments,
  };
}
