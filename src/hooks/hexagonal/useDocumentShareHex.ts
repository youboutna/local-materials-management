/**
 * Hexagonal hooks for Document Sharing
 * Uses DocumentService instead of direct Supabase access
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthService } from '@/application/services/AuthService';
import { DocumentService } from '@/application/services/DocumentService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export interface SharedDocument {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  file_name?: string;
  document_type: string;
  created_at: string;
  is_shared_with_suppliers: boolean;
  metadata?: {
    tender_id?: string;
    phase?: string;
  };
}

// Hook: Fetch tender documents
export function useTenderDocumentsForShare(tenderId: string, isOpen: boolean) {
  return useQuery({
    queryKey: ['tender-documents', tenderId],
    queryFn: async (): Promise<SharedDocument[]> => {
      const docRepo = RepositoryFactory.getDocumentRepository();
      const data = await docRepo.findByType('other' as any);
      return (data || []) as unknown as SharedDocument[];
    },
    enabled: isOpen && !!tenderId
  });
}

// Hook: Share documents with suppliers
export function useShareDocuments(tenderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentIds, phase }: { documentIds: string[]; phase: string }) => {
      if (documentIds.length === 0) {
        throw new Error('Aucun document sélectionné');
      }

      const authService = new AuthService(RepositoryFactory.getAuthRepository());
      const currentUser = await authService.getCurrentUser();
      const docRepo = RepositoryFactory.getDocumentRepository();
      
      for (const docId of documentIds) {
        await docRepo.update(docId, {
          is_shared_with_suppliers: true,
          shared_date: new Date().toISOString(),
          metadata: {
            tender_id: tenderId,
            phase: phase,
            shared_by: currentUser?.id
          }
        } as any);
      }

      return documentIds;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tender-documents'] });
      queryClient.invalidateQueries({ queryKey: ['shared-documents'] });
    }
  });
}
