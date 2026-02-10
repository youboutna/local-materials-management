/**
 * Hexagonal Hook for Phase Documents Management
 * Uses DocumentService instead of direct Supabase access
 */

import { useQuery } from '@tanstack/react-query';
import { DocumentService } from '@/application/services/DocumentService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export interface PhaseDocument {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  status: string;
  documentType: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsePhaseDocumentsResult {
  documents: PhaseDocument[];
  data: PhaseDocument[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook for documents by phase
 */
export function usePhaseDocuments(phaseId: string): UsePhaseDocumentsResult {
  const {
    data: documents = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['documents', 'phase', phaseId],
    queryFn: async (): Promise<PhaseDocument[]> => {
      if (!phaseId) return [];
      
      const service = new DocumentService(RepositoryFactory.getDocumentRepository());
      const docs = await service.getDocumentsByPhase(phaseId);
      return docs.map(d => ({
        id: d.id,
        title: d.title,
        description: d.description ?? null,
        fileUrl: d.fileUrl ?? null,
        fileName: d.fileName ?? null,
        fileSize: d.fileSize ?? null,
        mimeType: d.mimeType ?? null,
        status: d.status ?? 'draft',
        documentType: d.documentType ?? 'other',
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      }));
    },
    enabled: !!phaseId,
  });

  return {
    documents,
    data: documents,
    isLoading,
    error,
    refetch,
  };
}
