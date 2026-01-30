/**
 * Hexagonal Hook for Documents Management
 * Real data from DocumentService via RepositoryFactory
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { DocumentService, type DocumentResponseDto } from '@/application/services/DocumentService';
import { CreateDocumentRequestDto, UpdateDocumentRequestDto } from '@/application/services/DocumentService';

type DocumentRow = DocumentResponseDto;

// Types for the hooks
export interface UseDocumentsHexResult {
  documents: DocumentRow[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  createDocument: (data: CreateDocumentRequestDto) => void;
  updateDocument: ({ id, data }: { id: string; data: UpdateDocumentRequestDto }) => void;
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
    mutationFn: async (documentData: CreateDocumentRequestDto) => {
      return await documentService.createDocument(documentData);
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
    mutationFn: async ({ id, data }: { id: string; data: UpdateDocumentRequestDto }) => {
      return await documentService.updateDocument(id, data);
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

// Export individual hooks for specific operations
export const useDocumentCreate = () => {
  const queryClient = useQueryClient();
  const documentService = new DocumentService(
    RepositoryFactory.getDocumentRepository()
  );

  return useMutation({
    mutationFn: async (documentData: CreateDocumentRequestDto) => {
      return await documentService.createDocument(documentData);
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
};

export const useDocumentUpdate = () => {
  const queryClient = useQueryClient();
  const documentService = new DocumentService(
    RepositoryFactory.getDocumentRepository()
  );

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDocumentRequestDto }) => {
      return await documentService.updateDocument(id, data);
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
};

export const useDocumentDelete = () => {
  const queryClient = useQueryClient();
  const documentService = new DocumentService(
    RepositoryFactory.getDocumentRepository()
  );

  return useMutation({
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
};

export const useDocumentsList = (filters?: DocumentFilters) => {
  const documentService = new DocumentService(
    RepositoryFactory.getDocumentRepository()
  );

  return useQuery({
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
};

export const useDocumentsByProject = (projectId: string) => {
  const documentService = new DocumentService(
    RepositoryFactory.getDocumentRepository()
  );

  return useQuery({
    queryKey: ['project-documents', projectId],
    queryFn: async (): Promise<DocumentRow[]> => {
      try {
        if (!projectId) return [];
        const documents = await documentService.getProjectDocuments(projectId);
        return documents;
      } catch (err) {
        console.error('Error fetching project documents:', err);
        return [];
      }
    },
    enabled: !!projectId
  });
};

export const useDocumentById = (id: string) => {
  const documentService = new DocumentService(
    RepositoryFactory.getDocumentRepository()
  );

  return useQuery({
    queryKey: ['document', id],
    queryFn: async (): Promise<DocumentRow | null> => {
      try {
        // Get all documents and find by ID (since getDocumentById doesn't exist)
        const documents = await documentService.getAllDocuments();
        const document = documents.find(doc => doc.id === id);
        return document || null;
      } catch (err) {
        console.error('Error fetching document:', err);
        return null;
      }
    },
    enabled: !!id
  });
};

export const useTenderDocuments = (tenderId: string) => {
  const documentService = new DocumentService(
    RepositoryFactory.getDocumentRepository()
  );

  return useQuery({
    queryKey: ['tender-documents', tenderId],
    queryFn: async (): Promise<DocumentRow[]> => {
      try {
        // Get all documents and filter by tenderId (since getDocumentsByTender doesn't exist)
        const documents = await documentService.getAllDocuments();
        const tenderDocuments = documents.filter(doc => 
          (doc as any).tenderId === tenderId || 
          (doc as any).tender_id === tenderId
        );
        return tenderDocuments;
      } catch (err) {
        console.error('Error fetching tender documents:', err);
        return [];
      }
    },
    enabled: !!tenderId
  });
};

export const useWorkflowStepDocuments = (stepId: string) => {
  const documentService = new DocumentService(
    RepositoryFactory.getDocumentRepository()
  );

  return useQuery({
    queryKey: ['workflow-step-documents', stepId],
    queryFn: async (): Promise<DocumentRow[]> => {
      try {
        // Get all documents and filter by stepId (since getDocumentsByWorkflowStep doesn't exist)
        const documents = await documentService.getAllDocuments();
        const stepDocuments = documents.filter(doc => 
          (doc as any).stepId === stepId || 
          (doc as any).step_id === stepId
        );
        return stepDocuments;
      } catch (err) {
        console.error('Error fetching workflow step documents:', err);
        return [];
      }
    },
    enabled: !!stepId
  });
};
