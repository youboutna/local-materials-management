/**
 * Hook hexagonal pour les documents
 * Encapsule les use cases de l'architecture hexagonale + hooks React Query
 */
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { 
  GetDocumentsListUseCase,
  GetDocumentsByProjectUseCase
} from '@/application/use-cases';
import { Document as DomainDocument } from '@/domain/entities/Document';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Document = Database['public']['Tables']['documents']['Row'];

// Singleton instances des use cases
const documentRepository = RepositoryFactory.getDocumentRepository();
const getDocumentsListUseCase = new GetDocumentsListUseCase(documentRepository);
const getDocumentsByProjectUseCase = new GetDocumentsByProjectUseCase(documentRepository);

// ============= Types =============
export interface DocumentFilters {
  searchTerm?: string;
  filterType?: string;
  filterStatus?: string;
  supplierId?: string;
  projectId?: string;
  phaseId?: string;
  tenderId?: string;
}

export interface TenderDocumentWithDetails {
  id: string;
  project_id: string | null;
  document_id: string | null;
  category: string;
  subcategory: string;
  is_required: boolean | null;
  reviewer_notes: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
  document: {
    id: string;
    title: string;
    description: string | null;
    file_url: string | null;
    file_name: string | null;
    mime_type: string | null;
    file_size: number | null;
  } | null;
  step_info?: {
    step_title?: string;
    step_number?: number;
  };
}

// ============= React Query Hooks =============

export function useDocumentsList(filters: DocumentFilters = {}) {
  return useQuery({
    queryKey: ['documents-list', filters],
    queryFn: async (): Promise<Document[]> => {
      let query = supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.searchTerm) {
        query = query.or(`title.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`);
      }

      if (filters.filterType && filters.filterType !== 'all') {
        query = query.eq('document_type' as any, filters.filterType as any);
      }

      if (filters.filterStatus && filters.filterStatus !== 'all') {
        query = query.eq('status' as any, filters.filterStatus as any);
      }

      if (filters.supplierId) {
        query = query.eq('supplier_id', filters.supplierId);
      }

      if (filters.projectId) {
        query = query.eq('project_id', filters.projectId);
      }

      if (filters.phaseId) {
        query = query.eq('phase_id', filters.phaseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown as Document[]) || [];
    }
  });
}

export function useSupplierDocuments(supplierId: string) {
  return useQuery({
    queryKey: ['supplier-documents', supplierId],
    queryFn: async (): Promise<Document[]> => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data as unknown as Document[]) || [];
    },
    enabled: !!supplierId
  });
}

export function usePhaseDocuments(phaseId: string) {
  return useQuery({
    queryKey: ['phase-documents', phaseId],
    queryFn: async (): Promise<Document[]> => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('phase_id', phaseId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!phaseId
  });
}

export function useTenderDocuments(projectId: string) {
  return useQuery({
    queryKey: ['tender-documents', projectId],
    queryFn: async (): Promise<TenderDocumentWithDetails[]> => {
      const { data, error } = await supabase
        .from('tender_documents')
        .select(`
          *,
          document:documents(
            id,
            title,
            description,
            file_url,
            file_name,
            mime_type,
            file_size
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as TenderDocumentWithDetails[];
    },
    enabled: !!projectId
  });
}

export function useWorkflowStepDocuments(projectId: string) {
  return useQuery({
    queryKey: ['workflow-step-documents', projectId],
    queryFn: async (): Promise<TenderDocumentWithDetails[]> => {
      const { data: steps, error: stepsError } = await supabase
        .from('tender_steps')
        .select('id, title, step_number')
        .eq('tender_id', projectId);
      
      if (stepsError) throw stepsError;
      if (!steps?.length) return [];

      const stepIds = steps.map(s => s.id);
      const { data: stepDocs, error: docsError } = await supabase
        .from('tender_step_documents')
        .select(`
          *,
          document:documents(*),
          step:tender_steps(title, step_number)
        `)
        .in('step_id', stepIds);

      if (docsError) throw docsError;

      return (stepDocs || []).map(doc => ({
        id: doc.id,
        project_id: projectId,
        document_id: doc.document_id,
        category: doc.document_type as string || 'administrative',
        subcategory: 'workflow_step',
        is_required: doc.is_required,
        reviewer_notes: doc.reviewer_notes,
        status: doc.status as string,
        created_at: doc.created_at,
        updated_at: doc.created_at,
        document: doc.document,
        step_info: {
          step_title: doc.step?.title,
          step_number: doc.step?.step_number
        }
      }));
    },
    enabled: !!projectId
  });
}

export function useDocumentDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, phaseId }: { id: string; phaseId?: string }) => {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, phaseId };
    },
    onSuccess: (data) => {
      if (data.phaseId) {
        queryClient.invalidateQueries({ queryKey: ['phase-documents', data.phaseId] });
      }
      queryClient.invalidateQueries({ queryKey: ['documents-list'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-documents'] });
    }
  });
}

// ============= Legacy Hexagonal Hooks =============

export interface UseDocumentsHexResult {
  documents: DomainDocument[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useDocumentsHex(): UseDocumentsHexResult {
  const [documents, setDocuments] = useState<DomainDocument[]>([]);
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
  documents: DomainDocument[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useProjectDocumentsHex(projectId: string | undefined): UseProjectDocumentsHexResult {
  const [documents, setDocuments] = useState<DomainDocument[]>([]);
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
