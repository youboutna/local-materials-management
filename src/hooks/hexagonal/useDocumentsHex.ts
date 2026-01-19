/**
 * Hexagonal Hook for Documents Management
 * Implements complete hexagonal architecture flow:
 * [UI] → [Hook] → [Factory] → [Adapter] → [Service] → [Transformers] → [Entities] → [Persistence]
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { DocumentService } from "@/application/services/DocumentService";
import { DocumentDomainTransformer, CreateDocumentRequestDto, UpdateDocumentRequestDto } from "@/dtos/transforms";
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

// Types for the hooks
export interface UseDocumentsHexResult {
  documents: any[];
  isLoading: boolean;
  error: any;
  refetch: () => void;
  createDocument: (data: CreateDocumentRequestDto) => void;
  updateDocument: ({ id, data }: { id: string; data: UpdateDocumentRequestDto }) => void;
  deleteDocument: (id: string) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  // Enhanced UI features
  getDocumentCompliance: (document: any) => number;
  getDocumentStatus: (document: any) => 'valid' | 'expired' | 'pending' | 'rejected';
  getDocumentRiskLevel: (document: any) => 'low' | 'medium' | 'high';
  getDocumentDaysUntilExpiry: (document: any) => number;
  getDocumentAnalytics: () => any;
  validateDocumentWithReferential: (document: any, referentialType: string) => Promise<any>;
  generateDocumentReport: (document: any) => any;
}

/**
 * Main hook for documents management
 * Complete hexagonal architecture with unified transformers
 */
export function useDocumentsHex(): UseDocumentsHexResult {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // [Factory] → [Adapter] → [Service] → [Transformers] → [Entities]
  const documentRepository = RepositoryFactory.getDocumentRepository();
  const documentService = new DocumentService(documentRepository, DocumentDomainTransformer);
  const documentTransformer = new DocumentDomainTransformer();

  // Query for documents list
  const {
    data: documents = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['documents'],
    queryFn: async (): Promise<any[]> => {
      try {
        // Complete hexagonal flow
        const documentEntities = await documentService.getAllDocuments();
        return documentTransformer.fromDtosToAdapter(
          documentEntities.map(entity => documentTransformer.toDTO(entity))
        );
      } catch (err) {
        console.error('Error fetching documents:', err);
        throw err;
      }
    }
  });

  // Create document mutation
  const createDocumentMutation = useMutation({
    mutationFn: async (data: CreateDocumentRequestDto): Promise<DocumentResponseDto> => {
      try {
        const documentDTO = documentTransformer.toRequestDto(data);
        const documentEntity = documentService.createDocument(documentDTO);
        return documentTransformer.fromDomainToResponseDto(documentEntity);
      } catch (error) {
        console.error('Error creating document:', error);
        throw error;
      }
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
    mutationFn: async ({ id, data }: { id: string; data: UpdateDocumentRequestDto }): Promise<DocumentResponseDto> => {
      try {
        const documentDTO = documentTransformer.toUpdateDto(data);
        const documentEntity = await documentService.updateDocument(id, documentDTO);
        return documentTransformer.fromDomainToResponseDto(documentEntity);
      } catch (error) {
        console.error('Error updating document:', error);
        throw error;
      }
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
    mutationFn: async (id: string): Promise<void> => {
      try {
        await documentService.deleteDocument(id);
      } catch (error) {
        console.error('Error deleting document:', error);
        throw error;
      }
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

export function useDocumentsByProject(projectId: string) {
  const documentService = new DocumentService(
    RepositoryFactory.getDocumentRepository()
  );

  return useQuery({
    queryKey: ['documents', 'project', projectId],
    queryFn: async () => {
      return await documentService.getDocumentsByProject(projectId);
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useDocumentById(id: string) {
  const documentService = new DocumentService(
    RepositoryFactory.getDocumentRepository()
  );

  return useQuery({
    queryKey: ['documents', 'id', id],
    queryFn: async () => {
      const document = await documentService.getDocumentById(id);
      return document;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}