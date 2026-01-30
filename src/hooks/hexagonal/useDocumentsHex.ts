/**
 * Hexagonal Hook for Documents Management
 * Real data from DocumentService via RepositoryFactory
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { DocumentService } from '@/application/services/DocumentService';
import { DocumentDTO } from '@/dtos/entities/DocumentDTO';

type DocumentRow = DocumentDTO;

// Types for the hooks
export interface UseDocumentsHexResult {
  documents: DocumentRow[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  createDocument: (data: Partial<DocumentDTO>) => void;
  updateDocument: ({ id, data }: { id: string; data: Partial<DocumentDTO> }) => void;
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
export function useDocumentsHex(filters?: DocumentFilters): UseDocumentsHexResult {
  const queryClient = useQueryClient();
  
  // Initialize service with hexagonal architecture
  const documentService = new DocumentService(
    RepositoryFactory.getDocumentRepository()
  );

  // Query for documents list from DocumentService
  const {
    data: documents = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['documents', filters],
    queryFn: async (): Promise<DocumentRow[]> => {
      try {
        const documents = await documentService.getAllDocuments();
        return documents;
      } catch (err) {
        console.error('Error fetching documents:', err);
        throw err;
      }
    }
  });

  // Create document mutation
  const createDocumentMutation = useMutation({
    mutationFn: async (documentData: Partial<DocumentDTO>) => {
      return await documentService.createDocument(documentData as any);
    },
    onSuccess: () => {
      toast.success('Document créé avec succès');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (error: Error) => {
      console.error('Create document error:', error);
      toast.error('Erreur lors de la création du document');
    }
  });

  // Update document mutation
  const updateDocumentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DocumentDTO> }) => {
      return await documentService.updateDocument(id, data as any);
    },
    onSuccess: () => {
      toast.success('Document mis à jour avec succès');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (error: Error) => {
      console.error('Update document error:', error);
      toast.error('Erreur lors de la mise à jour du document');
    }
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      return await documentService.deleteDocument(id);
    },
    onSuccess: () => {
      toast.success('Document supprimé avec succès');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (error: Error) => {
      console.error('Delete document error:', error);
      toast.error('Erreur lors de la suppression du document');
    }
  });

  return {
    documents,
    isLoading,
    error: error?.message || null,
    refetch,
    createDocument: createDocumentMutation.mutate,
    updateDocument: updateDocumentMutation.mutate,
    deleteDocument: deleteDocumentMutation.mutate,
    isCreating: createDocumentMutation.isPending,
    isUpdating: updateDocumentMutation.isPending,
    isDeleting: deleteDocumentMutation.isPending,
  };
}
