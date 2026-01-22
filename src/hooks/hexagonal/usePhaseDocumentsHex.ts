/**
 * Hexagonal Hook for Phase Documents Management
 * Wraps existing document hooks with phase-specific functionality
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type DocumentRow = Database['public']['Tables']['documents']['Row'];

export interface UsePhaseDocumentsResult {
  documents: DocumentRow[];
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
    queryFn: async (): Promise<DocumentRow[]> => {
      if (!phaseId) return [];
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('phase_id', phaseId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!phaseId,
  });

  return {
    documents,
    isLoading,
    error,
    refetch,
  };
}
