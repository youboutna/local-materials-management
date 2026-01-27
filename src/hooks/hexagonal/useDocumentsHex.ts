/**
 * Hexagonal Hook for Documents Management
 * Real data from Supabase via SupabaseDocumentAdapter
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type DocumentRow = Database['public']['Tables']['documents']['Row'];

// Types for the hooks
export interface UseDocumentsHexResult {
  documents: DocumentRow[];
  isLoading: boolean;
  error: any;
  refetch: () => void;
  createDocument: (data: any) => void;
  updateDocument: ({ id, data }: { id: string; data: any }) => void;
  deleteDocument: (id: string) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export interface DocumentFilters {
  searchTerm?: string;
  filterType?: string;
  filterStatus?: string;
  projectId?: string;
}

/**
 * Main hook for documents management
 */
export function useDocumentsHex(): UseDocumentsHexResult {
  const queryClient = useQueryClient();

  // Query for documents list from Supabase
  const {
    data: documents = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['documents'],
    queryFn: async (): Promise<DocumentRow[]> => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as DocumentRow[];
    }
  });

  // Create document mutation
  const createDocumentMutation = useMutation({
    mutationFn: async (documentData: any) => {
      const { data, error } = await supabase
        .from('documents')
        .insert({
          title: documentData.title,
          description: documentData.description,
          document_type: documentData.documentType || documentData.document_type,
          status: documentData.status || 'draft',
          file_url: documentData.fileUrl || documentData.file_url,
          file_name: documentData.fileName || documentData.file_name,
          file_size: documentData.fileSize || documentData.file_size,
          mime_type: documentData.mimeType || documentData.mime_type,
          project_id: documentData.projectId || documentData.project_id,
          uploaded_by: documentData.uploadedBy || documentData.uploaded_by
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Document créé avec succès');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (error: any) => {
      console.error('Create document error:', error);
      toast.error('Erreur lors de la création du document');
    }
  });

  // Update document mutation
  const updateDocumentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from('documents')
        .update({
          title: data.title,
          description: data.description,
          status: data.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Document mis à jour avec succès');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (error: any) => {
      console.error('Update document error:', error);
      toast.error('Erreur lors de la mise à jour du document');
    }
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Document supprimé avec succès');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (error: any) => {
      console.error('Delete document error:', error);
      toast.error('Erreur lors de la suppression du document');
    }
  });

  return {
    documents,
    isLoading,
    error,
    refetch,
    createDocument: createDocumentMutation.mutate,
    updateDocument: updateDocumentMutation.mutate,
    deleteDocument: deleteDocumentMutation.mutate,
    isCreating: createDocumentMutation.isPending,
    isUpdating: updateDocumentMutation.isPending,
    isDeleting: deleteDocumentMutation.isPending
  };
}

/**
 * Hook for creating documents with mutation result
 */
export function useDocumentCreate() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (documentData: any) => {
      const { data, error } = await supabase
        .from('documents')
        .insert({
          title: documentData.title,
          description: documentData.description,
          document_type: documentData.documentType || documentData.document_type || 'project_report',
          status: documentData.status || 'draft',
          file_url: documentData.fileUrl || documentData.file_url,
          file_name: documentData.fileName || documentData.file_name,
          file_size: documentData.fileSize || documentData.file_size,
          mime_type: documentData.mimeType || documentData.mime_type,
          project_id: documentData.projectId || documentData.project_id,
          uploaded_by: documentData.uploadedBy || documentData.uploaded_by
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
  });

  return {
    createDocument: mutation,
    isCreating: mutation.isPending
  };
}

/**
 * Hook for updating documents
 */
export function useDocumentUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from('documents')
        .update({
          title: data.title,
          description: data.description,
          status: data.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
  });
}

/**
 * Hook for deleting documents
 */
export function useDocumentDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
  });
}

/**
 * Hook for listing documents with filters
 */
export function useDocumentsList(filters?: DocumentFilters) {
  return useQuery({
    queryKey: ['documents', 'list', filters],
    queryFn: async (): Promise<DocumentRow[]> => {
      let query = supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.filterType && filters.filterType !== 'all') {
        query = query.eq('document_type', filters.filterType as any);
      }

      if (filters?.filterStatus && filters.filterStatus !== 'all') {
        query = query.eq('status', filters.filterStatus as any);
      }

      if (filters?.projectId) {
        query = query.eq('project_id', filters.projectId);
      }

      if (filters?.searchTerm) {
        query = query.or(`title.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as DocumentRow[];
    }
  });
}

/**
 * Hook for documents by project
 */
export function useDocumentsByProject(projectId: string) {
  return useQuery({
    queryKey: ['documents', 'project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for single document by ID
 */
export function useDocumentById(id: string) {
  return useQuery({
    queryKey: ['documents', 'id', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for tender documents
 */
export function useTenderDocuments(tenderId: string) {
  return useQuery({
    queryKey: ['documents', 'tender', tenderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('document_type', 'tender')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenderId
  });
}

/**
 * Hook for workflow step documents
 */
export function useWorkflowStepDocuments(stepId: string) {
  return useQuery({
    queryKey: ['documents', 'workflow-step', stepId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!stepId
  });
}
