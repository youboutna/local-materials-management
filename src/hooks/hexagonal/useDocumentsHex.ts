/**
 * Hexagonal Hook for Documents Management
 * Real data from DocumentService via RepositoryFactory
 */

import { getDocumentService } from '@/application/services/DocumentService';
import { CreateDocumentDTO, DocumentDTO, UpdateDocumentDTO } from '@/dtos/entities/DocumentDTO';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type DocumentRow = DocumentDTO;

// Types for the hooks
export interface UseDocumentsHexResult {
  documents: DocumentRow[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  createDocument: (data: CreateDocumentDTO) => void;
  updateDocument: ({ id, data }: { id: string; data: UpdateDocumentDTO }) => void;
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
  const documentService = getDocumentService();

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
    mutationFn: async (documentData: CreateDocumentDTO) => {
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
    mutationFn: async ({ id, data }: { id: string; data: UpdateDocumentDTO }) => {
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
  const documentService = getDocumentService();

  const mutation = useMutation({
    mutationFn: async (documentData: CreateDocumentDTO) => {
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

  return {
    createDocument: mutation,
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error
  };
};

export const useDocumentUpdate = () => {
  const queryClient = useQueryClient();
  const documentService = getDocumentService();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDocumentDTO }) => {
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
  const documentService = getDocumentService();

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
  const documentService = getDocumentService();

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
  const documentService = getDocumentService();

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
  const documentService = getDocumentService();

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
  const documentService = getDocumentService();

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
  const documentService = getDocumentService();

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

// =================== DOCUMENT GENERATION HOOKS ===================

/**
 * Hook for project documents summary and analytics
 */
export const useProjectDocumentsSummary = (projectId: string) => {
  const documentService = getDocumentService();

  return useQuery({
    queryKey: ['project-documents-summary', projectId],
    queryFn: async () => {
      try {
        return await documentService.generateProjectDocumentsSummary(projectId);
      } catch (error) {
        console.error('Error generating project documents summary:', error);
        throw error;
      }
    },
    enabled: !!projectId
  });
};

/**
 * Hook for document metadata for reports
 */
export const useDocumentMetadata = (projectId: string) => {
  const documentService = getDocumentService();

  return useQuery({
    queryKey: ['document-metadata', projectId],
    queryFn: async () => {
      try {
        return await documentService.generateDocumentMetadata(projectId);
      } catch (error) {
        console.error('Error generating document metadata:', error);
        throw error;
      }
    },
    enabled: !!projectId
  });
};

/**
 * Hook for document compliance report
 */
export const useDocumentComplianceReport = (projectId: string) => {
  const documentService = getDocumentService();

  return useQuery({
    queryKey: ['document-compliance-report', projectId],
    queryFn: async () => {
      try {
        return await documentService.generateComplianceReport(projectId);
      } catch (error) {
        console.error('Error generating compliance report:', error);
        throw error;
      }
    },
    enabled: !!projectId
  });
};

/**
 * Hook for document download package generation
 */
export const useDocumentDownloadPackage = (projectId: string, documentIds?: string[]) => {
  const documentService = getDocumentService();

  return useMutation({
    mutationFn: async () => {
      try {
        return await documentService.generateDownloadPackage(projectId, documentIds);
      } catch (error) {
        console.error('Error generating download package:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast.success(`Package généré avec ${data.documentCount} documents`);
    },
    onError: (error) => {
      toast.error('Erreur lors de la génération du package');
    }
  });
};

/**
 * Hook for document analytics for dashboard
 */
export const useDocumentAnalytics = (projectId?: string) => {
  const documentService = getDocumentService();

  return useQuery({
    queryKey: ['document-analytics', projectId],
    queryFn: async () => {
      try {
        return await documentService.generateDocumentAnalytics(projectId);
      } catch (error) {
        console.error('Error generating document analytics:', error);
        throw error;
      }
    }
  });
};
