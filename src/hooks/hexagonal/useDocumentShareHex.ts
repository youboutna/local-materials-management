/**
 * Hexagonal hooks for Document Sharing
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthService } from '@/application/services/AuthService';
import { supabase } from '@/integrations/supabase/client';

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
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('document_type', 'tender')
        .or(`metadata->tender_id.eq.${tenderId},metadata.is.null`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as SharedDocument[];
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

      const authService = new AuthService();
      const user = await authService.getCurrentUser();
      
      for (const docId of documentIds) {
        const { error } = await supabase
          .from('documents')
          .update({
            is_shared_with_suppliers: true,
            shared_date: new Date().toISOString(),
            metadata: {
              tender_id: tenderId,
              phase: phase,
              shared_by: user.user?.id
            }
          })
          .eq('id', docId);

        if (error) throw error;
      }

      return documentIds;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tender-documents'] });
      queryClient.invalidateQueries({ queryKey: ['shared-documents'] });
    }
  });
}
